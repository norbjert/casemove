import { createReducer } from '@reduxjs/toolkit';
import { ModalMove } from 'renderer/interfaces/states';

const initialState: ModalMove = {
  moveOpen: false,
  notifcationOpen: false,
  storageIdsToClearFrom: [],
  modalPayload: {
    number: 0,
    itemID: '',
    isLast: false,
  },
  doCancel: [],
  query: [],
  totalFailed: 0,
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase('MOVE_MODAL_QUERY_SET', (state, action: any) => {
      const rest = [...action.payload.query];
      rest.shift();
      state.moveOpen = true;
      state.modalPayload = action.payload.query[0].payload;
      state.query = rest;
    })
    .addCase('MOVE_MODAL_UPDATE', (state) => {
      if (state.query.length == 0) {
        state.modalPayload = initialState.modalPayload;
        state.moveOpen = false;
        return;
      }
      const next = state.query[0].payload;
      if (!state.storageIdsToClearFrom.includes(next.storageID)) {
        state.storageIdsToClearFrom.push(next.storageID);
      }
      if (state.doCancel.includes(next.key)) {
        return;
      }
      state.moveOpen = true;
      // query payloads carry {key, storageID}; modalPayload is read loosely downstream
      state.modalPayload = next as any;
      const rest = [...state.query];
      rest.shift();
      state.query = rest;
    })
    .addCase('CLOSE_MOVE_MODAL', (state) => {
      state.moveOpen = false;
      state.totalFailed = initialState.totalFailed;
    })
    .addCase('MOVE_MODAL_RESET_PAYLOAD', (state) => {
      state.query = initialState.query;
    })
    .addCase('MOVE_MODAL_CANCEL', (state, action: any) => {
      state.doCancel.push(action.payload.doCancel);
      state.totalFailed = initialState.totalFailed;
    })
    .addCase('MODAL_RESET_STORAGE_IDS_TO_CLEAR_FROM', (state) => {
      state.storageIdsToClearFrom = initialState.storageIdsToClearFrom;
    })
    .addCase('MODAL_ADD_TO_FAILED', (state) => {
      state.totalFailed += 1;
    })
    .addCase('SIGN_OUT', () => initialState)
);
