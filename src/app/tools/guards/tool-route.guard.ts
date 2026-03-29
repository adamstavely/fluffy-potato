import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ToolRegistryService } from '../services/tool-registry.service';
import { TOOL_HOST_COMPONENTS } from '../tool-component.registry';

/** Resolves registry + host mapping for `/tools/:toolId`; unknown id or missing host → `/not-found`. */
export const toolRouteGuard: CanActivateFn = async (route) => {
  const registry = inject(ToolRegistryService);
  const router = inject(Router);
  const toolId = route.paramMap.get('toolId');
  const notFound = (): ReturnType<Router['parseUrl']> => router.parseUrl('/not-found');

  if (!toolId) {
    return notFound();
  }
  const tool =
    registry.lookupBundledToolById(toolId) ??
    (await firstValueFrom(registry.getToolByIdAny(toolId)));
  if (!tool) {
    return notFound();
  }
  if (!TOOL_HOST_COMPONENTS[toolId]) {
    return notFound();
  }
  return true;
};
