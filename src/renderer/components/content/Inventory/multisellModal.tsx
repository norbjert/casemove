import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ConvertPrices } from 'renderer/functionsClasses/prices';

interface SellEntry {
  item_id: string;
  item_name: string;
  item_wear_name: string;
  combined_ids: string[];
  combined_QTY: number;
  price: string;   // price per item in user currency (what seller receives)
  qty: number;     // how many to list
}

interface Props {
  open: boolean;
  onClose: () => void;
  selectedItems: any[];
  onSuccess: () => void;
}

export default function MultisellModal({ open, onClose, selectedItems, onSuccess }: Props) {
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const pricesResult = useSelector((state: any) => state.pricingReducer);
  const PricesClass = new ConvertPrices(settingsData, pricesResult);

  const [entries, setEntries] = useState<SellEntry[]>([]);
  const [selling, setSelling] = useState(false);
  const [results, setResults] = useState<{assetid: string; success: boolean; error?: string}[]>([]);

  useEffect(() => {
    if (open) {
      setResults([]);
      setEntries(selectedItems.map(item => {
        const basePrice = PricesClass.getPrice(item, true);
        const displayPrice = basePrice > 0 ? (basePrice - 0.01).toFixed(2) : '';
        return {
          item_id: item.item_id,
          item_name: item.item_name,
          item_wear_name: item.item_wear_name,
          combined_ids: item.combined_ids,
          combined_QTY: item.combined_QTY,
          price: displayPrice,
          qty: item.combined_QTY,
        };
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedItems]);

  function autoPriceAll() {
    setEntries(prev => prev.map(e => {
      const item = selectedItems.find(i => i.item_id === e.item_id);
      if (!item) return e;
      const basePrice = PricesClass.getPrice(item, true);
      return {
        ...e,
        price: basePrice > 0 ? (basePrice - 0.01).toFixed(2) : e.price,
      };
    }));
  }

  function updateEntry(item_id: string, field: 'price' | 'qty', value: string | number) {
    setEntries(prev => prev.map(e =>
      e.item_id === item_id ? { ...e, [field]: value } : e
    ));
  }

  async function handleSell() {
    setSelling(true);
    setResults([]);

    const itemsToSell: {assetid: string; price_in_cents: number}[] = [];
    for (const entry of entries) {
      const priceNum = parseFloat(entry.price);
      if (isNaN(priceNum) || priceNum <= 0) continue;
      const priceCents = Math.round(priceNum * 100);
      const idsToUse = entry.combined_ids.slice(0, entry.qty);
      for (const assetid of idsToUse) {
        itemsToSell.push({ assetid, price_in_cents: priceCents });
      }
    }

    try {
      const res = await (window.electron.ipcRenderer as any).sellItems(itemsToSell);
      setResults(res);
      const allOk = res.every((r: any) => r.success);
      if (allOk) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setResults([{ assetid: 'error', success: false, error: String(err) }]);
    } finally {
      setSelling(false);
    }
  }

  const currencySymbol = new Intl.NumberFormat(settingsData.locale, {
    style: 'currency',
    currency: settingsData.currency,
  }).formatToParts(0).find(p => p.type === 'currency')?.value || settingsData.currency;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-2xl bg-white dark:bg-dark-level-two rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-opacity-30">
              <h2 className="text-lg font-semibold dark:text-dark-white">
                Multisell — {entries.length} item{entries.length !== 1 ? 's' : ''}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={autoPriceAll}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Auto-price (Steam −0.01{currencySymbol})
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="text-left pb-2">Item</th>
                    <th className="text-center pb-2 w-24">Price ({currencySymbol})</th>
                    <th className="text-center pb-2 w-20">Qty</th>
                    <th className="text-center pb-2 w-20">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {entries.map(entry => {
                    const priceNum = parseFloat(entry.price) || 0;
                    const total = (priceNum * entry.qty).toFixed(2);
                    const result = results.find(r => entry.combined_ids.slice(0, entry.qty).includes(r.assetid));
                    return (
                      <tr key={entry.item_id} className="py-2">
                        <td className="py-2 pr-4 dark:text-dark-white">
                          <div className="font-medium">{entry.item_name}</div>
                          {entry.item_wear_name && (
                            <div className="text-xs text-gray-400">{entry.item_wear_name}</div>
                          )}
                          {result && (
                            <div className={`text-xs mt-0.5 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                              {result.success ? '✓ Listed' : `✗ ${result.error || 'Failed'}`}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={entry.price}
                            onChange={e => updateEntry(entry.item_id, 'price', e.target.value)}
                            className="w-20 text-center border rounded px-1 py-0.5 text-sm dark:bg-dark-level-one dark:text-dark-white dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max={entry.combined_QTY}
                            value={entry.qty}
                            onChange={e => updateEntry(entry.item_id, 'qty', Math.max(1, Math.min(entry.combined_QTY, parseInt(e.target.value) || 1)))}
                            className="w-16 text-center border rounded px-1 py-0.5 text-sm dark:bg-dark-level-one dark:text-dark-white dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-gray-400 ml-1">/ {entry.combined_QTY}</span>
                        </td>
                        <td className="py-2 text-center text-gray-600 dark:text-gray-300">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t dark:border-opacity-30 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total: {currencySymbol}{entries.reduce((sum, e) => sum + (parseFloat(e.price) || 0) * e.qty, 0).toFixed(2)}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-level-three rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSell}
                  disabled={selling || entries.every(e => !parseFloat(e.price))}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md"
                >
                  {selling ? 'Listing...' : `List ${entries.reduce((s, e) => s + e.qty, 0)} items`}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
