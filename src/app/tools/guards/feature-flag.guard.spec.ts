import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
} from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../platform/auth.service';
import { FeatureFlagService } from '../../platform/feature-flag.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import type { ToolDefinition } from '../models/tool.model';
import { featureFlagGuard } from './feature-flag.guard';

describe('featureFlagGuard', () => {
  let registry: jasmine.SpyObj<ToolRegistryService>;
  let flags: FeatureFlagService;
  let snack: { open: jasmine.Spy };

  const baseTool = (over: Partial<ToolDefinition> = {}): ToolDefinition =>
    ({
      id: 't',
      name: 'T',
      shortDescription: 'x',
      description: 'x',
      version: '1.0.0',
      category: 'language',
      icon: 'Braces',
      launchUrl: 'https://x',
      maintainer: { teamName: 'x', party: 'first_party', contact: 'x' },
      changelog: [],
      accessLevel: 'All authenticated users',
      auditLogEnabled: true,
      ...over,
    }) as ToolDefinition;

  beforeEach(() => {
    registry = jasmine.createSpyObj('ToolRegistryService', [
      'getToolByIdAny',
      'lookupBundledToolById',
    ]);
    registry.lookupBundledToolById.and.returnValue(undefined);
    snack = { open: jasmine.createSpy('open') };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        FeatureFlagService,
        { provide: ToolRegistryService, useValue: registry },
        { provide: MatSnackBar, useValue: snack },
        { provide: AuthService, useValue: { assertAuthenticated: () => {} } },
      ],
    });
    flags = TestBed.inject(FeatureFlagService);
  });

  function routeWith(toolId: string | null): ActivatedRouteSnapshot {
    return {
      paramMap: convertToParamMap(toolId ? { toolId } : {}),
    } as ActivatedRouteSnapshot;
  }

  const state = {} as RouterStateSnapshot;

  it('redirects when toolId is missing', async () => {
    const result = (await TestBed.runInInjectionContext(() =>
      featureFlagGuard(routeWith(null), state),
    )) as UrlTree;
    expect(result.toString()).toBe('/tools');
  });

  it('allows when tool has no feature flag', async () => {
    registry.getToolByIdAny.and.returnValue(of(baseTool({ featureFlag: undefined })));
    const result = await TestBed.runInInjectionContext(() =>
      featureFlagGuard(routeWith('t'), state),
    );
    expect(result).toBe(true);
  });

  it('blocks and shows snack when flag is off', async () => {
    registry.getToolByIdAny.and.returnValue(
      of(baseTool({ id: 'cyberchef', featureFlag: 'tools.cyberchef' })),
    );
    flags.setFlag('tools.cyberchef', false);
    const result = (await TestBed.runInInjectionContext(() =>
      featureFlagGuard(routeWith('cyberchef'), state),
    )) as UrlTree;
    expect(snack.open).toHaveBeenCalled();
    expect(result.toString()).toBe('/tools');
  });

  it('allows when flag is on', async () => {
    registry.getToolByIdAny.and.returnValue(
      of(baseTool({ id: 'cyberchef', featureFlag: 'tools.cyberchef' })),
    );
    flags.setFlag('tools.cyberchef', true);
    const result = await TestBed.runInInjectionContext(() =>
      featureFlagGuard(routeWith('cyberchef'), state),
    );
    expect(result).toBe(true);
  });
});
