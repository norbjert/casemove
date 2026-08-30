import { createReducer } from '@reduxjs/toolkit';
import { InventoryFilters } from '../../interfaces/states';

const initialState: InventoryFilters = {
  inventoryFilter: [
    {
      include: true,
      label: 'Storage moveable',
      valueToCheck: 'item_moveable',
      commandType: 'checkBooleanVariable',
    },
  ],
  storageFilter: [],
  sortValue: 'Default',
  inventoryFiltered: [],
  storageFiltered: [],
  searchInput: '',
  sortBack: false,
  categoryFilter: [],
  rarityFilter: [],
};

// present -> drop it, absent -> append
function toggle<T>(list: T[], value: T): T[] {
  const index = list.indexOf(value);
  if (index == -1) {
    return [...list, value];
  }
  const without = [...list];
  without.splice(index, 1);
  return without;
}

// clearing the from-side drops the storage view but keeps the inventory filters
function clearStorageSide(state: InventoryFilters) {
  state.categoryFilter = initialState.categoryFilter;
  state.storageFiltered = initialState.storageFiltered;
  state.storageFilter = initialState.storageFilter;
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase('SET_FILTERED', (state, action: any) => {
      state.inventoryFilter = action.payload.inventoryFilter;
      state.sortValue = action.payload.sortValue;
      state.inventoryFiltered = action.payload.inventoryFiltered;
    })
    .addCase('SET_FILTERED_STORAGE', (state, action: any) => {
      state.storageFiltered = action.payload.storageFiltered;
      state.storageFilter = action.payload.storageFilter;
    })
    .addCase('ALL_BUT_CLEAR', (state, action: any) => {
      if (state.sortValue == action.payload.sortValue) {
        state.sortBack = !state.sortBack;
      }
      state.inventoryFilter = action.payload.inventoryFilter;
      state.sortValue = action.payload.sortValue;
      state.inventoryFiltered = action.payload.inventoryFiltered;
    })
    .addCase('INVENTORY_STORAGES_CLEAR_CASKET', (state, action: any) => {
      state.storageFiltered = state.storageFiltered.filter(
        (id) => id.storage_id != action.payload.casketID
      );
    })
    .addCase('INVENTORY_STORAGES_SET_SORT_STORAGES', (state, action: any) => {
      state.storageFiltered = action.payload.storageFiltered;
    })
    .addCase('CLEAR_ALL', () => ({ ...initialState, inventoryFilter: [] }))
    .addCase('MOVE_FROM_CLEAR', clearStorageSide)
    .addCase('MOVE_FROM_CLEAR_ALL', clearStorageSide)
    .addCase('MOVE_TO_CLEAR_ALL', (state) => {
      state.categoryFilter = initialState.categoryFilter;
      state.inventoryFilter = initialState.inventoryFilter;
    })
    .addCase('INVENTORY_ADD_CATEGORY_FILTER', (state, action: any) => {
      state.categoryFilter = toggle(state.categoryFilter, action.payload);
    })
    .addCase('INVENTORY_ADD_RARITY_FILTER', (state, action: any) => {
      state.rarityFilter = toggle(state.rarityFilter, action.payload);
    })
    .addCase('INVENTORY_FILTERS_SET_SEARCH', (state, action: any) => {
      state.searchInput = action.payload.searchField;
    })
    .addCase('SET_SORT', (state, action: any) => {
      if (state.sortValue == action.payload.sortValue) {
        state.sortBack = !state.sortBack;
      } else {
        state.sortValue = action.payload.sortValue;
        state.sortBack = initialState.sortBack;
      }
    })
    .addCase('SIGN_OUT', () => initialState)
);
