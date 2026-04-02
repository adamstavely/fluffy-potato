import { Type } from '@angular/core';

import { BarcodeQrToolComponent } from './data/barcode-qr/barcode-qr-tool.component';
import { ImageMetadataStripToolComponent } from './data/image-metadata-strip/image-metadata-strip-tool.component';
import { Base64EncodeDecodeToolComponent } from './data/base64-encode-decode/base64-encode-decode-tool.component';
import { RegexPatternTesterToolComponent } from './data/regex-pattern-tester/regex-pattern-tester-tool.component';
import { CyberChefHostComponent } from './data/cyberchef/cyberchef-host.component';
import { CryptoWalletValidatorToolComponent } from './financial/crypto-wallet-validator/crypto-wallet-validator-tool.component';
import { IbanToolComponent } from './financial/iban/iban-tool.component';
import { ListCompareToolComponent } from './data/list-compare/list-compare-tool.component';
import { TableWorkspaceToolComponent } from './data/table-workspace/table-workspace-tool.component';
import { UnitConverterToolComponent } from './data/unit-converter/unit-converter-tool.component';
import { ImeiDecoderToolComponent } from './identity/imei-decoder/imei-decoder-tool.component';
import { MrzDecoderToolComponent } from './identity/mrz-decoder/mrz-decoder-tool.component';
import { VinDecoderToolComponent } from './identity/vin-decoder/vin-decoder-tool.component';
import { PaymentCardToolComponent } from './financial/payment-card/payment-card-tool.component';
import { CoordinateConverterToolComponent } from './geospatial/coordinate-converter/coordinate-converter-tool.component';
import { GeoRepoToolComponent } from './geospatial/georepo/georepo-tool.component';
import { DatetimeNormalizerToolComponent } from './temporal/datetime-normalizer/datetime-normalizer-tool.component';
import { DurationCalculatorToolComponent } from './temporal/duration-calculator/duration-calculator-tool.component';
import { EpochTimestampToolComponent } from './temporal/epoch-timestamp/epoch-timestamp-tool.component';
import { TimelineBuilderToolComponent } from './temporal/timeline-builder/timeline-builder-tool.component';
import { WorldClockToolComponent } from './temporal/world-clock/world-clock-tool.component';
import { GoblinLlmToolComponent } from './productivity/goblin-llm/goblin-llm-tool.component';
import { PomodoroToolComponent } from './productivity/pomodoro/pomodoro-tool.component';
import { SpeedReaderToolComponent } from './productivity/speed-reader/speed-reader-tool.component';
import { PhoneNumberToolComponent } from './identity/phone-number/phone-number-tool.component';
import { TaxIdToolComponent } from './identity/tax-id/tax-id-tool.component';
import { TranscriptionToolComponent } from './language/transcription/transcription-tool.component';
import { TransliterationToolComponent } from './language/transliteration/transliteration-tool.component';
import { GlossaryToolComponent } from './language/glossary/glossary-tool.component';
import { TranslationToolComponent } from './language/translation/translation-tool.component';

export interface ToolHostEntry {
  component: Type<unknown>;
  /** Whether to pass the `ToolDefinition` as a `tool` input to the component. */
  passToolInput: boolean;
}

/** Map `toolId` → host component entry. Every in-app tool in the registry must have an entry. */
export const TOOL_HOST_COMPONENTS: Record<string, ToolHostEntry> = {
  // CyberChef manages its own data and does not accept a `tool` input
  cyberchef: { component: CyberChefHostComponent, passToolInput: false },
  translation: { component: TranslationToolComponent, passToolInput: true },
  glossary: { component: GlossaryToolComponent, passToolInput: true },
  transcription: { component: TranscriptionToolComponent, passToolInput: true },
  transliteration: { component: TransliterationToolComponent, passToolInput: true },
  'list-compare': { component: ListCompareToolComponent, passToolInput: true },
  'table-workspace': { component: TableWorkspaceToolComponent, passToolInput: true },
  'mrz-decoder': { component: MrzDecoderToolComponent, passToolInput: true },
  'iban-validator': { component: IbanToolComponent, passToolInput: true },
  'crypto-wallet-validator': { component: CryptoWalletValidatorToolComponent, passToolInput: true },
  'phone-number': { component: PhoneNumberToolComponent, passToolInput: true },
  'tax-id': { component: TaxIdToolComponent, passToolInput: true },
  'payment-card': { component: PaymentCardToolComponent, passToolInput: true },
  'barcode-qr': { component: BarcodeQrToolComponent, passToolInput: true },
  'image-metadata-strip': { component: ImageMetadataStripToolComponent, passToolInput: true },
  'regex-pattern-tester': { component: RegexPatternTesterToolComponent, passToolInput: true },
  'base64-encode-decode': { component: Base64EncodeDecodeToolComponent, passToolInput: true },
  'imei-decoder': { component: ImeiDecoderToolComponent, passToolInput: true },
  'vin-decoder': { component: VinDecoderToolComponent, passToolInput: true },
  'epoch-timestamp': { component: EpochTimestampToolComponent, passToolInput: true },
  'datetime-normalizer': { component: DatetimeNormalizerToolComponent, passToolInput: true },
  'timeline-builder': { component: TimelineBuilderToolComponent, passToolInput: true },
  'duration-calculator': { component: DurationCalculatorToolComponent, passToolInput: true },
  'coordinate-converter': { component: CoordinateConverterToolComponent, passToolInput: true },
  georepo: { component: GeoRepoToolComponent, passToolInput: true },
  pomodoro: { component: PomodoroToolComponent, passToolInput: true },
  'unit-converter': { component: UnitConverterToolComponent, passToolInput: true },
  'world-clock': { component: WorldClockToolComponent, passToolInput: true },
  'speed-reader': { component: SpeedReaderToolComponent, passToolInput: true },
  'magic-todo': { component: GoblinLlmToolComponent, passToolInput: true },
  formalizer: { component: GoblinLlmToolComponent, passToolInput: true },
  judge: { component: GoblinLlmToolComponent, passToolInput: true },
  professor: { component: GoblinLlmToolComponent, passToolInput: true },
  consultant: { component: GoblinLlmToolComponent, passToolInput: true },
  estimator: { component: GoblinLlmToolComponent, passToolInput: true },
  compiler: { component: GoblinLlmToolComponent, passToolInput: true },
};

export function resolveToolHostComponent(toolId: string): ToolHostEntry | null {
  return TOOL_HOST_COMPONENTS[toolId] ?? null;
}
