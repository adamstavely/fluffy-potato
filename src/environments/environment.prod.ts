export const environment = {
  production: true,
  /** Set to your platform registry URL in deployment config or CI secrets. */
  toolsRegistryApiUrl: '',
  toolsRegistryAssetUrl: '/assets/tools-registry.json',
  /** Full URL to OpenAI-compatible chat completions; set in deployment. */
  llmChatCompletionsUrl: '',
  llmDefaultModel: 'gpt-4o-mini',
};
