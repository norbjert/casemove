import { createReducer } from '@reduxjs/toolkit';
import { MoveToReducer } from 'renderer/interfaces/states';

const initialState: MoveToReducer = {
  doHide: false,
  hideFull: true,
  activeStorages: [],
  activeStoragesAmount: 0,
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
    .addCase('MOVE_TO_SET_HIDE', (state) => {
      state.doHide = !state.doHide;
    })
    .addCase('MOVE_TO_SET_FULL', (state) => {
      state.hideFull = !state.hideFull;
    })
    .addCase('MOVE_TO_ADD_TO', (state, action: any) => {
      // only one destination storage can be active, so this toggles
      const alreadyActive = state.activeStorages.includes(action.payload.casketID);
      state.activeStorages = alreadyActive ? [] : [action.payload.casketID];
      state.activeStoragesAmount = alreadyActive ? 0 : action.payload.casketVolume;
    })
    .addCase('MOVE_TO_TOTAL_TO_ADD', (state, action: any) => {
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
    .addCase('SET_STORAGE_AMOUNT', (state, action: any) => {
      state.activeStoragesAmount = action.payload.storageAmount;
    })
    .addCase('MOVE_TO_SET_SEARCH', (state, action: any) => {
      state.searchInput = action.payload.searchField;
    })
    .addCase('MOVE_TO_SET_SEARCH_STORAGE', (state, action: any) => {
      state.searchInputStorage = action.payload.searchField;
    })
    .addCase('SET_SORT', (state, action: any) => {
      if (state.sortValue == action.payload.sortValue) {
        state.sortBack = !state.sortBack;
      } else {
        state.sortValue = action.payload.sortValue;
        state.sortBack = initialState.sortBack;
      }
    })
    .addCase('MOVE_TO_CLEAR_ALL', (state) => {
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
