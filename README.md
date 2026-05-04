# CASEMOVE

Casemove is an open-source desktop application that helps you easily move items in and out of Storage Units in Counter-Strike 2. 
This project was initially developed as [Casemove](https://github.com/nombersDev/casemove) by nombers, before he changed the license, abandonded the open-source project and replaced it with the subscription-based, closed-sourced app [Skinledger](https://skinledger.com/).

This fork of the original project will remain open source and up-to-date.
----

## Download Latest Version

Download the latest release from the [releases page](https://github.com/norbjert/casemove/releases/latest), or directly:

- [Windows](https://github.com/norbjert/casemove/releases/latest/download/Casemove-Setup.exe)
- [Linux (Debian/Ubuntu/Mint/etc)] (https://github.com/norbjert/casemove/releases/latest/download/Casemove.deb)
- [Linux (portable AppImage)](https://github.com/norbjert/casemove/releases/latest/download/Casemove.AppImage)


Work-in-progress/not yet supported:
- [Mac (Intel)]
- [Mac (Apple Silicon / M1+)]


## Support

-

https://user-images.githubusercontent.com/98760010/181345579-e4fd11be-1af9-4b8b-a211-5747fdd414aa.mp4




Features include:
  * An overview page of your storage unit contents
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

#### Does Casemove collect any of my information?

No, Casemove doesn’t collect any information by default. Since the app is open-source, you can vet the code yourself (or ask someone who you know and trust) and build it yourself from source.
Additionally, all releases are built using a [github action](https://github.com/norbjert/casemove/actions/workflows/release.yml) for a fully transpartent build.

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


After Nombers abandonded the Open-Source project in favor of his subscription-based, closed source casemove replacement (skinledger)[https://skinledger.com/], this project was been taken over by [norbjert](https://github.com/norbjert).
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

Unlike the original casemove, this fork welcomes open-source contributions.
Take a look at (Contributing.md)[https://github.com/norbjert/casemove/blob/main/CONTRIBUTING.md]

## TODOs
### Bugs
- fix the paste button on the login screen
- replace cringe skinledger discord server with something else
 
### Improvements/Refactoring
- fix or set up session/cookie storing options
- rename project to something else, different logo.
- Improve fastmove (maybe make it 3 options: pure fastmove, fastmove with fallback to re-querry failed moves, and regular slowmove for when steam is ratelimiting hard)
- branch protection rules (no more pushing to main directly)

### Features
- autogenerated release notes
- AUR publish
- casemove browser app?
- android mobile app?
- portable exe for windows

# Spikes
- Spike: price and asset development tracking
- Spike: Can we dynamically add new items without waiting on the csgo items dependency? (maybe by scanning scm etc) -> Would allow the app to stay up-to-date without updating for every cs2 patch with new items
- Spike: more test coverage (mocking steam?, automated UI tests to catch random version bumps white screening etc)
- own pricing API


### Braindead Shower-Thoughts
- What about a casemove-cli?
- casemove... as a skill

