import { BoltIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import { moveFromAddRemove } from 'renderer/store/actions/moveFromActions';
import { RowPrice } from '../../Inventory/inventoryRows/priceRow';
import { RowStickersPatches } from '../../Inventory/inventoryRows/stickerPatchesRow';
import { RowStorage } from '../../Inventory/inventoryRows/storageRow';
import { RowRarity } from '../../Inventory/inventoryRows/rarityRow';
import { classNames } from '../../shared/filters/inventoryFunctions';
import { RowFloat } from '../../Inventory/inventoryRows/floatRow';
import { RowTradehold } from '../../Inventory/inventoryRows/tradeholdRow';
import { RowQTY } from '../../Inventory/inventoryRows/QTYRow';
import { RowCollections } from '../../Inventory/inventoryRows/collectionsRow';
import { RowProduct } from '../../Inventory/inventoryRows/rowName';

function content({ projectRow, index }) {
  const dispatch = useDispatch();
  const fromReducer = useSelector((state: any) => state.moveFromReducer);
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const settingsReducer = useSelector((state: any) => state.settingsReducer);
  const pricingReducer = useSelector((state: any) => state.pricingReducer);


  async function returnField(fieldValue) {
    fieldValue = parseInt(fieldValue);
    let totalToGo = 1000 - inventory.inventory.length;
    for (const [, value] of Object.entries(fromReducer.totalToMove)) {
      const valued = value as any;
      if (valued[0] != projectRow.item_id) {
        totalToGo -= valued[2].length;
      }
    }

    let returnValue = 0;
    let totalMax = projectRow.combined_QTY;
    if (projectRow.combined_QTY > totalToGo) {
      totalMax = totalToGo;
    }
    if (fieldValue > totalMax) {
      returnValue = totalMax;
    } else if (fieldValue < 0) {
      returnValue = 0;
    } else {
      if (isNaN(fieldValue)) {
        returnValue = 0;
      } else {
        returnValue = fieldValue;
      }
    }

    let listToReturn = [] as any;
    if (returnValue > 0) {
      listToReturn = projectRow.combined_ids.slice(0, returnValue);
    }

    dispatch(
      moveFromAddRemove(
        projectRow.storage_id,
        projectRow.item_id,
        listToReturn,
        projectRow.item_name
      )
    );
  }


  const isTradelocked = projectRow.trade_unlock != null;

  const isEmpty =
    fromReducer.totalToMove.filter((row) => row[0] == projectRow.item_id)
      .length == 0;

  let totalFieldValue = 0;
  if (!isEmpty) {
    totalFieldValue = fromReducer.totalToMove.filter(
      (row) => row[0] == projectRow.item_id
    )[0][2].length;
  }

  return (
    <>

      <RowProduct itemRow={projectRow} />
      <RowCollections itemRow={projectRow} settingsData={settingsReducer}/>
      <RowPrice itemRow={projectRow} settingsData={settingsReducer} pricesReducer={pricingReducer} />
      <RowStickersPatches itemRow={projectRow} settingsData={settingsReducer} />
      <RowFloat itemRow={projectRow} settingsData={settingsReducer}/>
      <RowRarity itemRow={projectRow} settingsData={settingsReducer} />
      <RowStorage itemRow={projectRow} settingsData={settingsReducer} />
      <RowTradehold itemRow={projectRow} settingsData={settingsReducer}/>
      <RowQTY itemRow={projectRow}/>

      <td className="table-cell px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hover:text-gray-200 text-right">
        <div className="flex justify-center rounded-full drop-shadow-lg">
          <div>
            <input
              type="text"
              name="postal-code"
              id="postal-code"
              autoComplete="off"
              value={isEmpty ? '' : totalFieldValue}
              placeholder="0"
              onChange={(e) => returnField(e.target.value)}
              disabled={isTradelocked}
              className=" block w-full border rounded sm:text-sm text-gray-500 text-center border-gray-400 dark:bg-dark-level-two dark:text-dark-white disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </td>
      <td className="table-cell px-6 py-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <div className="flex justify-center">
          <button
            onClick={() => returnField(1000)}
            id={`fire-${index}`}
            className={classNames(
              isTradelocked ||
              1000 -
                inventory.inventory.length -
                fromReducer.totalItemsToMove ==
                0 || totalFieldValue == projectRow.combined_QTY
                ? 'pointer-events-none hidden'
                : `fireButton`
            )}
          >
            <BoltIcon
              className={classNames(
                isEmpty ? 'h-5 w-5' : 'h-4 w-4',
                'text-gray-400 dark:text-gray-500 hover:text-yellow-400 dark:hover:text-yellow-400'
              )}
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => returnField(0)}
            className={classNames(
              isEmpty ? 'pointer-events-none hidden' : 'removeXButton'
            )}
            id={`removeX-${index}`}
          >
            <XMarkIcon
              className={classNames(
                1000 -
                  inventory.inventory.length -
                  fromReducer.totalItemsToMove ==
                  0 || totalFieldValue == projectRow.combined_QTY
                  ? 'h-5 w-5'
                  : 'h-4 w-4',
                'text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400  '
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </td>
      <td className="hidden md:px-6 py-3 whitespace-nowrap text-right text-sm font-medium"></td>
    </>
  );
}
export default function StorageRow(projects) {
  return content(projects);
}
