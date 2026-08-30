import { createReducer } from '@reduxjs/toolkit';
import { Prices } from 'renderer/interfaces/states';

const initialState: Prices = {
  prices: {},
  storageAmount: 0,
  productsRequested: [],
};

const priceKey = (item: any) => item.item_name + (item.item_wear_name ?? '');

export default createReducer(initialState, (builder) =>
  builder
    .addCase('PRICING_ADD_STORAGE_TOTAL', (state, action: any) => {
      state.storageAmount += action.payload.storageAmount;
    })
    .addCase('PRICING_ADD_TO', (state, action: any) => {
      action.payload.itemRows.forEach((element) => {
        state.prices[priceKey(element)] = element.pricing;
      });
    })
    .addCase('PRICING_ADD_TO_REQUESTED', (state, action: any) => {
      action.payload.itemRows.forEach((element) => {
        state.productsRequested.push(priceKey(element));
      });
    })
    .addCase('PRICING_REMOVE', (state, action: any) => {
      delete state.prices[action.payload.itemName];
    })
    .addCase('PRICING_CLEAR', () => initialState)
    .addCase('MOVE_FROM_CLEAR', (state) => {
      state.storageAmount = initialState.storageAmount;
    })
    .addCase('SIGN_OUT', () => initialState)
);
