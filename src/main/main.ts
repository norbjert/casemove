import { createRequire } from 'module';
import { BrowserWindow, app, ipcMain, shell } from 'electron';
import * as fs from 'fs';
import GlobalOffensive from 'globaloffensive';
import os from 'os';
import path from 'path';
import { CurrencyReturnValue } from 'shared/Interfaces.tsx/IPCReturn';
import { LoginCommandReturnPackage } from 'shared/Interfaces.tsx/store';
import SteamUser from 'steam-user';
import { LoginGenerator } from './helpers/classes/IPCGenerators/loginGenerator';
import { currency } from './helpers/classes/steam/currency';
import { fetchItems } from './helpers/classes/steam/items/getCommands';
import {
  currencyCodes,
  pricingEmitter,
  runItems,
} from './helpers/classes/steam/pricing';
import {
  deleteUserData,
  getValue,
  setAccountPosition,
  setValue,
  storeUserAccount,
} from './helpers/classes/steam/settings';
import { login } from './helpers/classes/steam/steam';
import { tradeUps } from './helpers/classes/steam/tradeup';
import MenuBuilder from './menu';
import { getGithubVersion } from './scripts/versionHelper';
import { resolveHtmlPath } from './util';
// import log from 'electron-log';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { emitterAccount } from '../emitters';
import { flowLoginRegularQR } from './helpers/login/flowLoginRegularQR';

autoUpdater.logger = log;
// @ts-ignore
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

app.on('ready', function () {
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // No releases published yet — silently ignore
  });
});

const _require = createRequire(import.meta.url);
const find = _require('find-process');

autoUpdater.on('checking-for-update', () => {
  sendUpdaterStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (_info) => {
  sendUpdaterStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', (_info) => {
  sendUpdaterStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err) => {
  sendUpdaterStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
  sendUpdaterStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', (_info) => {
  sendUpdaterStatusToWindow('Update downloaded');
});

async function checkSteam(): Promise<{
  pid?: number;
  status: boolean;
}> {
  const steamName = 'steam.exe';
  if (process.platform == 'linux') {
    return {
      status: false,
    };
  }
  if (process.platform == 'darwin') {
    return {
      status: false,
    };
  }
  return await find('name', steamName, true)
    .then(function (list: string | any[]) {
      if (list.length > 0) {
        return {
          pid: list[0].pid,
          status: true,
        };
      }
      return {
        status: false,
      };
    })
    .catch(function (_err: any) {
      return {
        status: false,
      };
    });
}
checkSteam();

// Define helpers
const ByteBuffer = _require('bytebuffer');
const Protos = _require('globaloffensive/protobufs/generated/_load.js');
const Language = _require('globaloffensive/language.js');
const currencyClass = new currency();
const tradeUpClass = new tradeUps();
const ClassLoginResponse = new LoginGenerator();
// Web session for Steam Market operations
let steamWebCookieStr = '';
let steamWebSessionID = '';

// Cache of assetids currently listed on the Steam Community Market (appid 730),
// regardless of whether they were listed via this app or directly on Steam.
// Refreshed on login, on manual inventory refresh, and after selling items.
let marketListedAssetIds = new Set<string>();

async function refreshMarketListings() {
  if (!steamWebCookieStr) return;
  const axios = (await import('axios')).default;
  const listedIds = new Set<string>();
  try {
    let start = 0;
    const count = 100;
    for (;;) {
      const resp = await axios.get(
        'https://steamcommunity.com/market/mylistings/render/',
        {
          params: { query: '', start, count, norender: 1 },
          headers: {
            Cookie: steamWebCookieStr,
            Referer: 'https://steamcommunity.com/market/',
          },
        }
      );
      // Steam sometimes serves this endpoint as text/javascript, in which case
      // axios won't auto-parse it into an object.
      let data = resp.data as any;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          console.error('Market listings response was not JSON (likely not logged in on the web session):', data.slice(0, 300));
          break;
        }
      }
      // Listed assets for this page, keyed by appid -> contextid -> assetid.
      // (Steam's "assets" object here only ever contains currently-listed items,
      // possibly across multiple games, so filter to CS2's appid 730.)
      const assetsByApp = data?.assets?.['730'] || {};
      for (const contextid of Object.keys(assetsByApp)) {
        for (const assetid of Object.keys(assetsByApp[contextid])) {
          listedIds.add(assetid);
        }
      }
      start += count;
      const hasMorePages = Object.keys(data?.assets || {}).length > 0 && start < (data?.total_count ?? 0);
      if (!hasMorePages) break;
    }
    marketListedAssetIds = listedIds;
    console.log(`Market listings refreshed: ${listedIds.size} item(s) currently listed.`);
  } catch (err) {
    console.error('Failed to refresh market listings:', err);
  }
}

