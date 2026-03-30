/** Model year character at VIN position 10 (1-based) — 1980–2039 cycle (simplified). */
export function decodeModelYearCode(code: string): string {
  const c = code.toUpperCase();
  const map: Record<string, number> = {
    A: 1980,
    B: 1981,
    C: 1982,
    D: 1983,
    E: 1984,
    F: 1985,
    G: 1986,
    H: 1987,
    J: 1988,
    K: 1989,
    L: 1990,
    M: 1991,
    N: 1992,
    P: 1993,
    R: 1994,
    S: 1995,
    T: 1996,
    V: 1997,
    W: 1998,
    X: 1999,
    Y: 2000,
    '1': 2001,
    '2': 2002,
    '3': 2003,
    '4': 2004,
    '5': 2005,
    '6': 2006,
    '7': 2007,
    '8': 2008,
    '9': 2009,
  };
  const base = map[c];
  if (base === undefined) {
    return c;
  }
  return `${base} or ${base + 30} (confirm with manufacturer — 30-year cycle)`;
}
