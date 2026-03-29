import { TestBed } from '@angular/core/testing';

import { AnalyticsService } from '../../platform/analytics.service';
import { AuditService } from '../../platform/audit.service';
import { AuthService } from '../../platform/auth.service';
import { ToolLaunchService } from './tool-launch.service';

describe('ToolLaunchService', () => {
  let service: ToolLaunchService;
  let openSpy: jasmine.Spy<(url: string, target?: string, features?: string) => Window | null>;

  beforeEach(() => {
    openSpy = spyOn(window, 'open').and.returnValue(null);
    TestBed.configureTestingModule({
      providers: [ToolLaunchService, AuditService, AnalyticsService, AuthService],
    });
    service = TestBed.inject(ToolLaunchService);
  });

  it('opens URL and records launch', () => {
    service.launch('https://example.com/t', 'cyberchef', 'card');
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/t',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
