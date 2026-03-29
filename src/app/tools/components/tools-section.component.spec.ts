import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import { AnalyticsService } from '../../platform/analytics.service';
import { TeamToolFavoritesService } from '../../platform/team-tool-favorites.service';
import { UserPrefsService } from '../../platform/user-prefs.service';
import type { ToolDefinition } from '../models/tool.model';
import { ToolLaunchService } from '../services/tool-launch.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { ToolsSectionComponent } from './tools-section.component';

describe('ToolsSectionComponent', () => {
  let fixture: ComponentFixture<ToolsSectionComponent>;
  let teamFav$: BehaviorSubject<Set<string>>;

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
    teamFav$ = new BehaviorSubject<Set<string>>(new Set());
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
          provide: TeamToolFavoritesService,
          useValue: {
            getTeamFavoriteToolIds: () => teamFav$.asObservable(),
            snapshotTeamFavorites: () => teamFav$.value,
          },
        },
        {
          provide: UserPrefsService,
          useValue: {
            getFavoriteToolIds: () => fav$.asObservable(),
            snapshotFavorites: () => fav$.value,
            toggleFavorite: (id: string) => {
              const n = new Set(fav$.value);
              if (n.has(id)) {
                n.delete(id);
              } else {
                n.add(id);
              }
              fav$.next(n);
            },
          },
        },
        {
          provide: ToolLaunchService,
          useValue: {
            getLaunchHref: () => 'https://example.com/t',
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

  it('renders search and a tool card title', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#tool-search')).toBeTruthy();
    expect(el.textContent).toContain('CyberChef');
  });

  it('opens detail drawer when the details control is clicked', () => {
    const detailBtn = fixture.debugElement.query(
      By.css('sa-tool-card button[aria-label="View tool details"]'),
    );
    expect(detailBtn).withContext('Tool details control').toBeTruthy();
    detailBtn!.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('About');
  });

  describe('Catalog scope', () => {
    it('shows no tools on Mine when nothing is favorited', () => {
      const mineBtn = fixture.debugElement.queryAll(
        By.css('[aria-label="Catalog scope"] button'),
      )[1];
      mineBtn!.triggerEventHandler('click', {});
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No tools match your filters.');
    });

    it('shows favorited tools on Mine', () => {
      TestBed.inject(UserPrefsService).toggleFavorite('cyberchef');
      fixture.detectChanges();
      const mineBtn = fixture.debugElement.queryAll(
        By.css('[aria-label="Catalog scope"] button'),
      )[1];
      mineBtn!.triggerEventHandler('click', {});
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('CyberChef');
    });

    it('shows team-favorited tools on My Team', () => {
      teamFav$.next(new Set(['cyberchef']));
      fixture.detectChanges();
      const teamBtn = fixture.debugElement.queryAll(
        By.css('[aria-label="Catalog scope"] button'),
      )[2];
      expect(teamBtn).withContext('My Team scope').toBeTruthy();
      teamBtn!.triggerEventHandler('click', {});
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('CyberChef');
    });
  });

  describe('Category filter', () => {
    it('hides tools when category does not match', () => {
      fixture.componentInstance.activeFilter.set('data');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No tools match your filters.');
    });
  });

  describe('Launch', () => {
    let recordLaunchSpy: jasmine.Spy;

    beforeEach(async () => {
      recordLaunchSpy = jasmine.createSpy('recordLaunch');
      const fav$ = new BehaviorSubject<Set<string>>(new Set());
      const teamFav$ = new BehaviorSubject<Set<string>>(new Set());
      const inAppTool: ToolDefinition = {
        ...sampleTool,
        launchUrl: '/tools/cyberchef',
      };
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ToolsSectionComponent],
        providers: [
          provideRouter([]),
          {
            provide: ToolRegistryService,
            useValue: {
              getVisibleTools: () => of([inAppTool]),
            },
          },
          {
            provide: TeamToolFavoritesService,
            useValue: {
              getTeamFavoriteToolIds: () => teamFav$.asObservable(),
              snapshotTeamFavorites: () => teamFav$.value,
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
              getLaunchHref: () => 'http://localhost/tools/cyberchef',
              isExternalLaunch: () => false,
              recordLaunch: recordLaunchSpy,
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

    it('delegates to ToolLaunchService.recordLaunch with tool and source on Launch click', () => {
      const launchLink = fixture.debugElement.query(
        By.css('a[aria-label="Launch CyberChef"]'),
      );
      expect(launchLink).withContext('Launch link').toBeTruthy();
      launchLink!.triggerEventHandler('click', {});
      expect(recordLaunchSpy).toHaveBeenCalledTimes(1);
      const [tool, source] = recordLaunchSpy.calls.argsFor(0);
      expect(tool.id).toBe('cyberchef');
      expect(source).toBe('card');
    });
  });
});
