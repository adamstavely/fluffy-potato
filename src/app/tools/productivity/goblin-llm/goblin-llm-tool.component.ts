import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../environments/environment';
import { SaButtonComponent } from '../../../ui/sa-button.component';
import { SaSelectComponent } from '../../../ui/sa-select.component';
import { SaTextareaComponent } from '../../../ui/sa-textarea.component';
import type { ToolDefinition } from '../../models/tool.model';
import { LlmChatService } from '../../services/llm-chat.service';
import {
  buildUserMessage,
  resolveGoblinLlmConfig,
  type GoblinLlmToolConfig,
} from './goblin-llm.config';

@Component({
  selector: 'sa-goblin-llm-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, SaTextareaComponent, SaButtonComponent, SaSelectComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-4">
      @if (!cfg()) {
        <div
          class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
          role="alert"
        >
          This tool is not configured in the app (missing Goblin LLM config for this id).
        </div>
      } @else {
        <p class="text-sm leading-relaxed text-slate-600">{{ tool().description }}</p>

        @if (!llmConfigured()) {
          <div
            class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            role="status"
          >
            <strong class="font-medium">LLM not configured.</strong>
            Set
            <code class="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-xs">llmChatCompletionsUrl</code>
            (and optionally
            <code class="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-xs">llmDefaultModel</code>
            ) in your environment to point at your OpenAI-compatible chat completions endpoint. The request
            includes a Bearer token when the user is signed in.
          </div>
        }

        @if (error()) {
          <div
            class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
            role="alert"
          >
            {{ error() }}
          </div>
        }

        @if (cfg(); as c) {
          <div class="grid gap-3 sm:grid-cols-2">
            @if (c.toneOptions?.length) {
              <sa-select
                label="Tone"
                [options]="c.toneOptions!"
                [(ngModel)]="formalizerTone"
                fieldClass="sm:max-w-xs"
              />
            }
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <sa-textarea
              [label]="c.inputLabel"
              [rows]="10"
              [(ngModel)]="draft"
              [placeholder]="c.inputPlaceholder"
              [spellcheck]="true"
              inputClass="font-mono text-sm"
              fieldClass="min-h-[200px] flex-1"
            />
            <sa-textarea
              label="Result"
              [rows]="10"
              [ngModel]="output()"
              [readOnly]="true"
              placeholder="Result appears here…"
              [spellcheck]="false"
              inputClass="font-mono text-sm bg-slate-50"
              fieldClass="min-h-[200px] flex-1"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <sa-button
              variant="flat"
              [attr.aria-label]="c.runLabel"
              innerClass="!bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:!opacity-90 disabled:!cursor-not-allowed disabled:!opacity-50"
              [disabled]="loading() || !llmConfigured() || !draft.trim()"
              (click)="run()"
            >
              {{ loading() ? 'Working…' : c.runLabel }}
            </sa-button>
            <sa-button
              variant="stroked"
              ariaLabel="Copy result"
              innerClass="px-3 py-2 text-sm"
              [disabled]="!output()"
              (click)="copyOutput()"
            >
              Copy result
            </sa-button>
          </div>
        }
      }
    </div>
  `,
})
export class GoblinLlmToolComponent {
  readonly tool = input.required<ToolDefinition>();

  private readonly llm = inject(LlmChatService);

  protected readonly cfg = computed((): GoblinLlmToolConfig | null =>
    resolveGoblinLlmConfig(this.tool().id),
  );

  protected draft = '';
  protected formalizerTone = 'professional';

  protected readonly loading = signal(false);
  protected readonly output = signal('');
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.tool().id;
      untracked(() => {
        this.draft = '';
        this.formalizerTone = 'professional';
        this.output.set('');
        this.error.set(null);
        this.loading.set(false);
      });
    });
  }

  protected llmConfigured(): boolean {
    return !!(environment.llmChatCompletionsUrl?.trim());
  }

  protected async run(): Promise<void> {
    const c = this.cfg();
    if (!c || !this.llmConfigured()) {
      return;
    }
    const userContent = buildUserMessage(c, this.tool().id, this.draft, this.formalizerTone);
    if (!userContent.trim()) {
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    try {
      const text = await this.llm.complete([
        { role: 'system', content: c.systemPrompt },
        { role: 'user', content: userContent },
      ]);
      this.output.set(text);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Something went wrong. Try again or check your connection.';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  protected async copyOutput(): Promise<void> {
    const t = this.output();
    if (!t || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(t);
  }
}
