import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

export type ChatMessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface LlmChatCompletionOptions {
  /** Overrides `environment.llmDefaultModel` when set. */
  model?: string;
  temperature?: number;
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: { message?: string };
}

@Injectable({ providedIn: 'root' })
export class LlmChatService {
  private readonly http = inject(HttpClient);

  /**
   * POSTs to the configured OpenAI-compatible chat completions URL with the given messages.
   * @throws Error when URL is unset, response is malformed, or API returns an error object.
   */
  async complete(
    messages: ChatMessage[],
    options: LlmChatCompletionOptions = {},
  ): Promise<string> {
    const url = environment.llmChatCompletionsUrl?.trim() ?? '';
    if (!url) {
      throw new Error('LLM endpoint is not configured (llmChatCompletionsUrl).');
    }
    const model = options.model?.trim() || environment.llmDefaultModel?.trim() || 'gpt-4o-mini';
    const body: Record<string, unknown> = {
      model,
      messages,
    };
    if (options.temperature !== undefined) {
      body['temperature'] = options.temperature;
    }
    const res = await firstValueFrom(
      this.http.post<OpenAiChatCompletionResponse>(url, body),
    );
    if (res.error?.message) {
      throw new Error(res.error.message);
    }
    const text = res.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('The model returned an empty response.');
    }
    return text.trim();
  }
}
