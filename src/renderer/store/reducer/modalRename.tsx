import { createReducer } from '@reduxjs/toolkit';
import { RenameModal } from 'renderer/interfaces/states';

const initialState: RenameModal = {
  renameOpen: false,
  modalPayload: {
    itemID: '',
    itemName: '',
  },
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase('SET_RENAME_MODAL', (state, action: any) => {
      state.renameOpen = true;
      state.modalPayload = action.payload;
    })
    .addCase('CLOSE_RENAME_MODAL', (state) => {
      state.renameOpen = false;
    })
    .addCase('SIGN_OUT', () => initialState)
);
