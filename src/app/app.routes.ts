import { Routes } from '@angular/router';

import { authGuard } from './tools/guards/auth.guard';
import { featureFlagGuard } from './tools/guards/feature-flag.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  {
    path: 'tools',
    loadComponent: () =>
      import('./tools/pages/tools-page.component').then((m) => m.ToolsPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tools/:toolId',
    loadComponent: () =>
      import('./tools/components/tool-host.component').then((m) => m.ToolHostComponent),
    canActivate: [authGuard, featureFlagGuard],
  },
  { path: '**', redirectTo: 'tools' },
];
