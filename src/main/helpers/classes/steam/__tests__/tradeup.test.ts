import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.mock is hoisted before variable declarations, so mock data must be
// defined inside vi.hoisted() to be available when the factory runs.
const { COLLECTIONS_MOCK, KNIFE_COLLECTIONS_MOCK, DIRECTORY_MOCK } = vi.hoisted(() => {
  const COLLECTIONS_MOCK = {
    'Alpha Collection': {
      'Skin Alpha Consumer': {
        best_quality: '4',
        'min-wear': '0.00',
        'max-wear': '1.00',
        trade_up: true,
        imageURL: 'https://img/alpha_consumer.png',
      },
      'Skin Alpha Industrial': {
        best_quality: '5',
        'min-wear': '0.00',
        'max-wear': '1.00',
        trade_up: true,
        imageURL: 'https://img/alpha_ind.png',
      },
      'Skin Alpha Restricted': {
        best_quality: '6',
        'min-wear': '0.00',
        'max-wear': '1.00',
        trade_up: true,
        imageURL: 'https://img/alpha_r.png',
      },
      'Skin Alpha Classified': {
        best_quality: '8',
        'min-wear': '0.00',
        'max-wear': '1.00',
        trade_up: true,
        imageURL: 'https://img/alpha_c.png',
      },
      'Skin Alpha Covert': {
        best_quality: '10',
        'min-wear': '0.00',
        'max-wear': '1.00',
        trade_up: true,
        imageURL: 'https://img/alpha_co.png',
      },
    },
    'Beta Collection': {
      'Skin Beta Covert': {
        best_quality: '10',
        'min-wear': '0.00',
        'max-wear': '1.00',
        trade_up: true,
        imageURL: 'https://img/beta_co.png',
      },
    },
  };

  const KNIFE_COLLECTIONS_MOCK = {
    'Alpha Collection': [
      { name: '★ Karambit', imageURL: 'https://img/kara.png', 'min-wear': null, 'max-wear': null, vanilla: true },
      { name: '★ Karambit | Fade', imageURL: 'https://img/kara_fade.png', 'min-wear': '0.00', 'max-wear': '0.08' },
      // Doppler phases — weights sum to 1.0 across 4 phases
      { name: '★ Karambit | Doppler (Phase 1)', imageURL: 'https://img/kara_p1.png', 'min-wear': '0.00', 'max-wear': '0.08', weight: 0.225 },
      { name: '★ Karambit | Doppler (Phase 2)', imageURL: 'https://img/kara_p2.png', 'min-wear': '0.00', 'max-wear': '0.08', weight: 0.225 },
      { name: '★ Karambit | Doppler (Phase 3)', imageURL: 'https://img/kara_p3.png', 'min-wear': '0.00', 'max-wear': '0.08', weight: 0.225 },
      { name: '★ Karambit | Doppler (Phase 4)', imageURL: 'https://img/kara_p4.png', 'min-wear': '0.00', 'max-wear': '0.08', weight: 0.225 },
    ],
    'Beta Collection': [
      { name: '★ Butterfly Knife | Slaughter', imageURL: 'https://img/butter_s.png', 'min-wear': '0.00', 'max-wear': '0.26' },
    ],
  };

  const DIRECTORY_MOCK: Record<string, string> = {};
  for (const [collection, skins] of Object.entries(COLLECTIONS_MOCK)) {
    for (const skinName of Object.keys(skins)) {
      DIRECTORY_MOCK[skinName] = collection;
    }
  }

  return { COLLECTIONS_MOCK, KNIFE_COLLECTIONS_MOCK, DIRECTORY_MOCK };
});

vi.mock('../backup/collections.json', () => ({ default: COLLECTIONS_MOCK }));
vi.mock('../backup/knifeCollections.json', () => ({ default: KNIFE_COLLECTIONS_MOCK }));

import { tradeUps } from '../tradeup';

// --- Helpers -----------------------------------------------------------------

function makeItem(
  item_name: string,
  item_paint_wear: number,
  rarityName: string = 'Restricted'
) {
  return { item_name, item_paint_wear, rarityName };
}

// --- Tests -------------------------------------------------------------------

