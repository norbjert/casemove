
import { ItemRow, ItemRowStorage } from "renderer/interfaces/items";
import { State } from "renderer/interfaces/states";
import { HandleStorageData } from "./storageUnitsClass";

function sorting(valueOne, valueTwo) {
  if (valueOne < valueTwo) {
    return -1;
  }
  if (valueOne > valueTwo) {
    return 1;
  }
  return 0;
}
class Sort {
  itemArray: Array<ItemRow | ItemRowStorage>
  constructor(itemArray: Array<ItemRow | ItemRowStorage>) {
    this.itemArray = itemArray
  }

  async item_customname() {
    return this.itemArray.sort(function(a, b) {
      return sorting(a.item_customname || '0000', b.item_customname || '0000')
    })

  }
}

export async function getAllStorages(
  dispatch: Function,
  state: State
) {

  // Filter the storage inventory
  const casketResults = await state.inventoryReducer.inventory.filter(function (row) {
    if (!row.item_url.includes('casket')) {
      return false; // skip
    }
    if (row.item_storage_total == 0) {
      return false; // skip
    }
    if (
      state.moveFromReducer.searchInputStorage != '' &&
      !row?.item_customname?.toLowerCase()?.includes(state.moveFromReducer.searchInputStorage)
    ) {
      return false; // skip
    }
    if (row.item_storage_total == 1000 && state.moveFromReducer.hideFull) {
      return false; // skip
    }
    return true;
  });

  async function sendArrayAddStorage(returnValue: Array<any>) {
    let StorageClass = new HandleStorageData(dispatch, state)
    let loadedIds: Array<string> = [...state.moveFromReducer.activeStorages]
    let addArray: Array<ItemRow> = []
    for (const [_key, project] of Object.entries(returnValue)) {
      if (!loadedIds.includes(project.item_id)) {
        try {
          const result = await StorageClass.addStorage(
            project as ItemRowStorage,
            addArray
          )
          addArray = [...addArray, ...result]
          loadedIds.push(project.item_id)
        } catch (_err) {
          // GC request failed or timed out for this unit, skip and continue
        }
      }
    }
    return
  }

  // Handle storage data
  let SortingClass = new Sort(casketResults)
  return SortingClass.item_customname().then((returnValue) => {
    return sendArrayAddStorage(returnValue)
  })



}
