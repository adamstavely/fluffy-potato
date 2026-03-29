import { keySimilarity, levenshteinDistance } from './string-similarity';

describe('string-similarity', () => {
  it('computes Levenshtein distance', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('a', 'a')).toBe(0);
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('returns 1 for identical keys in keySimilarity', () => {
    expect(keySimilarity('ID-1', 'ID-1')).toBe(1);
  });
});
