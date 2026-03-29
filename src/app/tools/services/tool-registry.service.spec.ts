import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

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
      launchUrl: 'https://a',
      maintainer: {
        teamName: 't',
        party: 'first_party',
        contact: 'mailto:a@a.com',
      },
      changelog: [],
      accessLevel: 'All authenticated users',
      auditLogEnabled: true,
      allProcessingInBrowser: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ToolRegistryService],
    });
    service = TestBed.inject(ToolRegistryService);
    http = TestBed.inject(HttpTestingController);
  });

  it('getVisibleTools returns tools from the registry response', (done) => {
    service.getVisibleTools().subscribe((tools) => {
      expect(tools.length).toBe(1);
      expect(tools[0].id).toBe('a');
      done();
    });

    http.expectOne((req) => req.url.endsWith('tools-registry.json')).flush(sample);
  });

  it('lookupBundledToolById returns a tool from the bundled JSON', () => {
    const t = service.lookupBundledToolById('cyberchef');
    expect(t?.id).toBe('cyberchef');
    expect(service.lookupBundledToolById('nonexistent-tool-slug')).toBeUndefined();
  });

  it('falls back to bundled registry when asset GET fails', (done) => {
    service.getVisibleTools().subscribe((tools) => {
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t) => t.id === 'cyberchef')).toBe(true);
      done();
    });

    http
      .expectOne((req) => req.url.endsWith('tools-registry.json'))
      .flush('', { status: 404, statusText: 'Not Found' });
  });
});
