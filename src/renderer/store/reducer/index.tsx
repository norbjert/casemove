import { combineReducers } from "redux";
// import inventoryReducer from "../inventory/inventoryReducer";
import authReducer from "./userStatus";
import inventoryFiltersReducer from './inventoryFiltersRed'
import modalMoveReducer from './modalMove'
import modalRenameReducer from './modalRename'
import moveFromReducer from './moveFromReducers'
import moveToReducer from './moveToReducers'
import settingsReducer from "./settings";
import pricingReducer from "./pricing";
import tradeUpReducer from "./tradeupReducer";
import modalTradeReducer from './modalTrade'
import sellReducer from './sellReducer'
import { inventoryReducer } from "../inventory/inventoryClass";

const rootReducers = combineReducers({
    authReducer,
    inventoryReducer,
    inventoryFiltersReducer,
    modalMoveReducer,
    modalRenameReducer,
    moveFromReducer,
    moveToReducer,
    settingsReducer,
    pricingReducer,
    tradeUpReducer,
    modalTradeReducer,
    sellReducer
})

export default rootReducers;

export type RootState = ReturnType<typeof rootReducers>
