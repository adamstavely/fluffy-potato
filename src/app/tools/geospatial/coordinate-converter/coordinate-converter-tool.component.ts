import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { forward as mgrsForward, toPoint as mgrsToPoint } from 'mgrs';
import { fromLatLon, toLatLon } from 'utm';

import { SaTextFieldComponent } from '../../../ui/sa-text-field.component';
import type { ToolDefinition } from '../../models/tool.model';

const DD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/;
const UTM_RE = /^\s*(\d{1,2})\s*([CDEFGHJKLMNPQRSTUVWX])\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$/i;

function tryParseLatLon(raw: string): [number, number] | null {
  const s = raw.trim();
  if (!s) {
    return null;
  }

  const dd = s.match(DD_RE);
  if (dd) {
    const lat = Number(dd[1]);
    const lon = Number(dd[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return [lat, lon];
    }
  }

  const compact = s.replace(/\s+/g, '');
  try {
    const pt = mgrsToPoint(compact);
    return [pt[1], pt[0]];
  } catch {
    /* not MGRS */
  }

  const utm = s.match(UTM_RE);
  if (utm) {
    const zoneNum = Number(utm[1]);
    const zoneLetter = utm[2].toUpperCase();
    const easting = Number(utm[3]);
    const northing = Number(utm[4]);
    try {
      const o = toLatLon(easting, northing, zoneNum, zoneLetter);
      return [o.latitude, o.longitude];
    } catch {
      return null;
    }
  }

  return null;
}

function formatDd(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

function formatDms(lat: number, lon: number): string {
  return `${toDms(lat, true)}, ${toDms(lon, false)}`;
}

function toDms(deg: number, isLat: boolean): string {
  const v = Math.abs(deg);
  const d = Math.floor(v);
  const mf = (v - d) * 60;
  const m = Math.floor(mf);
  const s = (mf - m) * 60;
  const hemi = isLat
    ? deg >= 0
      ? 'N'
      : 'S'
    : deg >= 0
      ? 'E'
      : 'W';
  return `${d}° ${m}' ${s.toFixed(2)}" ${hemi}`;
}

@Component({
  selector: 'sa-coordinate-converter-tool',
  standalone: true,
  imports: [FormsModule, SaTextFieldComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <p class="text-sm text-slate-600">
        Paste decimal degrees (<span class="font-mono">lat, lon</span>), MGRS, or UTM
        (zone letter easting northing). Output is WGS84.
      </p>

      <sa-text-field
        label="Coordinate"
        placeholder="40.7128, -74.0060"
        [(ngModel)]="raw"
        (ngModelChange)="bump()"
        inputClass="font-mono text-sm"
        [spellcheck]="false"
        autocomplete="off"
      />

      @if (error(); as err) {
        <p class="text-sm text-rose-700">{{ err }}</p>
      }

      @if (result(); as r) {
        <dl class="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div>
            <dt class="text-xs font-medium text-slate-500">Decimal degrees</dt>
            <dd class="font-mono text-xs break-all">{{ r.dd }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-slate-500">DMS</dt>
            <dd class="font-mono text-xs break-all">{{ r.dms }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-slate-500">UTM (WGS84)</dt>
            <dd class="font-mono text-xs break-all">{{ r.utm }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium text-slate-500">MGRS</dt>
            <dd class="font-mono text-xs break-all">{{ r.mgrs }}</dd>
          </div>
        </dl>
      }
    </div>
  `,
})
export class CoordinateConverterToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected raw = '';

  private readonly version = signal(0);

  protected bump(): void {
    this.version.update((v) => v + 1);
  }

  protected readonly error = computed((): string | null => {
    this.version();
    const s = this.raw.trim();
    if (!s) {
      return null;
    }
    const ll = tryParseLatLon(s);
    if (!ll) {
      return 'Could not parse coordinate. Try decimal degrees, MGRS, or UTM.';
    }
    return null;
  });

  protected readonly result = computed(() => {
    this.version();
    const s = this.raw.trim();
    if (!s) {
      return null;
    }
    const ll = tryParseLatLon(s);
    if (!ll) {
      return null;
    }
    const [lat, lon] = ll;
    const u = fromLatLon(lat, lon);
    let mgrsStr = '';
    try {
      mgrsStr = mgrsForward([lon, lat], 5);
    } catch {
      mgrsStr = '(unavailable)';
    }
    return {
      dd: formatDd(lat, lon),
      dms: formatDms(lat, lon),
      utm: `${u.zoneNum}${u.zoneLetter} ${u.easting.toFixed(1)} m E, ${u.northing.toFixed(1)} m N`,
      mgrs: mgrsStr,
    };
  });
}
