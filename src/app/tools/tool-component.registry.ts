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
/** Map `toolId` → host component. Every in-app tool in the registry must have an entry. */
export const TOOL_HOST_COMPONENTS: Record<string, Type<unknown>> = {
  cyberchef: CyberChefHostComponent,
  translation: TranslationToolComponent,
  glossary: GlossaryToolComponent,
  transcription: TranscriptionToolComponent,
  transliteration: TransliterationToolComponent,
  'list-compare': ListCompareToolComponent,
  'table-workspace': TableWorkspaceToolComponent,
  'mrz-decoder': MrzDecoderToolComponent,
  'iban-validator': IbanToolComponent,
  'crypto-wallet-validator': CryptoWalletValidatorToolComponent,
  'phone-number': PhoneNumberToolComponent,
  'tax-id': TaxIdToolComponent,
  'payment-card': PaymentCardToolComponent,
  'barcode-qr': BarcodeQrToolComponent,
  'image-metadata-strip': ImageMetadataStripToolComponent,
  'regex-pattern-tester': RegexPatternTesterToolComponent,
  'base64-encode-decode': Base64EncodeDecodeToolComponent,
  'imei-decoder': ImeiDecoderToolComponent,
  'vin-decoder': VinDecoderToolComponent,
  'epoch-timestamp': EpochTimestampToolComponent,
  'datetime-normalizer': DatetimeNormalizerToolComponent,
  'timeline-builder': TimelineBuilderToolComponent,
  'duration-calculator': DurationCalculatorToolComponent,
  'coordinate-converter': CoordinateConverterToolComponent,
  georepo: GeoRepoToolComponent,
  pomodoro: PomodoroToolComponent,
  'unit-converter': UnitConverterToolComponent,
  'world-clock': WorldClockToolComponent,
  'speed-reader': SpeedReaderToolComponent,
  'magic-todo': GoblinLlmToolComponent,
  formalizer: GoblinLlmToolComponent,
  judge: GoblinLlmToolComponent,
  professor: GoblinLlmToolComponent,
  consultant: GoblinLlmToolComponent,
  estimator: GoblinLlmToolComponent,
  compiler: GoblinLlmToolComponent,
};

export function resolveToolHostComponent(toolId: string): Type<unknown> | null {
  return TOOL_HOST_COMPONENTS[toolId] ?? null;
}
