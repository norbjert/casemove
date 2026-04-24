Forked from https://github.com/nombersDev/casemove, before the change to the more restrictive CC license.
This fork will continue to be developed under the proper GPLv3 Open-Source License.



# CASEMOVE

*Casemove is an open-source desktop application that helps you easily move items in and out of Storage Units in Counter-Strike 2. The app utilizes the [Steam-user](https://github.com/DoctorMcKay/node-steam-user) & [Global Offensive](https://github.com/DoctorMcKay/node-globaloffensive) libraries to establish a connection with Steam and interact with the CS2 game coordinator.*

----

## Download Latest Version

Download the latest release from the [releases page](https://github.com/norbjert/casemove/releases/latest), or directly:

- [Linux (portable AppImage)](https://github.com/norbjert/casemove/releases/latest/download/Casemove.AppImage)
- [Windows](https://github.com/norbjert/casemove/releases/latest/download/Casemove-Setup.exe)

(not yet supported:)
- [Mac (Intel)](https://github.com/norbjert/casemove/releases/latest/download/Casemove.dmg)
- [Mac (Apple Silicon / M1+)](https://github.com/norbjert/casemove/releases/latest/download/Casemove-arm64.dmg)


## Support

-

https://user-images.githubusercontent.com/98760010/181345579-e4fd11be-1af9-4b8b-a211-5747fdd414aa.mp4




Features include:
  * An overview page of your storage contents
  * Log in without entering your password / Steam Guard
  * View your inventory
  * View your storage units contents
  * View the Value of your inventory and storage units
  * Move items out of and into your storage units in bulk instead of clicking on the individual items
  * Rename your storage units
  * Sort, search and filter your inventory
  * Sort, search and filter your storage units contents
  * Download a file over your Storage units and inventory contents
  * Switch between multiple accounts easily
  * Use your shared secret key instead of an auth code to log in 
  * See your storage unit's and inventory value from Buff, Skinport & SCM in almost all currencies

Trade up features:
  * Complete trade up contracts from within the app! 
  * See the possible outcomes from your trade up contract
  * See an estimated EV of your trade up contract recipe


## COMMON QUESTIONS
#### Can I be VAC banned?

No.
The app doesn’t interact with your CS2 game client. It doesn’t inject any code into the game. You don’t even need to have the game installed for the app to run. All the app does is connect to Steam and emulate a CS2 connection.

Furthermore, the libraries [Steam-user](https://github.com/DoctorMcKay/node-steam-user) & [Global Offensive](https://github.com/DoctorMcKay/node-globaloffensive) have been used by thousands of people, and this app is merely a cosmetic rendition of these libraries.

#### Does Casemove store any of my information?

No, Casemove doesn’t store any information on your computer, except for when you ask it to remember your refresh token. As of Casemove 2.3.3, Casemove no longer stores your password when you login. The refresh token is stored safely using [safeStore](https://www.electronjs.org/docs/latest/api/safe-storage). Casemove doesn’t send any information to anyone outside of Steam.

#### Why can't I just log in using the Steam Web authentication?

In order to move items in and out of Storage Units, the app needs to have an active connection with the CS2 game coordinator. This is not possible when using the web authentication method. However, take a look at the question below. 

#### How does the browser login work?

The browser login feature works by you logging in to the regular Steam website which makes Steam generate a one time string that you, amongst other things, can use to log in to casemove. This is the safest login method, as the generated string is single use which means that even if someone got a hold of it, it would be useless to them. To get the string open this [URL](https://steamcommunity.com/chat/clientjstoken).

#### Where can I read more about the safety?

Casemove is comparable to the software "Archi Steam Farm" and since Archi has made a terrific wiki on this issue, I'd refer over this wiki for further [reading](https://github.com/JustArchiNET/ArchiSteamFarm/wiki/FAQ#security--privacy--vac--bans--tos)

As with anything, It's important to know that the using this software is distributed "as is" and without any warranty. 


## Authors

Casemove was originally created by Nombers:
- Steam: https://steamcommunity.com/id/realNombers/
- Reddit: https://www.reddit.com/user/nubbiners
- Discord: Nombers#1046


After Nombers abandonded the Open-Source project in favor of his subscription-based, closed source casemove replacement (skinledger)[https://skinledger.com/], this project was been taken over by @norbjert.
- (Steam)[https://steamcommunity.com/id/norbjert/]

----

## How to build

TODO: add updated build instructions here

----

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License  along with this program.  If not, see http://www.gnu.org/licenses/.


## Contributing

Unlike the original casemove, this fork welcomes open-source contributions, provided you follow some basic requirements:
1. Only submit PRs with properly tested, clean code. Properly describe what bug youre fixing or what feature youre adding.
2. No AI Slop: While I support the use of AI-tools to assist you in development, human authorship is a requirement for copyright, which in turn is implicitly required by the GPL license.
TLDR: If I can tell you just let claude spit out some random code, your contribution will not be accepted.

## TODOs
### Bugs
- fix the paste button on the login screen
- fix QR code login
- Fix trade up calculations
- replace cringe skinledger discord server with something else
- fix broken items (mp5 lab rat, shattered web graffitis)
 
### Improvements/Refactoring
- electron-store 8->11 (ESM needed)
- fix or set up session/cookie storing options
- rename project to something else, different logo.
- Improve fastmove (maybe make it 3 options: pure fastmove, fastmove with fallback to re-querry failed moves, and regular slowmove for when steam is ratelimiting hard)
- branch protection rules (no more pushing to main directly)

### Features
- autogenerated release notes
- AUR publish
- casemove browser app?
- android mobile app?

# Spikes
- Spike: price and asset development tracking
- Spike: Can we dynamically add new items without waiting on the csgo items dependency? (maybe by scanning scm etc) -> Would allow the app to stay up-to-date without updating for every cs2 patch with new items
- Spike: more test coverage (mocking steam?, automated UI tests to catch random version bumps white screening etc)
- own pricing API


### Braindead Shower-Thoughts
- What about a casemove-cli?
- casemove... as a skill




# ESM Migration Plan

## Context
The main process has a mix of CJS (`module.exports`, `require()`) and ESM (`import`/`export`) syntax. This confuses vite/rollup and produces build warnings. Newer versions of `electron-store` and `electron-dl` are ESM-only, so the migration is a prerequisite for updating them.

electron-vite already bundles the main process via vite/rollup, so the goal is to make **source files use consistent ESM syntax** — not to change the actual output format (preload stays CJS by vite config design).

---

## Files to Change

### 1. Remove duplicate `module.exports` from 6 mixed files
These files already have `export { ... }` statements but also have redundant `module.exports = { ... }` blocks. Just delete the `module.exports` blocks:
- `src/main/helpers/classes/IPCGenerators/loginGenerator.tsx`
- `src/main/helpers/classes/steam/currency.tsx`
- `src/main/helpers/classes/steam/settings.tsx`
- `src/main/helpers/classes/steam/pricing.tsx`
- `src/main/helpers/classes/steam/steam.tsx`
- `src/main/helpers/classes/steam/tradeup.tsx`

### 2. Convert `require()` to `import` in the same files

**settings.tsx** — already has commented-out ESM imports above the active `require()` calls:
```ts
// Replace:
const Store = require('electron-store');
const { safeStorage } = require('electron');
const axios = require('axios');
// With:
import Store from 'electron-store';
import { safeStorage } from 'electron';
import axios from 'axios';
```

**pricing.tsx**:
```ts
// Replace:
const axios = require('axios');
require('dotenv').config();
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
// With:
import axios from 'axios';
import dotenv from 'dotenv'; dotenv.config();
import { EventEmitter } from 'events';
class MyEmitter extends EventEmitter {}
```

Also replace inline `const pricesBackup = require('./backup/prices.json')` inside function body with a top-level `import pricesBackup from './backup/prices.json'`.

**tradeup.tsx**:
```ts
// Replace:
const collections = require('./backup/collections.json');
// With:
import collections from './backup/collections.json';
```

### 3. Convert pure CJS `.js` files in `src/main/helpers/classes/steam/items/`

**getCommands.js**:
```js
// Replace:
var axios = require('axios');
var items = require('./index');
// ...
module.exports = { fetchItems };
// With:
import axios from 'axios';
import items from './index';
// ...
export { fetchItems };
```

**index.js** — replace all `const X = require(...)` with `import`, and `module.exports` with `export default` or named exports. Inline `require()` calls inside functions (e.g. `require('./itemsBackupFiles/csgo_english.json')`) become top-level imports.

**steam.js** — same pattern.

### 4. Convert `preload.js`
The vite config outputs preload as CJS (`format: 'cjs'`), so the source syntax doesn't matter for runtime — vite transforms it. Convert source to ESM for consistency:
```js
// Replace:
const { contextBridge, ipcRenderer } = require('electron');
var ByteBuffer = require('bytebuffer');
// With:
import { contextBridge, ipcRenderer } from 'electron';
import ByteBuffer from 'bytebuffer';
```
**Do not change** the `format: 'cjs'` in `electron.vite.config.ts` — Electron requires preload to be CJS.

### 5. Fix inline `require()` calls in `main.ts`

For packages without ESM support (`bytebuffer`, globaloffensive subpaths), use `createRequire`:
```ts
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const ByteBuffer = _require('bytebuffer');
const Protos = _require('globaloffensive/protobufs/generated/_load.js');
const Language = _require('globaloffensive/language.js');
```

For `find-process` (top-level, sync usage): same `createRequire` approach.

For conditionally-loaded packages (already in async/conditional blocks):
```ts
// source-map-support (in production if-block):
if (process.env.NODE_ENV === 'production') {
  const { default: sourceMapSupport } = await import('source-map-support');
  sourceMapSupport.install();
}

// electron-debug (in isDevelopment if-block):
if (isDevelopment) {
  const { default: electronDebug } = await import('electron-debug');
  electronDebug();
}

// electron-devtools-installer (already inside async installExtensions()):
const installer = await import('electron-devtools-installer');
```

### 6. Update `tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "esnext",           // was "commonjs"
    "moduleResolution": "bundler" // was "node"
  }
}
```

### 7. Upgrade `electron-store` and `electron-dl`
After source is clean ESM, bump versions in `package.json`:
```json
"electron-store": "^10.0.0",
"electron-dl": "^4.0.0"
```
Check changelogs for breaking API changes (electron-store v9+ changed some method signatures).
Run `npm install --legacy-peer-deps` and fix any type/API errors.

---

## What NOT to Change
- `electron.vite.config.ts` preload `format: 'cjs'` — Electron requires it
- Do **not** add `"type": "module"` to `package.json` — causes issues with electron-builder

---

## Verification
1. `npm run build` — should produce zero COMMONJS_VARIABLE_IN_ESM warnings
2. `npx electron-builder --linux AppImage` — should package successfully
3. Launch the AppImage and verify: login, inventory load, storage unit movement, price display

