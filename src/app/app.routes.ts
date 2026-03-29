import { Routes } from '@angular/router';

import { toolRouteGuard } from './tools/guards/tool-route.guard.loader';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  /** Must be before `tools` so `/tools/:toolId` is not partially matched by the catalog route. */
  {
    path: 'tools/:toolId',
    canActivate: [toolRouteGuard],
    loadComponent: () =>
      import('./tools/components/tool-host.component').then((m) => m.ToolHostComponent),
  },
  {
    path: 'tools',
    pathMatch: 'full',
    loadComponent: () =>
      import('./tools/pages/tools-page.component').then((m) => m.ToolsPageComponent),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./pages/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
  { path: '**', redirectTo: 'tools' },
];
