import { createReducer } from '@reduxjs/toolkit';
import { Settings } from 'renderer/interfaces/states';

const initialState: Settings = {
  fastMove: false,
  currency: 'USD',
  locale: 'EN-GB',
  os: '',
  steamLoginShow: true,
  devmode: false,
  columns: ["Price", "Stickers/patches", "Storage", "Tradehold", 'Moveable', 'Inventory link'],
  currencyPrice: {},
  source: {
    title: 'steam_listing',
    name: 'Steam Community Market',
    avatar: 'https://steamcommunity.com/favicon.ico'
  },
  showFloat: false,
  overview: {
    by: 'price',
    chartleft: 'overall',
    chartRight: 'itemDistribution'
  }
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase('SETTINGS_SET_FASTMOVE', (state, action: any) => {
      state.fastMove = action.payload;
    })
    .addCase('SETTINGS_SET_COLUMNS', (state, action: any) => {
      state.columns = action.payload;
    })
    .addCase('SETTINGS_SET_CURRENCY', (state, action: any) => {
      // `true` shows up while the store value is still loading; ignore it
      if (action.payload != true) {
        state.currency = action.payload;
      }
    })
    .addCase('SETTINGS_SET_STEAMLOGINSHOW', (state, action: any) => {
      state.steamLoginShow = action.payload;
    })
    .addCase('SETTINGS_SET_SOURCE', (state, action: any) => {
      state.source = action.payload;
    })
    .addCase('SETTINGS_SET_LOCALE', (state, action: any) => {
      state.locale = action.payload;
    })
    .addCase('SETTINGS_SET_OS', (state, action: any) => {
      state.os = action.payload;
    })
    .addCase('SETTINGS_SET_DEVMODE', (state, action: any) => {
      state.devmode = action.payload;
    })
    .addCase('SETTINGS_SET_SHOWFLOAT', (state, action: any) => {
      state.showFloat = action.payload;
    })
    .addCase('SETTINGS_SET_OVERVIEW', (state, action: any) => {
      state.overview = action.payload;
    })
    .addCase('SETTINGS_ADD_CURRENCYPRICE', (state, action: any) => {
      state.currency = action.payload.currency;
      state.currencyPrice[action.payload.currency] = action.payload.rate;
    })
);
