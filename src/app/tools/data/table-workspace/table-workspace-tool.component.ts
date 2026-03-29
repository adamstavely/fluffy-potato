import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { exportDelimited } from './csv-export';
import type { DelimiterMode } from '../shared/delimited-table';
import { parseDelimitedTable } from '../shared/delimited-table';
import { dedupeByColumns, dedupeExactRows, splitColumnAt } from './table-dedupe';
import { profileColumns } from './table-profiler';
import { type PivotAgg, simplePivot } from './table-pivot';
import { extractDatesFromText } from './timeline-extract';
import { normalizeTableCells, type TextNormalizeOptions } from './text-normalize';
import { replaceInCells } from './text-replace';
import type { ToolDefinition } from '../../models/tool.model';

const DATA_TOOL_MAX_ROWS = 50_000;
/** Rows rendered in the table workspace grid (export still includes full parsed set up to max). */
const TABLE_WORKSPACE_DISPLAY_MAX = 10_000;
const PII_PASTE_WARNING =
  'Do not paste secrets, credentials, or sensitive personal data unless policy allows. All processing happens in this browser session.';

type WorkspaceTab =
  | 'grid'
  | 'profiler'
  | 'dedupe'
  | 'pivot'
  | 'normalize'
  | 'timeline'
  | 'findreplace';

@Component({
  selector: 'sa-table-workspace-tool',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-workspace-tool.component.html',
})
export class TableWorkspaceToolComponent {
  readonly tool = input.required<ToolDefinition>();

  protected readonly DATA_TOOL_MAX_ROWS = DATA_TOOL_MAX_ROWS;
  protected readonly TABLE_WORKSPACE_DISPLAY_MAX = TABLE_WORKSPACE_DISPLAY_MAX;

  protected readonly tabDefs: { id: WorkspaceTab; label: string }[] = [
    { id: 'grid', label: 'Grid' },
    { id: 'profiler', label: 'Profiler' },
    { id: 'dedupe', label: 'Dedupe' },
    { id: 'pivot', label: 'Pivot' },
    { id: 'normalize', label: 'Normalize' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'findreplace', label: 'Find & replace' },
  ];

  protected readonly piiNotice = PII_PASTE_WARNING;

  protected readonly activeTab = signal<WorkspaceTab>('grid');

  protected rawPaste = '';
  protected delimiterUi: 'auto' | 'tab' | 'comma' = 'auto';
  protected firstRowHeader = true;

  protected readonly headers = signal<string[] | null>(null);
  protected readonly rows = signal<string[][]>([]);
  protected readonly parseNotice = signal<string | null>(null);

  protected sortCol = signal<number | null>(null);
  protected sortDir = signal<1 | -1>(1);
  protected readonly filterQuery = signal('');

  /** Dedupe */
  protected dedupeMode: 'columns' | 'whole' = 'columns';
  protected dedupeKeyCols = '1';

  /** Pivot */
  protected readonly pivotGroupCol = signal(1);
  protected readonly pivotValueCol = signal(2);
  protected readonly pivotAgg = signal<PivotAgg>('sum');

  /** Normalize */
  protected normCollapseWs = true;
  protected normLines = true;
  protected normNfc = false;
  protected normNfd = false;
  protected normStripInvisible = true;

  /** Split column */
  protected splitCol1 = 1;
  protected splitDelimiter = '|';

  /** Timeline */
  protected readonly timelineText = signal('');

  /** Find / replace */
  protected frFind = '';
  protected frReplace = '';
  protected frCaseInsensitive = true;

  protected setTab(t: WorkspaceTab): void {
    this.activeTab.set(t);
  }

  protected delimiterMode(): DelimiterMode {
    if (this.delimiterUi === 'tab') {
      return '\t';
    }
    if (this.delimiterUi === 'comma') {
      return ',';
    }
    return 'auto';
  }

  protected loadTable(): void {
    const parsed = parseDelimitedTable(
      this.rawPaste,
      this.delimiterMode(),
      this.firstRowHeader,
    );
    let data = parsed.rows.map((r) => [...r]);
    const total = data.length;
    let notice: string | null = null;
    if (data.length > DATA_TOOL_MAX_ROWS) {
      data = data.slice(0, DATA_TOOL_MAX_ROWS);
      notice = `Showing first ${DATA_TOOL_MAX_ROWS.toLocaleString()} of ${total.toLocaleString()} data rows. Export or re-parse after trimming.`;
    } else if (total > 0) {
      notice = `${total.toLocaleString()} data rows loaded.`;
    } else {
      notice = 'No rows found. Paste tab- or comma-separated text and click Load table.';
    }
    this.headers.set(parsed.headers ? [...parsed.headers] : null);
    this.rows.set(data);
    this.parseNotice.set(notice);
    this.sortCol.set(null);
  }

  protected readonly columnCount = computed(() => {
    const h = this.headers();
    const r = this.rows();
    const fromH = h?.length ?? 0;
    const fromR = r.reduce((m, row) => Math.max(m, row.length), 0);
    return Math.max(fromH, fromR, 0);
  });

