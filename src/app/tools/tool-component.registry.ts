import { Type } from '@angular/core';

import { BarcodeQrToolComponent } from './data/barcode-qr/barcode-qr-tool.component';
import { ImageMetadataStripToolComponent } from './data/image-metadata-strip/image-metadata-strip-tool.component';
import { CyberChefHostComponent } from './data/cyberchef/cyberchef-host.component';
import { IbanToolComponent } from './financial/iban/iban-tool.component';
import { ListCompareToolComponent } from './data/list-compare/list-compare-tool.component';
import { TableWorkspaceToolComponent } from './data/table-workspace/table-workspace-tool.component';
import { MrzDecoderToolComponent } from './identity/mrz-decoder/mrz-decoder-tool.component';
import { PaymentCardToolComponent } from './financial/payment-card/payment-card-tool.component';
import { GoblinLlmToolComponent } from './productivity/goblin-llm/goblin-llm-tool.component';
import { PomodoroToolComponent } from './productivity/pomodoro/pomodoro-tool.component';
import { SpeedReaderToolComponent } from './productivity/speed-reader/speed-reader-tool.component';
import { PhoneNumberToolComponent } from './identity/phone-number/phone-number-tool.component';
import { TaxIdToolComponent } from './identity/tax-id/tax-id-tool.component';
import { TranscriptionToolComponent } from './language/transcription/transcription-tool.component';
import { TransliterationToolComponent } from './language/transliteration/transliteration-tool.component';
import { TranslationToolComponent } from './language/translation/translation-tool.component';
import { UnitConverterToolComponent } from './productivity/unit-converter/unit-converter-tool.component';
import { WorldClockToolComponent } from './productivity/world-clock/world-clock-tool.component';

/** Map `toolId` → host component. Every in-app tool in the registry must have an entry. */
export const TOOL_HOST_COMPONENTS: Record<string, Type<unknown>> = {
  cyberchef: CyberChefHostComponent,
  translation: TranslationToolComponent,
  transcription: TranscriptionToolComponent,
  transliteration: TransliterationToolComponent,
  'list-compare': ListCompareToolComponent,
  'table-workspace': TableWorkspaceToolComponent,
  'mrz-decoder': MrzDecoderToolComponent,
  'iban-validator': IbanToolComponent,
  'phone-number': PhoneNumberToolComponent,
  'tax-id': TaxIdToolComponent,
  'payment-card': PaymentCardToolComponent,
  'barcode-qr': BarcodeQrToolComponent,
  'image-metadata-strip': ImageMetadataStripToolComponent,
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
