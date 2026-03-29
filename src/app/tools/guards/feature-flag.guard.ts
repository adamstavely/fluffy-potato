import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../platform/auth.service';
import { FeatureFlagService } from '../../platform/feature-flag.service';
import { ToolRegistryService } from '../services/tool-registry.service';

/** Registry + feature flags + auth assert (MVP auth always passes). Single guard for `/tools/:toolId`. */
export const featureFlagGuard: CanActivateFn = async (route) => {
  inject(AuthService).assertAuthenticated();
  const registry = inject(ToolRegistryService);
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);
  const toolId = route.paramMap.get('toolId');
  const toCatalog = (): ReturnType<Router['parseUrl']> => router.parseUrl('/tools');

  if (!toolId) {
    return toCatalog();
  }
  const tool =
    registry.lookupBundledToolById(toolId) ??
    (await firstValueFrom(registry.getToolByIdAny(toolId)));
  if (!tool) {
    return toCatalog();
  }
  if (!tool.featureFlag) {
    return true;
  }
  const enabled = await firstValueFrom(flags.isEnabled(tool.featureFlag));
  if (!enabled) {
    snack.open('This tool is not available.', 'Dismiss', { duration: 4000 });
    return toCatalog();
  }
  return true;
};
