import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { FireIcon, NoSymbolIcon, MagnifyingGlassIcon, TagIcon } from '@heroicons/react/24/solid';
import { classNames, sortDataFunction } from '../../components/content/shared/filters/inventoryFunctions';
import { searchFilter } from 'renderer/functionsClasses/filters/search';
import { RequestPrices, ConvertPrices } from 'renderer/functionsClasses/prices';
import {
  RowHeader,
  RowHeaderCondition,
  RowHeaderConditionShowFloat,
  RowHeaderPlain,
} from '../../components/content/Inventory/inventoryRows/headerRows';
import NotificationElement from '../../components/content/shared/modals & notifcations/notification';
import { sellClearAll, sellSetPrice, sellSetQty, sellSetSearchField } from 'renderer/store/actions/sellActions';
import SellRow from './sellRow';

function Content() {
  const dispatch = useDispatch();
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const inventoryFilters = useSelector((state: any) => state.inventoryFiltersReducer);
  const pricesResult = useSelector((state: any) => state.pricingReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const sellReducer = useSelector((state: any) => state.sellReducer);

  const parentRef = useRef<HTMLDivElement>(null);

  const [getInventory, setInventory] = useState([] as any);
  const [selling, setSelling] = useState(false);
  const [showNoSelection, setShowNoSelection] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultInfo, setResultInfo] = useState({ success: true, title: '', text: '' });
  const [sellProgress, setSellProgress] = useState({ open: false, total: 0, done: 0, failed: 0 });

  useEffect(() => {
    window.electron.ipcRenderer.on('sellProgress', (data: any) => {
      setSellProgress((prev) => ({ ...prev, total: data.total, done: data.done, failed: data.failed }));
    });
  }, []);

  function cancelSelling() {
    (window.electron.ipcRenderer as any).cancelSell();
    setSellProgress((prev) => ({ ...prev, open: false }));
  }

  let inventoryToUse = [] as any;
  if (inventoryFilters.inventoryFiltered.length == 0 && inventoryFilters.inventoryFilter.length == 0) {
    inventoryToUse = inventory.combinedInventory;
  } else {
    inventoryToUse = inventoryFilters.inventoryFiltered;
  }

  useEffect(() => {
    const PricingRequest = new RequestPrices(dispatch, settingsData, pricesResult);
    PricingRequest.handleRequestArray(inventoryToUse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryToUse]);

  useEffect(() => {
    sortDataFunction(
      inventoryFilters.sortValue,
      inventoryToUse,
      pricesResult.prices,
      settingsData?.source?.title
    ).then((result) => setInventory(result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryToUse, inventoryFilters.sortValue, inventoryFilters.sortBack]);

  if (inventoryFilters.sortBack == true) {
    getInventory.reverse();
  }

  const finalToUse = useMemo(
    () => searchFilter(getInventory, inventoryFilters, sellReducer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getInventory, inventoryFilters, sellReducer.searchInput]
  );

  const rowVirtualizer = useVirtualizer({
    count: finalToUse.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 57,
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  function selectAll() {
    finalToUse.forEach((item: any) => {
      if (item.trade_unlock != null) return;
      dispatch(sellSetQty(item.item_id, item.combined_ids, item.item_name));
    });
  }

  function clearAll() {
    finalToUse.forEach((item: any) => {
      dispatch(sellSetQty(item.item_id, [], item.item_name));
    });
  }

  function autoPriceSelected() {
    if (sellReducer.totalToSell.length == 0) {
      setShowNoSelection(true);
      return;
    }
    const PricesClass = new ConvertPrices(settingsData, pricesResult);
    sellReducer.totalToSell.forEach((entry: any) => {
      const item = inventoryToUse.find((row: any) => row.item_id == entry[0]);
      if (!item) return;
      const basePrice = PricesClass.getPrice(item, true);
      if (basePrice > 0) {
        dispatch(sellSetPrice(entry[0], (basePrice - 0.01).toFixed(2)));
      }
    });
  }

  async function listForSale() {
    const itemsToSell: { assetid: string; price_in_cents: number }[] = [];
    sellReducer.totalToSell.forEach((entry: any) => {
      const priceNum = parseFloat(entry[3]);
      if (isNaN(priceNum) || priceNum <= 0) return;
      const priceCents = Math.round(priceNum * 100);
      entry[1].forEach((assetid: string) => {
        itemsToSell.push({ assetid, price_in_cents: priceCents });
      });
    });

    if (itemsToSell.length == 0) {
      setShowNoSelection(true);
      return;
    }

    setSelling(true);
    setSellProgress({ open: true, total: itemsToSell.length, done: 0, failed: 0 });
    try {
      const res = await (window.electron.ipcRenderer as any).sellItems(itemsToSell);
      const succeeded = res.filter((r: any) => r.success).length;
      const failedEntries = res.filter((r: any) => !r.success);
      const failed = failedEntries.length;
      if (failed > 0) {
        console.error('sellItems failures:', failedEntries);
      }
      const firstError = failedEntries[0]?.error;
      setResultInfo({
        success: failed == 0,
        title: failed == 0 ? 'Listed on the market' : 'Some listings failed',
        text: `${succeeded} listed${failed > 0 ? `, ${failed} failed` : ''}.${firstError ? ` ${firstError}` : ''}`,
      });
      setShowResult(true);
      if (failed == 0) {
        dispatch(sellClearAll());
      }
    } catch (err) {
      console.error('sellItems error:', err);
      setResultInfo({ success: false, title: 'Listing failed', text: String((err as any)?.message ?? err) });
      setShowResult(true);
    } finally {
      setSelling(false);
      setSellProgress((prev) => ({ ...prev, open: false }));
    }
  }

  let totalValue = 0;
  sellReducer.totalToSell.forEach((entry: any) => {
    const priceNum = parseFloat(entry[3]);
    if (!isNaN(priceNum)) {
      totalValue += priceNum * entry[1].length;
    }
  });

  return (
    <>
      <NotificationElement
        success={false}
        titleToDisplay="No items selected"
        textToDisplay="Select a quantity to sell for at least one item before auto-filling prices."
        doShow={showNoSelection}
        setShow={setShowNoSelection}
      />
      <NotificationElement
        success={resultInfo.success}
        titleToDisplay={resultInfo.title}
        textToDisplay={resultInfo.text}
        doShow={showResult}
        setShow={setShowResult}
      />

      <Dialog
        open={sellProgress.open}
        as="div"
        className="relative z-10"
        onClose={() => cancelSelling()}
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500 bg-opacity-50 dark:bg-opacity-60 transition-opacity ease-out duration-300 data-[closed]:opacity-0 data-[leave]:ease-in data-[leave]:duration-200"
        />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <DialogPanel
              transition
              className="inline-block align-bottom bg-white dark:bg-dark-level-two rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 ease-out duration-300 data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95 data-[leave]:ease-in data-[leave]:duration-200"
            >
              <div>
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-500 dark:bg-blue-700">
                  <span className="animate-ping absolute inline-flex h-14 w-14 rounded-full dark:bg-blue-700 opacity-75"></span>
                  <span className="text-white dark:text-dark-white">
                    {sellProgress.total - sellProgress.done}
                  </span>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-white"
                  >
                    Listing items on the market
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please wait while the app lists your items on the Steam Community Market.
                    </p>
                    {sellProgress.failed == 0 ? (
                      ''
                    ) : (
                      <p className="text-sm text-red-500">
                        Total failed: {sellProgress.failed}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="dark:bg-dark-level-two dark:text-dark-white mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => cancelSelling()}
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Page title & actions */}
      <div className="border-b border-gray-200 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:border-opacity-50">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium leading-6 text-gray-900 dark:text-dark-white sm:truncate">
            Sell on Steam Community Market
          </h1>
        </div>
        <div className="mt-4 flex items-center gap-3 sm:mt-0 sm:ml-4">
          <label htmlFor="sell-search" className="sr-only">
            Search items
          </label>
          <div className="relative rounded-md focus:outline-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              id="sell-search"
              value={sellReducer.searchInput}
              className="block w-full pb-0.5 focus:outline-none dark:text-dark-white pl-9 sm:text-sm border-gray-300 h-7 dark:bg-dark-level-one dark:rounded-none"
              placeholder="Search items"
              spellCheck="false"
              onChange={(e) => dispatch(sellSetSearchField(e.target.value))}
            />
          </div>

          <span className="text-xs font-medium text-blue-500 whitespace-nowrap">
            {sellReducer.totalItemsToSell} selected
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Total {new Intl.NumberFormat(settingsData.locale, { style: 'currency', currency: settingsData.currency }).format(totalValue)}
          </span>

          <button
            type="button"
            onClick={autoPriceSelected}
            className="focus:outline-none inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
          >
            Auto-price (Steam −0.01)
          </button>

          <button
            type="button"
            onClick={listForSale}
            disabled={selling || sellReducer.totalToSell.length == 0}
            className="focus:outline-none inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white"
          >
            <TagIcon className="h-3.5 w-3.5" />
            {selling ? 'Listing...' : `Sell ${sellReducer.totalItemsToSell} item${sellReducer.totalItemsToSell != 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <div className="hidden sm:block">
        <div
          ref={parentRef}
          className={classNames(
            settingsData.os == 'win32' ? 'h-screen-from-windows' : 'h-screen-from',
            'overflow-y-auto'
          )}
        >
          <table className="min-w-full">
            <thead className="dark:bg-dark-level-two bg-gray-50 sticky top-0 z-10">
              <tr className="border-gray-200">
                <RowHeader headerName="Product" sortName="Product name" />
                <RowHeaderCondition headerName="Collection" sortName="Collection" condition="Collections" />
                <RowHeaderCondition headerName="Price" sortName="Price" condition="Price" />
                <RowHeaderCondition headerName="Stickers/Patches" sortName="Stickers" condition="Stickers/patches" />
                <RowHeaderConditionShowFloat headerName="Float" sortName="wearValue" />
                <RowHeaderCondition headerName="Rarity" sortName="Rarity" condition="Rarity" />
                <RowHeaderCondition headerName="Tradehold" sortName="tradehold" condition="Tradehold" />
                <RowHeader headerName="QTY" sortName="QTY" />
                <RowHeaderPlain headerName="Sell qty" />

                <th className="table-cell px-6 py-2 border-b border-gray-200 bg-gray-50 dark:border-opacity-50 dark:bg-dark-level-two text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex">
                    <button onClick={() => selectAll()} className="text-gray-600 dark:text-gray-400">
                      <FireIcon
                        className="h-4 w-4 text-current dark:text-current hover:text-yellow-400 dark:hover:text-yellow-400"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={() => clearAll()}
                      className={classNames(
                        sellReducer.totalToSell.length == 0
                          ? 'pointer-events-none text-gray-200 dark:text-gray-600'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <NoSymbolIcon
                        className="h-4 w-4 text-current dark:text-current hover:text-red-400 dark:hover:text-red-400"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </th>
                <RowHeaderPlain headerName="Sale price" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:divide-gray-500 dark:text-gray-400 dark:bg-dark-level-one">
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: paddingTop }} colSpan={12} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const project = finalToUse[virtualRow.index];
                return (
                  <tr key={project.item_id} data-index={virtualRow.index} ref={rowVirtualizer.measureElement} className="hover:shadow-inner">
                    <SellRow projectRow={project} index={virtualRow.index} />
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

export default function SellPage() {
  return <Content />;
}
