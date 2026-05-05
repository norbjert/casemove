import { describe, it, expect } from 'vitest';
import tradeUpReducer from '../tradeupReducer';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const initialState = {
  tradeUpProducts: [],
  tradeUpProductsIDS: [],
  possibleOutcomes: [],
  searchInput: '',
  MinFloat: 0,
  MaxFloat: 1,
  collections: [],
  options: ['Hide equipped'],
};

function makeProduct(id: number, rarityName: string = 'Restricted') {
  return { item_id: id, rarityName, item_name: `Skin ${id}`, item_paint_wear: 0.3 };
}

function addItem(state: any, item: any) {
  return tradeUpReducer(state, { type: 'TRADEUP_ADD_REMOVE', payload: item });
}

// --------------------------------------------------------------------------

describe('tradeUpReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = tradeUpReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  // -------------------------------------------------------------------------
  // TRADEUP_ADD_REMOVE — basic add/remove
  // -------------------------------------------------------------------------
  describe('TRADEUP_ADD_REMOVE', () => {
    it('adds an item to an empty list', () => {
      const state = addItem(initialState, makeProduct(1));
      expect(state.tradeUpProducts).toHaveLength(1);
      expect(state.tradeUpProductsIDS).toContain(1);
    });

    it('removes an item that is already in the list (toggle)', () => {
      let state = addItem(initialState, makeProduct(1));
      state = addItem(state, makeProduct(1)); // toggle off
      expect(state.tradeUpProducts).toHaveLength(0);
      expect(state.tradeUpProductsIDS).not.toContain(1);
    });

    it('can hold up to 10 non-covert items', () => {
      let state: any = initialState;
      for (let i = 1; i <= 10; i++) {
        state = addItem(state, makeProduct(i));
      }
      expect(state.tradeUpProducts).toHaveLength(10);
    });

    it('preserves possibleOutcomes when reaching exactly 10 items', () => {
      // The reducer clears possibleOutcomes when length != maxItems (not yet
      // ready), and preserves them when length == maxItems (trade-up complete).
      let state: any = initialState;
      for (let i = 1; i <= 9; i++) {
        state = addItem(state, makeProduct(i));
      }
      expect(state.possibleOutcomes).toHaveLength(0);
      // Restore outcomes then add 10th
      state = { ...state, possibleOutcomes: [{ item_name: 'Out' }] };
      state = addItem(state, makeProduct(10));
      expect(state.possibleOutcomes).toHaveLength(1);
    });

    it('resets possibleOutcomes when not at max', () => {
      const withOutcomes = { ...initialState, possibleOutcomes: [{ item_name: 'Out' }] };
      const state = addItem(withOutcomes, makeProduct(1));
      expect(state.possibleOutcomes).toHaveLength(0);
    });

    it('syncs tradeUpProductsIDS with tradeUpProducts', () => {
      let state: any = initialState;
      state = addItem(state, makeProduct(5));
      state = addItem(state, makeProduct(9));
      expect(state.tradeUpProductsIDS).toEqual([5, 9]);
    });
  });

  // -------------------------------------------------------------------------
  // TRADEUP_ADD_REMOVE — covert-specific limit
  // -------------------------------------------------------------------------
  describe('TRADEUP_ADD_REMOVE (covert)', () => {
    it('limits covert trade-ups to 5 items', () => {
      let state: any = initialState;
      for (let i = 1; i <= 5; i++) {
        state = addItem(state, makeProduct(i, 'Covert'));
      }
      expect(state.tradeUpProducts).toHaveLength(5);
    });

    it('preserves possibleOutcomes when reaching exactly 5 covert items', () => {
      let state: any = initialState;
      for (let i = 1; i <= 4; i++) {
        state = addItem(state, makeProduct(i, 'Covert'));
      }
      expect(state.possibleOutcomes).toHaveLength(0);
      state = { ...state, possibleOutcomes: [{ item_name: 'Knife' }] };
      state = addItem(state, makeProduct(5, 'Covert'));
      expect(state.possibleOutcomes).toHaveLength(1);
    });

    it('detects covert from existing state when new payload is not covert', () => {
      // If first item in state is Covert, subsequent non-Covert adds are
      // also treated as part of a covert trade-up (maxItems = 5).
      let state: any = initialState;
      state = addItem(state, makeProduct(1, 'Covert'));
      for (let i = 2; i <= 4; i++) {
        state = addItem(state, makeProduct(i, 'Restricted'));
      }
      state = { ...state, possibleOutcomes: [{ item_name: 'Knife' }] };
      state = addItem(state, makeProduct(5, 'Restricted'));
      // At 5 items (covert maxItems) possibleOutcomes should be preserved
      expect(state.possibleOutcomes).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Other actions
  // -------------------------------------------------------------------------
  describe('TRADEUP_ADDREMOVE_COLLECTION', () => {
    it('adds a collection', () => {
      const state = tradeUpReducer(initialState, {
        type: 'TRADEUP_ADDREMOVE_COLLECTION',
        payload: 'Chroma Collection',
      });
      expect(state.collections).toContain('Chroma Collection');
    });

    it('removes a collection (toggle)', () => {
      const withColl = { ...initialState, collections: ['Chroma Collection'] };
      const state = tradeUpReducer(withColl, {
        type: 'TRADEUP_ADDREMOVE_COLLECTION',
        payload: 'Chroma Collection',
      });
      expect(state.collections).not.toContain('Chroma Collection');
    });
  });

  describe('TRADEUP_ADDREMOVE_OPTION', () => {
    it('toggles an option on', () => {
      const state = tradeUpReducer(initialState, {
        type: 'TRADEUP_ADDREMOVE_OPTION',
        payload: 'Show all',
      });
      expect(state.options).toContain('Show all');
    });

    it('toggles an option off', () => {
      const state = tradeUpReducer(initialState, {
        type: 'TRADEUP_ADDREMOVE_OPTION',
        payload: 'Hide equipped',
      });
      expect(state.options).not.toContain('Hide equipped');
    });
  });

  describe('TRADEUP_SET_SEARCH', () => {
    it('sets the search input', () => {
      const state = tradeUpReducer(initialState, {
        type: 'TRADEUP_SET_SEARCH',
        payload: { searchField: 'AK-47' },
      });
      expect(state.searchInput).toBe('AK-47');
    });
  });

  describe('TRADEUP_SET_MIN / TRADEUP_SET_MAX', () => {
    it('sets MinFloat', () => {
      const state = tradeUpReducer(initialState, { type: 'TRADEUP_SET_MIN', payload: 0.1 });
      expect(state.MinFloat).toBe(0.1);
    });

    it('sets MaxFloat', () => {
      const state = tradeUpReducer(initialState, { type: 'TRADEUP_SET_MAX', payload: 0.9 });
      expect(state.MaxFloat).toBe(0.9);
    });
  });

  describe('TRADEUP_SET_POSSIBLE', () => {
    it('sets possible outcomes', () => {
      const outcomes = [{ item_name: 'Gloves', percentage: '50.00' }];
      const state = tradeUpReducer(initialState, {
        type: 'TRADEUP_SET_POSSIBLE',
        payload: outcomes,
      });
      expect(state.possibleOutcomes).toEqual(outcomes);
    });
  });

  describe('TRADEUP_RESET', () => {
    it('resets products and outcomes but preserves collections', () => {
      const populated = {
        ...initialState,
        tradeUpProducts: [makeProduct(1)],
        tradeUpProductsIDS: [1],
        possibleOutcomes: [{ item_name: 'Out' }],
        searchInput: 'search',
        collections: ['Chroma Collection', 'Alpha Collection'],
      };
      const state = tradeUpReducer(populated, { type: 'TRADEUP_RESET' });
      expect(state.tradeUpProducts).toHaveLength(0);
      expect(state.possibleOutcomes).toHaveLength(0);
      expect(state.searchInput).toBe('');
      expect(state.collections).toEqual(['Chroma Collection', 'Alpha Collection']);
    });
  });

  describe('SIGN_OUT', () => {
    it('fully resets state including collections', () => {
      const populated = {
        ...initialState,
        tradeUpProducts: [makeProduct(1)],
        collections: ['Chroma Collection'],
      };
      const state = tradeUpReducer(populated, { type: 'SIGN_OUT' });
      expect(state).toEqual(initialState);
    });
  });
});
