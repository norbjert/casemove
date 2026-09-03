import { createReducer } from '@reduxjs/toolkit';
import { Inventory } from 'renderer/interfaces/states';

const initialState: Inventory = {
  inventory: [],
  combinedInventory: [],
  storageInventory: [],
  storageInventoryRaw: [],
  totalAccountItems: 0,
  itemsLookUp: {},
};

function clearAllStorageUnits(state: Inventory) {
  state.storageInventory = initialState.storageInventory;
  state.storageInventoryRaw = initialState.storageInventoryRaw;
}

export const inventoryReducer = createReducer(initialState, (builder) =>
  builder
    .addCase('INVENTORY_SET_INVENTORY', (state, action: any) => {
      // a storage unit counts as itself plus everything inside it
      let storageTotal = 0;
      action.payload.inventory.forEach((element) => {
        storageTotal += 1;
        if (element.item_url == 'econ/tools/casket') {
          storageTotal += element.item_storage_total;
        }
      });
      state.inventory = action.payload.inventory;
      state.combinedInventory = action.payload.combinedInventory;
      state.totalAccountItems = storageTotal;
    })
    .addCase('INVENTORY_STORAGES_ADD_TO', (state, action: any) => {
      state.storageInventory = [
        ...(state.storageInventory?.filter(
          (id) => id.storage_id != action.payload.casketID
        ) || []),
        ...action.payload.storageData,
      ];
      state.storageInventoryRaw = [
        ...(state.storageInventoryRaw?.filter(
          (id) => id.storage_id != action.pay
        ) || []),
        ...action.payload.storageRowsRaw,
      ];
    })
    .addCase('INVENTORY_STORAGES_CLEAR_CASKET', (state, action: any) => {
      state.storageInventory = state.storageInventory.filter(
        (id) => id.storage_id != action.payload.casketID
      );
      state.storageInventoryRaw = state.storageInventoryRaw.filter(
        (id) => id.storage_id != action.payload.casketID
      );
    })
    .addCase('INVENTORY_STORAGES_SET_SORT_STORAGES', (state, action: any) => {
      state.storageInventory = action.payload.storageData;
    })
    .addCase('INVENTORY_STORAGES_CLEAR_ALL', clearAllStorageUnits)
    .addCase('MOVE_FROM_CLEAR', clearAllStorageUnits)
    .addCase('SIGN_OUT', () => initialState)
);
