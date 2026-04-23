import { useSelector } from "react-redux";
import { ReducerManager } from "renderer/functionsClasses/reducerManager";
import { Settings } from "renderer/interfaces/states";
import EmptyField from "./EmptyField";
import OverallVolume from "./leftGraph/barChartOverall";

export default function LeftGraph() {
    const ReducerClass = new ReducerManager(useSelector);
    const settingsData: Settings = ReducerClass.getStorage(ReducerClass.names.settings)

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
    console.log(Fitting)

   
  
 
  
    return (
      <>
      <Fitting />
      </>
    );
  }
  