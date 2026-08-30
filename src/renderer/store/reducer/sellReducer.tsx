import { createReducer } from '@reduxjs/toolkit';
import { SellReducer } from 'renderer/interfaces/states';

const initialState: SellReducer = {
  totalToSell: [],
  totalItemsToSell: 0,
  searchInput: '',
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase('SELL_TOTAL_TO_ADD', (state, action: any) => {
      const existing = state.totalToSell.find((row: any) => row[0] == action.payload.itemID);
      const existingPrice = existing ? existing[3] : '';
      const rows = state.totalToSell.filter((row: any) => row[0] != action.payload.itemID);

      if (action.payload.toSell.length > 0) {
        rows.push([action.payload.itemID, action.payload.toSell, action.payload.itemName, existingPrice]);
      }
      state.totalToSell = rows;
      state.totalItemsToSell = rows.reduce((sum: number, row: any) => sum + row[1].length, 0);
    })
    .addCase('SELL_SET_PRICE', (state, action: any) => {
      state.totalToSell = state.totalToSell.map((row: any) =>
        row[0] == action.payload.itemID ? [row[0], row[1], row[2], action.payload.price] : row
      );
    })
    .addCase('SELL_SET_SEARCH', (state, action: any) => {
      state.searchInput = action.payload.searchField;
    })
    .addCase('SELL_CLEAR_ALL', () => initialState)
    .addCase('SIGN_OUT', () => initialState)
);
