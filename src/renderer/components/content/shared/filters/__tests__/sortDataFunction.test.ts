import { describe, it, expect } from 'vitest';
import { sortDataFunction } from '../inventoryFunctions';

// Redux state is frozen by immer; sorting must not mutate its input.
describe('sortDataFunction', () => {
  it('sorts frozen state by total price without throwing', async () => {
    const rows = Object.freeze([
      Object.freeze({ item_name: 'B', combined_QTY: 1 }),
      Object.freeze({ item_name: 'A', combined_QTY: 12 }),
      Object.freeze({ item_name: 'C', combined_QTY: 2 }),
      Object.freeze({ item_name: 'D', combined_QTY: 1 }),
    ]);
    const prices = { A: { s: 0.09 }, B: { s: 5 }, C: { s: 1 } };
    const sorted = await sortDataFunction('Price', rows, prices, 's');
    expect(sorted.map((r: any) => r.item_name)).toEqual(['D', 'A', 'C', 'B']);
  });
});