describe('tradeUps', () => {
  let tu: tradeUps;

  beforeEach(() => {
    tu = new tradeUps();
    // Bypass the async constructor; inject mock data directly
    tu.setCollections(COLLECTIONS_MOCK as any, DIRECTORY_MOCK);
  });

  // --------------------------------------------------------------------------
  // getRarity
  // --------------------------------------------------------------------------
  describe('getRarity', () => {
    // With min=0, max=1 the normalized float == averageFloat, and the returned
    // float value == averageFloat (since c = (1-0)*avg and result = c + 0).
    it('returns Factory New for avgNorm < 0.07', () => {
      const [wear, float] = tu.getRarity('0', '1', 0.05);
      expect(wear).toBe('Factory New');
      expect(float).toBeCloseTo(0.05);
    });

    it('returns Minimal Wear for 0.07 <= avgNorm < 0.15', () => {
      const [wear] = tu.getRarity('0', '1', 0.10);
      expect(wear).toBe('Minimal Wear');
    });

    it('returns Field-Tested for 0.15 <= avgNorm < 0.38', () => {
      const [wear] = tu.getRarity('0', '1', 0.25);
      expect(wear).toBe('Field-Tested');
    });

    it('returns Well-Worn for 0.38 <= avgNorm < 0.45', () => {
      const [wear] = tu.getRarity('0', '1', 0.42);
      expect(wear).toBe('Well-Worn');
    });

    it('returns Battle-Scarred for avgNorm >= 0.45', () => {
      const [wear] = tu.getRarity('0', '1', 0.80);
      expect(wear).toBe('Battle-Scarred');
    });

    it('respects min/max wear range for float calculation', () => {
      // With min=0.06, max=0.80, avgNorm=0 → float = 0 + 0.06 = 0.06
      const [, float] = tu.getRarity('0.06', '0.80', 0);
      expect(float).toBeCloseTo(0.06);
    });
  });

  // --------------------------------------------------------------------------
  // getPossible
  // --------------------------------------------------------------------------
  describe('getPossible', () => {
    it('returns next-tier skins (Restricted 6 → Classified 8)', () => {
      const possible = tu.getPossible('Alpha Collection', 6);
      expect(possible).toContain('Skin Alpha Classified');
      expect(possible).not.toContain('Skin Alpha Restricted');
    });

    it('finds direct next tier (Consumer 4 → Industrial 5)', () => {
      const possible = tu.getPossible('Alpha Collection', 4);
      expect(possible).toContain('Skin Alpha Industrial');
    });

    it('returns empty array when already at max quality', () => {
      const possible = tu.getPossible('Alpha Collection', 10);
      expect(possible).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // getTradeUp
  // --------------------------------------------------------------------------
  describe('getTradeUp', () => {
    it('marks a known skin as trade-up confirmed', async () => {
      const items = [makeItem('Skin Alpha Restricted', 0.2)];
      const result = await tu.getTradeUp(items) as any[];
      expect(result[0].tradeUpConfirmed).toBe(true);
      expect(result[0].collection).toBe('Alpha Collection');
    });

    it('sets tradeUpConfirmed=false for unknown skins', async () => {
      const items = [makeItem('Unknown Skin', 0.2)];
      const result = await tu.getTradeUp(items) as any[];
      expect(result[0].tradeUpConfirmed).toBe(false);
    });

    it('covert skins always get tradeUpConfirmed=true', async () => {
      const items = [makeItem('Skin Alpha Covert', 0.2, 'Covert')];
      const result = await tu.getTradeUp(items) as any[];
      expect(result[0].tradeUpConfirmed).toBe(true);
    });

    it('strips StatTrak™ prefix for lookup', async () => {
      const items = [makeItem('StatTrak™ Skin Alpha Restricted', 0.2)];
      const result = await tu.getTradeUp(items) as any[];
      expect(result[0].tradeUpConfirmed).toBe(true);
      expect(result[0].collection).toBe('Alpha Collection');
    });
  });

  // --------------------------------------------------------------------------
  // getPotentitalOutcome — normal trade-up
  // --------------------------------------------------------------------------
  describe('getPotentitalOutcome (normal)', () => {
    it('returns next-tier skins with equal probability', async () => {
      const items = Array(10).fill(null).map(() =>
        makeItem('Skin Alpha Restricted', 0.5)
      );
      const result = await tu.getPotentitalOutcome(items) as any[];
      expect(result.length).toBeGreaterThan(0);
      const names = result.map((r) => r.item_name);
      expect(names).toContain('Skin Alpha Classified');
      // All outcomes share equal probability
      const percentages = result.map((r) => parseFloat(r.percentage));
      const expected = 100 / result.length;
      percentages.forEach((p) => expect(p).toBeCloseTo(expected, 1));
    });

    it('prefixes StatTrak™ on normal trade-up outputs', async () => {
      const items = Array(10).fill(null).map(() =>
        makeItem('StatTrak™ Skin Alpha Restricted', 0.5)
      );
      const result = await tu.getPotentitalOutcome(items) as any[];
      result.forEach((r) => {
        expect(r.item_name).toMatch(/^StatTrak™/);
      });
    });

    it('calculates average normalized float correctly', async () => {
      // With min=0, max=1: avgNorm = item_paint_wear directly.
      // Field-Tested threshold is 0.38, so avgNorm=0.25 → FT (0.25 < 0.38).
      const items = Array(10).fill(null).map(() =>
        makeItem('Skin Alpha Restricted', 0.25)
      );
      const result = await tu.getPotentitalOutcome(items) as any[];
      result.forEach((r) => {
        expect(r.item_wear_name).toBe('Field-Tested');
      });
    });
  });

  // --------------------------------------------------------------------------
  // getPotentitalOutcome — covert trade-up (knives/gloves)
  // --------------------------------------------------------------------------
  describe('getPotentitalOutcome (covert)', () => {
    function makeCovert(name: string, wear: number = 0.5) {
      return makeItem(name, wear, 'Covert');
    }

    it('returns knife pool entries for covert inputs', async () => {
      const items = Array(5).fill(null).map(() => makeCovert('Skin Alpha Covert'));
      const result = await tu.getPotentitalOutcome(items) as any[];
      const names = result.map((r) => r.item_name);
      expect(names).toContain('★ Karambit');
      expect(names).toContain('★ Karambit | Fade');
    });

    it('vanilla knives have null wear info', async () => {
      const items = Array(5).fill(null).map(() => makeCovert('Skin Alpha Covert'));
      const result = await tu.getPotentitalOutcome(items) as any[];
      const vanilla = result.find((r) => r.item_name === '★ Karambit');
      expect(vanilla).toBeTruthy();
      expect(vanilla.item_wear_name).toBeNull();
      expect(vanilla.float_chance).toBeNull();
    });

    it('non-vanilla knives have wear info', async () => {
      const items = Array(5).fill(null).map(() => makeCovert('Skin Alpha Covert'));
      const result = await tu.getPotentitalOutcome(items) as any[];
      const fade = result.find((r) => r.item_name === '★ Karambit | Fade');
      expect(fade).toBeTruthy();
      expect(fade.item_wear_name).toBeTruthy();
      expect(typeof fade.float_chance).toBe('number');
    });

    it('probabilities across all outcomes sum to 100', async () => {
      const items = Array(5).fill(null).map(() => makeCovert('Skin Alpha Covert'));
      const result = await tu.getPotentitalOutcome(items) as any[];
      const total = result.reduce((sum, r) => sum + parseFloat(r.percentage), 0);
      expect(total).toBeCloseTo(100, 1);
    });

    it('Doppler phases have lower probability than non-phase finishes', async () => {
      // Pool has 1 vanilla (w=1) + 1 Fade (w=1) + 4 Doppler phases (w=0.225 each).
      // Total weight = 1 + 1 + 0.225*4 = 2.9
      // Fade: 1/2.9 * 100 ≈ 34.5%, each Doppler phase: 0.225/2.9 * 100 ≈ 7.76%
      const items = Array(5).fill(null).map(() => makeCovert('Skin Alpha Covert'));
      const result = await tu.getPotentitalOutcome(items) as any[];
      const fade = result.find((r) => r.item_name === '★ Karambit | Fade');
      const p1 = result.find((r) => r.item_name === '★ Karambit | Doppler (Phase 1)');
      expect(parseFloat(fade.percentage)).toBeGreaterThan(parseFloat(p1.percentage));
    });

    it('mixed collections split probability proportionally (4+1)', async () => {
      // 4 from Alpha Collection, 1 from Beta Collection → 80% Alpha / 20% Beta
      const items = [
        makeCovert('Skin Alpha Covert'),
        makeCovert('Skin Alpha Covert'),
        makeCovert('Skin Alpha Covert'),
        makeCovert('Skin Alpha Covert'),
        makeCovert('Skin Beta Covert'),
      ];
      const result = await tu.getPotentitalOutcome(items) as any[];

      // Beta pool has only 1 knife → should get 20% of probability
      const slaughter = result.find((r) => r.item_name === '★ Butterfly Knife | Slaughter');
      expect(slaughter).toBeTruthy();
      expect(parseFloat(slaughter.percentage)).toBeCloseTo(20, 0);

      // Alpha outcomes together should sum to ~80%
      const alphaTotal = result
        .filter((r) => r.item_name !== '★ Butterfly Knife | Slaughter')
        .reduce((sum, r) => sum + parseFloat(r.percentage), 0);
      expect(alphaTotal).toBeCloseTo(80, 0);
    });

    it('prefixes StatTrak™ on covert outputs', async () => {
      const items = Array(5).fill(null).map(() =>
        makeItem('StatTrak™ Skin Alpha Covert', 0.5, 'Covert')
      );
      const result = await tu.getPotentitalOutcome(items) as any[];
      result.forEach((r) => {
        expect(r.item_name).toMatch(/^StatTrak™/);
      });
    });

    it('does not include duplicate knife entries', async () => {
      const items = Array(5).fill(null).map(() => makeCovert('Skin Alpha Covert'));
      const result = await tu.getPotentitalOutcome(items) as any[];
      const names = result.map((r) => r.item_name);
      const unique = new Set(names);
      expect(names.length).toBe(unique.size);
    });
  });
});