  protected readonly columnIndices = computed(() => {
    const n = this.columnCount();
    return Array.from({ length: n }, (_, i) => i);
  });

  protected readonly filteredRows = computed(() => {
    const q = this.filterQuery().trim().toLowerCase();
    let list = this.rows().map((r) => [...r]);
    if (q.length > 0) {
      list = list.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  protected readonly viewRows = computed(() => {
    const list = this.filteredRows();
    if (this.sortCol() === null) {
      return list;
    }
    const c = this.sortCol()!;
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      const x = a[c] ?? '';
      const y = b[c] ?? '';
      return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  });

  protected readonly displayRows = computed(() => {
    const all = this.viewRows();
    const cap = TABLE_WORKSPACE_DISPLAY_MAX;
    if (all.length <= cap) {
      return { rows: all, truncated: false, total: all.length };
    }
    return {
      rows: all.slice(0, cap),
      truncated: true,
      total: all.length,
    };
  });

  protected readonly profiles = computed(() => {
    return profileColumns(this.headers(), this.rows());
  });

  protected readonly pivotResult = computed(() => {
    const r = this.rows();
    const n = this.columnCount();
    if (r.length === 0 || n === 0) {
      return [];
    }
    const g = Math.max(0, Math.floor(this.pivotGroupCol()) - 1);
    const v = Math.max(0, Math.floor(this.pivotValueCol()) - 1);
    if (g >= n || v >= n) {
      return [];
    }
    return simplePivot(r, g, v, this.pivotAgg());
  });

  protected readonly timelineHits = computed(() => {
    return extractDatesFromText(this.timelineText());
  });

  protected padRow(row: string[], n: number): string[] {
    const c = [...row];
    while (c.length < n) {
      c.push('');
    }
    return c.slice(0, n);
  }

  protected headerLabel(col: number): string {
    const h = this.headers();
    if (h && h[col] !== undefined && String(h[col]).trim().length > 0) {
      return String(h[col]).trim();
    }
    return `Column ${col + 1}`;
  }

  protected toggleSort(col: number): void {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 1 ? -1 : 1);
    } else {
      this.sortCol.set(col);
      this.sortDir.set(1);
    }
  }

  protected sortIndicator(col: number): string {
    if (this.sortCol() !== col) {
      return '';
    }
    return this.sortDir() === 1 ? '↑' : '↓';
  }

  protected setPivotAgg(v: string): void {
    this.pivotAgg.set(v as PivotAgg);
  }

  protected applyNormalize(): void {
    const opts: TextNormalizeOptions = {
      collapseWhitespace: this.normCollapseWs,
      unifyLineEndings: this.normLines,
      nfc: this.normNfc,
      nfd: this.normNfd && !this.normNfc,
      stripInvisible: this.normStripInvisible,
    };
    this.rows.update((rows) => normalizeTableCells(rows, opts));
    this.headers.update((h) => {
      if (!h) {
        return null;
      }
      const [norm] = normalizeTableCells([h], opts);
      return norm;
    });
  }

  protected applyDedupe(): void {
    this.rows.update((rows) => {
      if (this.dedupeMode === 'whole') {
        return dedupeExactRows(rows);
      }
      const parts = this.dedupeKeyCols
        .split(/[,;\s]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 1);
      const n = this.columnCount();
      const idx = parts.map((p) => p - 1).filter((i) => i >= 0 && i < n);
      if (idx.length === 0) {
        return dedupeExactRows(rows);
      }
      return dedupeByColumns(rows, idx);
    });
  }

  protected applySplitColumn(): void {
    const n = this.columnCount();
    const col = Math.floor(this.splitCol1) - 1;
    if (col < 0 || col >= n) {
      return;
    }
    this.rows.update((rows) => splitColumnAt(rows, col, this.splitDelimiter));
    this.headers.update((h) => {
      if (!h) {
        return h;
      }
      const cell = h[col] ?? '';
      const parts = cell.split(this.splitDelimiter).map((p) => p.trim());
      const before = h.slice(0, col);
      const after = h.slice(col + 1);
      return [...before, ...parts, ...after];
    });
  }

  protected applyFindReplace(): void {
    this.rows.update((rows) =>
      replaceInCells(rows, this.frFind, this.frReplace, this.frCaseInsensitive),
    );
    this.headers.update((h) =>
      h
        ? replaceInCells([h], this.frFind, this.frReplace, this.frCaseInsensitive)[0]
        : null,
    );
  }

  protected exportCsv(): void {
    const text = exportDelimited(this.headers(), this.rows(), 'csv');
    this.downloadFile('table-export.csv', text, 'text/csv;charset=utf-8');
  }

  protected exportTsv(): void {
    const text = exportDelimited(this.headers(), this.rows(), 'tsv');
    this.downloadFile('table-export.tsv', text, 'text/tab-separated-values;charset=utf-8');
  }

  private downloadFile(name: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected async copyText(text: string): Promise<void> {
    if (!text || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(text);
  }

  protected timelineExportText(): string {
    return this.timelineHits()
      .map((h) => `${h.isoOrRaw}\t${h.match}\t${h.context}`)
      .join('\n');
  }
}
