import { Component, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ToolDefinition } from '../../models/tool.model';

/** Narrow typings for Web Speech API (project tsconfig omits full DOM typings). */
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: Array<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionErrorLike = { error: string };

type FileTranscriber = (
  audio: string,
  options: {
    language?: string;
    task?: string;
    chunk_length_s?: number;
    stride_length_s?: number;
  },
) => Promise<{ text: string }>;

/** Browser bundle only (do not import the npm package — Angular’s bundler pulls Node-only deps). */
const TRANSFORMERS_ESM =
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

type TransformersModule = {
  pipeline: (task: string, model: string) => Promise<FileTranscriber>;
  env: { allowLocalModels: boolean; useBrowserCache: boolean };
};

let whisperPipelinePromise: Promise<FileTranscriber> | null = null;

function loadWhisperTranscriber(): Promise<FileTranscriber> {
  if (!whisperPipelinePromise) {
    whisperPipelinePromise = (async () => {
      const { pipeline, env } = (await import(
        /* @vite-ignore */
        TRANSFORMERS_ESM
      )) as TransformersModule;
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
    })();
  }
  return whisperPipelinePromise;
}

@Component({
  selector: 'sa-transcription-tool',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm leading-relaxed text-slate-600">
        <strong class="font-medium text-slate-800">Live listening</strong> uses your browser’s
        <strong class="font-medium text-slate-800">Web Speech API</strong>
        (typically Chrome or Edge). Audio is processed by the browser/OS speech engine — not by this app’s servers.
      </p>
      <p class="text-sm leading-relaxed text-slate-600">
        <strong class="font-medium text-slate-800">Upload a file</strong> runs the
        <strong class="font-medium text-slate-800">Whisper tiny</strong> model in your browser via ONNX (first use
        downloads model weights; stays cached afterward). Works offline after that.
      </p>

      @if (error()) {
        <div
          class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          {{ error() }}
        </div>
      }

      <div
        class="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4"
        role="region"
        aria-label="Upload an audio or video file to transcribe"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class.ring-2]="fileDragOver()"
        [class.ring-slate-400]="fileDragOver()"
        [class.bg-slate-100]="fileDragOver()"
      >
        <p class="text-xs font-medium text-slate-700" id="transcription-file-upload-desc">
          Transcribe an audio or video file
        </p>
        <p class="mt-1 text-xs text-slate-600">
          Drop a file here or choose one. Video must contain an audio track your browser can decode.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <input
            #fileInput
            id="transcription-file-input"
            type="file"
            class="sr-only"
            accept="audio/*,video/*"
            aria-describedby="transcription-file-upload-desc"
            (change)="onFileInputChange($event)"
          />
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="fileTranscribing()"
            aria-controls="transcription-file-input"
            (click)="fileInput.click()"
          >
            Choose file…
          </button>
          @if (fileTranscribing()) {
            <span class="text-sm text-slate-600">Transcribing… (first run may download the model)</span>
          }
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <label class="block min-w-[200px] text-xs font-medium text-slate-700">
          Recognition language
          <select
            class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            [(ngModel)]="lang"
            [disabled]="listening() || fileTranscribing()"
          >
            @for (l of langOptions; track l.code) {
              <option [value]="l.code">{{ l.label }}</option>
            }
          </select>
        </label>
        <div class="flex flex-wrap gap-2">
          @if (!listening()) {
            <button
              type="button"
              class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="!supported() || fileTranscribing()"
              (click)="start()"
            >
              Start listening
            </button>
          } @else {
            <button
              type="button"
              class="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              (click)="stop()"
            >
              Stop
            </button>
          }
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            [disabled]="!transcriptText"
            (click)="clear()"
          >
            Clear text
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            [disabled]="!transcriptText"
            (click)="copy()"
          >
            Copy
          </button>
        </div>
      </div>

      <label class="block text-xs font-medium text-slate-700">
        Transcript
        <textarea
          class="mt-1 min-h-[200px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-slate-400"
          [(ngModel)]="transcriptText"
          placeholder="Spoken text will appear here…"
          spellcheck="true"
        ></textarea>
      </label>
    </div>
  `,
})
export class TranscriptionToolComponent implements OnInit {
  readonly tool = input.required<ToolDefinition>();

  private recognition: SpeechRec | null = null;

  protected readonly supported = signal(false);
  protected readonly listening = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fileTranscribing = signal(false);
  protected readonly fileDragOver = signal(false);

  protected transcriptText = '';
  protected lang = 'en-US';

  protected readonly langOptions = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Spanish (Spain)' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'it-IT', label: 'Italian' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'ko-KR', label: 'Korean' },
    { code: 'zh-CN', label: 'Chinese (Mandarin)' },
    { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  ];

  ngOnInit(): void {
    const Ctor = this.getSpeechRecognitionCtor();
    if (Ctor) {
      this.supported.set(true);
      const rec = new Ctor() as unknown as SpeechRec;
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (ev: SpeechRecognitionResultEvent): void => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          if (!ev.results[i].isFinal) {
            continue;
          }
          const piece = ev.results[i][0].transcript.trim();
          if (piece) {
            const prefix = this.transcriptText.trim();
            this.transcriptText = prefix ? `${prefix} ${piece}` : piece;
          }
        }
      };
      rec.onerror = (ev: SpeechRecognitionErrorLike): void => {
        if (ev.error === 'not-allowed') {
          this.error.set('Microphone permission denied. Allow the microphone for this site and try again.');
        } else if (ev.error === 'no-speech') {
          this.error.set('No speech detected. Speak closer to the mic or check input volume.');
        } else {
          this.error.set(`Recognition error: ${ev.error}`);
        }
        this.listening.set(false);
      };
      rec.onend = (): void => {
        this.listening.set(false);
      };
      this.recognition = rec;
    } else {
      this.error.set(
        'Speech recognition is not available in this browser. Try Chrome or Edge on desktop.',
      );
    }
  }

  private getSpeechRecognitionCtor(): (new () => unknown) | null {
    const w = globalThis as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }

  protected onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.fileDragOver.set(true);
  }

  protected onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.fileDragOver.set(false);
  }

  protected onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.fileDragOver.set(false);
    const file = ev.dataTransfer?.files?.[0];
    if (file) {
      void this.transcribeFile(file);
    }
  }

  protected onFileInputChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.transcribeFile(file);
    }
  }

  private whisperLangFromUi(uiLang: string): string {
    const map: Record<string, string> = {
      'en-US': 'en',
      'en-GB': 'en',
      'es-ES': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'it-IT': 'it',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'zh-CN': 'zh',
      'pt-BR': 'pt',
    };
    return map[uiLang] ?? 'en';
  }

  protected async transcribeFile(file: File): Promise<void> {
    this.error.set(null);
    this.fileTranscribing.set(true);
    const objectUrl = URL.createObjectURL(file);
    try {
      const transcriber = await loadWhisperTranscriber();
      const language = this.whisperLangFromUi(this.lang);
      const result = await transcriber(objectUrl, {
        language,
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      const text = result.text?.trim() ?? '';
      if (text) {
        const prefix = this.transcriptText.trim();
        this.transcriptText = prefix ? `${prefix}\n\n${text}` : text;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.error.set(
        `File transcription failed: ${msg}. If this is a video, try an MP4/WebM with a supported audio codec, or export audio as WAV/MP3.`,
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      this.fileTranscribing.set(false);
    }
  }

  protected start(): void {
    const rec = this.recognition;
    if (!rec) {
      return;
    }
    this.error.set(null);
    rec.lang = this.lang;
    try {
      rec.start();
      this.listening.set(true);
    } catch {
      this.error.set('Could not start recognition. Stop any other session first, then retry.');
    }
  }

  protected stop(): void {
    this.recognition?.stop();
    this.listening.set(false);
  }

  protected clear(): void {
    this.transcriptText = '';
  }

  protected async copy(): Promise<void> {
    if (!this.transcriptText || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(this.transcriptText);
  }
}
