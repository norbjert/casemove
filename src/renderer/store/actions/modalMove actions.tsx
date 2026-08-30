import { createAction } from '@reduxjs/toolkit';

export const setRenameModal = createAction(
  'SET_RENAME_MODAL',
  (itemID, itemName) => ({ payload: { itemID, itemName } })
);
export const closeRenameModal = createAction('CLOSE_RENAME_MODAL');

export const moveModalQuerySet = createAction(
  'MOVE_MODAL_QUERY_SET',
  (queryList) => ({ payload: { query: queryList } })
);
export const modalResetStorageIdsToClearFrom = createAction(
  'MODAL_RESET_STORAGE_IDS_TO_CLEAR_FROM'
);
export const closeMoveModal = createAction('CLOSE_MOVE_MODAL');
export const cancelModal = createAction('MOVE_MODAL_CANCEL', (key) => ({
  payload: { doCancel: key },
}));
export const moveModalAddToFail = createAction('MODAL_ADD_TO_FAILED');
export const moveModalUpdate = createAction('MOVE_MODAL_UPDATE');
export const moveModalResetPayload = createAction('MOVE_MODAL_RESET_PAYLOAD');
