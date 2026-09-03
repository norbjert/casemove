import { createAction } from '@reduxjs/toolkit';

export const moveFromSetFull = createAction('MOVE_FROM_SET_FULL');
export const moveFromSetSortBack = createAction('MOVE_FROM_SET_SORT_BACK');
export const moveFromClearAll = createAction('MOVE_FROM_CLEAR_ALL');
export const moveFromReset = createAction('MOVE_FROM_CLEAR');

export const moveFromsetSearchField = createAction(
  'MOVE_FROM_SET_SEARCH',
  (searchField) => ({ payload: { searchField } })
);
export const moveFromsetSearchFieldStorage = createAction(
  'MOVE_FROM_SET_SEARCH_STORAGE',
  (searchField) => ({ payload: { searchField } })
);
export const SetSortOption = createAction('SET_SORT', (sortValue) => ({
  payload: { sortValue },
}));
export const moveFromAddCasketToStorages = createAction(
  'MOVE_FROM_ADD_TO',
  (casketID) => ({ payload: { casketID } })
);
export const moveFromAddRemove = createAction(
  'MOVE_FROM_TOTAL_TO_ADD',
  (casketID: string, itemID: string, totalItems: Array<string>, itemName: string) => ({
    payload: { casketID, toMove: totalItems, itemID, itemName },
  })
);
export const moveFromRemoveCasket = createAction(
  'MOVE_FROM_ALL_CASKET_RESULTS',
  (casketID) => ({ payload: { casketID } })
);
