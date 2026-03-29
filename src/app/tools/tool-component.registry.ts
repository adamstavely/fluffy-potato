import { Type } from '@angular/core';

import { BarcodeQrToolComponent } from './components/barcode-qr-tool.component';
import { CyberChefHostComponent } from './components/cyberchef-host.component';
import { GenericToolPlaceholderComponent } from './components/generic-tool-placeholder.component';
import { IbanToolComponent } from './components/iban-tool.component';
import { ListCompareToolComponent } from './components/list-compare-tool.component';
import { TableWorkspaceToolComponent } from './components/table-workspace-tool.component';
import { MrzDecoderToolComponent } from './components/mrz-decoder-tool.component';
import { PaymentCardToolComponent } from './components/payment-card-tool.component';
import { PomodoroToolComponent } from './components/pomodoro-tool.component';
import { PhoneNumberToolComponent } from './components/phone-number-tool.component';
import { TaxIdToolComponent } from './components/tax-id-tool.component';
import { TranscriptionToolComponent } from './components/transcription-tool.component';
import { TransliterationToolComponent } from './components/transliteration-tool.component';
import { TranslationToolComponent } from './components/translation-tool.component';
import { UnitConverterToolComponent } from './components/unit-converter-tool.component';
import { WorldClockToolComponent } from './components/world-clock-tool.component';

/**
 * Map `toolId` → host component. Tools not listed here use {@link GenericToolPlaceholderComponent}.
 */
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
  pomodoro: PomodoroToolComponent,
  'unit-converter': UnitConverterToolComponent,
  'world-clock': WorldClockToolComponent,
};

export function resolveToolHostComponent(
  toolId: string,
): Type<unknown> {
  return TOOL_HOST_COMPONENTS[toolId] ?? GenericToolPlaceholderComponent;
}
