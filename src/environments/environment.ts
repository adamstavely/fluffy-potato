export const environment = {
  production: false,
  /**
   * Primary registry URL (e.g. `https://api.example.com/api/v1/tools`).
   * When empty, only the asset fallback is used.
   */
  toolsRegistryApiUrl: '',
  /** Bundled JSON used when the API is unavailable or not configured */
  toolsRegistryAssetUrl: '/assets/tools-registry.json',
  /**
   * Full URL to an OpenAI-compatible chat completions endpoint (e.g. `…/v1/chat/completions`).
   * When empty, LLM productivity tools show a configuration message instead of calling the API.
   */
  llmChatCompletionsUrl: '',
  /** Default model name sent in the chat completions request body. */
  llmDefaultModel: 'gpt-4o-mini',
};