// Tags each item with market_listed using the cached listings set above.
async function convertInventoryTagged(inventory: any) {
  const items = await fetchItemClass.convertInventory(inventory);
  items.forEach((item: any) => {
    item.market_listed = marketListedAssetIds.has(String(item.item_id));
  });
  return items;
}


// Electron stuff
let mainWindow: BrowserWindow | null = null;
const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  _require('electron-debug')();
}

const installExtensions = async () => {
  const installer = _require('electron-devtools-installer');
  const forceDownload = !process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  let frameValue = true;
  if (process.platform == 'win32') {
    frameValue = false;
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1124,
    height: 850,
    minWidth: 1030,
    minHeight: 800,
    frame: frameValue,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
      enableBlinkFeatures: 'CSSColorSchemeUARendering',
    },
  });
  await mainWindow.webContents.session.clearStorageData();

  // Allow cross-origin fetch() from the file:// renderer (e.g. image lookup JSON).
  // This is narrower than webSecurity:false - web security stays on; we only
  // inject Access-Control-Allow-Origin so same-origin fetch works from null origin.
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
      },
    });
  });

  ipcMain.on('download', (_event, info) => {
    const fileP = path.join(os.homedir(), '/Downloads/casemove.csv');

    fs.writeFileSync(fileP, info, 'utf-8');
    shell.showItemInFolder(fileP);
  });

  const htmlPath = resolveHtmlPath('index.html');
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL(htmlPath);
  } else {
    await mainWindow.loadFile(htmlPath);
  }

  mainWindow.on('ready-to-show', () => {
    console.log(app.getVersion());
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.platform == 'linux') {
    mainWindow.removeMenu();
  }
};

/**
 * Add event listeners...
 */
// Windows actions

ipcMain.on('windowsActions', async (_event, message) => {
  if (message == 'min') {
    mainWindow?.minimize();
  }
  if (message == 'max') {
    if (mainWindow?.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow?.maximize();
    }
  }
  if (message == 'close') {
    mainWindow?.close();
  }
});

let currentLocale = 'da-dk';

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
    // localStorage.clear();
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      currentLocale = app.getLocale();
      console.log('Currentlocal', currentLocale);


      await createWindow();
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createWindow();
      });
    })
    .catch(console.log);
}

/**
 * IPC...
 */

const fetchItemClass = new fetchItems();

// Version manager

let gitHub = 0;
ipcMain.on('needUpdate', async (event: any) => {
  try {
    if (gitHub == 0) {
      getGithubVersion(process.platform).then((returnValue) => {
        // Get the current version
        const version = parseInt(
          app.getVersion().toString().replaceAll('.', '')
        );

        // Check success status
        const successStatus: boolean = returnValue.version > version;

        // Send the event back back
        event.reply('needUpdate-reply', {
          requireUpdate: successStatus,
          currentVersion: app.getVersion(),
          githubResponse: returnValue,
        });
      });
    }
  } catch {
    event.reply('needUpdate-reply', [false, app.getVersion(), 0]);
    gitHub = 1;
  }
});

// Return 1 = Success
// Return 2 = Steam Guard
// Return 3 = Steam Guard wrong
// Return 4 = Wrong password
// Return 5 = Unknown
// Return 6 = Error with loginkey
async function sendLoginReply(event: any) {
  event.reply('login-reply', ClassLoginResponse.returnValue);
}

ipcMain.handle('check-steam', async () => {
  const pid = await checkSteam();
  return pid.status;

});

ipcMain.handle('close-steam', async () => {
  const pid = await checkSteam();
  if (pid.status) {
    process.kill(pid.pid as number);
    return true;
  }
  return false;
});

