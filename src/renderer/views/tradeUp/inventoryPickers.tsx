import { BeakerIcon, PencilIcon, TagIcon } from '@heroicons/react/24/solid';
import React, { useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RowHeader, RowHeaderHiddenXL } from 'renderer/components/content/Inventory/inventoryRows/headerRows';
import {
  classNames,
  sortDataFunctionTwo,
} from 'renderer/components/content/shared/filters/inventoryFunctions';
import itemRarities from 'renderer/components/content/shared/rarities';
import { ConvertPricesFormatted } from 'renderer/functionsClasses/prices';
import { setRenameModal } from 'renderer/store/actions/modalMove actions';
import { tradeUpAddRemove } from 'renderer/store/actions/tradeUpActions';
import { createCSGOImage } from '../../functionsClasses/createCSGOImage';
import { useVirtualizer } from '@tanstack/react-virtual';

// ── Per-row component ────────────────────────────────────────────────────────
// Moving hover state into each row prevents the entire list from re-rendering
// on every mouseover event.

interface TradeUpRowProps {
  projectRow: any;
  pricesResult: any;
  settingsData: any;
  isFull: boolean;
  dispatch: ReturnType<typeof useDispatch>;
}

const TradeUpRow = React.memo(function TradeUpRow({
  projectRow,
  pricesResult,
  settingsData,
  isFull,
  dispatch,
}: TradeUpRowProps) {
  const [stickerHover, setStickerHover] = useState<number | null>(null);
  const [itemHover, setItemHover] = useState(false);

  return (
    <>
      <td className="px-6 py-3 max-w-0 w-full whitespace-nowrap overflow-hidden text-sm font-normal text-gray-900">
        <div className="flex items-center space-x-3 lg:pl-2">
          <div
            className={classNames(
              projectRow.rarityColor,
              'flex-shrink-0 w-2.5 h-2.5 rounded-full'
            )}
            aria-hidden="true"
          />
          <div className="flex flex-shrink-0 -space-x-1">
            {projectRow.item_moveable != true ? (
              <div className="flex flex-shrink-0 -space-x-1">
                <img
                  className="max-w-none h-11 w-11 dark:from-gray-300 dark:to-gray-400 rounded-full ring-2 ring-transparent object-cover bg-gradient-to-t from-gray-100 to-gray-300"
                  src={createCSGOImage(projectRow.item_url)}
                />
              </div>
            ) : (
              <a
                href={`https://steamcommunity.com/market/listings/730/${
                  projectRow.item_paint_wear == undefined
                    ? projectRow.item_name
                    : projectRow.item_name +
                      ' (' +
                      projectRow.item_wear_name +
                      ')'
                }`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="flex flex-shrink-0 -space-x-1">
                  <img
                    onMouseEnter={() => setItemHover(true)}
                    onMouseLeave={() => setItemHover(false)}
                    className={classNames(
                      itemHover
                        ? 'transform-gpu hover:-translate-y-1 hover:scale-110'
                        : '',
                      'max-w-none h-11 w-11 transition duration-500 ease-in-out  dark:from-gray-300 dark:to-gray-400 rounded-full ring-2 ring-transparent object-cover bg-gradient-to-t from-gray-100 to-gray-300'
                    )}
                    src={createCSGOImage(projectRow.item_url)}
                  />
                </div>
              </a>
            )}
          </div>
          <span>
            <span className="flex dark:text-dark-white">
              {projectRow.item_name !== '' ? (
                projectRow.item_customname !== null ? (
                  projectRow.item_customname
                ) : (
                  projectRow.item_name
                )
              ) : (
                <span>
                  <a
                    href="https://forms.gle/6qZ8N2ES8CdeavcVA"
                    target="_blank"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    An error occurred. Please report this here.
                  </a>
                  <br />
                  <button
                    className="px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() =>
                      navigator.clipboard.writeText(JSON.stringify(projectRow))
                    }
                  >
                    {' '}
                    COPY REF
                  </button>
                </span>
              )}
              {projectRow.item_name !== '' &&
              projectRow.item_customname !== null &&
              !projectRow.item_url.includes('casket') ? (
                <TagIcon className="h-3 w-3  ml-1" />
              ) : (
                ''
              )}
              {projectRow.equipped_t ? (
                <span className="ml-1 h-3 leading-3 pl-1 pr-1 text-white  dark:text-dark-white text-center font-medium	 bg-dark-level-four rounded-full   text-xs">
                  {' '}
                  T{' '}
                </span>
              ) : (
                ''
              )}
              {projectRow.equipped_ct ? (
                <span className="ml-1 h-3 leading-3 pl-1 pr-1 text-center  text-white dark:text-dark-white font-medium	 bg-dark-level-four rounded-full   text-xs">
                  {' '}
                  CT{' '}
                </span>
              ) : (
                ''
              )}

              {projectRow.item_url.includes('casket') ? (
                <Link
                  to=""
                  className="text-gray-500"
                  onClick={() =>
                    dispatch(
                      setRenameModal(
                        projectRow.item_id,
                        projectRow.item_customname !== null
                          ? projectRow.item_customname
                          : projectRow.item_name
                      )
                    )
                  }
                >
                  <PencilIcon className="h-4 w-5 pb-1" />
                </Link>
              ) : (
                ''
              )}
            </span>
            <span
              className="text-gray-500 "
              title={projectRow.item_paint_wear}
            >
              {projectRow.item_customname !== null
                ? projectRow.item_storage_total !== undefined
                  ? projectRow.item_name +
                    ' (' +
                    projectRow.item_storage_total +
                    ')'
                  : projectRow.item_name
                : ''}

              {projectRow.item_customname !== null &&
              projectRow.item_paint_wear !== undefined
                ? ' - '
                : ''}

              {projectRow.item_paint_wear !== undefined
                ? projectRow.item_wear_name
                : ''}

              {projectRow.storage_name
                ? ' /' + projectRow.storage_name
                : ''}
            </span>
          </span>
        </div>
      </td>
      <td className="hidden xl:table-cell px-6 py-3 max-w-0 w-full whitespace-nowrap overflow-hidden text-sm font-normal text-gray-900">
        <div className="flex items-center">
          <span>
            <span className="flex dark:text-dark-white">
              {projectRow.collection
                .replace('The ', '')
                .replace(' Collection', '')}
            </span>
          </span>
        </div>
      </td>

      <td className="hidden xl:table-cell px-6 py-3 text-sm text-gray-500 font-medium">
        <div className="flex items-center space-x-2 justify-center rounded-full drop-shadow-lg">
          <div className="flex flex-shrink-0 -space-x-1 text-gray-500 dark:text-gray-400 font-normal">
            {pricesResult.prices[
              projectRow.item_name + (projectRow.item_wear_name ?? '')
            ] == undefined
              ? ''
              : new ConvertPricesFormatted(settingsData, pricesResult).getFormattedPrice(projectRow)}
          </div>
        </div>
      </td>

      <td className="hidden 2xl:table-cell px-6 py-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <div className="flex items-center space-x-2 justify-center rounded-full drop-shadow-lg">
          <div className="flex flex-shrink-0 -space-x-1">
            {projectRow.stickers?.map((sticker: any, index: number) => (
              <a
                key={index}
                href={`https://steamcommunity.com/market/listings/730/${sticker.sticker_type} | ${sticker.sticker_name}`}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  onMouseEnter={() => setStickerHover(index)}
                  onMouseLeave={() => setStickerHover(null)}
                  className={classNames(
                    stickerHover === index
                      ? 'transform-gpu hover:-translate-y-1 hover:scale-110'
                      : '',
                    'max-w-none h-8 w-8 rounded-full hover:shadow-sm text-black hover:bg-gray-50 transition duration-500 ease-in-out hover:text-white hover:bg-green-600 ring-2 object-cover ring-transparent bg-gradient-to-t from-gray-100 to-gray-300 dark:from-gray-300 dark:to-gray-400'
                  )}
                  src={createCSGOImage(sticker.sticker_url)}
                  alt={sticker.sticker_name}
                  title={sticker.sticker_name}
                />
              </a>
            ))}
          </div>
        </div>
      </td>

      <td className="table-cell px-6 py-3 text-sm text-gray-500 dark:text-gray-400 font-normal ">
        {projectRow.item_paint_wear?.toString()?.substr(0, 9)}
      </td>
      <td className="table-cell px-6 py-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <div
          className={classNames(isFull ? 'hidden' : '', 'flex justify-center')}
        >
          <button onClick={() => dispatch(tradeUpAddRemove(projectRow))}>
            <BeakerIcon
              className={classNames(
                'text-gray-400 dark:text-gray-500 hover:text-yellow-400 dark:hover:text-yellow-400 h-5'
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </td>

      <td className="hidden md:px-6 py-3 whitespace-nowrap text-right text-sm font-medium"></td>
    </>
  );
});

// ── Main component ───────────────────────────────────────────────────────────

export default function TradeUpPicker() {
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const inventoryFilters = useSelector((state: any) => state.inventoryFiltersReducer);
  const pricesResult = useSelector((state: any) => state.pricingReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const tradeUpData = useSelector((state: any) => state.tradeUpReducer);
  const dispatch = useDispatch();

  const parentRef = useRef<HTMLDivElement>(null);

  const itemR = useMemo(() => {
    const map: Record<string, string> = {};
    itemRarities.forEach((el) => { map[el.value] = el.bgColorClass; });
    return map;
  }, []);

  const displayList = useMemo(() => {
    // Build name→items lookup from full inventory (inventory + storage raw)
    const nameMap: Record<string, any[]> = {};
    [...inventory.inventory, ...inventory.storageInventoryRaw].forEach((el) => {
      if (nameMap[el.item_name] == undefined) {
        nameMap[el.item_name] = [el];
      } else {
        nameMap[el.item_name].push(el);
      }
    });

    // Deduplicate by name, preserving order from filtered inventory
    const seenNames: string[] = [];
    let result: any[] = [];
    [...inventoryFilters.inventoryFiltered, ...inventory.storageInventory].forEach((row) => {
      if (nameMap[row.item_name] != undefined && !seenNames.includes(row.item_name)) {
        result = [...result, ...nameMap[row.item_name]];
        seenNames.push(row.item_name);
      }
    });

    // Sort
    result = sortDataFunctionTwo(
      inventoryFilters.sortValue,
      result,
      pricesResult.prices,
      settingsData?.source?.title
    );

    // Trade-up eligibility + filter filters
    result = result.filter((item) => {
      if (!item.tradeUpConfirmed) return false;
      if (tradeUpData.MinFloat > item.item_paint_wear || tradeUpData.MaxFloat < item.item_paint_wear) return false;
      if (tradeUpData.tradeUpProductsIDS.includes(item.item_id)) return false;
      if (tradeUpData.collections.length > 0 && !tradeUpData.collections.includes(item?.collection)) return false;
      if (tradeUpData.options.includes('Hide equipped') && (item.equipped_t || item.equipped_ct)) return false;
      if (tradeUpData.tradeUpProducts.length != 0) {
        if (item.rarityName != tradeUpData.tradeUpProducts[0].rarityName) return false;
        if (item.stattrak != tradeUpData.tradeUpProducts[0].stattrak) return false;
      }
      return item.tradeUp;
    });

    // Attach rarity color
    result.forEach((el) => { el.rarityColor = itemR[el.rarityName]; });

    // Search filter (array-based, not CSS hidden)
    if (tradeUpData.searchInput) {
      const q = tradeUpData.searchInput.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.item_name?.toLowerCase().includes(q) ||
          item.item_customname?.toLowerCase().includes(q) ||
          item.item_wear_name?.toLowerCase().includes(q)
      );
    }

    // Rarity filter
    if (inventoryFilters.rarityFilter.length !== 0) {
      result = result.filter((item) => inventoryFilters.rarityFilter.includes(item.rarityColor));
    }

    if (inventoryFilters.sortBack) {
      result = [...result].reverse();
    }

    return result;
  }, [
    inventory.inventory,
    inventory.storageInventoryRaw,
    inventory.storageInventory,
    inventoryFilters.inventoryFiltered,
    inventoryFilters.sortValue,
    inventoryFilters.sortBack,
    inventoryFilters.rarityFilter,
    pricesResult.prices,
    settingsData?.source?.title,
    tradeUpData.MinFloat,
    tradeUpData.MaxFloat,
    tradeUpData.tradeUpProductsIDS,
    tradeUpData.collections,
    tradeUpData.options,
    tradeUpData.tradeUpProducts,
    tradeUpData.searchInput,
    itemR,
  ]);

  const isCovert = tradeUpData.tradeUpProducts.length > 0 && tradeUpData.tradeUpProducts[0].rarityName === 'Covert';
  const isFull = tradeUpData.tradeUpProducts.length === (isCovert ? 5 : 10);

  const rowVirtualizer = useVirtualizer({
    count: displayList.length,
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

  return (
    <div
      ref={parentRef}
      className={classNames(
        settingsData.os === 'win32' ? 'h-screen-picker-windows' : 'h-screen-picker',
        'overflow-y-auto'
      )}
    >
      <table className="min-w-full">
        <thead className="sticky top-0 z-10">
          <tr className="border-gray-200">
            <RowHeader headerName="Product" sortName="Product name" />
            <RowHeader headerName="Collection" sortName="Collection" />
            <RowHeader headerName="Price" sortName="Price" />
            <RowHeaderHiddenXL headerName="Stickers/Patches" sortName="Stickers" />
            <RowHeader headerName="Float" sortName="wearValue" />
            <th className="hidden lg:table-cell px-6 py-2 border-b bg-gray-50 border-gray-200 dark:border-opacity-50 dark:bg-dark-level-two">
              <span className="text-gray-500 dark:text-gray-400 tracking-wider uppercase text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                Move
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100 dark:bg-dark-level-one dark:divide-gray-500">
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={7} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const projectRow = displayList[virtualRow.index];
            return (
              <tr
                key={projectRow.item_id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="hover:shadow-inner"
              >
                <TradeUpRow
                  projectRow={projectRow}
                  pricesResult={pricesResult}
                  settingsData={settingsData}
                  isFull={isFull}
                  dispatch={dispatch}
                />
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={7} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
