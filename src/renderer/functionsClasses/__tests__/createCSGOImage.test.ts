const mockLookup = {
  'econ/weapons/base_weapons/weapon_ak47': 'https://cdn.example.com/ak47.png',
  'econ/default_generated/weapon_ak47_cu_ak47_cobra_light': 'https://cdn.example.com/ak47_cobra.png',
  'econ/tools/case_key': 'https://cdn.example.com/key.png',
  'econ/stickers/eslam': 'https://cdn.example.com/sticker.png',
};

// Mock fetch before module is imported
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve(mockLookup),
}) as any;

// eslint-disable-next-line import/first
import { createCSGOImage } from '../createCSGOImage';

describe('createCSGOImage', () => {
  it('returns empty string for empty input', () => {
    expect(createCSGOImage('')).toBe('');
  });

  it('returns empty string for unknown item when lookup not loaded', () => {
    // imageLookup is null until fetch resolves — safe fallback
    expect(createCSGOImage('econ/unknown/item')).toBe('');
  });

  describe('after lookup is loaded', () => {
    beforeAll(async () => {
      // Flush the fetch promise so imageLookup gets populated
      await new Promise((r) => setTimeout(r, 0));
    });

    it('matches direct path', () => {
      expect(createCSGOImage('econ/tools/case_key')).toBe('https://cdn.example.com/key.png');
    });

    it('matches base weapon path', () => {
      expect(createCSGOImage('econ/weapons/base_weapons/weapon_ak47')).toBe(
        'https://cdn.example.com/ak47.png'
      );
    });

    it('strips _large suffix for skin lookup', () => {
      expect(
        createCSGOImage('econ/default_generated/weapon_ak47_cu_ak47_cobra_light_large')
      ).toBe('https://cdn.example.com/ak47_cobra.png');
    });

    it('matches sticker path directly', () => {
      expect(createCSGOImage('econ/stickers/eslam')).toBe('https://cdn.example.com/sticker.png');
    });

    it('returns empty string for unknown item', () => {
      expect(createCSGOImage('econ/unknown/nonexistent')).toBe('');
    });
  });
});
