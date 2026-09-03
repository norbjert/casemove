import combineInventory, { sortDataFunctionTwo } from "renderer/components/content/shared/filters/inventoryFunctions";
import { filterItemRows } from "renderer/functionsClasses/filters/custom";
import { dispatchCurrencyRate, dispatchStoreSetting } from "renderer/functionsClasses/rendererCommands/admin"
import { Settings, InventoryFilters, Prices } from "renderer/interfaces/states";
import { SignInActionPackage } from "renderer/interfaces/store/authReducerActionsInterfaces"
import { inventorySetFilter } from "renderer/store/actions/filtersInventoryActions";
import { setInventoryAction } from "renderer/store/inventory/inventoryActions";
import { signIn } from "renderer/store/actions/userStatsActions";
import { getURL } from "renderer/store/helpers/userStatusHelper";
import { LoginCommandReturnPackage } from "shared/Interfaces.tsx/store"
import { createCSGOImage } from "../../functionsClasses/createCSGOImage";

async function getProfilePicture(steamID: string): Promise<string> {
  try {
    const profilePicture = await getURL(steamID);
    return profilePicture as string;
  } catch (error) {
    return createCSGOImage("econ/characters/customplayer_tm_separatist");
  }
}

export async function handleSuccess(
  returnSuccessPackage: LoginCommandReturnPackage,
  dispatch: Function,
  settingsState: Settings,
  filtersState: InventoryFilters,
  pricingState: Prices,
) {
  dispatchStoreSetting(dispatch, 'source')
  dispatchStoreSetting(dispatch, 'locale')
  dispatchCurrencyRate(dispatch)
  await new Promise((r) => setTimeout(r, 2500));

  const signInPackage: SignInActionPackage = {
    userProfilePicture: await getProfilePicture(returnSuccessPackage.steamID),
    displayName: returnSuccessPackage.displayName,
    CSGOConnection: returnSuccessPackage.haveGCSession,
    steamID: returnSuccessPackage.steamID,
    wallet: returnSuccessPackage.walletToSend
  }

  dispatch(signIn(signInPackage))

  // Inventory
  const combinedInventory = await combineInventory(
    returnSuccessPackage.csgoInventory,
    settingsState
  )
  dispatch(
    setInventoryAction({
      inventory: returnSuccessPackage.csgoInventory,
      combinedInventory
    })
  );

  // Filtered inventory
  let filteredInv = await filterItemRows(
    combinedInventory,
    filtersState.inventoryFilter
  );
  filteredInv = await sortDataFunctionTwo(
    filtersState.sortValue,
    filteredInv,
    pricingState.prices,
    settingsState?.source?.title
  );

  dispatch(
    inventorySetFilter(
      filtersState.inventoryFilter,
      filtersState.sortValue,
      filteredInv
    )
  );
}
