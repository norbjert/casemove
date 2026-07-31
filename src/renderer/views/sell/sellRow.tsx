import React from 'react';
import { BoltIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import { sellSetPrice, sellSetQty } from 'renderer/store/actions/sellActions';
import { RowCollections } from '../../components/content/Inventory/inventoryRows/collectionsRow';
import { RowFloat } from '../../components/content/Inventory/inventoryRows/floatRow';
import { RowPrice } from '../../components/content/Inventory/inventoryRows/priceRow';
import { RowQTY } from '../../components/content/Inventory/inventoryRows/QTYRow';
import { RowRarity } from '../../components/content/Inventory/inventoryRows/rarityRow';
import { RowProduct } from '../../components/content/Inventory/inventoryRows/rowName';
import { RowStickersPatches } from '../../components/content/Inventory/inventoryRows/stickerPatchesRow';
import { RowTradehold } from '../../components/content/Inventory/inventoryRows/tradeholdRow';
import { classNames } from '../../components/content/shared/filters/inventoryFunctions';

const SellRow = React.memo(function SellRow({ projectRow, index }: { projectRow: any; index: number }) {
  const dispatch = useDispatch();
  const sellReducer = useSelector((state: any) => state.sellReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const pricingReducer = useSelector((state: any) => state.pricingReducer);

  async function returnField(fieldValue) {
    const parsedValue = parseInt(fieldValue);

    let returnValue: number;
    if (isNaN(parsedValue) || parsedValue < 0) {
      returnValue = 0;
    } else if (parsedValue > projectRow.combined_QTY) {
      returnValue = projectRow.combined_QTY;
    } else {
      returnValue = parsedValue;
    }

    let listToReturn = [] as any;
    if (returnValue > 0) {
      listToReturn = projectRow.combined_ids.slice(0, returnValue);
    }

    dispatch(sellSetQty(projectRow.item_id, listToReturn, projectRow.item_name));
  }

  const isTradelocked = projectRow.trade_unlock != null || projectRow.market_listed;

  const entry = sellReducer.totalToSell.find((row: any) => row[0] == projectRow.item_id);
  const isEmpty = entry == undefined;
  const totalFieldValue = isEmpty ? 0 : entry[1].length;
  const priceValue = isEmpty ? '' : entry[3];

  return (
    <>
      <RowProduct itemRow={projectRow} />
      <RowCollections itemRow={projectRow} settingsData={settingsData} />
      <RowPrice itemRow={projectRow} settingsData={settingsData} pricesReducer={pricingReducer} />
      <RowStickersPatches itemRow={projectRow} settingsData={settingsData} />
      <RowFloat itemRow={projectRow} settingsData={settingsData} />
      <RowRarity itemRow={projectRow} settingsData={settingsData} />
      <RowTradehold itemRow={projectRow} settingsData={settingsData} />
      <RowQTY itemRow={projectRow} />

      <td className="table-cell px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hover:text-gray-200 text-right">
        <div className="flex justify-center rounded-full drop-shadow-lg">
          <div>
            <input
              type="text"
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
            id={`sell-fire-${index}`}
            className={classNames(
              isTradelocked || totalFieldValue == projectRow.combined_QTY
                ? 'pointer-events-none hidden'
                : ''
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
            className={classNames(isEmpty ? 'pointer-events-none hidden' : '')}
            id={`sell-removeX-${index}`}
          >
            <XMarkIcon
              className={classNames(
                totalFieldValue == projectRow.combined_QTY ? 'h-5 w-5' : 'h-4 w-4',
                'text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400  '
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </td>
      <td className="table-cell px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
        <div className="flex justify-center rounded-full drop-shadow-lg">
          <div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="—"
              value={priceValue}
              disabled={isEmpty}
              onChange={(e) => dispatch(sellSetPrice(projectRow.item_id, e.target.value))}
              className="block w-20 border rounded sm:text-sm text-gray-500 text-center border-gray-400 dark:bg-dark-level-two dark:text-dark-white disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </td>
    </>
  );
});

export default SellRow;