emitterAccount.on(
  'login',
  async (
    event,
    user: SteamUser,
    csgo: GlobalOffensive,
    username: string,
    shouldRemember: boolean,
    secretKey: string | null
  ) => {
    // Success
    user.once('accountInfo', (displayName: string) => {
      console.log('Logged into Steam as main ' + displayName);
      getValue('pricing.currency').then((returnValue) => {
        if (returnValue == undefined) {
          setValue(
            'pricing.currency',
            currencyCodes?.[user?.wallet?.currency] || 'USD',
          );
        }
      });
      console.log('logged on main');

      async function gameCoordinate(resolve: any = null) {
        csgo.once('connectedToGC', () => {
          if (resolve) {
            resolve('GC');
          }
          console.log('Connected to GC!');
          if (csgo.haveGCSession) {
            console.log('Have Session!');
            convertInventoryTagged(csgo.inventory)
              .then((returnValue) => {
                tradeUpClass
                  .getTradeUp(returnValue)
                  .then((newReturnValue: any) => {
                    const walletToSend = user.wallet;
                    if (walletToSend) {
                      walletToSend.currency =
                        currencyCodes?.[walletToSend?.currency];
                    }
                    const returnPackage: LoginCommandReturnPackage = {
                      steamID: user.logOnResult.client_supplied_steamid,
                      displayName,
                      haveGCSession: csgo.haveGCSession,
                      csgoInventory: newReturnValue,
                      walletToSend: walletToSend,
                    };

                    startEvents(csgo, user);
                    if (shouldRemember) {
                      storeUserAccount(
                        username,
                        displayName,
                        user.logOnResult.client_supplied_steamid,
                        secretKey,
                      );
                    }
                    ClassLoginResponse.setResponseStatus('loggedIn');
                    ClassLoginResponse.setPackage(returnPackage);
                    sendLoginReply(event);
                  });
              });
          }
        });
      }

      // // Create a timeout race to catch an infinite loading error in case the Steam account hasnt added the CSGO license
      // Run the normal version

      const GCResponse = new Promise((resolve) => {
        user.once('playingState', function (blocked, _playingApp) {
          if (!blocked) {
            startGameCoordinator();
            gameCoordinate(resolve);
          } else {
            ClassLoginResponse.setEmptyPackage();
            ClassLoginResponse.setResponseStatus('playingElsewhere');
            sendLoginReply(event);
            resolve('error');
          }
        });
      });

      // Run the timeout
      const timeout = new Promise((resolve, _reject) => {
        setTimeout(resolve, 10000, 'time');
      });

      // Run the timeout
      const error = new Promise((resolve, _reject) => {
        user.once('error', (error) => {
          if (error == 'Error: LoggedInElsewhere') {
            resolve('error');
          }
        });
      });

      // Race the two
      Promise.race([timeout, GCResponse, error]).then((value) => {
        if (value == 'error') {
          // Force login
          ipcMain.on('forceLogin', async () => {
            console.log('forceLogin');
            setTimeout(() => {
              // user.setPersona(SteamUser.EPersonaState.Online);
              gameCoordinate();
              user.gamesPlayed([730], true);
            }, 3000);

            ipcMain.removeAllListeners('forceLogin');
            ipcMain.removeAllListeners('signOut');
          });
          ipcMain.once('signOut', async () => {
            console.log('Sign out');
            user.logOff();
            ipcMain.removeAllListeners('forceLogin');
            ipcMain.removeAllListeners('signOut');
          });
        }
        if (value == 'time') {
          console.log(
            'GC didnt start in time, adding CSGO to the library and retrying.',
          );
          user.requestFreeLicense([730], function (err, packageIds, appIds) {
            if (err) {
              console.log(err);
              ClassLoginResponse.setEmptyPackage();
              ClassLoginResponse.setResponseStatus('playingElsewhere');
              sendLoginReply(event);
            }
            console.log('Granted package: ', packageIds);
            console.log('Granted App: ', appIds);
            startGameCoordinator();
          });
        }
      });
    });

    // Steam guard
    user.once('steamGuard', function (domain, callback, lastCodeWrong) {
      domain;
      callback;
      if (lastCodeWrong) {
        console.log('Last code wrong, try again!');
        cancelLogin(user);

        ClassLoginResponse.setEmptyPackage();
        ClassLoginResponse.setResponseStatus('steamGuardCodeIncorrect');
        sendLoginReply(event);
      } else {
        cancelLogin(user);
        ClassLoginResponse.setEmptyPackage();
        ClassLoginResponse.setResponseStatus('steamGuardError');
        sendLoginReply(event);
      }
    });

    // Login

    // Start the game coordinator for CSGO
    async function startGameCoordinator() {
      // user.setPersona(SteamUser.EPersonaState.Online);

      setTimeout(() => {
        // user.setPersona(SteamUser.EPersonaState.Online);
        user.gamesPlayed([730], true);
      }, 3000);
    }
  }
);

