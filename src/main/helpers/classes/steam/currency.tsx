import axios from 'axios';
import currencyBackup from './backup/currency.json';

async function loadLiveRates(currencyClass) {
  axios.get('https://api.frankfurter.app/latest?from=USD')
    .then((response) => {
      if (response.data?.rates && typeof response.data.rates === 'object') {
        currencyClass.rates = { ...response.data.rates, USD: 1 };
        console.log('Live exchange rates loaded from frankfurter.app');
      }
    })
    .catch((error) => {
      console.log('Could not load live exchange rates, using backup:', error.message);
    });
}

class currency {
  rates = {};

  constructor() {
    this.rates = { ...currencyBackup.rates, USD: 1 };
    loadLiveRates(this);
  }

  getRate(exchangeTo) {
    if (!exchangeTo || typeof exchangeTo !== 'string') {
      return Promise.resolve(1);
    }
    return Promise.resolve(this.rates[exchangeTo] || 1);
  }
}

export { currency };
