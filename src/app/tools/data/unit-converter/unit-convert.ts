import convert from 'convert-units';

/** Measure keys supported by convert-units (camelCase). */
export const MEASURE_ORDER: string[] = [
  'length',
  'mass',
  'volume',
  'temperature',
  'area',
  'speed',
  'pressure',
  'digital',
  'time',
  'energy',
  'power',
  'current',
  'voltage',
  'frequency',
  'angle',
  'illuminance',
  'pace',
  'partsPer',
  'each',
];

export function measureLabel(key: string): string {
  const map: Record<string, string> = {
    length: 'Length',
    mass: 'Mass',
    volume: 'Volume',
    temperature: 'Temperature',
    area: 'Area',
    speed: 'Speed',
    pressure: 'Pressure',
    digital: 'Digital storage',
    time: 'Time',
    energy: 'Energy',
    power: 'Power',
    current: 'Electric current',
    voltage: 'Voltage',
    frequency: 'Frequency',
    angle: 'Angle',
    illuminance: 'Illuminance',
    pace: 'Pace',
    partsPer: 'Parts per',
    each: 'Count (each)',
    reactivePower: 'Reactive power',
    apparentPower: 'Apparent power',
    reactiveEnergy: 'Reactive energy',
    volumeFlowRate: 'Volume flow rate',
  };
  return map[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

export function listMeasures(): string[] {
  const all = convert().measures();
  const ordered = MEASURE_ORDER.filter((m) => all.includes(m));
  const rest = all.filter((m) => !ordered.includes(m)).sort();
  return [...ordered, ...rest];
}

export interface UnitRow {
  abbr: string;
  singular: string;
  plural: string;
}

export function listUnitsForMeasure(measure: string): UnitRow[] {
  const rows = convert().list(measure) as {
    abbr: string;
    singular: string;
    plural: string;
  }[];
  return rows.map((r) => ({
    abbr: r.abbr,
    singular: r.singular,
    plural: r.plural,
  }));
}

export function convertValue(
  value: number,
  measure: string,
  fromAbbr: string,
  toAbbr: string,
): number {
  if (!Number.isFinite(value)) {
    return NaN;
  }
  return convert(value).from(fromAbbr).to(toAbbr);
}
