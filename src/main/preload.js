import { contextBridge, ipcRenderer } from 'electron';

// Channels the main process is allowed to push to the renderer. Everything
// else is renderer -> main and now goes over invoke/handle, so it can never
// arrive here.
const validChannels = [
  'ipc-example',
  'login-reply',
  'pricing',
  'qrLogin:scanned',
  'qrLogin:show',
  'sellProgress',
  'updater',
  'userEvents',
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing(message = 'ping') {
      ipcRenderer.send('ipc-example', message);
    },

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
      return ipcRenderer.invoke('needUpdate');
    },
    // User account
    getAccountDetails() {
      return ipcRenderer.invoke('electron-store-getAccountDetails');
    },

    // User account
    getPossibleOutcomes(resultsToGet) {
      return ipcRenderer.invoke('getTradeUpPossible', resultsToGet);
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
      return ipcRenderer.invoke('getCurrency');
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
      console.log(clientjstoken);

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
      return ipcRenderer.invoke('renameStorageUnit', itemID, newName);
    },

    // Commands
    getStorageUnitData(itemID, storageName) {
      return ipcRenderer.invoke('getCasketContents', itemID, storageName);
    },

    // Commands — main resolves immediately in fastMode, otherwise when the GC
    // confirms, or rejects on its own timeout.
    moveFromStorageUnit(casketID, itemID, fastMode) {
      return ipcRenderer.invoke('removeFromStorageUnit', casketID, itemID, fastMode);
    },
    // Commands
    moveToStorageUnit(casketID, itemID, fastMode) {
      return ipcRenderer.invoke('moveToStorageUnit', casketID, itemID, fastMode);
    },


    sellItems(items) {
      return ipcRenderer.invoke('sellItems', items);
    },
    cancelSell() {
      ipcRenderer.send('cancelSell');
    },

    on(channel, func) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
  },
  store: {
    // Commands
    get(val) {
      return ipcRenderer.invoke('electron-store-get', val);
    },
    set(property, val) {
      ipcRenderer.send('electron-store-set', property, val);
    },
  },
});
