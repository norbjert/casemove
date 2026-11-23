import { describe, it, expect } from 'vitest';
import { computePortfolio, marketHashNames } from '../portfolio';

const row = (item_name: string, item_wear_name: string | undefined, combined_QTY: number) =>
  ({ item_name, item_wear_name, combined_QTY, item_moveable: true } as any);

const point = (day: string, steamPrice: number | null, buff163Price: number | null = null) => ({
  fetchedAt: `${day}T18:00:00Z`,
  steamPrice,
  buff163Price,
  skinportPrice: null,
});

describe('marketHashNames', () => {
  it('appends wear in parentheses and keeps the bare name as fallback', () => {
    expect(marketHashNames(row('AK-47 | Redline', 'Field-Tested', 1))).toEqual([
      'AK-47 | Redline (Field-Tested)',
      'AK-47 | Redline',
    ]);
  });

  it('normalises Holo/Foil', () => {
    expect(marketHashNames(row('Sticker | Foo (Holo/Foil)', undefined, 1))).toEqual(['Sticker | Foo (Holo-Foil)']);
  });
});

describe('computePortfolio', () => {
  const history = {
    'AK-47 | Redline (Field-Tested)': [point('2026-05-01', 10), point('2026-05-03', 12)],
    'Case A': [point('2026-05-02', 1), point('2026-05-03', 0.5)],
  };

  it('sums quantities, carries prices forward and backfills late starters', () => {
    const r = computePortfolio(
      [row('AK-47 | Redline', 'Field-Tested', 1), row('AK-47 | Redline', 'Field-Tested', 1), row('Case A', undefined, 10)],
      history,
      'steam_listing',
      2
    );
    expect(r.labels).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
    // AK: 2 x [20, 20, 24]; Case: 10 x [2 (backfilled), 2, 1]
    expect(r.values).toEqual([60, 60, 58]);
    expect(r.change).toBe(-2);
    expect(r.items.map((i) => [i.name, i.change])).toEqual([
      ['AK-47 | Redline (Field-Tested)', 8],
      ['Case A', -10],
    ]);
    expect(r.items[1].changePct).toBe(-50);
  });

  it('uses the selected price source and skips items without data', () => {
    const r = computePortfolio(
      [row('X', undefined, 1), row('Unknown', undefined, 5)],
      { X: [point('2026-05-01', 99, 4), point('2026-05-02', 99, 5)] },
      'buff163',
      1
    );
    expect(r.values).toEqual([4, 5]);
    expect(r.items).toHaveLength(1);
  });

  it('handles an empty portfolio', () => {
    const r = computePortfolio([], {}, 'steam_listing', 1);
    expect(r).toMatchObject({ labels: [], startValue: 0, endValue: 0, change: 0, changePct: 0 });
  });
});