ipcMain.on(
  'login',
  async (
    event,
    username,
    password = null,
    shouldRemember,
    steamGuard = null,
    secretKey = null,
    clientjstoken = null
  ) => {
    const user = new SteamUser();
    const csgo = new GlobalOffensive(user);
    emitterAccount.emit(
      'login',
      event,
      user,
      csgo,
      username,
      shouldRemember,
      secretKey
    );
    const loginClass = new login();
    loginClass
      .mainLogin(
        user,
        username,
        shouldRemember,
        password,
        steamGuard,
        secretKey,
        clientjstoken
      )
      .then((returnValue: any) => {
        console.log(returnValue);
        event.reply('login-reply', returnValue);
      });
  }
);

emitterAccount.on('qrLogin:show', async (qrChallengeLogin) => {
  mainWindow?.webContents.send('qrLogin:show', qrChallengeLogin);
});
emitterAccount.on('qrLogin:scanned', () => {
  mainWindow?.webContents.send('qrLogin:scanned');
});
ipcMain.on('startQRLogin', async (event, shouldRemember) => {
  const user = new SteamUser();
  const csgo = new GlobalOffensive(user);
  const loginClass = new login();
  emitterAccount.emit('qrLogin:cancel')
  flowLoginRegularQR(shouldRemember).then((returnValue) => {
    if (!returnValue.session) {
      ClassLoginResponse.setEmptyPackage();
      ClassLoginResponse.setResponseStatus('defaultError');
      event.reply('login-reply', ClassLoginResponse.returnValue);
      return;
    }

    emitterAccount.emit(
      'login',
      event,
      user,
      csgo,
      returnValue.session.accountName,
      shouldRemember
    );
    loginClass
      .mainLogin(
        user,
        returnValue.session.accountName,
        shouldRemember,
        null,
        null,
        null,
        null,
        returnValue.session.refreshToken
      )
      .then((returnValue: any) => {
        event.reply('login-reply', returnValue);
      });
  });
});

ipcMain.on('qrLogin:cancel', async () => {
  emitterAccount.emit('qrLogin:cancel');
});

async function cancelLogin(user: {
  removeAllListeners: (arg0: string) => void;
}) {
  console.log('Cancel login');
  user.removeAllListeners('loggedOn');
  user.removeAllListeners('steamGuard');
  user.removeAllListeners('error');
}

function sendUpdaterStatusToWindow(text: string) {
  log.info(text);
  mainWindow?.webContents.send('updater', [text]);
}

