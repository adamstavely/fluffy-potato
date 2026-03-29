import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  /** Must be before `tools` so `/tools/:toolId` is not partially matched by the catalog route. */
  {
    path: 'tools/:toolId',
    loadComponent: () =>
      import('./tools/components/tool-host.component').then((m) => m.ToolHostComponent),
  },
  {
    path: 'tools',
    pathMatch: 'full',
    loadComponent: () =>
      import('./tools/pages/tools-page.component').then((m) => m.ToolsPageComponent),
  },
  { path: '**', redirectTo: 'tools' },
];
