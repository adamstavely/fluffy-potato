import { NgModule } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  Binary,
  Braces,
  ChefHat,
  ExternalLink,
  Fingerprint,
  Languages,
  ListChecks,
  Mic,
  ReplaceAll,
  ScanLine,
  Star,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Shield,
  Table,
  X,
} from 'lucide-angular/src/icons';

/**
 * Lucide icons used by the Tools catalog. Import this NgModule into standalone components
 * (Angular does not allow LucideAngularModule.pick() directly in standalone `imports`).
 */
@NgModule({
  imports: [
    LucideAngularModule.pick({
      Star,
      Braces,
      Binary,
      Fingerprint,
      Table,
      Shield,
      ChefHat,
      Search,
      ExternalLink,
      PanelRightOpen,
      PanelRightClose,
      X,
      Languages,
      Mic,
      ReplaceAll,
      ListChecks,
      ScanLine,
    }),
  ],
  exports: [LucideAngularModule],
})
export class ToolsIconsModule {}
