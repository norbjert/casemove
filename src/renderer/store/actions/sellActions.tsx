import { createAction } from '@reduxjs/toolkit';

export const sellSetQty = createAction(
  'SELL_TOTAL_TO_ADD',
  (itemID: string, totalItems: Array<string>, itemName: string) => ({
    payload: { itemID, toSell: totalItems, itemName },
  })
);
export const sellSetPrice = createAction(
  'SELL_SET_PRICE',
  (itemID: string, price: string) => ({ payload: { itemID, price } })
);
export const sellClearAll = createAction('SELL_CLEAR_ALL');
export const sellSetSearchField = createAction(
  'SELL_SET_SEARCH',
  (searchField: string) => ({ payload: { searchField } })
);
