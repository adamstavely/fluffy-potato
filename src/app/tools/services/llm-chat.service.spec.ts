import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { LlmChatService } from './llm-chat.service';

describe('LlmChatService', () => {
  let service: LlmChatService;
  let http: HttpTestingController;
  let savedUrl: string;
  let savedModel: string;

  beforeEach(() => {
    savedUrl = environment.llmChatCompletionsUrl;
    savedModel = environment.llmDefaultModel;
    environment.llmChatCompletionsUrl = 'https://llm.example/v1/chat/completions';
    environment.llmDefaultModel = 'test-model';

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), LlmChatService],
    });
    service = TestBed.inject(LlmChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    environment.llmChatCompletionsUrl = savedUrl;
    environment.llmDefaultModel = savedModel;
  });

  it('throws when llmChatCompletionsUrl is empty', async () => {
    environment.llmChatCompletionsUrl = '';
    let caught: unknown;
    try {
      await service.complete([{ role: 'user', content: 'hi' }]);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/not configured/);
  });

  it('POSTs messages and returns assistant content', async () => {
    const p = service.complete(
      [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ],
      { temperature: 0.2 },
    );

    const req = http.expectOne('https://llm.example/v1/chat/completions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      model: 'test-model',
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ],
      temperature: 0.2,
    });

    req.flush({
      choices: [{ message: { content: '  Hi there  ' } }],
    });

    expect(await p).toBe('Hi there');
  });

  it('uses options.model when provided', async () => {
    const p = service.complete([{ role: 'user', content: 'x' }], { model: 'other' });

    const req = http.expectOne('https://llm.example/v1/chat/completions');
    expect(req.request.body['model']).toBe('other');
    req.flush({ choices: [{ message: { content: 'ok' } }] });

    expect(await p).toBe('ok');
  });

  it('throws when API returns error object', async () => {
    const p = service.complete([{ role: 'user', content: 'x' }]);

    const req = http.expectOne('https://llm.example/v1/chat/completions');
    req.flush({ error: { message: 'Rate limited' } });

    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toBe('Rate limited');
  });

  it('throws when choices are empty', async () => {
    const p = service.complete([{ role: 'user', content: 'x' }]);

    const req = http.expectOne('https://llm.example/v1/chat/completions');
    req.flush({ choices: [] });

    let caught: unknown;
    try {
      await p;
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toMatch(/empty response/);
  });
});
