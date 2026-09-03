import { createAction } from '@reduxjs/toolkit';
import { Overview } from 'renderer/interfaces/states';
import { CurrencyReturnValue } from 'shared/Interfaces.tsx/IPCReturn';

export const setFastMove = createAction<any>('SETTINGS_SET_FASTMOVE');
export const setColumns = createAction<any>('SETTINGS_SET_COLUMNS');
export const setCurrencyValue = createAction<any>('SETTINGS_SET_CURRENCY');
export const setLocale = createAction<any>('SETTINGS_SET_LOCALE');
export const setSourceValue = createAction<any>('SETTINGS_SET_SOURCE');
export const setCurrencyRate = createAction(
  'SETTINGS_ADD_CURRENCYPRICE',
  (returnPackage: CurrencyReturnValue) => ({
    payload: { currency: returnPackage.currency, rate: returnPackage.rate },
  })
);
export const setOS = createAction<any>('SETTINGS_SET_OS');
export const setSteamLoginShow = createAction<any>('SETTINGS_SET_STEAMLOGINSHOW');
export const setDevmode = createAction<any>('SETTINGS_SET_DEVMODE');
export const setOverview = createAction<Overview>('SETTINGS_SET_OVERVIEW');
export const setShowFloat = createAction<any>('SETTINGS_SET_SHOWFLOAT');
