import { NgModule } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  BadgePercent,
  Binary,
  Braces,
  ChefHat,
  CreditCard,
  ExternalLink,
  Fingerprint,
  Globe,
  Landmark,
  Languages,
  LayoutGrid,
  ListChecks,
  Mic,
  Phone,
  ReplaceAll,
  Scale,
  ScanBarcode,
  ScanLine,
  Star,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Shield,
  Table,
  Timer,
  X,
} from 'lucide-angular';

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
      LayoutGrid,
      ListChecks,
      ScanLine,
      Timer,
      Scale,
      Globe,
      Landmark,
      Phone,
      BadgePercent,
      CreditCard,
      ScanBarcode,
    }),
  ],
  exports: [LucideAngularModule],
})
export class ToolsIconsModule {}
