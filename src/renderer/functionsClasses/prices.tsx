import { ItemRow } from 'renderer/interfaces/items';
import { Prices, Settings } from 'renderer/interfaces/states';
import { pricing_add_to_requested } from 'renderer/store/actions/pricingActions';

export class ConvertPrices {
  settingsData: Settings;
  prices: Prices;

  constructor(settingsData: Settings, prices: Prices) {
    this.settingsData = settingsData;
    this.prices = prices;
  }

  _getName(itemRow: ItemRow) {
    return itemRow.item_name + (itemRow.item_wear_name ?? '');
  }

  getPrice(itemRow:ItemRow, nanToZero=false) {
    const itemPrice =
      this.prices.prices[this._getName(itemRow)]?.[
        this.settingsData.source.title
      ] * this.settingsData.currencyPrice[this.settingsData.currency];

    if (nanToZero && isNaN(itemPrice)) {
      return 0
    }

    return itemPrice
  }
}

export class ConvertPricesFormatted extends ConvertPrices {
  formatPrice(price: number) {
    return new Intl.NumberFormat(this.settingsData.locale, {
      style: 'currency',
      currency: this.settingsData.currency,
    }).format(price);
  }

  getFormattedPrice(itemRow: ItemRow) {
    return this.formatPrice(this.getPrice(itemRow));
  }
  getFormattedPriceCombined(itemRow: ItemRow) {
    const comQty = itemRow?.combined_QTY as number;
    return this.formatPrice(comQty * this.getPrice(itemRow));
  }
}

export class RequestPrices extends ConvertPrices {
  dispatch: Function;
  constructor(dispatch: Function, settingsData: Settings, prices: Prices) {
    super(settingsData, prices);
    this.dispatch = dispatch;
  }

  _checkRequested(itemRow: ItemRow): boolean {
    return (
      this.prices.productsRequested.includes(this._getName(itemRow)) == false
    );
  }

  handleRequested(itemRow: ItemRow): void {
    if (isNaN(this.getPrice(itemRow)) == true && this._checkRequested(itemRow)) {
      this._request([itemRow]);
    }
  }

  handleRequestArray(itemRows: Array<ItemRow>): void {
    const rowsToSend = [] as Array<ItemRow>
    itemRows.forEach((itemRow) => {
      if (isNaN(this.getPrice(itemRow)) == true && this._checkRequested(itemRow)) {
        rowsToSend.push(itemRow)
      }
    });
    if (rowsToSend.length > 0) {
      this._request(rowsToSend);
    }
  }

  _request(rowsToSend: Array<ItemRow>): void {
    window.electron.ipcRenderer.getPrice(rowsToSend);
    this.dispatch(pricing_add_to_requested(rowsToSend));
  }
}
