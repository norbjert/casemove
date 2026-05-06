import { describe, it, expect } from 'vitest';
import moveFromReducer from '../moveFromReducers';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const initialState = {
  hideFull: false,
  activeStorages: [],
  totalToMove: [],
  totalItemsToMove: 0,
  searchInput: '',
  searchInputStorage: '',
  sortValue: 'Default',
  doCancel: false,
  sortBack: false,
};

// --------------------------------------------------------------------------

describe('moveFromReducer', () => {
  it('returns initial state for unknown action', () => {
    const state = moveFromReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_SET_FULL
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_SET_FULL', () => {
    it('toggles hideFull from false to true', () => {
      const state = moveFromReducer(initialState, { type: 'MOVE_FROM_SET_FULL' });
      expect(state.hideFull).toBe(true);
    });

    it('toggles hideFull from true to false', () => {
      const state = moveFromReducer({ ...initialState, hideFull: true }, { type: 'MOVE_FROM_SET_FULL' });
      expect(state.hideFull).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_SET_SORT_BACK
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_SET_SORT_BACK', () => {
    it('toggles sortBack', () => {
      const state = moveFromReducer(initialState, { type: 'MOVE_FROM_SET_SORT_BACK' });
      expect(state.sortBack).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_ADD_TO
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_ADD_TO', () => {
    it('adds a storage ID that is not yet active', () => {
      const state = moveFromReducer(initialState, {
        type: 'MOVE_FROM_ADD_TO',
        payload: { casketID: 'casket-1' },
      });
      expect(state.activeStorages).toContain('casket-1');
    });

    it('removes a storage ID that is already active (toggle off)', () => {
      const withStorage = { ...initialState, activeStorages: ['casket-1'] };
      const state = moveFromReducer(withStorage, {
        type: 'MOVE_FROM_ADD_TO',
        payload: { casketID: 'casket-1' },
      });
      expect(state.activeStorages).not.toContain('casket-1');
    });

    it('can hold multiple active storages', () => {
      let state: any = initialState;
      state = moveFromReducer(state, { type: 'MOVE_FROM_ADD_TO', payload: { casketID: 'a' } });
      state = moveFromReducer(state, { type: 'MOVE_FROM_ADD_TO', payload: { casketID: 'b' } });
      expect(state.activeStorages).toEqual(['a', 'b']);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_CLEAR
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_CLEAR', () => {
    it('resets to initial state', () => {
      const populated = {
        ...initialState,
        hideFull: true,
        activeStorages: ['casket-1'],
        searchInput: 'knife',
      };
      const state = moveFromReducer(populated, { type: 'MOVE_FROM_CLEAR' });
      expect(state).toEqual(initialState);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_TOTAL_TO_ADD
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_TOTAL_TO_ADD', () => {
    const payload = (itemID: string, casketID: string, toMove: string[], itemName = 'AK-47') => ({
      itemID, casketID, toMove, itemName,
    });

    it('adds an entry and updates totalItemsToMove', () => {
      const state = moveFromReducer(initialState, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-1', 'casket-1', ['id-a', 'id-b']),
      });
      expect(state.totalToMove).toHaveLength(1);
      expect(state.totalItemsToMove).toBe(2);
    });

    it('replaces an existing entry for the same itemID', () => {
      let state: any = initialState;
      state = moveFromReducer(state, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-1', 'casket-1', ['id-a', 'id-b']),
      });
      state = moveFromReducer(state, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-1', 'casket-1', ['id-c']), // smaller selection
      });
      expect(state.totalToMove).toHaveLength(1);
      expect(state.totalItemsToMove).toBe(1);
    });

    it('removes an entry when toMove is empty', () => {
      let state: any = moveFromReducer(initialState, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-1', 'casket-1', ['id-a']),
      });
      state = moveFromReducer(state, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-1', 'casket-1', []), // deselect all
      });
      expect(state.totalToMove).toHaveLength(0);
      expect(state.totalItemsToMove).toBe(0);
    });

    it('accumulates items from multiple entries', () => {
      let state: any = initialState;
      state = moveFromReducer(state, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-1', 'casket-1', ['a', 'b']),
      });
      state = moveFromReducer(state, {
        type: 'MOVE_FROM_TOTAL_TO_ADD',
        payload: payload('item-2', 'casket-1', ['c', 'd', 'e']),
      });
      expect(state.totalItemsToMove).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_ALL_CASKET_RESULTS
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_ALL_CASKET_RESULTS', () => {
    it('removes all entries for a given casketID', () => {
      const withEntries = {
        ...initialState,
        totalToMove: [
          ['item-1', 'casket-1', ['a', 'b'], 'AK'],
          ['item-2', 'casket-2', ['c'], 'AWP'],
        ] as any,
        totalItemsToMove: 3,
      };
      const state = moveFromReducer(withEntries, {
        type: 'MOVE_FROM_ALL_CASKET_RESULTS',
        payload: { casketID: 'casket-1' },
      });
      expect(state.totalToMove).toHaveLength(1);
      expect(state.totalItemsToMove).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_SET_SEARCH / MOVE_FROM_SET_SEARCH_STORAGE
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_SET_SEARCH', () => {
    it('sets searchInput', () => {
      const state = moveFromReducer(initialState, {
        type: 'MOVE_FROM_SET_SEARCH',
        payload: { searchField: 'knife' },
      });
      expect(state.searchInput).toBe('knife');
    });
  });

  describe('MOVE_FROM_SET_SEARCH_STORAGE', () => {
    it('sets searchInputStorage', () => {
      const state = moveFromReducer(initialState, {
        type: 'MOVE_FROM_SET_SEARCH_STORAGE',
        payload: { searchField: 'storage box' },
      });
      expect(state.searchInputStorage).toBe('storage box');
    });
  });

  // -------------------------------------------------------------------------
  // SET_SORT
  // -------------------------------------------------------------------------
  describe('SET_SORT', () => {
    it('sets a new sort value and resets sortBack', () => {
      const state = moveFromReducer(
        { ...initialState, sortBack: true },
        { type: 'SET_SORT', payload: { sortValue: 'Name' } }
      );
      expect(state.sortValue).toBe('Name');
      expect(state.sortBack).toBe(false);
    });

    it('toggles sortBack when the same sort value is re-selected', () => {
      const state = moveFromReducer(
        { ...initialState, sortValue: 'Name', sortBack: false },
        { type: 'SET_SORT', payload: { sortValue: 'Name' } }
      );
      expect(state.sortValue).toBe('Name');
      expect(state.sortBack).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // MOVE_FROM_CLEAR_ALL
  // -------------------------------------------------------------------------
  describe('MOVE_FROM_CLEAR_ALL', () => {
    it('clears totalToMove, search, and sort but preserves other state', () => {
      const populated = {
        ...initialState,
        hideFull: true,
        activeStorages: ['casket-1'],
        totalToMove: [['item-1', 'casket-1', ['a'], 'AK']] as any,
        totalItemsToMove: 1,
        searchInput: 'knife',
        sortValue: 'Name',
      };
      const state = moveFromReducer(populated, { type: 'MOVE_FROM_CLEAR_ALL' });
      expect(state.totalToMove).toHaveLength(0);
      expect(state.totalItemsToMove).toBe(0);
      expect(state.searchInput).toBe('');
      expect(state.sortValue).toBe('Default');
      // Non-cleared fields should stay
      expect(state.hideFull).toBe(true);
      expect(state.activeStorages).toEqual(['casket-1']);
    });
  });

  // -------------------------------------------------------------------------
  // DO_CANCEL
  // -------------------------------------------------------------------------
  describe('DO_CANCEL', () => {
    it('sets doCancel', () => {
      const state = moveFromReducer(initialState, { type: 'DO_CANCEL', payload: { doCancel: true } });
      expect(state.doCancel).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // SIGN_OUT
  // -------------------------------------------------------------------------
  describe('SIGN_OUT', () => {
    it('fully resets state', () => {
      const populated = { ...initialState, hideFull: true, activeStorages: ['casket-1'] };
      const state = moveFromReducer(populated, { type: 'SIGN_OUT' });
      expect(state).toEqual(initialState);
    });
  });
});
