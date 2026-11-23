import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { LoadButton } from 'renderer/components/content/loadStorageUnitsButton';
import { classNames } from 'renderer/components/content/shared/filters/inventoryFunctions';
import { createCSGOImage } from 'renderer/functionsClasses/createCSGOImage';
import {
  ItemPerformance,
  PortfolioHistory,
  computePortfolio,
  marketHashNames,
  timeFrames,
} from 'renderer/functionsClasses/portfolio';
Chart;

function Change({ value, pct, format }: { value: number; pct: number; format: (n: number) => string }) {
  const up = value >= 0;
  const Icon = up ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  return (
    <span className={classNames(up ? 'text-green-500' : 'text-red-500', 'inline-flex items-center gap-1')}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {up ? '+' : ''}
      {format(value)} ({up ? '+' : ''}
      {pct.toFixed(1)}%)
    </span>
  );
}

function ItemList({ title, items, format }: { title: string; items: ItemPerformance[]; format: (n: number) => string }) {
  return (
    <div className="bg-dark-level-three p-5">
      <h3 className="text-sm font-medium text-dark-white mb-3">{title}</h3>
      {items.length === 0 && <p className="text-sm text-gray-500">Nothing here for this time frame.</p>}
      <ul className="divide-y divide-dark-level-four">
        {items.map((i) => (
          <li key={i.name} className="flex items-center gap-3 py-2">
            <img className="h-10 w-10 rounded-full object-cover bg-dark-level-four" src={createCSGOImage(i.item.item_url)} alt="" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-dark-white">{i.name}</p>
              <p className="text-xs text-gray-500">
                {i.qty}x · {format(i.startPrice)} → {format(i.endPrice)}
              </p>
            </div>
            <div className="text-sm text-right">
              <Change value={i.change} pct={i.changePct} format={format} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PortfolioPage() {
  const inventory = useSelector((state: any) => state.inventoryReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);
  const [days, setDays] = useState(30);
  const [history, setHistory] = useState<PortfolioHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(
    () => [...inventory.combinedInventory, ...inventory.storageInventory],
    [inventory.combinedInventory, inventory.storageInventory]
  );
  const namesKey = useMemo(
    () => [...new Set(rows.filter((r) => r.item_moveable).flatMap(marketHashNames))].sort().join('\n'),
    [rows]
  );

  useEffect(() => {
    if (!namesKey) return;
    let cancelled = false;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    setLoading(true);
    window.electron.ipcRenderer
      .getPortfolioHistory(namesKey.split('\n'), from.toISOString(), to.toISOString())
      .then((res) => {
        if (cancelled) return;
        setError(res.error ?? null);
        setHistory((res.history as PortfolioHistory) ?? null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [namesKey, days]);

  const result = useMemo(
    () =>
      history &&
      computePortfolio(rows, history, settingsData.source?.title, settingsData.currencyPrice[settingsData.currency] ?? 1),
    [history, rows, settingsData]
  );

  const format = (n: number) =>
    new Intl.NumberFormat(settingsData.locale, { style: 'currency', currency: settingsData.currency }).format(n);

  const gainers = result?.items.filter((i) => i.change > 0).slice(0, 5) ?? [];
  const losers = result?.items.filter((i) => i.change < 0).reverse().slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-dark-level-one pb-8">
      <div className="shadow border-opacity-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-dark-white">Portfolio</h1>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md shadow-sm" role="group" aria-label="Time frame">
              {timeFrames.map((tf, idx) => (
                <button
                  key={tf.label}
                  onClick={() => setDays(tf.days)}
                  aria-pressed={days === tf.days}
                  className={classNames(
                    days === tf.days ? 'bg-dark-level-four text-dark-white' : 'bg-dark-level-three text-gray-400 hover:text-dark-white',
                    idx === 0 ? 'rounded-l-md' : '',
                    idx === timeFrames.length - 1 ? 'rounded-r-md' : '',
                    'px-3 py-2 text-sm font-medium'
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <LoadButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-5">
        {error && <div className="bg-red-900/40 text-red-200 text-sm p-4">{error}</div>}
        {!namesKey && <p className="text-sm text-gray-500">No items to track yet.</p>}
        {loading && !result && <p className="text-sm text-gray-500">Loading price history…</p>}

        {result && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-dark-level-three p-5">
                <dt className="text-sm font-medium text-dark-white">Current value</dt>
                <dd className="text-lg font-medium text-dark-white">{format(result.endValue)}</dd>
              </div>
              <div className="bg-dark-level-three p-5">
                <dt className="text-sm font-medium text-dark-white">Gain / loss</dt>
                <dd className="text-lg font-medium">
                  <Change value={result.change} pct={result.changePct} format={format} />
                </dd>
              </div>
              <div className="bg-dark-level-three p-5">
                <dt className="text-sm font-medium text-dark-white">Items tracked</dt>
                <dd className="text-lg font-medium text-dark-white">
                  {result.items.length}
                  <span className="text-sm text-gray-500"> / {new Set(rows.filter((r) => r.item_moveable).map((r) => marketHashNames(r)[0])).size} unique</span>
                </dd>
              </div>
            </div>

            <div className={classNames(loading ? 'opacity-50' : '', 'bg-dark-level-three p-5 h-96')}>
              <Line
                data={{
                  labels: result.labels,
                  datasets: [
                    {
                      label: 'Portfolio value',
                      data: result.values,
                      borderColor: '#a78bfa',
                      backgroundColor: 'rgba(167, 139, 250, 0.15)',
                      borderWidth: 2,
                      pointRadius: 0,
                      pointHitRadius: 8,
                      fill: true,
                      tension: 0.2,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => format(ctx.parsed.y ?? 0) } },
                  },
                  scales: {
                    x: { ticks: { color: '#d6d3cd', maxTicksLimit: 8 }, grid: { display: false } },
                    y: { ticks: { color: '#d6d3cd', callback: (v) => format(Number(v)) }, grid: { color: 'rgba(214, 211, 205, 0.08)' } },
                  },
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ItemList title="Top performers" items={gainers} format={format} />
              <ItemList title="Worst performers" items={losers} format={format} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
