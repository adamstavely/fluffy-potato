import { outputFilename, pickOutputMime } from './strip-image-metadata';

describe('strip-image-metadata helpers', () => {
  it('pickOutputMime maps common types', () => {
    expect(pickOutputMime('image/jpeg')).toBe('image/jpeg');
    expect(pickOutputMime('image/JPG')).toBe('image/jpeg');
    expect(pickOutputMime('image/png')).toBe('image/png');
    expect(pickOutputMime('image/webp')).toBe('image/webp');
    expect(pickOutputMime('image/gif')).toBe('image/png');
  });

  it('outputFilename adds -stripped before extension', () => {
    expect(outputFilename('photo.jpg', 'image/jpeg')).toBe('photo-stripped.jpg');
    expect(outputFilename('x.PNG', 'image/png')).toBe('x-stripped.png');
  });
});
