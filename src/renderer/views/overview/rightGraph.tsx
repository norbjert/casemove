import { useSelector } from "react-redux";
import { ReducerManager } from "renderer/functionsClasses/reducerManager";
import { Settings } from "renderer/interfaces/states";
import EmptyField from "./EmptyField";
import ItemDistributionByVolume from "./categoryDistribution/categoryDistribution";

export default function RightGraph() {
    const ReducerClass = new ReducerManager(useSelector);
    const settingsData: Settings = ReducerClass.getStorage(ReducerClass.names.settings)

    const by = settingsData.overview.by
    const right = settingsData.overview.chartRight

    const returnObject = {
        itemDistribution: ItemDistributionByVolume
    }

    let Fitting = returnObject[right]
    if (Fitting == undefined) {
        Fitting = EmptyField
      }
    console.log(by)

   
  
 
  
    return (
      <>
      <Fitting />
      </>
    );
  }
  