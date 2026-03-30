import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import axe from 'axe-core';

import { AnalyticsService } from '../platform/analytics.service';
import { AuditService } from '../platform/audit.service';
import { AuthService } from '../platform/auth.service';
import { UserPrefsService } from '../platform/user-prefs.service';
import { ToolsSectionComponent } from '../tools/components/tools-section.component';
import type { ToolDefinition } from '../tools/models/tool.model';
import { ToolLaunchService } from '../tools/services/tool-launch.service';
import { ToolRegistryService } from '../tools/services/tool-registry.service';

describe('WCAG smoke (axe) — tools catalog shell', () => {
  let fixture: ComponentFixture<ToolsSectionComponent>;

  const sampleTool: ToolDefinition = {
    id: 'cyberchef',
    name: 'CyberChef',
    shortDescription: 'x',
    description: 'x',
    version: '1.0.0',
    category: 'language',
    icon: 'Braces',
    launchUrl: 'https://example.com',
    maintainer: { teamName: 't', party: 'first_party', contact: 'x' },
    changelog: [],
    accessLevel: 'All authenticated users',
    auditLogEnabled: true,
    allProcessingInBrowser: true,
  };

  beforeEach(async () => {
    const fav$ = new BehaviorSubject<Set<string>>(new Set());
    await TestBed.configureTestingModule({
      imports: [ToolsSectionComponent],
      providers: [
        provideRouter([]),
        {
          provide: ToolRegistryService,
          useValue: {
            getVisibleTools: () => of([sampleTool]),
          },
        },
        {
          provide: UserPrefsService,
          useValue: {
            getFavoriteToolIds: () => fav$.asObservable(),
            snapshotFavorites: () => fav$.value,
            toggleFavorite: () => {},
          },
        },
        {
          provide: ToolLaunchService,
          useValue: {
            getLaunchHref: () => 'https://example.com/t',
            getLaunchTarget: () => '_blank' as const,
            isExternalLaunch: () => true,
            recordLaunch: () => {},
            launchTool: () => {},
          },
        },
        { provide: AuditService, useValue: { logView: () => {} } },
        { provide: AnalyticsService, useValue: { track: () => {} } },
        { provide: AuthService, useValue: { getUserIdSnapshot: () => 'u1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolsSectionComponent);
    fixture.detectChanges();
  });

  it('has no axe violations (WCAG 2.0/2.1 A & AA rules) on the tools section', async () => {
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const results = await axe.run(el, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      },
    });
    expect(results.violations).withContext(JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
