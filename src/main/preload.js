import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // User commands
    refreshInventory() {
      ipcRenderer.send('refreshInventory');
    },

    checkSteam() {
      return ipcRenderer.invoke('check-steam');
    },

    closeSteam() {
      return ipcRenderer.invoke('close-steam');
    },
    // User commands
    needUpdate() {
      return new Promise((resolve) => {
        ipcRenderer.send('needUpdate');
        ipcRenderer.once('needUpdate-reply', (evt, message) => {
          resolve(message);
        });
      });
    },
    // User account
    getAccountDetails() {
      return new Promise((resolve) => {
        ipcRenderer.send('electron-store-getAccountDetails');
        ipcRenderer.once(
          'electron-store-getAccountDetails-reply',
          (evt, message) => {
            resolve(message);
          }
        );
      });
    },

    // User account
    getPossibleOutcomes(resultsToGet) {
      return new Promise((resolve) => {
        ipcRenderer.send('getTradeUpPossible', resultsToGet);
        ipcRenderer.once('getTradeUpPossible-reply', (evt, message) => {
          resolve(message);
        });
      });
    },

    // Trade up
    tradeOrder(idsToProcess, idToUse) {
      ipcRenderer.send('processTradeOrder', idsToProcess, idToUse);
    },
    //
    setItemsPosition(dictToUse) {
      ipcRenderer.send('setItemsPositions', dictToUse);
    },
    //
    OpenContainer(listToUse) {
      ipcRenderer.send('openContainer', listToUse);
    },

    // User account
    deleteAccountDetails(username) {
      ipcRenderer.send('electron-store-deleteAccountDetails', username);
    },

    // User account
    setAccountPosition(username, indexPosition) {
      ipcRenderer.send(
        'electron-store-setAccountPosition',
        username,
        indexPosition
      );
    },

    downloadFile(data) {
      ipcRenderer.send('download', data);
    },
    getPrice(itemRows) {
      ipcRenderer.send('getPrice', itemRows);
    },
    getCurrencyRate() {
      return new Promise((resolve) => {
        ipcRenderer.send('getCurrency');
        ipcRenderer.once('getCurrency-reply', (evt, message) => {
          resolve(message);
        });
      });
    },
    // User commands
    retryConnection() {
      ipcRenderer.send('retryConnection');
    },
    // User commands
    logUserOut() {
      ipcRenderer.send('signOut');
    },
    // User commands
    handleWindowsActions(action_type) {
      ipcRenderer.send('windowsActions', action_type);
    },

    // Send Confirm Force
    forceLogin() {
      ipcRenderer.send('forceLogin');
    },

    startQRLogin(shouldRemember) {
      return new Promise((resolve) => {
        ipcRenderer.removeAllListeners('login-reply');

        ipcRenderer.send('startQRLogin', shouldRemember);
        ipcRenderer.once('login-reply', (event, arg) => {
          resolve(arg);
        });
      });
    },

    cancelQRLogin() {
      ipcRenderer.send('cancelQRLogin');
    },

    // USER CONNECTIONS
    loginUser(
      username,
      password,
      shouldRemember,
      authcode,
      sharedSecret,
      clientjstoken
    ) {

      if (authcode === '') {
        authcode = null;
      }
      if (sharedSecret === '') {
        sharedSecret = null;
      }
      if (clientjstoken === '') {
        clientjstoken = null;
      }
      return new Promise((resolve) => {
        ipcRenderer.send(
          'login',
          username,
          password,
          shouldRemember,
          authcode,
          sharedSecret,
          clientjstoken
        );
        ipcRenderer.once('login-reply', (event, arg) => {
          resolve(arg);
        });
      });
    },

    forceLoginReply() {
      return new Promise((resolve) => {
        ipcRenderer.once('login-reply', (event, arg) => {
          resolve(arg);
        });
      });
    },

    userEvents() {
      return new Promise((resolve) => {
        ipcRenderer.once('userEvents', (evt, message) => {
          resolve(message);
        });
      });
    },

    // Commands
    renameStorageUnit(itemID, newName) {
      return new Promise((resolve) => {
        ipcRenderer.send('renameStorageUnit', itemID, newName);

        ipcRenderer.once('renameStorageUnit-reply', (event, arg) => {
          resolve(arg);
        });
      });
    },

    // Commands
    getStorageUnitData(itemID, storageName) {
      return new Promise((resolve, reject) => {
        const handler = (_event, arg) => {
          clearTimeout(timeoutId);
          ipcRenderer.removeListener('getCasketContent-reply', handler);
          resolve(arg);
        };
        const timeoutId = setTimeout(() => {
          ipcRenderer.removeListener('getCasketContent-reply', handler);
          reject(new Error('GC request timed out'));
        }, 8000);
        ipcRenderer.on('getCasketContent-reply', handler);
        ipcRenderer.send('getCasketContents', itemID, storageName);
      });
    },

    // Commands
    moveFromStorageUnit(casketID, itemID, fastMode) {
      // Create a promise that rejects in <ms> milliseconds
      let storageUnitResponse = new Promise((resolve) => {
        ipcRenderer.send('removeFromStorageUnit', casketID, itemID, fastMode);

        if (fastMode) {
          resolve(fastMode);
        } else {
          ipcRenderer.once('removeFromStorageUnit-reply', (event, arg) => {
            resolve(arg);
          });
        }
      });
      if (fastMode) {
        return true;
      } else {
        let timeout = new Promise((_resolve, reject) => {
          let id = setTimeout(() => {
            clearTimeout(id);
            reject();
          }, 10000);
        });
        return Promise.race([storageUnitResponse, timeout]);
      }
    },
    // Commands
    moveToStorageUnit(casketID, itemID, fastMode) {
      let storageUnitResponse = new Promise((resolve) => {
        ipcRenderer.send('moveToStorageUnit', casketID, itemID, fastMode);
        if (fastMode) {
          resolve(fastMode);
        } else {
          ipcRenderer.once('moveToStorageUnit-reply', (event, arg) => {
            resolve(arg);
          });
        }
      });

      if (fastMode) {
        return true;
      } else {
        let timeout = new Promise((_resolve, reject) => {
          let id = setTimeout(() => {
            clearTimeout(id);
            reject();
          }, 10000);
        });

        return Promise.race([storageUnitResponse, timeout]);
      }
    },


    sellItems(items) {
      return ipcRenderer.invoke('sellItems', items);
    },
    cancelSell() {
      ipcRenderer.send('cancelSell');
    },

    on(channel, func) {
      const validChannels = [
        'login',
        'userEvents',
        'refreshInventory',
        'renameStorageUnit',
        'removeFromStorageUnit',
        'errorMain',
        'signOut',
        'retryConnection',
        'needUpdate',
        'download',
        'electron-store-getAccountDetails',
        'electron-store-get',
        'electron-store-set',
        'pricing',
        'getPrice',
        'windowsActions',
        'getTradeUpPossible',
        'processTradeOrder',
        'setItemsPositions',
        'openContainer',
        'forceLogin',
        'checkSteam',
        'closeSteam',
        'updater',
        'startQRLogin',
        'cancelQRLogin',
        'qrLogin:show',
        'qrLogin:scanned',
        'sellProgress',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = [
        'login',
        'userEvents',
        'refreshInventory',
        'renameStorageUnit',
        'removeFromStorageUnit',
        'errorMain',
        'signOut',
        'retryConnection',
        'needUpdate',
        'download',
        'electron-store-getAccountDetails',
        'electron-store-get',
        'electron-store-set',
        'pricing',
        'getPrice',
        'windowsActions',
        'getTradeUpPossible',
        'processTradeOrder',
        'setItemsPositions',
        'openContainer',
        'forceLogin',
        'checkSteam',
        'closeSteam',
        'updater',
        'startQRLogin',
        'cancelQRLogin',
        'qrLogin:show',
        'qrLogin:scanned',
        'sellProgress',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
  },
  store: {
    // Commands
    get(val) {
      const key =
        Math.random().toString(36).slice(2, 3) +
        '-' +
        Math.random().toString(36).slice(2, 3) +
        '-' +
        Math.random().toString(36).slice(2, 4);
      return new Promise((resolve) => {
        ipcRenderer.send('electron-store-get', val, key);

        ipcRenderer.once('electron-store-get-reply' + key, (event, arg) => {
          resolve(arg);
        });
      });
    },
    set(property, val) {
      ipcRenderer.send('electron-store-set', property, val);
    },
  },
});