// Adds events listeners the user
// Forward Steam notifications to renderer
async function startEvents(csgo, user) {

  // Capture web session cookies for market listing
  user.on('webSession', (sessionID: string, cookies: string[]) => {
    steamWebSessionID = sessionID;
    steamWebCookieStr = cookies.join('; ');
    refreshMarketListings();
  });
  // webLogOn() must be called explicitly — steam-user does not negotiate
  // a web session automatically, so without this, 'webSession' never fires
  // and steamWebCookieStr/steamWebSessionID stay empty forever.
  user.webLogOn();

  // Pricing
  const pricing = new runItems(user);
  pricingEmitter.on('result', (message) => {
    mainWindow?.webContents.send('pricing', [message]);
  });
  ipcMain.on('getPrice', async (_event, info) => {
    await pricing.handleItem(info);
  });

  // Trade up handlers
  ipcMain.on('getTradeUpPossible', async (event, itemsToGet) => {
    tradeUpClass.getPotentitalOutcome(itemsToGet).then((returnValue) => {
      pricing.handleTradeUp(returnValue);
      event.reply('getTradeUpPossible-reply', returnValue);
    });
  });
  ipcMain.on('processTradeOrder', async (_event, idsToProcess, rarityToUse) => {
    const rarObject = {
      0: '00000A00',
      1: '01000A00',
      2: '02000A00',
      3: '03000A00',
      4: '04000A00',
      10: '0a000a00',
      11: '0b000a00',
      12: '0c000a00',
      13: '0d000a00',
      14: '0e000a00',
    };
    const idsToUse = [] as any;
    idsToProcess.forEach((element: string) => {
      idsToUse.push(parseInt(element));
    });
    const tradeupPayLoad = new ByteBuffer(
      1 + 2 + idsToUse.length * 8,
      ByteBuffer.LITTLE_ENDIAN
    );
    tradeupPayLoad.append(rarObject[rarityToUse], 'hex');
    for (const id of idsToUse) {
      tradeupPayLoad.writeUint64(id);
    }
    await csgo._send(Language.Craft, null, tradeupPayLoad);
  });

  // Open container
  ipcMain.on('openContainer', async (_event, itemsToOpen) => {
    const containerPayload = new ByteBuffer(16, ByteBuffer.LITTLE_ENDIAN);
    containerPayload.append('0000000000000000', 'hex');
    for (const id of itemsToOpen) {
      containerPayload.writeUint64(parseInt(id));
    }
    await csgo._send(Language.UnlockCrate, null, containerPayload);
  });

  // CSGO listeners
  // Inventory events
  async function startChangeEvents() {
    console.log('Start events');
    csgo.on('itemRemoved', (item: { id?: any }) => {
      if (
        !Object.keys(item).includes('casket_id') &&
        !Object.keys(item).includes('casket_contained_item_count')
      ) {
        console.log('Item ' + item.id + ' was removed');
        convertInventoryTagged(csgo.inventory).then((returnValue) => {
          tradeUpClass.getTradeUp(returnValue).then((newReturnValue: any) => {
            mainWindow?.webContents.send('userEvents', [
              1,
              'itemRemoved',
              [item, newReturnValue],
            ]);
          });
        });
      }
    });

    csgo.on('itemChanged', (item) => {
      convertInventoryTagged(csgo.inventory).then((returnValue) => {
        tradeUpClass.getTradeUp(returnValue).then((newReturnValue: any) => {
          mainWindow?.webContents.send('userEvents', [
            1,
            'itemChanged',
            [item, newReturnValue],
          ]);
        });
      });
    });

    csgo.on('itemAcquired', (item: { id?: any }) => {
      if (
        !Object.keys(item).includes('casket_id') &&
        !Object.keys(item).includes('casket_contained_item_count')
      ) {
        console.log('Item ' + item.id + ' was acquired');
        removeInventoryListeners();
        setTimeout(function () {
          console.log('ran');
          startChangeEvents();
          convertInventoryTagged(csgo.inventory)
            .then((returnValue) => {
              tradeUpClass.getTradeUp(returnValue).then((newReturnValue) => {
                mainWindow?.webContents.send('userEvents', [
                  1,
                  'itemAcquired',
                  [{}, newReturnValue],
                ]);
              });
            });
        }, 1000);

        convertInventoryTagged(csgo.inventory).then((returnValue) => {
          tradeUpClass.getTradeUp(returnValue).then((newReturnValue: any) => {
            mainWindow?.webContents.send('userEvents', [
              1,
              'itemAcquired',
              [item, newReturnValue],
            ]);
          });
        });
      }
    });
  }
  startChangeEvents();

  csgo.on('disconnectedFromGC', (reason) => {
    console.log('Disconnected from GC - reason: ', reason);
    mainWindow?.webContents.send('userEvents', [
      3,
      'disconnectedFromGC',
      [reason],
    ]);
  });

  csgo.on('connectedToGC', () => {
    console.log('Connected to GC!');
    if (csgo.haveGCSession) {
      mainWindow?.webContents.send('userEvents', [3, 'connectedToGC']);
    }
  });

  // User listeners
  // Steam Connection
  user.on('error', (result: any, msg: any) => {
    console.log('main', result, msg);
    mainWindow?.webContents.send('userEvents', [2, 'fatalError']);
    clearForNewSession();
  });
  user.on('disconnected', (result: any, msg: any) => {
    console.log(result, msg);
    mainWindow?.webContents.send('userEvents', [2, 'disconnected']);
  });
  user.on('loggedOn', () => {
    mainWindow?.webContents.send('userEvents', [2, 'reconnected']);
  });
  user.on('wallet', (hasWallet: any, currency: any, balance: any) => {
    const walletToSend = { hasWallet, currency, balance };
    walletToSend.currency = currencyCodes?.[walletToSend?.currency];
    console.log('Wallet update: ', balance);
    mainWindow?.webContents.send('userEvents', [4, walletToSend]);
  });

  // Get commands from Renderer
  async function removeInventoryListeners() {
    console.log('Removed inventory listeners');
    csgo.removeAllListeners('itemRemoved');
    csgo.removeAllListeners('itemChanged');
    csgo.removeAllListeners('itemAcquired');
  }
  ipcMain.on('refreshInventory', async () => {
    await removeInventoryListeners();
    await startChangeEvents();
    await refreshMarketListings();

    convertInventoryTagged(csgo.inventory).then((returnValue) => {
      tradeUpClass.getTradeUp(returnValue).then((newReturnValue) => {
        mainWindow?.webContents.send('userEvents', [
          1,
          'itemAcquired',
          [{}, newReturnValue],
        ]);
      });
    });
  });
  // Retry connection
  ipcMain.on('retryConnection', async () => {
    user.gamesPlayed([]);
    user.gamesPlayed([730]);
    console.log('Retrying');
  });
  // Rename Storage units
  ipcMain.on('renameStorageUnit', async (event, itemID, newName) => {
    csgo.nameItem(0, itemID, newName);
    csgo.once(
      'itemCustomizationNotification',
      (itemIds: any[], notificationType: any) => {
        if (
          notificationType ==
          GlobalOffensive.ItemCustomizationNotification.NameItem
        ) {
          event.reply('renameStorageUnit-reply', [1, itemIds[0]]);
        }
      },
    );
  });

  // Set item positions
  ipcMain.on('setItemsPositions', async (_event, dictOfItems) => {
    await csgo._send(
      Language.SetItemPositions,
      Protos.CMsgSetItemPositions,
      dictOfItems
    );
  });

  // Set item positions
  ipcMain.on(
    'setItemEquipped',
    async (_event, item_id, itemClass) => {

      await csgo._send(
        Language.k_EMsgGCAdjustItemEquippedState,
        Protos.CMsgAdjustItemEquippedState,
        {
          item_id: item_id,
          new_class: itemClass,
          new_slot: 0,
          swap: 0,
        }
      );
    }
  );

  // Remove items from storage unit
  ipcMain.on(
    'removeFromStorageUnit',
    async (event, casketID, itemID, fastMode) => {
      await removeInventoryListeners();
      csgo.removeFromCasket(casketID, itemID);

      if (fastMode == false) {
        csgo.once(
          'itemCustomizationNotification',
          (itemIds: string | any[], notificationType: any) => {
            if (
              notificationType ==
              GlobalOffensive.ItemCustomizationNotification.CasketRemoved
            ) {
              console.log(itemIds + ' got an item removed from it');
              event.reply('removeFromStorageUnit-reply', [1, itemIds[0]]);
            }
          },
        );
      }
    }
  );

  // Move to Storage Unit
  ipcMain.on('moveToStorageUnit', async (event, casketID, itemID, fastMode) => {
    csgo.addToCasket(casketID, itemID);
    //if (fastMode) {

    removeInventoryListeners();

    // }

    if (fastMode == false) {
      csgo.once(
        'itemCustomizationNotification',
        (itemIds, notificationType) => {
          if (
            notificationType ==
            GlobalOffensive.ItemCustomizationNotification.CasketAdded
          ) {
            console.log(itemIds[0] + ' got an item added to it');
            event.reply('moveToStorageUnit-reply', [1, itemIds[0]]);
          }
        }
      );
    }
  });

  // Get storage unit contents
  ipcMain.on('getCasketContents', async (event, casketID, _casketName) => {
    await csgo.getCasketContents(
      casketID,
      async function (_err: any, items: any) {
        if (!items || typeof items !== 'object') {
          event.reply('getCasketContent-reply', [0]);
          return;
        }
        fetchItemClass.convertStorageData(items).then((returnValue) => {
          tradeUpClass.getTradeUp(returnValue).then((newReturnValue: any) => {
            event.reply('getCasketContent-reply', [1, newReturnValue]);
            console.log('Casket contains: ', newReturnValue.length);
          });
        });
      },
    );
  });
  // Get commands from Renderer
  ipcMain.on('signOut', async () => {
    await clearForNewSession();
  });

  async function clearForNewSession() {
    console.log('Signout');
    // Remove for CSGO
    await removeInventoryListeners();
    csgo.removeAllListeners('connectedToGC');
    csgo.removeAllListeners('disconnectedFromGC');

    user.logOff();
    pricingEmitter.removeAllListeners('result');
    // Remove for user
    user.removeAllListeners('error');
    user.removeAllListeners('disconnected');
    user.removeAllListeners('loggedOn');

    // IPC
    ipcMain.removeAllListeners('renameStorageUnit');
    ipcMain.removeAllListeners('removeFromStorageUnit');
    ipcMain.removeAllListeners('moveToStorageUnit');
    ipcMain.removeAllListeners('getCasketContents');
    ipcMain.removeAllListeners('signOut');
    ipcMain.removeAllListeners('forceLogin');
  }
}

