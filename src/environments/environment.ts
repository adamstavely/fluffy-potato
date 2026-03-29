export const environment = {
  production: false,
  /**
   * Primary registry URL (e.g. `https://api.example.com/api/v1/tools`).
   * When empty, only the asset fallback is used.
   */
  toolsRegistryApiUrl: '',
  /** Bundled JSON used when the API is unavailable or not configured */
  toolsRegistryAssetUrl: '/assets/tools-registry.json',
};
