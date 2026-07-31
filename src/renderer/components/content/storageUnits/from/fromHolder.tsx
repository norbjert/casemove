import StorageFilter from './fromFilters';
import StorageRow from './fromStorageRow';
import StorageSelectorContent from './fromSelector';

import { useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { classNames } from '../../shared/filters/inventoryFunctions';
import { NoSymbolIcon, FireIcon } from '@heroicons/react/24/solid';
import { RowHeader, RowHeaderCondition, RowHeaderConditionShowFloat, RowHeaderPlain } from '../../Inventory/inventoryRows/headerRows';
import { searchFilter } from 'renderer/functionsClasses/filters/search';
import { moveFromAddRemove } from 'renderer/store/actions/moveFromActions';

function StorageUnits() {
  const dispatch = useDispatch();
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const inventoryFilters = useSelector((state: any) => state.inventoryFiltersReducer);
  const fromReducer = useSelector((state: any) => state.moveFromReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);

  const parentRef = useRef<HTMLDivElement>(null);

  function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const storageFiltered = useMemo(() => {
    let base = inventoryFilters.storageFiltered;
    if (base.length === 0 && inventoryFilters.storageFilter.length === 0) {
      base = inventory.storageInventory;
    }
    let list = searchFilter(base, inventoryFilters, fromReducer);
    if (fromReducer.sortBack) list = [...list].reverse();
    return list;
  }, [
    inventory.storageInventory,
    inventoryFilters,
    fromReducer,
  ]);

  const rowVirtualizer = useVirtualizer({
    count: storageFiltered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 57,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  async function ultimateFire() {
    let totalUsed = fromReducer.totalItemsToMove;
    const maxCapacity = 1000 - inventory.inventory.length;

    for (const item of storageFiltered) {
      if (item.trade_unlock != null || item.market_listed) continue;

      const existing = fromReducer.totalToMove.find((row: any) => row[0] === item.item_id);
      const currentQty = existing ? existing[2].length : 0;
      if (currentQty >= item.combined_QTY) continue;

      // Capacity for this item = max minus everything else already allocated
      const capacityForItem = maxCapacity - (totalUsed - currentQty);
      if (capacityForItem <= 0) continue;

      const newQty = Math.min(item.combined_QTY, capacityForItem);
      if (newQty <= currentQty) continue;

      dispatch(moveFromAddRemove(item.storage_id, item.item_id, item.combined_ids.slice(0, newQty), item.item_name));
      totalUsed += newQty - currentQty;
      await sleep(25);
    }
  }

  function removeFire() {
    storageFiltered.forEach((item: any) => {
      dispatch(moveFromAddRemove(item.storage_id, item.item_id, [], item.item_name));
    });
  }

  return (
    <>
      {/* Storage units */}
      <StorageSelectorContent />

      <StorageFilter />

      {/* Projects table (small breakpoint and up) */}
      <div className="hidden sm:block">
        <div
          ref={parentRef}
          className={classNames(
            settingsData.os === 'win32' ? 'h-screen-from-windows' : 'h-screen-from',
            'overflow-y-auto'
          )}
        >
          <table className="min-w-full">
            <thead className="dark:bg-dark-level-two bg-gray-50 sticky top-0 z-10">
              <tr className="border-gray-200">
                <RowHeader headerName='Product' sortName='Product name'/>
                <RowHeaderCondition headerName='Collection' sortName='Collection' condition='Collections'/>
                <RowHeaderCondition headerName='Price' sortName='Price' condition='Price'/>
                <RowHeaderCondition headerName='Stickers/Patches' sortName='Stickers' condition='Stickers/patches'/>
                <RowHeaderConditionShowFloat headerName='Float' sortName='wearValue'/>
                <RowHeaderCondition headerName='Rarity' sortName='Rarity' condition='Rarity'/>
                <RowHeaderCondition headerName='Storage' sortName='StorageName' condition='Storage'/>
                <RowHeaderCondition headerName='Tradehold' sortName='tradehold' condition='Tradehold'/>
                <RowHeader headerName='QTY' sortName='QTY'/>
                <RowHeaderPlain headerName='Move'/>

                <th className="table-cell px-6 py-2 border-b border-gray-200 bg-gray-50  dark:border-opacity-50 dark:bg-dark-level-two text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="md:hidden">move</span>
                  <div className="flex">
                    <button
                      onClick={() => ultimateFire()}
                      className={classNames(
                        (1000 -
                          inventory.inventory.length -
                          fromReducer.totalItemsToMove ==
                          0 &&
                          storageFiltered.length != 0) ||
                          storageFiltered.length == 0 ||
                          storageFiltered.length == fromReducer.totalToMove.length
                          ? 'pointer-events-none text-gray-400 dark:text-gray-600'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <FireIcon
                        className={classNames(
                          ' h-4 w-4 text-current dark:text-current hover:text-yellow-400 dark:hover:text-yellow-400'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={() => removeFire()}
                      className={classNames(
                        fromReducer.totalToMove.length == 0
                          ? 'pointer-events-none text-gray-200 dark:text-gray-600'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <NoSymbolIcon
                        className={classNames(
                          ' h-4 w-4 text-current dark:text-current hover:text-red-400 dark:hover:text-red-400'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </th>
                <th className="md:hidden table-cell px-6 py-2 border-b border-gray-200 bg-gray-50   dark:border-opacity-50 dark:bg-dark-level-two text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="md:hidden"></span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:divide-gray-500 dark:text-gray-400 dark:bg-dark-level-one">
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: paddingTop }} colSpan={12} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const project = storageFiltered[virtualRow.index];
                return (
                  <tr
                    key={project.item_id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="hover:shadow-inner"
                  >
                    <StorageRow projectRow={project} index={virtualRow.index} />
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: paddingBottom }} colSpan={12} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function FromMainComponent() {
  return <StorageUnits />;
}
