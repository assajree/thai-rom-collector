import { browseRoute, browseSlug, normalizeBrowseName } from './browse-route.util';

describe('browseRoute util', () => {
  it('returns /walkthrough for walkthrough route kind', () => {
    expect(browseRoute('walkthrough')).toBe('/walkthrough');
    expect(browseRoute('walkthrough', '')).toBe('/walkthrough');
  });

  it('returns /rom for rom route kind', () => {
    expect(browseRoute('rom')).toBe('/rom');
    expect(browseRoute('rom', '')).toBe('/rom');
  });

  it('formats system and translator queries correctly', () => {
    expect(browseRoute('system', 'SNES')).toBe('/system?system=SNES');
    expect(browseRoute('translator', 'Siam Quest')).toBe('/translator?translator=Siam%20Quest');
  });

  it('formats tag route correctly', () => {
    expect(browseRoute('tag', 'RPG')).toBe('/tag/RPG');
  });
});
