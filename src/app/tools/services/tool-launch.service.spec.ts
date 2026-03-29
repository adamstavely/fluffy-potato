import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { AnalyticsService } from '../../platform/analytics.service';
import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import type { ToolDefinition } from '../models/tool.model';
import { ToolLaunchService } from './tool-launch.service';

describe('ToolLaunchService', () => {
  let service: ToolLaunchService;
  let openSpy: jasmine.Spy<(url: string, target?: string, features?: string) => Window | null>;

  const baseTool = (over: Partial<ToolDefinition> = {}): ToolDefinition =>
    ({
      id: 'cyberchef',
      name: 'CyberChef',
      shortDescription: 'x',
      description: 'x',
      version: '1.0.0',
      category: 'data',
      icon: 'ChefHat',
      launchUrl: '/tools/cyberchef',
      maintainer: { teamName: 't', party: 'first_party', contact: 'x' },
      changelog: [],
      accessLevel: 'All authenticated users',
      auditLogEnabled: true,
      allProcessingInBrowser: true,
      ...over,
    }) as ToolDefinition;

  const expectOriginPlusPath = (path: string): string =>
    `${window.location.origin}${path}`;

  beforeEach(() => {
    openSpy = spyOn(window, 'open').and.returnValue(null);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Location,
          useValue: {
            prepareExternalUrl: (p: string) => (p.startsWith('/') ? p : `/${p}`),
          },
        },
        ToolLaunchService,
        AuditService,
        AnalyticsService,
        AuthService,
      ],
    });
    service = TestBed.inject(ToolLaunchService);
  });

  it('isExternalLaunch is false for path-only launchUrl', () => {
    expect(service.isExternalLaunch(baseTool({ launchUrl: '/tools/cyberchef' }))).toBe(false);
  });

  it('isExternalLaunch is false for same-origin root https launchUrl', () => {
    const origin = window.location.origin;
    expect(service.isExternalLaunch(baseTool({ launchUrl: `${origin}/` }))).toBe(false);
  });

  it('isExternalLaunch is true for external https URL', () => {
    expect(service.isExternalLaunch(baseTool({ launchUrl: 'https://example.com/t' }))).toBe(true);
  });

  it('getLaunchHref matches URL passed to window.open by launchTool for in-app tools', () => {
    const t = baseTool({ launchUrl: '/tools/cyberchef' });
    expect(service.getLaunchHref(t)).toBe(expectOriginPlusPath('/tools/cyberchef'));
    service.launchTool(t, 'card');
    expect(openSpy).toHaveBeenCalledWith(
      expectOriginPlusPath('/tools/cyberchef'),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('getLaunchHref returns external https launchUrl unchanged', () => {
    expect(
      service.getLaunchHref(baseTool({ launchUrl: 'https://example.com/t' })),
    ).toBe('https://example.com/t');
  });

  it('opens external https launchUrl unchanged', () => {
    service.launchTool(
      baseTool({ launchUrl: 'https://example.com/t' }),
      'card',
    );
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/t',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens in-app URL from /tools/:id + Location for non-http launchUrl', () => {
    service.launchTool(baseTool({ launchUrl: '/tools/cyberchef' }), 'card');
    expect(openSpy).toHaveBeenCalledTimes(1);
    const opened = openSpy.calls.mostRecent().args[0] as string;
    expect(opened).toBe(expectOriginPlusPath('/tools/cyberchef'));
  });

  it('opens in-app URL when launchUrl is same-origin https root (misconfiguration)', () => {
    const origin = window.location.origin;
    service.launchTool(
      baseTool({ launchUrl: `${origin}/` }),
      'card',
    );
    expect(openSpy).toHaveBeenCalledTimes(1);
    const opened = openSpy.calls.mostRecent().args[0] as string;
    expect(opened).toBe(`${origin}/tools/cyberchef`);
  });

  it('uses fallback when prepareExternalUrl returns empty string', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Location,
          useValue: {
            prepareExternalUrl: () => '',
          },
        },
        ToolLaunchService,
        AuditService,
        AnalyticsService,
        AuthService,
      ],
    });
    service = TestBed.inject(ToolLaunchService);
    openSpy.calls.reset();

    service.launchTool(baseTool({ id: 'translation', launchUrl: '/tools/translation' }), 'card');
    const opened = openSpy.calls.mostRecent().args[0] as string;
    expect(opened).toBe(expectOriginPlusPath('/tools/translation'));
  });

  it('uses fallback when prepareExternalUrl returns /', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Location,
          useValue: {
            prepareExternalUrl: () => '/',
          },
        },
        ToolLaunchService,
        AuditService,
        AnalyticsService,
        AuthService,
      ],
    });
    service = TestBed.inject(ToolLaunchService);
    openSpy.calls.reset();

    service.launchTool(baseTool({ id: 'list-compare', launchUrl: '/tools/list-compare' }), 'card');
    const opened = openSpy.calls.mostRecent().args[0] as string;
    expect(opened).toBe(expectOriginPlusPath('/tools/list-compare'));
  });

  it('prepends APP_BASE_HREF-style path from prepareExternalUrl (subfolder deploy)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Location,
          useValue: {
            prepareExternalUrl: (p: string) => {
              const q = p.startsWith('/') ? p : `/${p}`;
              return `/myapp${q}`;
            },
          },
        },
        ToolLaunchService,
        AuditService,
        AnalyticsService,
        AuthService,
      ],
    });
    service = TestBed.inject(ToolLaunchService);
    openSpy.calls.reset();

    service.launchTool(baseTool({ id: 'pomodoro', launchUrl: '/tools/pomodoro' }), 'card');
    const opened = openSpy.calls.mostRecent().args[0] as string;
    expect(opened).toBe(expectOriginPlusPath('/myapp/tools/pomodoro'));
  });

  it('uses fallback when prepareExternalUrl returns scheme-relative //', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Location,
          useValue: {
            prepareExternalUrl: () => '//oops',
          },
        },
        ToolLaunchService,
        AuditService,
        AnalyticsService,
        AuthService,
      ],
    });
    service = TestBed.inject(ToolLaunchService);
    openSpy.calls.reset();

    service.launchTool(baseTool({ id: 'mrz-decoder', launchUrl: '/tools/mrz-decoder' }), 'card');
    const opened = openSpy.calls.mostRecent().args[0] as string;
    expect(opened).toBe(expectOriginPlusPath('/tools/mrz-decoder'));
  });
});
