import { Type } from '@angular/core';

import { CyberChefHostComponent } from './components/cyberchef-host.component';
import { GenericToolPlaceholderComponent } from './components/generic-tool-placeholder.component';
import { ListCompareToolComponent } from './components/list-compare-tool.component';
import { MrzDecoderToolComponent } from './components/mrz-decoder-tool.component';
import { TranscriptionToolComponent } from './components/transcription-tool.component';
import { TransliterationToolComponent } from './components/transliteration-tool.component';
import { TranslationToolComponent } from './components/translation-tool.component';

/**
 * Map `toolId` → host component. Tools not listed here use {@link GenericToolPlaceholderComponent}.
 */
export const TOOL_HOST_COMPONENTS: Record<string, Type<unknown>> = {
  cyberchef: CyberChefHostComponent,
  translation: TranslationToolComponent,
  transcription: TranscriptionToolComponent,
  transliteration: TransliterationToolComponent,
  'list-compare': ListCompareToolComponent,
  'mrz-decoder': MrzDecoderToolComponent,
};

export function resolveToolHostComponent(
  toolId: string,
): Type<unknown> {
  return TOOL_HOST_COMPONENTS[toolId] ?? GenericToolPlaceholderComponent;
}
