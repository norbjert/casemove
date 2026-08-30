import { createAction } from '@reduxjs/toolkit';
import { ItemRow } from 'renderer/interfaces/items';

export const pricing_addPrice = createAction('PRICING_ADD_TO', (itemRows) => ({
  payload: { itemRows },
}));
export const pricing_removePrice = createAction(
  'PRICING_REMOVE',
  (priceResult, itemName) => ({ payload: { price: priceResult, itemName } })
);
export const pricing_add_storage_total = createAction(
  'PRICING_ADD_STORAGE_TOTAL',
  (amountToAdd) => ({ payload: { storageAmount: amountToAdd } })
);
export const pricing_add_to_requested = createAction(
  'PRICING_ADD_TO_REQUESTED',
  (itemRows: Array<ItemRow>) => ({ payload: { itemRows } })
);
export const pricing_clearAll = createAction('PRICING_CLEAR');
