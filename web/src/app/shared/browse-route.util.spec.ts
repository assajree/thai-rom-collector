import { browseRoute, browseSlug, isPortMasterSystem, normalizeBrowseName } from './browse-route.util';

describe('browseRoute util', () => {
  it('returns /walkthrough for walkthrough route kind', () => {
    expect(browseRoute('walkthrough')).toBe('/walkthrough');
    expect(browseRoute('walkthrough', '')).toBe('/walkthrough');
  });

  it('returns /rom for rom route kind', () => {
    expect(browseRoute('rom')).toBe('/rom');
    expect(browseRoute('rom', '')).toBe('/rom');
  });

  it('returns /port for port route kind', () => {
    expect(browseRoute('port')).toBe('/port');
    expect(browseRoute('port', '')).toBe('/port');
  });

  it('formats system and translator queries correctly', () => {
    expect(browseRoute('system', 'SNES')).toBe('/system?system=SNES');
    expect(browseRoute('translator', 'Siam Quest')).toBe('/translator?translator=Siam%20Quest');
  });

  it('identifies PortMaster systems (PORT, PortMaster, port master, etc.)', () => {
    expect(isPortMasterSystem('PORT')).toBeTrue();
    expect(isPortMasterSystem('port')).toBeTrue();
    expect(isPortMasterSystem('PortMaster')).toBeTrue();
    expect(isPortMasterSystem('port master')).toBeTrue();
    expect(isPortMasterSystem('  PORT  ')).toBeTrue();
    expect(isPortMasterSystem('SNES')).toBeFalse();
    expect(isPortMasterSystem('GBA')).toBeFalse();
    expect(isPortMasterSystem('')).toBeFalse();
    expect(isPortMasterSystem(null)).toBeFalse();
    expect(isPortMasterSystem(undefined)).toBeFalse();
  });
});

