import { ItemRow } from 'renderer/interfaces/items';

// One daily point from the cs2-pricing API (prices in USD)
export interface PricePoint {
  fetchedAt: string;
  steamPrice: number | null;
  buff163Price: number | null;
  skinportPrice: number | null;
}
export type PortfolioHistory = Record<string, PricePoint[]>;

// settings source.title -> API field
const sourceFields: Record<string, keyof PricePoint> = {
  steam_listing: 'steamPrice',
  buff163: 'buff163Price',
  skinport: 'skinportPrice',
};

export const timeFrames = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 3650 },
];

// Same naming as the main process pricing lookup; the bare name is a fallback for items whose wear isn't priced separately
export function marketHashNames(itemRow: ItemRow): string[] {
  const name = itemRow.item_name.replaceAll('(Holo/Foil)', '(Holo-Foil)');
  return itemRow.item_wear_name ? [`${itemRow.item_name} (${itemRow.item_wear_name})`, name] : [name];
}

export interface ItemPerformance {
  name: string;
  item: ItemRow;
  qty: number;
  startPrice: number;
  endPrice: number;
  change: number;
  changePct: number;
}

export interface PortfolioResult {
  labels: string[];
  values: number[];
  startValue: number;
  endValue: number;
  change: number;
  changePct: number;
  items: ItemPerformance[];
}

export function computePortfolio(
  rows: ItemRow[],
  history: PortfolioHistory,
  source: string,
  rate: number
): PortfolioResult {
  const field = sourceFields[source] ?? 'steamPrice';

  // Group holdings by the name we have history for
  const holdings = new Map<string, { item: ItemRow; qty: number; prices: Map<string, number> }>();
  rows.forEach((row) => {
    if (!row.item_moveable) return;
    const name = marketHashNames(row).find((n) => history[n]?.length);
    if (!name) return;
    if (!holdings.has(name)) {
      const prices = new Map<string, number>();
      history[name].forEach((p) => {
        const price = p[field] as number | null;
        if (price) prices.set(p.fetchedAt.slice(0, 10), price * rate);
      });
      if (!prices.size) return;
      holdings.set(name, { item: row, qty: 0, prices });
    }
    holdings.get(name)!.qty += row.combined_QTY ?? 1;
  });

  const labels = [...new Set([...holdings.values()].flatMap((h) => [...h.prices.keys()]))].sort();

  // Carry each item's last known price forward; before its first point, use the first point so items joining the dataset don't show up as gains
  const values = labels.map(() => 0);
  const items: ItemPerformance[] = [];
  holdings.forEach(({ item, qty, prices }, name) => {
    let last = prices.get([...prices.keys()].sort()[0])!;
    const startPrice = last;
    labels.forEach((day, i) => {
      last = prices.get(day) ?? last;
      values[i] += last * qty;
    });
    const change = (last - startPrice) * qty;
    items.push({ name, item, qty, startPrice, endPrice: last, change, changePct: ((last - startPrice) / startPrice) * 100 });
  });

  const startValue = values[0] ?? 0;
  const endValue = values[values.length - 1] ?? 0;
  return {
    labels,
    values,
    startValue,
    endValue,
    change: endValue - startValue,
    changePct: startValue ? ((endValue - startValue) / startValue) * 100 : 0,
    items: items.sort((a, b) => b.change - a.change),
  };
}
