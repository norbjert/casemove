import { useSelector } from "react-redux";
import { Settings, State } from "renderer/interfaces/states";
import EmptyField from "./EmptyField";
import ItemDistributionByVolume from "./categoryDistribution/categoryDistribution";

export default function RightGraph() {
    const settingsData: Settings = useSelector((state: State) => state.settingsReducer)

    const by = settingsData.overview.by
    const right = settingsData.overview.chartRight

    const returnObject = {
        itemDistribution: ItemDistributionByVolume
    }

    let Fitting = returnObject[right]
    if (Fitting == undefined) {
        Fitting = EmptyField
      }
  
 
  
    return (
      <>
      <Fitting />
      </>
    );
  }
  