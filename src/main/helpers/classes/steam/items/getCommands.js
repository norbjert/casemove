import axios from 'axios';
import items from './index';

// RUN PROGRAMS
class fetchItems {
  itemsClass = items;
  constructor() {
    this.itemsClass = new items();
  }

  async convertInventory(inventory) {
    const responseFiltered = await this.itemsClass.inventoryConverter(
      inventory,
      false
    );
    return responseFiltered;
  }
  async convertStorageData(inventory) {
    const responseFiltered = await this.itemsClass.inventoryConverter(
      inventory,
      true
    );
    return responseFiltered;
  }
}
export { fetchItems };
