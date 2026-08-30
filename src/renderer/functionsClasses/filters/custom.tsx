import { Filter } from "renderer/interfaces/filters";
import { ItemRow } from "renderer/interfaces/items";


// Check if the filter's value appears in one of the row's string fields
function includesValue(itemRow: ItemRow, filter: Filter, variableName: string): boolean {
    return itemRow?.[variableName]?.includes(filter.valueToCheck)
}

// Same, but only for containers
function containerIncludesValue(itemRow: ItemRow, filter: Filter, variableName: string): boolean {
    return itemRow.category == 'Containers' && includesValue(itemRow, filter, variableName) || false
}

function filterLogic(itemRow: ItemRow, IndividualFilter: Filter): boolean {
    let returnValue: boolean = false;
    switch (IndividualFilter.commandType) {
        case 'checkBooleanVariable':
            returnValue = itemRow?.[IndividualFilter.valueToCheck] || false
            break

        case 'checkName':
            returnValue = includesValue(itemRow, IndividualFilter, 'item_name')
            break

        case 'checkURL':
            returnValue = includesValue(itemRow, IndividualFilter, 'item_url')
            break

        case 'checkMajor':
            returnValue = includesValue(itemRow, IndividualFilter, 'major')
            break

        case 'checkNameAndContainer':
            returnValue = containerIncludesValue(itemRow, IndividualFilter, 'item_name')
            break

        case 'checkCapsule':
            returnValue = containerIncludesValue(itemRow, IndividualFilter, 'item_name')
            if (itemRow.item_name.includes('Challengers') || itemRow.item_name.includes('Legends') || itemRow.item_name.includes('Contenders')) {
                if (!itemRow.item_name.includes('Patch')) {
                    returnValue = true;

                }
            }

            break;

        default:
            break
    }
    if (IndividualFilter.include) {
        return returnValue
    } else {
        return !returnValue
    }
}

export async function filterItemRows(arrayToFilter: Array<ItemRow>, filters: Array<Filter>): Promise<Array<ItemRow>> {
    let returnArray = arrayToFilter;

    filters.forEach(filt => {

        returnArray = returnArray.filter(itemRow => {
            return filterLogic(itemRow, filt)
        });
    });

    return returnArray
}