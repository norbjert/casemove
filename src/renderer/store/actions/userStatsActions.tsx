import { createAction } from '@reduxjs/toolkit';
import { SignInActionPackage } from 'renderer/interfaces/store/authReducerActionsInterfaces';

export const signIn = createAction<SignInActionPackage>('SIGN_IN');
export const signOut = createAction('SIGN_OUT');
export const setConnection = createAction(
  'SET_CONNECTION',
  (connectionStatus: boolean) => ({ payload: { hasConnection: connectionStatus } })
);
export const setWalletBalance = createAction<any>('SET_WALLET_BALANCE');
export const setGC = createAction('SET_GC', (connectionStatus: boolean) => ({
  payload: { CSGOConnection: connectionStatus },
}));
