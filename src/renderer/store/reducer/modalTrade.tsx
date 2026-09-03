import { createReducer } from '@reduxjs/toolkit';
import { ModalTrade } from 'renderer/interfaces/states';

const initialState: ModalTrade = {
  moveOpen: false,
  openResult: false,
  inventoryFirst: [],
  rowToMatch: {},
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase('TRADE_MODAL_OPEN_CLOSE', (state) => {
      state.moveOpen = !state.moveOpen;
    })
    .addCase('TRADE_MODAL_CONFIRM', (state, action: any) => {
      state.moveOpen = false;
      state.inventoryFirst = action.payload.inventory;
    })
    .addCase('TRADE_MODAL_MATCH_FOUND', (state, action: any) => {
      state.openResult = true;
      state.inventoryFirst = initialState.inventoryFirst;
      state.rowToMatch = action.payload.matchRow;
    })
    .addCase('TRADE_MODAL_RESET', () => initialState)
    .addCase('TRADE_MODAL_OPEN_RESULT', (state) => {
      // opening the result closes the move modal if it was up
      if (state.moveOpen) {
        state.moveOpen = false;
      }
      state.openResult = !state.openResult;
    })
    .addCase('SIGN_OUT', () => initialState)
);
