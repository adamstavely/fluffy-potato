declare module 'convert-units' {
  interface UnitInfo {
    abbr: string;
    measure: string;
    system: string;
    singular: string;
    plural: string;
  }

  interface Converter {
    from(unit: string): this;
    to(unit: string): number;
    list(measure?: string): UnitInfo[];
    measures(): string[];
    possibilities(measure?: string): string[];
  }

  function convert(value: number): Converter;
  function convert(): Converter;

  export default convert;
}
