import { SellReducer } from "renderer/interfaces/states";

const initialState: SellReducer = {
  totalToSell: [],
  totalItemsToSell: 0,
  searchInput: '',
};

const sellReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SELL_TOTAL_TO_ADD': {
      const existing = state.totalToSell.find((row: any) => row[0] == action.payload.itemID);
      const existingPrice = existing ? existing[3] : '';
      const toSellAlreadyExists = state.totalToSell.filter((row: any) => row[0] != action.payload.itemID);

      if (action.payload.toSell.length > 0) {
        toSellAlreadyExists.push([action.payload.itemID, action.payload.toSell, action.payload.itemName, existingPrice]);
      }
      let newTotalItemsToSell = 0;
      toSellAlreadyExists.forEach((element: any) => {
        newTotalItemsToSell += element[1].length;
      });
      return {
        ...state,
        totalToSell: toSellAlreadyExists,
        totalItemsToSell: newTotalItemsToSell,
      };
    }

    case 'SELL_SET_PRICE':
      return {
        ...state,
        totalToSell: state.totalToSell.map((row: any) =>
          row[0] == action.payload.itemID ? [row[0], row[1], row[2], action.payload.price] : row
        ),
      };

    case 'SELL_SET_SEARCH':
      return {
        ...state,
        searchInput: action.payload.searchField,
      };

    case 'SELL_CLEAR_ALL':
      return {
        ...initialState,
      };

    case 'SIGN_OUT':
      return {
        ...initialState,
      };

    default:
      return { ...state };
  }
};

export default sellReducer;
