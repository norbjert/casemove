import { createAction } from '@reduxjs/toolkit';

export const tradeUpAddRemove = createAction<any>('TRADEUP_ADD_REMOVE');
export const tradeUpSetPossible = createAction<any>('TRADEUP_SET_POSSIBLE');
export const tradeUpResetPossible = createAction('TRADEUP_RESET');
export const tradeUpSetSearch = createAction(
  'TRADEUP_SET_SEARCH',
  (searchField) => ({ payload: { searchField } })
);
export const tradeUpSetMin = createAction<any>('TRADEUP_SET_MIN');
export const tradeUpSetMax = createAction<any>('TRADEUP_SET_MAX');
export const tradeUpCollectionsAddRemove = createAction<any>(
  'TRADEUP_ADDREMOVE_COLLECTION'
);
export const tradeUpOptionsAddRemove = createAction<any>(
  'TRADEUP_ADDREMOVE_OPTION'
);
