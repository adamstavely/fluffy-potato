import { Type } from '@angular/core';

export interface ToolHostEntry {
  /**
   * Lazily loads the tool's host component. Each `import()` is code-split into its own
   * chunk, so opening one tool downloads only that tool (and its libraries), not the
   * whole catalog. The factory is invoked by `ToolHostComponent` on activation.
   */
  load: () => Promise<Type<unknown>>;
  /** Whether to pass the `ToolDefinition` as a `tool` input to the component. */
  passToolInput: boolean;
}

/** Map `toolId` → host component entry. Every in-app tool in the registry must have an entry. */
export const TOOL_HOST_COMPONENTS: Record<string, ToolHostEntry> = {
  // CyberChef manages its own data and does not accept a `tool` input
  cyberchef: {
    load: () => import('./data/cyberchef/cyberchef-host.component').then((m) => m.CyberChefHostComponent),
    passToolInput: false,
  },
  translation: {
    load: () => import('./language/translation/translation-tool.component').then((m) => m.TranslationToolComponent),
    passToolInput: true,
  },
  glossary: {
    load: () => import('./language/glossary/glossary-tool.component').then((m) => m.GlossaryToolComponent),
    passToolInput: true,
  },
  transcription: {
    load: () =>
      import('./language/transcription/transcription-tool.component').then((m) => m.TranscriptionToolComponent),
    passToolInput: true,
  },
  transliteration: {
    load: () =>
      import('./language/transliteration/transliteration-tool.component').then((m) => m.TransliterationToolComponent),
    passToolInput: true,
  },
  'list-compare': {
    load: () => import('./data/list-compare/list-compare-tool.component').then((m) => m.ListCompareToolComponent),
    passToolInput: true,
  },
  'table-workspace': {
    load: () =>
      import('./data/table-workspace/table-workspace-tool.component').then((m) => m.TableWorkspaceToolComponent),
    passToolInput: true,
  },
  'mrz-decoder': {
    load: () => import('./identity/mrz-decoder/mrz-decoder-tool.component').then((m) => m.MrzDecoderToolComponent),
    passToolInput: true,
  },
  'iban-validator': {
    load: () => import('./financial/iban/iban-tool.component').then((m) => m.IbanToolComponent),
    passToolInput: true,
  },
  'crypto-wallet-validator': {
    load: () =>
      import('./financial/crypto-wallet-validator/crypto-wallet-validator-tool.component').then(
        (m) => m.CryptoWalletValidatorToolComponent,
      ),
    passToolInput: true,
  },
  'phone-number': {
    load: () => import('./identity/phone-number/phone-number-tool.component').then((m) => m.PhoneNumberToolComponent),
    passToolInput: true,
  },
  'tax-id': {
    load: () => import('./identity/tax-id/tax-id-tool.component').then((m) => m.TaxIdToolComponent),
    passToolInput: true,
  },
  'payment-card': {
    load: () => import('./financial/payment-card/payment-card-tool.component').then((m) => m.PaymentCardToolComponent),
    passToolInput: true,
  },
  'barcode-qr': {
    load: () => import('./data/barcode-qr/barcode-qr-tool.component').then((m) => m.BarcodeQrToolComponent),
    passToolInput: true,
  },
  'image-metadata-strip': {
    load: () =>
      import('./data/image-metadata-strip/image-metadata-strip-tool.component').then(
        (m) => m.ImageMetadataStripToolComponent,
      ),
    passToolInput: true,
  },
  'regex-pattern-tester': {
    load: () =>
      import('./data/regex-pattern-tester/regex-pattern-tester-tool.component').then(
        (m) => m.RegexPatternTesterToolComponent,
      ),
    passToolInput: true,
  },
  'base64-encode-decode': {
    load: () =>
      import('./data/base64-encode-decode/base64-encode-decode-tool.component').then(
        (m) => m.Base64EncodeDecodeToolComponent,
      ),
    passToolInput: true,
  },
  'imei-decoder': {
    load: () => import('./identity/imei-decoder/imei-decoder-tool.component').then((m) => m.ImeiDecoderToolComponent),
    passToolInput: true,
  },
  'vin-decoder': {
    load: () => import('./identity/vin-decoder/vin-decoder-tool.component').then((m) => m.VinDecoderToolComponent),
    passToolInput: true,
  },
  'epoch-timestamp': {
    load: () =>
      import('./temporal/epoch-timestamp/epoch-timestamp-tool.component').then((m) => m.EpochTimestampToolComponent),
    passToolInput: true,
  },
  'datetime-normalizer': {
    load: () =>
      import('./temporal/datetime-normalizer/datetime-normalizer-tool.component').then(
        (m) => m.DatetimeNormalizerToolComponent,
      ),
    passToolInput: true,
  },
  'timeline-builder': {
    load: () =>
      import('./temporal/timeline-builder/timeline-builder-tool.component').then((m) => m.TimelineBuilderToolComponent),
    passToolInput: true,
  },
  'duration-calculator': {
    load: () =>
      import('./temporal/duration-calculator/duration-calculator-tool.component').then(
        (m) => m.DurationCalculatorToolComponent,
      ),
    passToolInput: true,
  },
  'coordinate-converter': {
    load: () =>
      import('./geospatial/coordinate-converter/coordinate-converter-tool.component').then(
        (m) => m.CoordinateConverterToolComponent,
      ),
    passToolInput: true,
  },
  georepo: {
    load: () => import('./geospatial/georepo/georepo-tool.component').then((m) => m.GeoRepoToolComponent),
    passToolInput: true,
  },
  pomodoro: {
    load: () => import('./productivity/pomodoro/pomodoro-tool.component').then((m) => m.PomodoroToolComponent),
    passToolInput: true,
  },
  'unit-converter': {
    load: () => import('./data/unit-converter/unit-converter-tool.component').then((m) => m.UnitConverterToolComponent),
    passToolInput: true,
  },
  'world-clock': {
    load: () => import('./temporal/world-clock/world-clock-tool.component').then((m) => m.WorldClockToolComponent),
    passToolInput: true,
  },
  'speed-reader': {
    load: () =>
      import('./productivity/speed-reader/speed-reader-tool.component').then((m) => m.SpeedReaderToolComponent),
    passToolInput: true,
  },
  'magic-todo': {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
  formalizer: {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
  judge: {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
  professor: {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
  consultant: {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
  estimator: {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
  compiler: {
    load: () => import('./productivity/goblin-llm/goblin-llm-tool.component').then((m) => m.GoblinLlmToolComponent),
    passToolInput: true,
  },
};

export function resolveToolHostComponent(toolId: string): ToolHostEntry | null {
  return TOOL_HOST_COMPONENTS[toolId] ?? null;
}
