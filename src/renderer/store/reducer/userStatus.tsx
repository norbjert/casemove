import { createReducer } from '@reduxjs/toolkit';
import { AuthReducer } from 'renderer/interfaces/states';

const initialState: AuthReducer = {
  displayName: null,
  CSGOConnection: false,
  userProfilePicture: null,
  steamID: null,
  isLoggedIn: false,
  hasConnection: false,
  walletBalance: {
    hasWallet: false,
    currency: '',
    balance: 0,
  },
};

export default createReducer(initialState, (builder) =>
  builder
    .addCase('SIGN_IN', (state, action: any) => {
      state.displayName = action.payload.displayName;
      state.CSGOConnection = action.payload.CSGOConnection;
      state.userProfilePicture = action.payload.userProfilePicture;
      state.steamID = action.payload.steamID;
      state.isLoggedIn = true;
      state.hasConnection = true;
      state.walletBalance = action.payload.wallet;
    })
    .addCase('SET_CONNECTION', (state, action: any) => {
      state.hasConnection = action.payload.hasConnection;
    })
    .addCase('SET_WALLET_BALANCE', (state, action: any) => {
      state.walletBalance = action.payload;
    })
    .addCase('SET_GC', (state, action: any) => {
      state.CSGOConnection = action.payload.CSGOConnection;
    })
    .addCase('SIGN_OUT', () => initialState)
    .addCase('LOGOUT', () => initialState)
);