// Get currency
ipcMain.on('getCurrency', async (event) => {
  getValue('pricing.currency').then((returnValue) => {
    currencyClass.getRate(returnValue).then((response) => {
      const returnObject: CurrencyReturnValue = {
        currency: returnValue,
        rate: response as number,
      };
      event.reply('getCurrency-reply', returnObject);
    }).catch((err) => {
      console.log('getCurrency rate error:', err);
      event.reply('getCurrency-reply', { currency: returnValue || 'USD', rate: 1 });
    });
  }).catch((err) => {
    console.log('getCurrency getValue error:', err);
    event.reply('getCurrency-reply', { currency: 'USD', rate: 1 });
  });
});

// Set initial settings
async function settingsSetup() {
  getValue('devmode').then((returnValue) => {
    if (returnValue == undefined) {
      setValue('devmode', false);
    }
  });
  getValue('fastmove').then((returnValue) => {
    if (returnValue == undefined) {
      console.log('fastmove', returnValue);
      setValue('fastmove', false);
    }
  });
}
settingsSetup();

// Set platform
setValue('os', process.platform);

// Kinda store
ipcMain.on('electron-store-getAccountDetails', async (event) => {
  const accountDetails = await getValue('account');
  event.returnValue = event.reply('electron-store-getAccountDetails-reply', accountDetails);
});

