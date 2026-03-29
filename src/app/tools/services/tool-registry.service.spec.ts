import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FeatureFlagService } from '../../platform/feature-flag.service';
import type { ToolDefinition } from '../models/tool.model';
import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;
  let http: HttpTestingController;

  const sample: ToolDefinition[] = [
    {
      id: 'a',
      name: 'A',
      shortDescription: 'x',
      description: 'x',
      version: '1.0.0',
      category: 'language',
      icon: 'Braces',
      featureFlag: 'tools.a',
      launchUrl: 'https://a',
      maintainer: {
        teamName: 't',
        party: 'first_party',
        contact: 'mailto:a@a.com',
      },
      changelog: [],
      accessLevel: 'All authenticated users',
      auditLogEnabled: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ToolRegistryService, FeatureFlagService],
    });
    service = TestBed.inject(ToolRegistryService);
    http = TestBed.inject(HttpTestingController);
  });

  it('filters out tools when feature flag is off', (done) => {
    const flags = TestBed.inject(FeatureFlagService);
    flags.setFlag('tools.a', false);

    service.getVisibleTools().subscribe((tools) => {
      expect(tools.length).toBe(0);
      done();
    });

    http.expectOne((req) => req.url.endsWith('tools-registry.json')).flush(sample);
  });
});
