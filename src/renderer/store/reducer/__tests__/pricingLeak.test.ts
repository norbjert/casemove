import { describe, it, expect } from 'vitest';
import pricingReducer from '../pricing';
import { inventoryReducer } from '../../inventory/inventoryClass';

// The hand-written versions of these reducers assigned state.prices /
// state.productsRequested to a local and mutated it in place. On the first
// action that local IS initialState's object, so initialState was permanently
// polluted and every later reset returned the polluted copy.
describe('reducers do not pollute initialState', () => {
  it('PRICING_CLEAR really clears prices', () => {
    let state = pricingReducer(undefined, { type: '@@INIT' });
    state = pricingReducer(state, {
      type: 'PRICING_ADD_TO',
      payload: { itemRows: [{ item_name: 'AK-47', item_wear_name: 'FT', pricing: 5 }] },
    });
    expect(state.prices).toEqual({ 'AK-47FT': 5 });

    state = pricingReducer(state, { type: 'PRICING_CLEAR' });
    expect(state.prices).toEqual({});
  });

  it('a fresh pricing store is not carrying a previous run’s prices', () => {
    const fresh = pricingReducer(undefined, { type: 'UNKNOWN' });
    expect(fresh.prices).toEqual({});
    expect(fresh.productsRequested).toEqual([]);
  });

  it('SIGN_OUT really clears storage inventory', () => {
    let state = inventoryReducer(undefined, { type: '@@INIT' });
    state = inventoryReducer(state, {
      type: 'INVENTORY_STORAGES_ADD_TO',
      payload: {
        casketID: 'c1',
        storageData: [{ storage_id: 'c1', item_id: 'i1' }],
        storageRowsRaw: [{ storage_id: 'c1', item_id: 'i1' }],
      },
    });
    expect(state.storageInventory).toHaveLength(1);

    state = inventoryReducer(state, { type: 'SIGN_OUT' });
    expect(state.storageInventory).toEqual([]);
    expect(inventoryReducer(undefined, { type: 'UNKNOWN' }).storageInventory).toEqual([]);
  });
});
