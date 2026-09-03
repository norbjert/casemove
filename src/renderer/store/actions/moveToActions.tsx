import { createAction } from '@reduxjs/toolkit';

export const moveToSetHide = createAction('MOVE_TO_SET_HIDE');
export const moveToSetFull = createAction('MOVE_TO_SET_FULL');
export const moveToClearAll = createAction('MOVE_TO_CLEAR_ALL');

export const doCancel = createAction('DO_CANCEL', (doCancel) => ({
  payload: { doCancel },
}));
export const moveTosetSearchField = createAction(
  'MOVE_TO_SET_SEARCH',
  (searchField) => ({ payload: { searchField } })
);
export const moveTosetSearchFieldStorage = createAction(
  'MOVE_TO_SET_SEARCH_STORAGE',
  (searchField) => ({ payload: { searchField } })
);
export const moveToAddCasketToStorages = createAction(
  'MOVE_TO_ADD_TO',
  (casketID, casketVolume) => ({ payload: { casketID, casketVolume } })
);
export const moveToSetStorageAmount = createAction(
  'SET_STORAGE_AMOUNT',
  (storageAmount) => ({ payload: { storageAmount } })
);
export const moveToAddRemove = createAction(
  'MOVE_TO_TOTAL_TO_ADD',
  (casketID, itemID, totalItems, itemName) => ({
    payload: { casketID, toMove: totalItems, itemID, itemName },
  })
);
