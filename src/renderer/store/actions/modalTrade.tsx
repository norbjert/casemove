import { createAction } from '@reduxjs/toolkit';

export const setTradeMove = createAction('TRADE_MODAL_OPEN_CLOSE');
export const setTradeConfirm = createAction('TRADE_MODAL_CONFIRM', (inven) => ({
  payload: { inventory: inven },
}));
export const setTradeReset = createAction('TRADE_MODAL_RESET');
export const setTradeFoundMatch = createAction(
  'TRADE_MODAL_MATCH_FOUND',
  (matchRow) => ({ payload: { matchRow } })
);
export const setTradeMoveResult = createAction('TRADE_MODAL_OPEN_RESULT');
