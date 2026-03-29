import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
} from '@angular/router';
import { of } from 'rxjs';

import { ToolRegistryService } from '../services/tool-registry.service';
import type { ToolDefinition } from '../models/tool.model';
import { toolRouteGuard } from './tool-route.guard';

describe('toolRouteGuard', () => {
  let registry: jasmine.SpyObj<ToolRegistryService>;

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
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ToolRegistryService, useValue: registry }],
    });
  });

  function routeWith(toolId: string | null): ActivatedRouteSnapshot {
    return {
      paramMap: convertToParamMap(toolId ? { toolId } : {}),
    } as ActivatedRouteSnapshot;
  }

  const state = {} as RouterStateSnapshot;

  it('redirects to not-found when toolId is missing', async () => {
    const result = (await TestBed.runInInjectionContext(() =>
      toolRouteGuard(routeWith(null), state),
    )) as UrlTree;
    expect(result.toString()).toBe('/not-found');
  });

  it('redirects to not-found when tool is unknown', async () => {
    registry.getToolByIdAny.and.returnValue(of(undefined));
    const result = (await TestBed.runInInjectionContext(() =>
      toolRouteGuard(routeWith('unknown-slug'), state),
    )) as UrlTree;
    expect(result.toString()).toBe('/not-found');
  });

  it('redirects to not-found when tool has no host mapping', async () => {
    registry.getToolByIdAny.and.returnValue(of(baseTool({ id: 'no-host-mapping' })));
    const result = (await TestBed.runInInjectionContext(() =>
      toolRouteGuard(routeWith('no-host-mapping'), state),
    )) as UrlTree;
    expect(result.toString()).toBe('/not-found');
  });

  it('allows when tool exists and has a host', async () => {
    registry.getToolByIdAny.and.returnValue(of(baseTool({ id: 'cyberchef' })));
    const result = await TestBed.runInInjectionContext(() =>
      toolRouteGuard(routeWith('cyberchef'), state),
    );
    expect(result).toBe(true);
  });
});
