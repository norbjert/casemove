import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  LinearScale,
} from 'chart.js';
import { useSelector } from 'react-redux';
import { itemCategories } from 'renderer/components/content/shared/categories';
import { categoriesRGB } from './categoriesRGB';
import PieChart from '../charts/pieChart';
import { ConvertPrices } from 'renderer/functionsClasses/prices';
import { Inventory, Prices, Settings, State } from 'renderer/interfaces/states';


ChartJS.register(
  RadialLinearScale,
  PointElement,
  LinearScale,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function getData(
  settingsData: Settings,
  pricingData: Prices,
  inventory: Inventory,
  by: string
) {
  const categoriesFixed: Array<string> = [];
  const categoriesColors: any = {};

  const resultingData = {} as any;
  itemCategories.forEach((element) => {
    categoriesFixed.push(element.name);
    categoriesColors[element.name] = categoriesRGB[element.value]
    resultingData[element.name] = {
      inventory: 0,
      storageUnits: 0
    }
  });

  const PricingConverter = new ConvertPrices(settingsData, pricingData)
  // Go through inventory and find matching categories
  inventory.combinedInventory.forEach(element => {
    if (resultingData[element.category]) {
      if (by == 'price') {

        resultingData[element.category].inventory += PricingConverter.getPrice(element, true) * element.combined_QTY
      }
      if (by == 'volume') {
        resultingData[element.category].inventory = resultingData?.[element.category]?.inventory + element.combined_QTY
      }

    }
  });

  // Go through Storage Units
  inventory.storageInventory.forEach(element => {
    if (resultingData[element.category]) {
      if (by == 'price') {

        resultingData[element.category].storageUnits += PricingConverter.getPrice(element, true) * element.combined_QTY
      }
      if (by == 'volume') {
        resultingData[element.category].storageUnits = resultingData?.[element.category]?.storageUnits + element.combined_QTY
      }
    }
  });

  // Convert inventory to chart data
  const finalDataToUse: Array<number> = [];
  const rgbColorsToUse: Array<string> = [];
  const rgbColorsToUseBorder: Array<string> = [];

  categoriesFixed.forEach(category => {
    finalDataToUse.push(resultingData[category].inventory + resultingData[category].storageUnits)
    rgbColorsToUse.push(categoriesColors[category])
    rgbColorsToUseBorder.push(categoriesColors[category]?.replace('0.2', '1'))
  });

  return {
    labels: categoriesFixed,
    data: finalDataToUse,
    backgroundColor: rgbColorsToUse,
    borderColor: rgbColorsToUseBorder
  }

}
export default function ItemDistributionByVolume() {
  const settingsData = useSelector((state: State) => state.settingsReducer);
  const pricingData = useSelector((state: State) => state.pricingReducer);
  const inventory = useSelector((state: State) => state.inventoryReducer);

  const by = settingsData.overview.by;
  const returnObject: any =
    by == 'price' || by == 'volume'
      ? getData(settingsData, pricingData, inventory, by)
      : { labels: [], data: [], backgroundColor: [], borderColor: [] };

  const data = {
    labels: returnObject.labels,

    datasets: [
      {
        label: 'Inventory',
        data: returnObject.data,
        backgroundColor: returnObject.backgroundColor,
        borderColor: returnObject.borderColor,
        borderWidth: 1,
      }

    ],
  };

  return (
    <>
      <PieChart data={data} headerName='Category distribution' />
    </>
  );
}
