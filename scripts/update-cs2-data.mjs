#!/usr/bin/env node
/**
 * Update CS2 item backup JSON files from SteamTracking/GameTracking-CS2.
 * Replicates the transformation logic in src/main/helpers/classes/steam/items/index.js.
 *
 * Usage: node scripts/update-cs2-data.mjs
 * Exit code 0 = success (files may or may not have changed)
 * Exit code 1 = fetch/parse/validation error
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(
  __dirname,
  '../src/main/helpers/classes/steam/items/itemsBackupFiles'
);

const itemsLink =
  'https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/scripts/items/items_game.txt';
const translationsLink =
  'https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/resource/csgo_english.txt';

// VDF parser — identical logic to the worker in index.js
function parseVDF(text) {
  if (typeof text !== 'string') throw new TypeError('VDF: expected string');
  const lines = text.split('\n');
  const object = {};
  const stack = [object];
  let expect = false;
  const regex =
    /^("((?:\\.|[^\\"])+)"|([a-z0-9\-\_]+))([ \t]*("((?:\\.|[^\\"])*)(")? ?|([a-z0-9\-\_]+)))?/;
  let i = 0;
  let comment = false;
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
        if (stack[stack.length - 1][key] === undefined)
          stack[stack.length - 1][key] = {};
        stack.push(stack[stack.length - 1][key]);
        expect = true;
      } else {
        if (m[7] === undefined && m[8] === undefined) {
          line += '\n' + lines[++i];
          continue;
        }
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

function updateItemsLoop(jsonData, keyToRun) {
  const returnDict = {};
  for (const [key, value] of Object.entries(jsonData['items_game'])) {
    if (key === keyToRun) {
      for (const [subKey, subValue] of Object.entries(value)) {
        returnDict[subKey] = subValue;
      }
    }
  }
  return returnDict;
}

function parseTranslations(data) {
  const finalDict = {};
  const lines = data.split(/\n/);
  for (const line of lines) {
    const matches = line.match(/"(.*?)"/g);
    if (matches && matches[1]) {
      finalDict[matches[0].replaceAll('"', '').toLowerCase()] = matches[1];
    }
  }
  return finalDict;
}

async function fetchText(url) {
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function updateItemsGame() {
  const raw = await fetchText(itemsLink);
  console.log('Parsing items_game VDF...');
  const jsonData = parseVDF(raw);

  const dict = {
    items: updateItemsLoop(jsonData, 'items'),
    paint_kits: updateItemsLoop(jsonData, 'paint_kits'),
    prefabs: updateItemsLoop(jsonData, 'prefabs'),
    sticker_kits: updateItemsLoop(jsonData, 'sticker_kits'),
    music_kits: updateItemsLoop(jsonData, 'music_definitions'),
    graffiti_tints: updateItemsLoop(jsonData, 'graffiti_tints'),
    casket_icons: updateItemsLoop(jsonData, 'alternate_icons2')?.['casket_icons'],
  };

  if (!dict.items[1209]) throw new Error('Validation failed: item 1209 not found');

  const outPath = path.join(BACKUP_DIR, 'items_game.json');
  const newContent = JSON.stringify(dict, null, 2) + '\n';
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : null;

  if (existing === newContent) {
    console.log('items_game.json: no changes');
    return false;
  }

  fs.writeFileSync(outPath, newContent, 'utf-8');
  console.log('items_game.json: updated');
  return true;
}

async function updateCsgoEnglish() {
  const raw = await fetchText(translationsLink);
  console.log('Parsing csgo_english translations...');
  const dict = parseTranslations(raw);

  if (!dict['stickerkit_cs20_boost_holo']) {
    throw new Error('Validation failed: stickerkit_cs20_boost_holo not found in translations');
  }

  const outPath = path.join(BACKUP_DIR, 'csgo_english.json');
  const newContent = JSON.stringify(dict, null, 2) + '\n';
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : null;

  if (existing === newContent) {
    console.log('csgo_english.json: no changes');
    return false;
  }

  fs.writeFileSync(outPath, newContent, 'utf-8');
  console.log('csgo_english.json: updated');
  return true;
}

async function main() {
  try {
    const [itemsChanged, translationsChanged] = await Promise.all([
      updateItemsGame(),
      updateCsgoEnglish(),
    ]);

    if (itemsChanged || translationsChanged) {
      console.log('Done — files updated.');
      // Signal to the CI workflow that files changed
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=true\n');
      }
    } else {
      console.log('Done — no changes.');
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, 'changed=false\n');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
