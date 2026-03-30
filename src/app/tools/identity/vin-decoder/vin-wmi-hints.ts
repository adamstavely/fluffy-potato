/** Curated WMI (first 3 VIN chars) hints — not exhaustive. */
export const WMI_HINTS: { wmi: string; hint: string }[] = [
  { wmi: '1G1', hint: 'GM USA (example)' },
  { wmi: '1HG', hint: 'Honda USA' },
  { wmi: '1FT', hint: 'Ford USA' },
  { wmi: '2HG', hint: 'Honda Canada' },
  { wmi: '3VW', hint: 'Volkswagen Mexico' },
  { wmi: 'JHM', hint: 'Honda Japan' },
  { wmi: 'KMH', hint: 'Hyundai Korea' },
  { wmi: 'WBA', hint: 'BMW Germany' },
  { wmi: 'WVW', hint: 'Volkswagen Germany' },
  { wmi: 'ZFF', hint: 'Ferrari Italy' },
];

export function wmiHint(wmi: string): string | null {
  const u = wmi.toUpperCase();
  const exact = WMI_HINTS.find((h) => h.wmi === u);
  return exact?.hint ?? null;
}

/** Rough region from WMI first character (model year / plant rules vary). */
export function regionHint(firstChar: string): string {
  const c = firstChar.toUpperCase();
  if ('ABCDEFGH'.includes(c)) {
    return 'Africa / Middle East (rough)';
  }
  if ('JKLMNPRS'.includes(c)) {
    return 'Asia (rough)';
  }
  if ('TUVWXYZ'.includes(c)) {
    return 'Europe (rough)';
  }
  if (c >= '1' && c <= '5') {
    return 'North America (rough)';
  }
  if (c >= '6' && c <= '9') {
    return 'Oceania / South America (rough)';
  }
  return 'Unknown';
}
