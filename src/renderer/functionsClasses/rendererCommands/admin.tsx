import {
  setColumns,
  setShowFloat,
  setCurrencyRate,
  setCurrencyValue,
  setDevmode,
  setFastMove,
  setLocale,
  setOS,
  setSourceValue,
  setSteamLoginShow,
} from 'renderer/store/actions/settings';

// Settings that live in electron-store, and the action that puts each in redux.
const storeSettings = {
  source: { name: 'pricing.source', action: setSourceValue },
  locale: { name: 'locale', action: setLocale },
  os: { name: 'os', action: setOS },
  columns: { name: 'columns', action: setColumns },
  devmode: { name: 'devmode.value', action: setDevmode },
  fastmove: { name: 'fastmove', action: setFastMove },
  currency: { name: 'currency', action: setCurrencyValue },
  steamLoginShow: { name: 'steamLogin', action: setSteamLoginShow },
  showFloat: { name: 'showFloat', action: setShowFloat },
};

export type StoreSetting = keyof typeof storeSettings;

export async function dispatchStoreSetting(
  dispatch: Function,
  setting: StoreSetting
) {
  const { name, action } = storeSettings[setting];
  const value = await window.electron.store.get(name);
  if (value != undefined) {
    dispatch(action(value));
  }
}

export async function dispatchCurrencyRate(dispatch: Function) {
  const rate = await window.electron.ipcRenderer.getCurrencyRate();
  if (rate != undefined) {
    dispatch(setCurrencyRate(rate));
  }
}
