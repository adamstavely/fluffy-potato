import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';

import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import { AnalyticsService } from '../../platform/analytics.service';
import { UserPrefsService } from '../../platform/user-prefs.service';
import type { ToolDefinition } from '../models/tool.model';
import { ToolLaunchService } from '../services/tool-launch.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { ToolsSectionComponent } from './tools-section.component';

describe('ToolsSectionComponent', () => {
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
  };

  beforeEach(async () => {
    const fav$ = new BehaviorSubject<Set<string>>(new Set());
    await TestBed.configureTestingModule({
      imports: [ToolsSectionComponent],
      providers: [
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
        { provide: ToolLaunchService, useValue: { launch: () => {} } },
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
    const detailBtn = fixture.debugElement.queryAll(By.css('button')).find((b) => {
      const label = (b.nativeElement as HTMLButtonElement).getAttribute('aria-label');
      return label === 'View tool details' || label === 'Close tool details';
    });
    expect(detailBtn).withContext('Tool details button').toBeTruthy();
    detailBtn!.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('About');
  });
});
