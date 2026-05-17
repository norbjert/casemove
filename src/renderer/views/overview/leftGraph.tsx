import { useSelector } from "react-redux";
import { Settings } from "renderer/interfaces/states";
import EmptyField from "./EmptyField";
import OverallVolume from "./leftGraph/barChartOverall";

export default function LeftGraph() {
    const settingsData: Settings = useSelector((state: any) => state.settingsReducer);

    const by = settingsData.overview.by
    const left = settingsData.overview.chartleft

    const returnObject = {
        overall: {
            volume: OverallVolume,
            price: OverallVolume
        }
    }

    let Fitting = returnObject[left][by]
    if (Fitting == undefined) {
      Fitting = EmptyField
    }
  
 
  
    return (
      <>
      <Fitting />
      </>
    );
  }
  