ipcMain.on('electron-store-deleteAccountDetails', async (_event, username) => {
  deleteUserData(username);
});

ipcMain.on(
  'electron-store-setAccountPosition',
  async (_event, username, position) => {
    setAccountPosition(username, position);
  }
);

// Store IPC
ipcMain.on('electron-store-get', async (event, val, key) => {
  if (val == 'locale') {
    event.reply('electron-store-get-reply' + key, currentLocale);
    return;
  }
  getValue(val).then((returnValue) => {
    event.reply('electron-store-get-reply' + key, returnValue);
  });
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  event;
  setValue(key, val);
});

// Multisell: list items on Steam Community Market
async function sellSingleItem(item: {assetid: string; price_in_cents: number}): Promise<{assetid: string; success: boolean; error?: string}> {
  const axios = (await import('axios')).default;

  if (!steamWebCookieStr || !steamWebSessionID) {
    return { assetid: item.assetid, success: false, error: 'No web session. Please re-login.' };
  }

  try {
    const params = new URLSearchParams({
      sessionid: steamWebSessionID,
      appid: '730',
      contextid: '2',
      assetid: item.assetid,
      amount: '1',
      price: item.price_in_cents.toString(),
    });
    const resp = await axios.post(
      'https://steamcommunity.com/market/sellitem/',
      params.toString(),
      {
        headers: {
          'Cookie': steamWebCookieStr,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://steamcommunity.com/id/me/inventory/',
        },
      }
    );
    const data = resp.data as any;
    return { assetid: item.assetid, success: !!data.success };
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Unknown error';
    return { assetid: item.assetid, success: false, error: msg };
  }
}

let sellCancelled = false;
ipcMain.on('cancelSell', () => {
  sellCancelled = true;
});

ipcMain.handle('sellItems', async (_event, items: {assetid: string; price_in_cents: number}[]) => {
  sellCancelled = false;
  const results: {assetid: string; success: boolean; error?: string}[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i++) {
    if (sellCancelled) break;
    const result = await sellSingleItem(items[i]);
    results.push(result);
    const failed = results.filter(r => !r.success).length;
    mainWindow?.webContents.send('sellProgress', { done: i + 1, total, failed });
    // Avoid rate limiting
    if (i < items.length - 1 && !sellCancelled) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  if (results.some(r => r.success)) {
    await refreshMarketListings();
  }
  return results;
});
