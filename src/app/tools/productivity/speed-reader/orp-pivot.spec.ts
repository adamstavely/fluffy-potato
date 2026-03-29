import { orpPivotIndex, splitOrpDisplay, tokenizeWords } from './orp-pivot';

describe('orpPivotIndex', () => {
  it('maps length buckets to Spritz-style pivots', () => {
    expect(orpPivotIndex('')).toBe(0);
    expect(orpPivotIndex('a')).toBe(0);
    expect(orpPivotIndex('ab')).toBe(0);
    expect(orpPivotIndex('abc')).toBe(1);
    expect(orpPivotIndex('abcde')).toBe(1);
    expect(orpPivotIndex('abcdef')).toBe(2);
    expect(orpPivotIndex('abcdefghi')).toBe(2);
    expect(orpPivotIndex('abcdefghij')).toBe(3);
    expect(orpPivotIndex('abcdefghijklm')).toBe(3);
    expect(orpPivotIndex('abcdefghijklmn')).toBe(4);
    expect(orpPivotIndex('abcdefghijklmno')).toBe(4);
    expect(orpPivotIndex('abcdefghijklmnop')).toBe(4);
    expect(orpPivotIndex('abcdefghijklmnopqrst')).toBe(5);
  });

  it('uses extended buckets for long words without exceeding length', () => {
    const s = 'x'.repeat(100);
    expect(orpPivotIndex(s)).toBe(25);
    expect(orpPivotIndex(s)).toBeLessThan(s.length);
  });
});

describe('splitOrpDisplay', () => {
  it('splits around pivot', () => {
    expect(splitOrpDisplay('hello')).toEqual({ before: 'h', pivot: 'e', after: 'llo' });
    expect(splitOrpDisplay('I')).toEqual({ before: '', pivot: 'I', after: '' });
  });
});

describe('tokenizeWords', () => {
  it('splits on whitespace and drops empties', () => {
    expect(tokenizeWords('  a  b\nc\t')).toEqual(['a', 'b', 'c']);
  });

  it('keeps punctuation on tokens', () => {
    expect(tokenizeWords('Hello, world!')).toEqual(['Hello,', 'world!']);
  });
});
