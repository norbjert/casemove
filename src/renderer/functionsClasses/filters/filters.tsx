import { itemSubCategories } from 'renderer/components/content/shared/categories';
import {
  ClassOptionFilter,
  Filter,
  FilterRequirement,
  Filters,
  FiltersRequirement,
} from 'renderer/interfaces/filters';
import { ItemRow } from 'renderer/interfaces/items';
import { some } from 'lodash';

export class FilterManager {
  filters: Filters = {};

  addFilter(keyToAddUnder: string, filterObject: FilterRequirement, include: boolean): void {

    const finalFilter: Filter = {
      ...filterObject,
      include: include,
    };
    if (this.filters?.[keyToAddUnder] != undefined) {

      const oldArray = this.filters[keyToAddUnder];
      oldArray.push(finalFilter);
      this.filters[keyToAddUnder] = oldArray;
    } else {
      this.filters[keyToAddUnder] = [finalFilter];
    }
  }

  addFilters(
    keyToAddUnder: string,
    filterObjects: Array<FilterRequirement>,
    includeFilter: boolean
  ): void {
    const arrayToAdd: Array<Filter> = [];
    filterObjects.forEach((element) => {
      if (!some(this.filters?.[keyToAddUnder], element)) {
        const finalFilter: Filter = {
          ...element,
          include: includeFilter,
        };
        arrayToAdd.push(finalFilter);
      }
    });
    if (arrayToAdd.length > 0) {
      if (this.filters?.[keyToAddUnder] != undefined) {
        this.filters[keyToAddUnder] = [
          ...this.filters?.[keyToAddUnder],
          ...arrayToAdd,
        ];
      } else {
        this.filters[keyToAddUnder] = [...arrayToAdd];
      }
    }
  }

  loadFilter(
    filterObject: FiltersRequirement,
    includeFilter: boolean,
    specialName: string = ''
  ): void {
    for (const [key, value] of Object.entries(filterObject)) {
      let keyToUse = key;
      if (specialName != '') {
        keyToUse = specialName;
      }
      this.addFilters(keyToUse, value, includeFilter);
    }
  }

  excludeFilter(keyToAddUnder: string, filterLabel: string) {
    const filtered = this.filters?.[keyToAddUnder]?.filter(
      (filter) => filter.label != filterLabel
    );
    if (filtered.length > 0) {
      this.filters[keyToAddUnder] = [...filtered];
    }
  }
}

export const characteristics: ClassOptionFilter = {
  activeTradehold: {
    label: 'Active tradehold',
    valueToCheck: 'trade_unlock',
    commandType: 'checkBooleanVariable',
  },
  customName: {
    label: 'Custom name',
    valueToCheck: 'item_customname',
    commandType: 'checkBooleanVariable',
  },
  stickersPatches: {
    label: 'Stickers/Patches applied',
    valueToCheck: 'item_has_stickers',
    commandType: 'checkBooleanVariable',
  },
  moveable: {
    label: 'Storage moveable',
    valueToCheck: 'item_moveable',
    commandType: 'checkBooleanVariable',
  },
  CT: {
    label: 'Equipped CT',
    valueToCheck: 'equipped_ct',
    commandType: 'checkBooleanVariable',
  },
  T: {
    label: 'Equipped T',
    valueToCheck: 'equipped_t',
    commandType: 'checkBooleanVariable',
  },
};
export const containers: ClassOptionFilter = {
  cases: {
    label: 'Cases',
    valueToCheck: 'Case',
    commandType: 'checkNameAndContainer',
  },
  stickerCapsules: {
    label: 'Sticker Capsules',
    valueToCheck: 'Capsule',
    commandType: 'checkCapsule',
  },
  patchPacks: {
    label: 'Patch Packs',
    valueToCheck: 'Patch',
    commandType: 'checkNameAndContainer',
  },
  pinsCapsule: {
    label: 'Pins Capsule',
    valueToCheck: 'Pins Capsule',
    commandType: 'checkNameAndContainer',
  },
};

export async function addMajorsFilters(itemArray: Array<ItemRow>) {
  const returnArray: Array<Filter> = [];
  const seenMajors: Array<string> = [];
  itemArray.forEach((itemRow) => {
    seenMajors.push(itemRow.major);
  });

  itemSubCategories.majors.forEach((major) => {
    if (seenMajors.includes(major)) {
      returnArray.push({
        include: true,
        label: major,
        valueToCheck: major,
        commandType: 'checkMajor',
      });
    }
  });

  return {
    Majors: returnArray,
  };
}
