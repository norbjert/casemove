import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConvertPrices, ConvertPricesFormatted, RequestPrices } from '../prices';

// --------------------------------------------------------------------------
// Shared test fixtures
// --------------------------------------------------------------------------

const makeSettings = (overrides = {}) => ({
  currency: 'EUR',
  locale: 'de-DE',
  source: { title: 'steam_listings', avatar: '', name: 'Steam' },
  currencyPrice: { EUR: 1.0, USD: 1.1 },
  fastMove: false,
  fastConsistentMove: false,
  steamLoginShow: false,
  os: '',
  devmode: false,
  columns: [],
  overview: { by: 'rarity', chartleft: 'totalValue', chartRight: 'itemCount' },
  ...overrides,
} as any);

const makePrices = (overrides = {}) => ({
  prices: {
    // item_name + item_wear_name (no separator, as per _getName implementation)
    'AK-47 | RedlineField-Tested': { steam_listings: 10.0, buff163: 8.0 },
    'AK-47 | Redline': { steam_listings: 12.0, buff163: 9.5 },
  },
  storageAmount: 0,
  productsRequested: [] as string[],
  ...overrides,
} as any);

const makeItem = (item_name: string, item_wear_name: string | null = null) => ({
  item_name,
  item_wear_name,
} as any);

// --------------------------------------------------------------------------
// ConvertPrices
// --------------------------------------------------------------------------

describe('ConvertPrices', () => {
  let cp: ConvertPrices;

  beforeEach(() => {
    cp = new ConvertPrices(makeSettings(), makePrices());
  });

  describe('_getName', () => {
    it('concatenates item_name and item_wear_name', () => {
      const name = cp._getName(makeItem('AK-47 | Redline', 'Field-Tested'));
      expect(name).toBe('AK-47 | RedlineField-Tested');
    });

    it('returns just item_name when wear is null', () => {
      const name = cp._getName(makeItem('AK-47 | Redline', null));
      expect(name).toBe('AK-47 | Redline');
    });
  });

  describe('getPrice', () => {
    it('returns source price multiplied by currency rate', () => {
      // EUR rate = 1.0, source price = 10.0 → 10.0
      const price = cp.getPrice(makeItem('AK-47 | Redline', 'Field-Tested'));
      expect(price).toBeCloseTo(10.0);
    });

    it('applies currency conversion rate', () => {
      const cpUSD = new ConvertPrices(
        makeSettings({ currency: 'USD', currencyPrice: { EUR: 1.0, USD: 1.1 } }),
        makePrices()
      );
      const price = cpUSD.getPrice(makeItem('AK-47 | Redline', 'Field-Tested'));
      expect(price).toBeCloseTo(11.0); // 10.0 * 1.1
    });

    it('returns NaN for an item not in the price list', () => {
      const price = cp.getPrice(makeItem('Unknown Item', 'Factory New'));
      expect(isNaN(price)).toBe(true);
    });

    it('returns 0 with nanToZero=true when price is missing', () => {
      const price = cp.getPrice(makeItem('Unknown Item', 'Factory New'), true);
      expect(price).toBe(0);
    });

    it('returns actual price with nanToZero=true when price exists', () => {
      const price = cp.getPrice(makeItem('AK-47 | Redline', 'Field-Tested'), true);
      expect(price).toBeCloseTo(10.0);
    });

    it('looks up item without wear name', () => {
      const price = cp.getPrice(makeItem('AK-47 | Redline', null));
      expect(price).toBeCloseTo(12.0);
    });
  });
});

// --------------------------------------------------------------------------
// ConvertPricesFormatted
// --------------------------------------------------------------------------

describe('ConvertPricesFormatted', () => {
  let cpf: ConvertPricesFormatted;

  beforeEach(() => {
    cpf = new ConvertPricesFormatted(makeSettings(), makePrices());
  });

  describe('formatPrice', () => {
    it('formats a price as a EUR currency string (de-DE locale)', () => {
      const formatted = cpf.formatPrice(10.5);
      // de-DE format uses comma for decimal: "10,50 €"
      expect(formatted).toContain('10');
      expect(formatted).toContain('€');
    });

    it('formats zero correctly', () => {
      const formatted = cpf.formatPrice(0);
      expect(formatted).toContain('0');
    });
  });

  describe('getFormattedPrice', () => {
    it('returns formatted price string for a known item', () => {
      const formatted = cpf.getFormattedPrice(makeItem('AK-47 | Redline', 'Field-Tested'));
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('10');
    });
  });

  describe('getFormattedPriceCombined', () => {
    it('multiplies price by combined_QTY', () => {
      const item = { ...makeItem('AK-47 | Redline', 'Field-Tested'), combined_QTY: 3 };
      const formatted = cpf.getFormattedPriceCombined(item);
      // 10.0 * 3 = 30.0
      expect(formatted).toContain('30');
    });
  });
});

// --------------------------------------------------------------------------
// RequestPrices
// --------------------------------------------------------------------------

describe('RequestPrices', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let getPrice: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatch = vi.fn();
    getPrice = vi.fn();
    // Mock window.electron.ipcRenderer
    (globalThis as any).window = {
      electron: { ipcRenderer: { getPrice } },
    };
  });

  const makeRP = (extraRequested: string[] = []) =>
    new RequestPrices(dispatch, makeSettings(), makePrices({
      productsRequested: extraRequested,
    }));

  describe('_checkRequested', () => {
    it('returns true when item has NOT been requested', () => {
      const rp = makeRP([]);
      expect(rp._checkRequested(makeItem('AK-47 | Redline', 'Field-Tested'))).toBe(true);
    });

    it('returns false when item HAS already been requested', () => {
      const rp = makeRP(['AK-47 | RedlineField-Tested']);
      expect(rp._checkRequested(makeItem('AK-47 | Redline', 'Field-Tested'))).toBe(false);
    });
  });

  describe('handleRequested', () => {
    it('calls getPrice when item price is NaN and not yet requested', () => {
      const rp = makeRP([]);
      rp.handleRequested(makeItem('Unknown Item', 'Factory New'));
      expect(getPrice).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('does not call getPrice when price is already known', () => {
      const rp = makeRP([]);
      rp.handleRequested(makeItem('AK-47 | Redline', 'Field-Tested'));
      expect(getPrice).not.toHaveBeenCalled();
    });

    it('does not call getPrice when item is already in productsRequested', () => {
      const rp = makeRP(['Unknown ItemFactory New']);
      rp.handleRequested(makeItem('Unknown Item', 'Factory New'));
      expect(getPrice).not.toHaveBeenCalled();
    });
  });

  describe('handleRequestArray', () => {
    it('batches multiple missing items into a single getPrice call', () => {
      const rp = makeRP([]);
      rp.handleRequestArray([
        makeItem('Missing A', 'FN'),
        makeItem('Missing B', 'FT'),
        makeItem('AK-47 | Redline', 'Field-Tested'), // known — should be skipped
      ]);
      expect(getPrice).toHaveBeenCalledTimes(1);
      const sentItems = getPrice.mock.calls[0][0];
      expect(sentItems).toHaveLength(2);
    });

    it('does nothing when all items are already priced', () => {
      const rp = makeRP([]);
      rp.handleRequestArray([makeItem('AK-47 | Redline', 'Field-Tested')]);
      expect(getPrice).not.toHaveBeenCalled();
    });
  });
});
