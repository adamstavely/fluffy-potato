import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { FeatureFlagService } from '../../platform/feature-flag.service';
import { ToolRegistryService } from '../services/tool-registry.service';

export const featureFlagGuard: CanActivateFn = async (route) => {
  const registry = inject(ToolRegistryService);
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);
  const toolId = route.paramMap.get('toolId');
  if (!toolId) {
    return router.parseUrl('/tools');
  }
  const tool = await firstValueFrom(registry.getToolByIdAny(toolId));
  if (!tool) {
    return router.parseUrl('/tools');
  }
  if (!tool.featureFlag) {
    return true;
  }
  const enabled = await firstValueFrom(flags.isEnabled(tool.featureFlag));
  if (!enabled) {
    snack.open('This tool is not available.', 'Dismiss', { duration: 4000 });
    return router.parseUrl('/tools');
  }
  return true;
};
