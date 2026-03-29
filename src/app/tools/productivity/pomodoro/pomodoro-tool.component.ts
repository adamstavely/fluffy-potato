import {
  Component,
  computed,
  inject,
  input,
  NgZone,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

type Phase = 'focus' | 'shortBreak' | 'longBreak';

const STORAGE_KEY = 'tools.pomodoro.settings';

interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
}

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { focusMin: 25, shortBreakMin: 5, longBreakMin: 15 };
    }
    const p = JSON.parse(raw) as Partial<PomodoroSettings>;
    return {
      focusMin: clampMin(p.focusMin ?? 25),
      shortBreakMin: clampMin(p.shortBreakMin ?? 5),
      longBreakMin: clampMin(p.longBreakMin ?? 15),
    };
  } catch {
    return { focusMin: 25, shortBreakMin: 5, longBreakMin: 15 };
  }
}

function clampMin(n: number): number {
  if (!Number.isFinite(n)) {
    return 1;
  }
  return Math.min(180, Math.max(1, Math.round(n)));
}

function persistSettings(s: PomodoroSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

@Component({
  selector: 'sa-pomodoro-tool',
  standalone: true,
  template: `
    <div class="mx-auto max-w-2xl space-y-6">
      <p class="text-sm leading-relaxed text-slate-600">
        Focus and break intervals run entirely in your browser. The countdown corrects for timer drift.
      </p>

      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-6 text-center">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
            id="pomodoro-phase-label"
          >
            {{ phaseLabel() }}
          </p>
          <p
            class="font-display text-5xl font-semibold tabular-nums tracking-tight text-slate-900"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ timeDisplay() }}
          </p>
          <p class="mt-2 text-sm text-slate-500" aria-live="polite">
            @if (phase() === 'focus') {
              {{ focusUntilLong() }} focus session{{ focusUntilLong() !== 1 ? 's' : '' }} until long break
            } @else {
              Next: {{ nextPhaseHint() }}
            }
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2">
          @if (!isRunning()) {
            <sa-button
              variant="flat"
              ariaLabel="Start or resume timer"
              innerClass="!bg-slate-900 px-5 py-2.5 text-sm font-medium !text-white hover:!bg-slate-800"
              (click)="startOrResume()"
            >
              {{ hasStarted() ? 'Resume' : 'Start' }}
            </sa-button>
          } @else {
            <sa-button
              variant="stroked"
              ariaLabel="Pause timer"
              innerClass="px-5 py-2.5 text-sm font-medium"
              (click)="pause()"
            >
              Pause
            </sa-button>
          }
          <sa-button
            variant="stroked"
            ariaLabel="Skip to next phase"
            innerClass="px-5 py-2.5 text-sm font-medium"
            (click)="skipPhase()"
          >
            Skip phase
          </sa-button>
          <sa-button
            variant="text"
            ariaLabel="Reset timer"
            innerClass="px-5 py-2.5 text-sm text-slate-600"
            (click)="reset()"
          >
            Reset
          </sa-button>
        </div>
      </div>

      <div class="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-3">
        <sa-text-field
          label="Focus (minutes)"
          type="number"
          [min]="1"
          [max]="180"
          [ngModel]="settings().focusMin"
          (ngModelChange)="setFocusMin($event)"
          [hostDisabled]="isRunning()"
        />
        <sa-text-field
          label="Short break (minutes)"
          type="number"
          [min]="1"
          [max]="180"
          [ngModel]="settings().shortBreakMin"
          (ngModelChange)="setShortBreakMin($event)"
          [hostDisabled]="isRunning()"
        />
        <sa-text-field
          label="Long break (minutes)"
          type="number"
          [min]="1"
          [max]="180"
          [ngModel]="settings().longBreakMin"
          (ngModelChange)="setLongBreakMin($event)"
          [hostDisabled]="isRunning()"
        />
      </div>
    </div>
  `,
  imports: [FormsModule, SaButtonComponent, SaTextFieldComponent],
})
export class PomodoroToolComponent implements OnDestroy {
  readonly tool = input.required<ToolDefinition>();

  private readonly zone = inject(NgZone);

  private readonly settingsSig = signal<PomodoroSettings>(loadSettings());
  protected readonly settings = this.settingsSig.asReadonly();

  private readonly phaseSig = signal<Phase>('focus');
  protected readonly phase = this.phaseSig.asReadonly();

  /** Focus sessions remaining before a long break (after current focus completes). */
  private readonly focusUntilLongSig = signal(4);
  protected readonly focusUntilLong = this.focusUntilLongSig.asReadonly();

  private readonly isRunningSig = signal(false);
  protected readonly isRunning = this.isRunningSig.asReadonly();

  private readonly hasStartedSig = signal(false);
  protected readonly hasStarted = this.hasStartedSig.asReadonly();

  /** Wall-clock end time when running; drift-corrected. */
  private endsAt: number | null = null;

  private readonly remainingMsSig = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly phaseLabel = computed(() => {
    switch (this.phase()) {
      case 'focus':
        return 'Focus';
      case 'shortBreak':
        return 'Short break';
      case 'longBreak':
        return 'Long break';
      default:
        return '';
    }
  });

  protected readonly timeDisplay = computed(() => {
    const ms = this.remainingMsSig();
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  protected readonly nextPhaseHint = computed(() => {
    switch (this.phase()) {
      case 'shortBreak':
        return 'focus';
      case 'longBreak':
        return 'focus';
      case 'focus':
        return 'break';
      default:
        return '';
    }
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private durationMsForPhase(p: Phase): number {
    const s = this.settingsSig();
    const min =
      p === 'focus'
        ? s.focusMin
        : p === 'shortBreak'
          ? s.shortBreakMin
          : s.longBreakMin;
    return min * 60 * 1000;
  }

  private tick(): void {
    if (!this.isRunningSig() || this.endsAt === null) {
      return;
    }
    const rem = Math.max(0, this.endsAt - Date.now());
    this.remainingMsSig.set(rem);
    if (rem <= 0) {
      this.onPhaseComplete();
    }
  }

  private startInterval(): void {
    this.clearTimer();
    this.zone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.zone.run(() => this.tick());
      }, 250);
    });
  }

  private playChime(): void {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      setTimeout(() => {
        o.stop();
        void ctx.close();
      }, 200);
    } catch {
      /* ignore */
    }
  }

  private onPhaseComplete(playSound = true): void {
    if (playSound) {
      this.playChime();
    }
    const ph = this.phaseSig();

    if (ph === 'focus') {
      const next = this.focusUntilLongSig() - 1;
      this.focusUntilLongSig.set(next);
      if (next <= 0) {
        this.focusUntilLongSig.set(4);
        this.beginPhase('longBreak', true);
      } else {
        this.beginPhase('shortBreak', true);
      }
      return;
    }

    if (ph === 'shortBreak' || ph === 'longBreak') {
      this.beginPhase('focus', true);
    }
  }

  private beginPhase(p: Phase, autoRun: boolean): void {
    this.phaseSig.set(p);
    const dur = this.durationMsForPhase(p);
    this.remainingMsSig.set(dur);
    if (autoRun) {
      this.hasStartedSig.set(true);
      this.isRunningSig.set(true);
      this.endsAt = Date.now() + dur;
      this.startInterval();
    } else {
      this.endsAt = null;
      this.isRunningSig.set(false);
    }
  }

  protected startOrResume(): void {
    if (this.isRunningSig()) {
      return;
    }
    this.hasStartedSig.set(true);
    if (this.endsAt === null) {
      const rem = this.remainingMsSig();
      if (rem > 0) {
        this.endsAt = Date.now() + rem;
      } else {
        const dur = this.durationMsForPhase(this.phaseSig());
        this.remainingMsSig.set(dur);
        this.endsAt = Date.now() + dur;
      }
    }
    this.isRunningSig.set(true);
    this.startInterval();
    this.tick();
  }

  protected pause(): void {
    if (!this.isRunningSig() || this.endsAt === null) {
      return;
    }
    this.remainingMsSig.set(Math.max(0, this.endsAt - Date.now()));
    this.endsAt = null;
    this.isRunningSig.set(false);
    this.clearTimer();
  }

  protected skipPhase(): void {
    this.clearTimer();
    this.endsAt = null;
    this.isRunningSig.set(false);
    this.onPhaseComplete(false);
  }

  protected reset(): void {
    this.clearTimer();
    this.endsAt = null;
    this.isRunningSig.set(false);
    this.hasStartedSig.set(false);
    this.phaseSig.set('focus');
    this.focusUntilLongSig.set(4);
    this.remainingMsSig.set(this.durationMsForPhase('focus'));
  }

  protected setFocusMin(v: number): void {
    const next = { ...this.settingsSig(), focusMin: clampMin(Number(v)) };
    this.settingsSig.set(next);
    persistSettings(next);
    if (!this.hasStartedSig()) {
      this.remainingMsSig.set(this.durationMsForPhase('focus'));
    }
  }

  protected setShortBreakMin(v: number): void {
    const next = { ...this.settingsSig(), shortBreakMin: clampMin(Number(v)) };
    this.settingsSig.set(next);
    persistSettings(next);
  }

  protected setLongBreakMin(v: number): void {
    const next = { ...this.settingsSig(), longBreakMin: clampMin(Number(v)) };
    this.settingsSig.set(next);
    persistSettings(next);
  }

  constructor() {
    this.remainingMsSig.set(this.durationMsForPhase('focus'));
  }
}
