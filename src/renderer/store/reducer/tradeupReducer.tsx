import { createReducer } from '@reduxjs/toolkit';
import { TradeUpActions } from 'renderer/interfaces/states';

const initialState: TradeUpActions = {
  tradeUpProducts: [],
  tradeUpProductsIDS: [],
  possibleOutcomes: [],
  searchInput: '',
  MinFloat: 0,
  MaxFloat: 1,
  collections: [],
  options: ['Hide equipped'],
};

// present -> remove, absent -> add
function toggle<T>(list: T[], value: T): T[] {
  const without = list.filter((row) => row != value);
  return without.length == list.length ? [...without, value] : without;
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase('TRADEUP_ADD_REMOVE', (state, action: any) => {
      const products = state.tradeUpProducts.filter(
        (row) => row.item_id != action.payload.item_id
      );
      if (products.length == state.tradeUpProducts.length) {
        products.push(action.payload);
      }
      const isCovert =
        action.payload.rarityName === 'Covert' ||
        (state.tradeUpProducts.length > 0 &&
          state.tradeUpProducts[0].rarityName === 'Covert');

      state.tradeUpProducts = products;
      state.tradeUpProductsIDS = products.map((element) => element.item_id);
      // a full contract keeps whatever outcomes were already computed
      if (products.length != (isCovert ? 5 : 10)) {
        state.possibleOutcomes = initialState.possibleOutcomes;
      }
    })
    .addCase('TRADEUP_ADDREMOVE_COLLECTION', (state, action: any) => {
      state.collections = toggle(state.collections, action.payload);
    })
    .addCase('TRADEUP_ADDREMOVE_OPTION', (state, action: any) => {
      state.options = toggle(state.options, action.payload);
    })
    .addCase('TRADEUP_SET_SEARCH', (state, action: any) => {
      state.searchInput = action.payload.searchField;
    })
    .addCase('TRADEUP_SET_MIN', (state, action: any) => {
      state.MinFloat = action.payload;
    })
    .addCase('TRADEUP_SET_MAX', (state, action: any) => {
      state.MaxFloat = action.payload;
    })
    .addCase('TRADEUP_SET_POSSIBLE', (state, action: any) => {
      state.possibleOutcomes = action.payload;
    })
    .addCase('TRADEUP_RESET', (state) => ({
      ...initialState,
      collections: state.collections,
    }))
    .addCase('SIGN_OUT', () => initialState)
);
