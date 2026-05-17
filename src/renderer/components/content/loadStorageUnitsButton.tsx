import { RectangleStackIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllStorages } from "renderer/functionsClasses/storageUnits/storageUnitsFunctions";
import { LoadingButton } from "./shared/animations";
import { classNames } from "./shared/filters/inventoryFunctions";

export function LoadButton() {
    const dispatch = useDispatch();
    const moveFromReducer = useSelector((state: any) => state.moveFromReducer);
    const inventoryReducer = useSelector((state: any) => state.inventoryReducer);
    const pricingReducer = useSelector((state: any) => state.pricingReducer);
    const settingsReducer = useSelector((state: any) => state.settingsReducer);
    const inventoryFiltersReducer = useSelector((state: any) => state.inventoryFiltersReducer);
    const currentState = { moveFromReducer, inventoryReducer, pricingReducer, settingsReducer, inventoryFiltersReducer };
    // Get all storage unit data
    async function getAllStor() {
        setLoadingButton(true)
        getAllStorages(dispatch, currentState).then(() => {
            setLoadingButton(false)
        })
    }

    const [getLoadingButton, setLoadingButton] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => getAllStor()}
                className={classNames(moveFromReducer.activeStorages.length == 0 || getLoadingButton ? 'bg-green-700' : 'bg-dark-level-three', "inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-dark-white hover:bg-dark-level-four")}
            >
                {' '}

                {getLoadingButton ? (
                    <LoadingButton
                        className="shrink-0 mr-1.5 h-5 w-5 text-dark-white"
                        aria-hidden="true"
                    />
                ) : (
                    <RectangleStackIcon
                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-dark-white"
                        aria-hidden="true"
                    />
                )}
                {moveFromReducer.activeStorages.length != 0 ? moveFromReducer.activeStorages.length + " Storage units loaded" : "Load storage units"}
            </button>
        </>
    );
}
