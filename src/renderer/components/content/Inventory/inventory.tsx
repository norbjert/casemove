
import InventoryFilters from './filterHeader';
import InventoryRowsComponent from './inventoryRows';
import MultisellModal from './multisellModal';
import { useState, useCallback } from 'react';
import { LoadingButton } from '../shared/animations';
import { ArrowPathIcon, TagIcon } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import { setShowFloat } from 'renderer/store/actions/settings';

function Content() {
  const [getLoadingButton, setLoadingButton] = useState(false);
  setLoadingButton;

  const dispatch = useDispatch();
  const settingsData = useSelector((state: any) => state.settingsReducer);

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [multisellOpen, setMultisellOpen] = useState(false);

  const handleToggleSelect = useCallback((item: any) => {
    setSelectedItems(prev => {
      const exists = prev.some(s => s.item_id === item.item_id);
      return exists ? prev.filter(s => s.item_id !== item.item_id) : [...prev, item];
    });
  }, []);

  function toggleFloat() {
    const next = !settingsData.showFloat;
    dispatch(setShowFloat(next));
    window.electron.store.set('showFloat', next);
    window.electron.ipcRenderer.refreshInventory();
  }

  // Get the inventory
  async function refreshInventory() {
    window.electron.ipcRenderer.refreshInventory();
  }

  return (
    <>
      <MultisellModal
        open={multisellOpen}
        onClose={() => setMultisellOpen(false)}
        selectedItems={selectedItems}
        onSuccess={() => setSelectedItems([])}
      />

      {/* Page title & actions */}
      <div className="border-b border-gray-200 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:border-opacity-50">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium leading-6 text-gray-900 dark:text-dark-white  sm:truncate">
            Inventory
          </h1>
        </div>
        <div className="mt-4 flex items-center gap-3 sm:mt-0 sm:ml-4">

          {/* Float toggle */}
          <button
            type="button"
            onClick={toggleFloat}
            title={settingsData.showFloat ? 'Showing floats (items de-stacked) — click to stack' : 'Showing stacked items — click to show floats'}
            className={`focus:outline-none inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border ${
              settingsData.showFloat
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                : 'bg-white dark:bg-dark-level-three text-gray-600 dark:text-dark-white border-gray-200 dark:border-opacity-30 hover:bg-gray-50 dark:hover:bg-dark-level-four'
            }`}
          >
            {settingsData.showFloat ? 'Float ON' : 'Float OFF'}
          </button>

          {/* Multisell button */}
          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMultisellOpen(true)}
              className="focus:outline-none inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white"
            >
              <TagIcon className="h-3.5 w-3.5" />
              Sell {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </button>
          )}

          <button
            type="button"
            onClick={() => refreshInventory()}
            className="focus:outline-none focus:bg-dark-level-four order-1 ml-3  order-1 inline-flex items-center px-4 py-2 hover:border hover:shadow-sm dark:hover:bg-dark-level-four  text-sm font-medium rounded-md text-gray-700  hover:bg-gray-50 sm:order-0 sm:ml-0'"

          >
            {getLoadingButton ? (
              <LoadingButton />
            ) : (
              <ArrowPathIcon
                className="h-4 w-4 text-gray-500 dark:text-dark-white"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
      {/* Pinned projects */}
      <InventoryFilters />

      {/* Projects list (only on smallest breakpoint) */}
      <div className="mt-10 sm:hidden">
        <div className="px-4 sm:px-6">
          <h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide">
            Storages
          </h2>
        </div>
      </div>

      {/* Projects table (small breakpoint and up) */}
      <div className="hidden sm:block">
        <div className="align-middle inline-block min-w-full border-b border-gray-200 dark:border-opacity-50">
          <InventoryRowsComponent
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
          />
        </div>
      </div>
    </>
  );
}
export default function InventoryView() {
  return <Content />;
}
