jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: { rates: { EUR: 0.88, GBP: 0.77, DKK: 6.55 } },
  }),
}));

jest.mock('../backup/currency.json', () => ({
  rates: { EUR: 0.95, GBP: 0.80, DKK: 7.07 },
}));

// eslint-disable-next-line import/first
import { currency } from '../currency';

describe('currency', () => {
  let c: currency;

  beforeEach(() => {
    c = new currency();
    // Manually set rates to avoid relying on async axios mock resolving
    (c as any).rates = { EUR: 0.88, GBP: 0.77, DKK: 6.55, USD: 1 };
  });

  it('returns 1 for undefined', async () => {
    expect(await c.getRate(undefined as any)).toBe(1);
  });

  it('returns 1 for null', async () => {
    expect(await c.getRate(null as any)).toBe(1);
  });

  it('returns 1 for non-string', async () => {
    expect(await c.getRate(123 as any)).toBe(1);
  });

  it('returns 1 for unknown currency', async () => {
    expect(await c.getRate('XYZ')).toBe(1);
  });

  it('returns 1 for USD', async () => {
    expect(await c.getRate('USD')).toBe(1);
  });

  it('returns correct EUR rate', async () => {
    expect(await c.getRate('EUR')).toBe(0.88);
  });

  it('returns correct GBP rate', async () => {
    expect(await c.getRate('GBP')).toBe(0.77);
  });

  it('loads backup rates on construction', () => {
    const fresh = new currency();
    // rates should be populated from backup immediately (before async fetch)
    expect((fresh as any).rates).toMatchObject({ EUR: 0.95, GBP: 0.80 });
  });
});
