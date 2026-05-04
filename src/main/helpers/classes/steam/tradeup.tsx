import collections from './backup/collections.json';
import knifeCollections from './backup/knifeCollections.json';

async function setCollections(currencyClass) {

  const directory = {};
  for (const [key, value] of Object.entries(collections)) {
    // @ts-ignore
    const keys = Object.keys(value);
    keys.forEach((element) => {
      directory[element] = key;
    });
  }
  currencyClass.setCollections(collections, directory);
}

class tradeUps {
  collections = {};
  seenRates = {};
  directory = {};
  knifeCollections = knifeCollections as Record<string, Array<{ name: string; imageURL: string; 'min-wear': string; 'max-wear': string }>>;
  rarityLevels = {
    'Factory New': 0.07,
    'Minimal Wear': 0.15,
    'Field-Tested': 0.38,
    'Well-Worn': 0.45,
    'Battle-Scarred': 1,
  };

  constructor() {
    setCollections(this);
  }

  // Setup backup
  setCollections(converter, dir) {
    this.collections = converter;
    this.directory = dir;
  }

  // Get rarity
  getRarity(min_wear, max_wear, averageFloat) {
    const c = (max_wear - min_wear) * averageFloat
    for (const [key, value] of Object.entries(this.rarityLevels)) {
      // @ts-ignore
      const chance = (value - min_wear) / (max_wear - min_wear);
      if (chance > averageFloat) {
        return [key, c + parseFloat(min_wear)];
      }
    }
    return ['Battle-Scarred', c + parseFloat(min_wear)];
  }

  // Get possible outcomes
  getPossible(collection, quality) {
    let i = 1;
    while (true) {
      const listOfPossibilites = [];
      for (const [key, value] of Object.entries(this.collections[collection])) {
        // @ts-ignore
        if (value.best_quality == quality + i) {
          // @ts-ignore
          listOfPossibilites.push(key);
        }
      }

      if (listOfPossibilites.length > 0 || i + quality > 15) {
        return listOfPossibilites;
      }
      i++;
    }
  }

  getTradeUp(arrayOfItems: Array<any>) {
    return new Promise((resolve) => {
      arrayOfItems.forEach((element) => {
        const itemName = element.item_name.replace('StatTrak™ ', '')
        const collection = this.directory[itemName];
        element['tradeUpConfirmed'] = false;

        if (collection != undefined) {
          let possible =
            this.collections?.[collection][itemName]?.trade_up;
          if (element.rarityName === 'Covert') {
            possible = true;
          }
          element['tradeUpConfirmed'] = possible;
          element['collection'] = collection
        }
      });

      resolve(arrayOfItems);
    });
  }

  // Generate outcome
  getPotentitalOutcome(arrayOfItems) {
    return new Promise((resolve) => {
      const finalResult = [];
      let avgNormalized = 0;
      let isStattrak = false;
      let isCovert = false;

      // Check if stattrak
      if (arrayOfItems[0].item_name.includes('StatTrak™')) {
        isStattrak = true;
      }

      // For covert trade-ups: collect the knife pool from each input collection
      const seenKnifeNames = new Set<string>();
      const knifePool: Array<{ name: string; imageURL: string; 'min-wear': string; 'max-wear': string }> = [];

      // For normal trade-ups: collect possible output skins
      const seenSkins: string[] = [];

      arrayOfItems.forEach((element) => {
        if (isStattrak) {
          element.item_name = element.item_name.replace('StatTrak™ ', '');
        }
        const collection = this.directory[element.item_name];
        const skinData = this.collections[collection][element.item_name];

        if (parseInt(skinData.best_quality) === 10) {
          // Covert trade-up: look up knife pool for this collection
          isCovert = true;
          const collectionKnives = this.knifeCollections[collection] || [];
          collectionKnives.forEach((knife) => {
            if (!seenKnifeNames.has(knife.name)) {
              seenKnifeNames.add(knife.name);
              knifePool.push(knife);
            }
          });
        } else {
          // Normal trade-up: find next-tier skins in same collection
          const possible = this.getPossible(collection, parseInt(skinData.best_quality));
          possible.forEach((skin) => {
            if (!seenSkins.includes(skin)) {
              seenSkins.push(skin);
            }
          });
        }

        // New formula (Re-Retakes Update, Oct 2025): normalize each input float
        // to its own wear range before averaging, so narrow-range skins contribute
        // their relative position rather than their raw float value.
        const minWear = parseFloat(skinData['min-wear']);
        const maxWear = parseFloat(skinData['max-wear']);
        avgNormalized += (element.item_paint_wear - minWear) / (maxWear - minWear);
      });

      avgNormalized = avgNormalized / arrayOfItems.length;

      if (isCovert) {
        // Covert → knife: each knife type in the pool has equal probability
        const percentageChance = 100 / knifePool.length;
        knifePool.forEach((knife) => {
          const skinRarity = this.getRarity(knife['min-wear'], knife['max-wear'], avgNormalized);
          const floatChance = skinRarity[1];
          const wearName = skinRarity[0];
          let item_name = knife.name;
          if (isStattrak) {
            item_name = 'StatTrak™ ' + item_name;
          }
          // @ts-ignore
          finalResult.push({
            item_name,
            item_wear_name: wearName,
            percentage: percentageChance.toFixed(2),
            image: knife.imageURL,
            float_chance: floatChance,
          });
        });
      } else {
        seenSkins.forEach((element) => {
          const relevantObject = this.collections[this.directory[element]][element];
          let skinRarity = this.getRarity(
            relevantObject['min-wear'],
            relevantObject['max-wear'],
            avgNormalized
          );
          const floatChance = skinRarity[1];
          // @ts-ignore
          skinRarity = skinRarity[0];
          // Each unique possible output has equal probability.
          const percentageChance = 100 / seenSkins.length;

          let item_name = element as any;
          if (isStattrak) {
            item_name = 'StatTrak™ ' + item_name;
          }
          const objectToWrite = {
            item_name: item_name,
            item_wear_name: skinRarity,
            percentage: percentageChance.toFixed(2),
            image: relevantObject['imageURL'],
            float_chance: floatChance
          };
          // @ts-ignore
          finalResult.push(objectToWrite);
        });
      }

      resolve(finalResult);
    });
  }
}

export { tradeUps };
