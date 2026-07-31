import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { Worker } from 'worker_threads';
import axios from 'axios';
import csgoEnglishBackup from './itemsBackupFiles/csgo_english.json';
import itemsGameBackup from './itemsBackupFiles/items_game.json';

const itemsLink =
  'https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/scripts/items/items_game.txt';
const translationsLink =
  'https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/resource/csgo_english.txt';

function getCacheDir() {
  return app.getPath('userData');
}

async function readCache(filename) {
  try {
    const filePath = path.join(getCacheDir(), filename);
    if (fs.existsSync(filePath)) {
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.log('Cache read failed:', filename, err.message);
  }
  return null;
}

async function writeCache(filename, data) {
  try {
    const filePath = path.join(getCacheDir(), filename);
    await fs.promises.writeFile(filePath, JSON.stringify(data), 'utf-8');
  } catch (err) {
    console.log('Cache write failed:', filename, err.message);
  }
}

// Run VDF parse in a worker thread to avoid blocking the main process.
// Parse logic is inlined to avoid module-resolution issues in packaged apps.
function parseVDFInWorker(data) {
  return new Promise((resolve, reject) => {
    const workerCode = `
      const { workerData, parentPort } = require('worker_threads');
      function parseVDF(text) {
        if (typeof text !== 'string') throw new TypeError('VDF: expected string');
        const lines = text.split('\\n');
        const object = {};
        const stack = [object];
        let expect = false;
        const regex = /^("((?:\\\\.|[^\\\\"])+)"|([a-z0-9\\-\\_]+))([ \\t]*("((?:\\\\.|[^\\\\"])*)(")? ?|([a-z0-9\\-\\_]+)))?/;
        let i = 0; let comment = false;
        for (; i < lines.length; i++) {
          let line = lines[i].trim();
          if (line.startsWith('/*') && line.endsWith('*/')) continue;
          if (line.startsWith('/*')) { comment = true; continue; }
          if (line.endsWith('*/')) { comment = false; continue; }
          if (comment || line === '' || line[0] === '/') continue;
          if (line[0] === '{') { expect = false; continue; }
          if (expect) throw new SyntaxError('VDF: invalid syntax line ' + (i + 1));
          if (line[0] === '}') { stack.pop(); continue; }
          while (true) {
            const m = regex.exec(line);
            if (!m) throw new SyntaxError('VDF: invalid syntax line ' + (i + 1));
            const key = m[2] !== undefined ? m[2] : m[3];
            let val = m[6] !== undefined ? m[6] : m[8];
            if (val === undefined) {
              if (stack[stack.length - 1][key] === undefined) stack[stack.length - 1][key] = {};
              stack.push(stack[stack.length - 1][key]);
              expect = true;
            } else {
              if (m[7] === undefined && m[8] === undefined) { line += '\\n' + lines[++i]; continue; }
              if (val !== '' && !isNaN(val)) val = +val;
              if (val === 'true') val = true;
              if (val === 'false') val = false;
              if (val === 'null') val = null;
              stack[stack.length - 1][key] = val;
            }
            break;
          }
        }
        if (stack.length !== 1) throw new SyntaxError('VDF: unclosed block');
        return object;
      }
      try {
        parentPort.postMessage({ ok: true, result: parseVDF(workerData.data) });
      } catch (e) {
        parentPort.postMessage({ ok: false, error: e.message });
      }
    `;
    const worker = new Worker(workerCode, { eval: true, workerData: { data } });
    worker.on('message', (msg) => {
      worker.terminate();
      if (msg.ok) resolve(msg.result);
      else reject(new Error(msg.error));
    });
    worker.on('error', (err) => {
      worker.terminate();
      reject(err);
    });
  });
}

// Parse translation text without blocking the event loop
async function parseTranslationsAsync(data) {
  const finalDict = {};
  const ks = data.split(/\n/);
  for (let i = 0; i < ks.length; i++) {
    const value = ks[i];
    const test = value.match(/"(.*?)"/g);
    if (test && test[1]) {
      finalDict[test[0].replaceAll('"', '').toLowerCase()] = test[1];
    }
    if (i % 5000 === 0 && i > 0) {
      await new Promise((r) => setImmediate(r));
    }
  }
  return finalDict;
}

function fileCatcher(endNote) {
  return `${csgo_install_directory}${endNote}`;
}

function fileGetError(items) {
  // Use embedded backup synchronously — no disk I/O at startup
  items.setTranslations(csgoEnglishBackup, 'backup');
  items.setCSGOItems(itemsGameBackup);
}

async function getTranslations(items) {
  try {
    const response = await axios.get(translationsLink);
    const finalDict = await parseTranslationsAsync(response.data);
    finalDict['stickerkit_cs20_boost_holo']; // validate
    await writeCache('csgo_english_cache.json', finalDict);
    items.setTranslations(finalDict, 'normal');
  } catch (err) {
    console.log('Error occurred during translation parsing');
    const cached = await readCache('csgo_english_cache.json');
    if (cached) {
      items.setTranslations(cached, 'cache');
    } else {
      items.setTranslations(csgoEnglishBackup, 'backup');
    }
  }
}

function updateItemsLoop(jsonData, keyToRun) {
  const returnDict = {};
  for (const [key, value] of Object.entries(jsonData['items_game'])) {
    if (key == keyToRun) {
      for (const [subKey, subValue] of Object.entries(value)) {
        returnDict[subKey] = subValue;
      }
    }
  }
  return returnDict;
}

async function updateItems(items) {
  try {
    const response = await axios.get(itemsLink, { timeout: 60000 });
    const data = response.data;
    let jsonData;
    try {
      jsonData = await parseVDFInWorker(data);
    } catch (vdfErr) {
      console.log('VDF parse failed:', vdfErr.message);
      throw vdfErr;
    }
    const dict_to_write = {
      items: {},
      paint_kits: {},
      prefabs: {},
      sticker_kits: {},
      music_kits: {},
      graffiti_tints: {},
      casket_icons: {},
      keychain_definitions: {},
      highlight_reels: {},
    };
    dict_to_write['items'] = updateItemsLoop(jsonData, 'items');
    dict_to_write['paint_kits'] = updateItemsLoop(jsonData, 'paint_kits');
    dict_to_write['prefabs'] = updateItemsLoop(jsonData, 'prefabs');
    dict_to_write['sticker_kits'] = updateItemsLoop(jsonData, 'sticker_kits');
    dict_to_write['music_kits'] = updateItemsLoop(jsonData, 'music_definitions');
    dict_to_write['graffiti_tints'] = updateItemsLoop(jsonData, 'graffiti_tints');
    dict_to_write['casket_icons'] = updateItemsLoop(jsonData, 'alternate_icons2')?.['casket_icons'];
    dict_to_write['keychain_definitions'] = updateItemsLoop(jsonData, 'keychain_definitions');
    // "highlight_reels" maps a numeric ID (referenced by the "keychain slot
    // 0 highlight" attribute) to a string identifier (e.g.
    // "cologne2026_st1ultimatenukejumpkill"), which must then be matched
    // against a keychain_definitions entry's own "highlight_reel" field to
    // find the specific highlight-clip's loc_name.
    dict_to_write['highlight_reels'] = updateItemsLoop(jsonData, 'highlight_reels');
    // Validate data
    if (!dict_to_write['items'][1209]) throw new Error('Validation failed: item 1209 not found');
    await writeCache('items_game_cache.json', dict_to_write);
    items.setCSGOItems(dict_to_write);
    console.log('Items loaded from live data');
  } catch (err) {
    console.log('Error occurred during items parsing:', err.message);
    const cached = await readCache('items_game_cache.json');
    if (cached) {
      items.setCSGOItems(cached);
      console.log('Items loaded from cache');
    } else {
      items.setCSGOItems(itemsGameBackup);
      console.log('Items loaded from backup');
    }
  }
}

class items {
  translation = {};
  csgoItems = {};
  constructor() {
    fileGetError(this);
    getTranslations(this);
    updateItems(this);
  }

  setCSGOItems(value) {
    this.csgoItems = value;
  }
  setTranslations(value, commandFrom) {
    console.log(commandFrom);
    this.translation = value;
  }

  handleError(callback, args) {
    try {
      return callback.apply(this, args);
    } catch (err) {
      console.log(err);
      return '';
    }
  }

  async inventoryConverter(inventoryResult, isCasket = false) {
    var returnList = [];
    if (typeof inventoryResult === 'object' && inventoryResult !== null) {
      returnList;
    } else {
      return returnList;
    }

    let _idx = 0;
    for (const [key, value] of Object.entries(inventoryResult)) {
      if (++_idx % 50 === 0) {
        await new Promise((r) => setImmediate(r));
      }

      
      if (value['def_index'] == undefined) {
        continue;
      }
      const freeRewardStatusBytes = getAttributeValueBytes(value, 277);
      if (freeRewardStatusBytes && freeRewardStatusBytes.readUInt32LE(0) === 1) {
        continue;
        
      }
      let musicIndexBytes = getAttributeValueBytes(value, 166);
      if (musicIndexBytes) {
        value.music_index = musicIndexBytes.readUInt32LE(0);
      }
      let graffitiTint = getAttributeValueBytes(value, 233);
      if (graffitiTint) {
        value.graffiti_tint = graffitiTint.readUInt32LE(0);
      }
      // "keychain slot 0 id" — the globaloffensive library doesn't decode
      // this attribute (unlike stickers), so we read it ourselves.
      let keychainIdBytes = getAttributeValueBytes(value, 299);
      if (keychainIdBytes) {
        value.keychain_id = keychainIdBytes.readUInt32LE(0);
      }
      // "keychain slot 0 highlight" — only present on souvenir/event charms
      // tied to a specific highlight-reel play (e.g. "magixx 1v4 Clutch").
      // keychain_id above resolves to the shared collection entry
      // ("Cologne 2026 Highlight"); this attribute points to the specific
      // highlight-reel entry for the third part of the full name.
      let keychainHighlightBytes = getAttributeValueBytes(value, 314);
      if (keychainHighlightBytes) {
        value.keychain_highlight_id = keychainHighlightBytes.readUInt32LE(0);
      }
      if (
        (value['casket_id'] !== undefined && isCasket == false) ||
        ['17293822569110896676', '17293822569102708641'].includes(value['id'])
      ) {
        continue;
      }
      // console.log(value['item_id'])


      const returnDict = {};
      // URL
      let imageURL = this.handleError(this.itemProcessorImageUrl, [value]);

      const iconMatch = getAttributeValueBytes(value, 70)?.readUInt32LE(0);
      if (
        value['def_index'] == 1201 &&
        iconMatch &&
        this.csgoItems['casket_icons']?.[iconMatch]?.icon_path
      ) {
        imageURL = this.csgoItems['casket_icons']?.[iconMatch]?.icon_path;
      }
      // Check names
      returnDict['item_name'] = this.handleError(this.itemProcessorName, [
        value,
        imageURL,
      ]);
      if (returnDict['item_name'] == '') {
        console.log('Error');
        try {
          console.log(value, this.get_def_index(value['def_index']));
        } catch (err) {
          console.log(value);
        }
      }
      returnDict['item_customname'] = value['custom_name'];
      returnDict['item_url'] = imageURL;
      returnDict['item_id'] = value['id'];
      returnDict['position'] = 9999;
      if (value['position'] != null) {
        returnDict['position'] = value['position'];
      }

      // Check tradable after value
      if (value['tradable_after'] !== undefined) {
        const tradable_after_date = new Date(value['tradable_after']);
        const todaysDate = new Date();
        if (
          tradable_after_date >= todaysDate &&
          returnDict['item_name'].includes('Key') == false
        ) {
          returnDict['trade_unlock'] = tradable_after_date;
        }
      }

      if (value['casket_contained_item_count'] !== undefined) {
        returnDict['item_storage_total'] = value['casket_contained_item_count'];
      }

      // Check paint_wear value
      if (value['paint_wear'] !== undefined) {
        returnDict['item_wear_name'] = this.handleError(getSkinWearName, [
          value['paint_wear'],
        ]);
        returnDict['item_paint_wear'] = value['paint_wear'];
      }

      // Trade restrictions (maybe?)
      returnDict['item_origin'] = value['origin'];

      returnDict['item_moveable'] = this.handleError(
        this.itemProcessorCanBeMoved,
        [returnDict, value]
      );

      returnDict['item_has_stickers'] = this.handleError(
        this.itemProcessorHasStickersApplied,
        [returnDict, value]
      );
      let equipped = this.handleError(this.itemProcessorisEquipped, [value]);
      returnDict['equipped_ct'] = equipped[0];
      returnDict['equipped_t'] = equipped[1];
      returnDict['def_index'] = value['def_index'];

      if (returnDict['item_has_stickers']) {
        const stickerList = [];
        for (const [stickersKey, stickersValue] of Object.entries(
          value['stickers'] || {}
        )) {
          stickerList.push(
            this.handleError(this.stickersProcessData, [stickersValue])
          );
        }
        if (value['keychain_id'] !== undefined) {
          const charmEntry = this.handleError(this.keychainProcessData, [
            value['keychain_id'],
            value['keychain_highlight_id'],
          ]);
          if (charmEntry) {
            stickerList.push(charmEntry);
          }
        }
        returnDict['stickers'] = stickerList;
      } else {
        returnDict['stickers'] = [];
      }

      if (
        value?.quality == 3 ||
        returnDict['item_name'].includes('Souvenir') ||
        !returnDict['item_url'].includes('econ/default_generated')
      ) {
        returnDict['tradeUp'] = false;
      } else {
        returnDict['rarity'] = value.rarity;
        returnDict['rarityName'] = this.handleError(
          this.itemProcessorGetRarityName,
          [value.rarity]
        );
        returnDict['tradeUp'] = true;
      }
      returnDict['stattrak'] = false;
      if (this.isStatTrak(value)) {
        returnDict['stattrak'] = true;
        returnDict['item_name'] = 'StatTrak™ ' + returnDict['item_name'];
      }
      // Star (quality 3 = unusual/knife/glove)
      if (value['quality'] == 3) {
        returnDict['item_name'] = '★ ' + returnDict['item_name'];
        returnDict['item_moveable'] = true;
      }
      // Souvenir quality fallback (quality 12 = souvenir in CS2)
      if (value['quality'] == 12 && !returnDict['item_name'].includes('Souvenir')) {
        returnDict['item_name'] = 'Souvenir ' + returnDict['item_name'];
      }

      // Promotional pin fix
      if (returnDict['item_name']?.includes('Pin') && value['origin'] == 5) {
        returnDict['item_moveable'] = false;
      }

      // Promotional music kit fix
      if (value['music_index'] != undefined && value['origin'] == 0) {
        returnDict['item_moveable'] = false;
      }

      // returnDict['coordinator_data'] = JSON.stringify(value);
      // console.log(value, returnDict)

      returnList.push(returnDict);
    }
    return returnList;
  }

  itemProcessorGetRarityName(rarity) {
    const rarityDict = {
      1: 'Consumer Grade',
      2: 'Industrial Grade',
      3: 'Mil-Spec',
      4: 'Restricted',
      5: 'Classified',
      6: 'Covert',
    };
    return rarityDict[rarity];
  }

  itemProcessorHasStickersApplied(returnDict, storageRow) {
    if (
      returnDict['item_url'].includes('econ/characters') ||
      returnDict['item_url'].includes('econ/default_generated') ||
      returnDict['item_url'].includes('weapons/base_weapons')
    ) {
      if (
        storageRow['stickers'] !== undefined ||
        storageRow['keychain_id'] !== undefined
      ) {
        return true;
      }
    }
    return false;
  }

  itemProcessorisEquipped(storageRow) {
    // 2 = CT
    // 3 = T
    let CT = false;
    let T = false;

    for (const [key, value] of Object.entries(storageRow?.equipped_state)) {
      if (value?.new_class == 2) {
        T = true;
      }
      if (value?.new_class == 3) {
        CT = true;
      }
    }
    return [CT, T];
  }

  isStatTrak(storageRow) {
    if (storageRow['attribute'] !== undefined) {
      for (const [, value] of Object.entries(storageRow['attribute'])) {
        if (value['def_index'] == 80) {
          return true;
        }
      }
    }
    return false;
  }

  itemProcessorName(storageRow, imageURL) {
    const defIndexresult = this.get_def_index(storageRow['def_index']);

    // Check if CSGO Case Key
    if (imageURL == 'econ/tools/weapon_case_key') {
      return 'CS:GO Case Key';
    }

    // Music kit check
    if (storageRow['music_index'] !== undefined) {
      const musicKitIndex = storageRow['music_index'];
      const musicKitResult = this.getMusicKits(musicKitIndex);
      let nameToUse =
        'Music Kit | ' + this.getTranslation(musicKitResult?.['loc_name']);
      return nameToUse;
    }

    // Guard: item not found in items data — derive name from imageURL
    if (!defIndexresult) {
      if (imageURL) {
        const rawName = imageURL.split('/').pop().replaceAll('_', ' ');
        return rawName ? capitalizeWords(rawName) : '';
      }
      return '';
    }

    // Main checks
    // Get first string
    if (defIndexresult['item_name'] !== undefined) {
      var baseOne = this.getTranslation(defIndexresult['item_name']);
    } else if (defIndexresult['prefab'] !== undefined) {
      const prefabResult = this.getPrefab(defIndexresult['prefab']);
      var baseOne = this.getTranslation(prefabResult?.['item_name']);
    }

    // Get second string
    if (
      storageRow['stickers'] !== undefined &&
      imageURL.includes('econ/characters/') == false
    ) {
      var relevantStickerData = storageRow['stickers'][0];
      if (
        relevantStickerData?.['slot'] == 0 &&
        baseOne?.includes('Coin') == false
      ) {
        var stickerDefIndex = this.getStickerDetails(
          relevantStickerData['sticker_id']
        );
        if (stickerDefIndex) {
          var baseTwo = this.getTranslation(stickerDefIndex['item_name']);
        }
      }
    }
    if (storageRow['paint_index'] !== undefined) {
      var skinPatternName = this.getPaintDetails(storageRow['paint_index']);
      var baseTwo = this.getTranslation(skinPatternName?.['description_tag']);
    }

    // Standalone charm item (not attached to a weapon) — resolve its
    // specific name via the "keychain slot 0 id" attribute.
    if (
      storageRow['keychain_id'] !== undefined &&
      defIndexresult['name'] == 'keychain'
    ) {
      var keychainDefIndex = this.getKeychainDetails(
        storageRow['keychain_id']
      );
      if (keychainDefIndex) {
        // Souvenir/event charms (e.g. "Cologne 2026 Highlight") also carry
        // a separate "keychain slot 0 highlight" attribute pointing to the
        // specific highlight-reel entry (e.g. "magixx 1v4 Clutch") for the
        // third part of the full name.
        const keychainHighlightName =
          storageRow['keychain_highlight_id'] !== undefined
            ? this.getKeychainHighlightName(storageRow['keychain_highlight_id'])
            : undefined;
        const keychainNameParts = [
          this.getTranslation(keychainDefIndex['loc_name']),
        ];
        if (keychainHighlightName) {
          keychainNameParts.push(keychainHighlightName);
        }
        var baseTwo = keychainNameParts.join(' | ');
      }
    }

    // Get third string (wear name)
    if (storageRow['paint_wear'] !== undefined) {
      var baseThree = getSkinWearName(storageRow['paint_wear']);
    }

    // Final fallback: use item's internal name field when all lookups returned empty
    if (!baseOne && defIndexresult['name']) {
      var baseOne = capitalizeWords(defIndexresult['name'].replaceAll('_', ' '));
    }

    if (baseOne) {
      var finalName = baseOne;
      if (baseTwo) {
        var finalName = `${baseOne} | ${baseTwo}`;
        if (baseThree) {
          var finalName = `${baseOne} | ${baseTwo}`;
        }
      }
    }

    if (storageRow['attribute'] !== undefined) {
      for (const [, value] of Object.entries(storageRow['attribute'])) {
        if (
          value['def_index'] == 140 &&
          !finalName?.includes('Souvenir')
        ) {
          var finalName = 'Souvenir ' + finalName;
        }
      }
    }

    // Graffiti kit check
    if (storageRow['graffiti_tint'] !== undefined) {
      const graffitiKitIndex = storageRow['graffiti_tint'];
      if (graffitiKitIndex != 0) {
        const graffitiKitRaw = this.getGraffitiKitName(graffitiKitIndex);
        if (graffitiKitRaw && graffitiKitRaw.toLowerCase() !== 'unknown') {
          const graffitiKitResult = capitalizeWords(
            graffitiKitRaw.replaceAll('_', ' ')
          );
          var finalName = finalName + ' (' + graffitiKitResult + ')';
          var finalName = finalName.replace('Swat', 'SWAT');
        }
      }
    }

    return finalName || '';
  }

  itemProcessorImageUrl(storageRow) {
    const defIndexresult = this.get_def_index(storageRow['def_index']);

    // Music kit check
    if (storageRow['music_index'] !== undefined) {
      const musicKitIndex = storageRow['music_index'];
      const localMusicKits = this.getMusicKits(musicKitIndex);
      return localMusicKits?.['image_inventory'] || '';
    }

    if (!defIndexresult) {
      return '';
    }

    // Rest of check

    // Check if it should use the full image_inventory
    if (defIndexresult['image_inventory'] !== undefined) {
      var imageInventory = defIndexresult['image_inventory'];
    }

    // Get second string
    if (storageRow['stickers'] !== undefined && imageInventory == undefined) {
      var relevantStickerData = storageRow['stickers'][0];
      if (relevantStickerData?.['slot'] == 0) {
        var stickerDefIndex = this.getStickerDetails(
          relevantStickerData['sticker_id']
        );
        if (stickerDefIndex?.['patch_material'] !== undefined) {
          var imageInventory = `econ/patches/${stickerDefIndex['patch_material']}`;
        } else if (stickerDefIndex?.['sticker_material'] !== undefined) {
          var imageInventory = `econ/stickers/${stickerDefIndex['sticker_material']}`;
        }
      }
    }
    // Standalone charm item (not attached to a weapon) — resolve its
    // specific image via the "keychain slot 0 id" attribute.
    if (
      storageRow['keychain_id'] !== undefined &&
      imageInventory == undefined &&
      defIndexresult['name'] == 'keychain'
    ) {
      const keychainDefIndex = this.getKeychainDetails(
        storageRow['keychain_id']
      );
      if (keychainDefIndex?.['image_inventory'] !== undefined) {
        var imageInventory = keychainDefIndex['image_inventory'];
      }
    }
    // Weapons and knifes
    if (storageRow['paint_index'] !== undefined) {
      var skinPatternName = this.getPaintDetails(storageRow['paint_index']);
      var imageInventory = `econ/default_generated/${defIndexresult['name']}_${skinPatternName?.['name']}_light_large`;
    } else if (defIndexresult['baseitem'] == 1) {
      var imageInventory = `econ/weapons/base_weapons/${defIndexresult['name']}`;
    }

    return imageInventory || '';
  }
  itemProcessorCanBeMoved(returnDict, storageRow) {
    const defIndexresult = this.get_def_index(storageRow['def_index']);

    // Unknown item — assume tradeable
    if (!defIndexresult) {
      return true;
    }

    if (defIndexresult['prefab'] !== undefined) {
      if (defIndexresult['prefab'] == 'collectible_untradable') {
        return false;
      }
    }
    if (defIndexresult['item_name'] !== undefined) {
      if (
        returnDict['item_url'].includes('econ/status_icons/') &&
        returnDict['item_origin'] == 0
      ) {
        return false;
      }
      if (returnDict['item_url'].includes('econ/status_icons/service_medal_')) {
        return false;
      }

      if (storageRow['def_index'] == 987) {
        return false;
      }

      if (returnDict['item_url'].includes('plusstars')) {
        return false;
      }
    }

    // If characters
    if (defIndexresult['attributes'] !== undefined) {
      for (const [key, value] of Object.entries(defIndexresult['attributes'])) {
        if (key == 'cannot trade' && value == 1) {
          return false;
        }
      }
    }
    if (
      returnDict['item_url'].includes('crate_key') &&
      storageRow['flags'] == 10
    ) {
      return false;
    }
    if (returnDict['item_url'].includes('weapons/base_weapons')) {
      return false;
    }
    return true;
  }
  stickersProcessData(relevantStickerData) {
    // Get second string
    var stickerDefIndex = this.getStickerDetails(
      relevantStickerData['sticker_id']
    );
    if (stickerDefIndex['patch_material'] !== undefined) {
      var imageInventory = `econ/patches/${stickerDefIndex['patch_material']}`;
      var stickerType = 'Patch';
    } else if (stickerDefIndex['sticker_material'] !== undefined) {
      var imageInventory = `econ/stickers/${stickerDefIndex['sticker_material']}`;
      var stickerType = 'Sticker';
    }
    const stickerDict = {
      sticker_name: this.getTranslation(stickerDefIndex['item_name']),
      sticker_url: imageInventory,
      sticker_type: stickerType,
    };
    return stickerDict;
  }
  keychainProcessData(keychainID, highlightID) {
    const keychainDefIndex = this.getKeychainDetails(keychainID);
    if (!keychainDefIndex) {
      return null;
    }
    // Souvenir/event charms (e.g. "Cologne 2026 Highlight") also carry a
    // separate "keychain slot 0 highlight" attribute pointing to the
    // specific highlight-reel entry (e.g. "magixx 1v4 Clutch") for the
    // third part of the full name.
    const highlightName =
      highlightID !== undefined
        ? this.getKeychainHighlightName(highlightID)
        : undefined;
    const nameParts = [this.getTranslation(keychainDefIndex['loc_name'])];
    if (highlightName) {
      nameParts.push(highlightName);
    }
    const stickerDict = {
      sticker_name: nameParts.join(' | '),
      sticker_url: keychainDefIndex['image_inventory'],
      sticker_type: 'Charm',
    };
    return stickerDict;
  }

  get_def_index(def_index) {
    return this.csgoItems['items'][def_index];
  }

  getTranslation(csgoString) {
    if (!csgoString) return '';
    let stringFormatted = csgoString.replace('#', '').toLowerCase();
    const translated = (this.translation[stringFormatted] || '').replaceAll('"', '');
    if (translated) return translated;
    // Fallback: format the raw key as a readable name for items missing from translation file
    return csgoString.replace('#', '').replaceAll('_', ' ');
  }
  getPrefab(prefab) {
    return this.csgoItems['prefabs'][prefab.toString()];
  }

  getPaintDetails(paintIndex) {
    return this.csgoItems['paint_kits'][paintIndex];
  }

  getMusicKits(musicIndex) {
    return this.csgoItems['music_kits'][musicIndex];
  }

  getGraffitiKitName(graffitiID) {
    if (!this.csgoItems['graffiti_tints']) return 'unknown';
    for (const [key, value] of Object.entries(
      this.csgoItems['graffiti_tints']
    )) {
      if (value.id == graffitiID) {
        return key;
      }
    }
    return 'unknown';
  }

  getStickerDetails(stickerID) {
    return this.csgoItems['sticker_kits'][stickerID];
  }

  getKeychainDetails(keychainID) {
    return this.csgoItems['keychain_definitions']?.[keychainID];
  }

  // Resolves a "keychain slot 0 highlight" attribute value (a highlight_reels
  // ID) to its specific play name (e.g. "1v2 Clutch", "910 Ace"). The
  // translation file has a direct "highlightreel_<id>" entry for every
  // highlight reel across all tournaments (not just ones with a dedicated
  // keychain_definitions child entry, e.g. Cologne 2026) so this works
  // uniformly instead of cross-referencing keychain_definitions.
  getKeychainHighlightName(highlightReelID) {
    const highlightReel = this.csgoItems['highlight_reels']?.[highlightReelID];
    if (!highlightReel?.['id']) return undefined;
    return this.getTranslation('highlightreel_' + highlightReel['id']) || undefined;
  }

  checkIfAttributeIsThere(item, attribDefIndex) {
    let attrib = (item.attribute || []).find(
      (attrib) => attrib.def_index == attribDefIndex
    );
    return attrib ? true : false;
  }
}

function getSkinWearName(paintWear) {
  const skinWearValues = [0.07, 0.15, 0.38, 0.45, 1];
  const skinWearNames = [
    'Factory New',
    'Minimal Wear',
    'Field-Tested',
    'Well-Worn',
    'Battle-Scarred',
  ];

  for (const [key, value] of Object.entries(skinWearValues)) {
    if (paintWear > value) {
      continue;
    }
    return skinWearNames[key];
  }
}

function getAttributeValueBytes(item, attribDefIndex) {
  let attrib = (item.attribute || []).find(
    (attrib) => attrib.def_index == attribDefIndex
  );
  return attrib ? attrib.value_bytes : null;
}

function capitalizeWords(string) {
  return string.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
}
export default items;
