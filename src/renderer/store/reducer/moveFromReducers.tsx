import { createReducer } from '@reduxjs/toolkit';
import { MoveFromReducer } from 'renderer/interfaces/states';

const initialState: MoveFromReducer = {
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

// rows are [itemID, casketID, toMove[], itemName]
const countItems = (rows: any[]) =>
  rows.reduce((total, row) => total + row[2].length, 0);

export default createReducer(initialState, (builder) =>
  builder
    .addCase('MOVE_FROM_SET_FULL', (state) => {
      state.hideFull = !state.hideFull;
    })
    .addCase('MOVE_FROM_SET_SORT_BACK', (state) => {
      state.sortBack = !state.sortBack;
    })
    .addCase('MOVE_FROM_ADD_TO', (state, action: any) => {
      // Add to or remove from active storages
      const { casketID } = action.payload;
      state.activeStorages = state.activeStorages.includes(casketID)
        ? state.activeStorages.filter((id) => id != casketID)
        : [...state.activeStorages, casketID];
    })
    .addCase('MOVE_FROM_CLEAR', () => initialState)
    .addCase('MOVE_FROM_TOTAL_TO_ADD', (state, action: any) => {
      const rows = state.totalToMove.filter((row) => row[0] != action.payload.itemID);
      if (action.payload.toMove.length > 0) {
        rows.push([
          action.payload.itemID,
          action.payload.casketID,
          action.payload.toMove,
          action.payload.itemName,
        ]);
      }
      state.totalToMove = rows;
      state.totalItemsToMove = countItems(rows);
    })
    .addCase('MOVE_FROM_ALL_CASKET_RESULTS', (state, action: any) => {
      const rows = state.totalToMove.filter((row) => row[1] != action.payload.casketID);
      state.totalToMove = rows;
      state.totalItemsToMove = countItems(rows);
    })
    .addCase('MOVE_FROM_SET_SEARCH', (state, action: any) => {
      state.searchInput = action.payload.searchField;
    })
    .addCase('MOVE_FROM_SET_SEARCH_STORAGE', (state, action: any) => {
      state.searchInputStorage = action.payload.searchField;
    })
    .addCase('SET_SORT', (state, action: any) => {
      // clicking the active column flips direction, a new column resets it
      if (state.sortValue == action.payload.sortValue) {
        state.sortBack = !state.sortBack;
      } else {
        state.sortValue = action.payload.sortValue;
        state.sortBack = initialState.sortBack;
      }
    })
    .addCase('MOVE_FROM_CLEAR_ALL', (state) => {
      state.totalToMove = [];
      state.totalItemsToMove = 0;
      state.searchInput = '';
      state.sortValue = 'Default';
    })
    .addCase('DO_CANCEL', (state, action: any) => {
      state.doCancel = action.payload.doCancel;
    })
    .addCase('SIGN_OUT', () => initialState)
);
