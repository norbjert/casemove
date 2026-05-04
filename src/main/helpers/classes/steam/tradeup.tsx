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
  knifeCollections = knifeCollections as Record<string, Array<{ name: string; imageURL: string; 'min-wear': string | null; 'max-wear': string | null; vanilla?: boolean; weight?: number }>>;
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

      type KnifeEntry = { name: string; imageURL: string; 'min-wear': string | null; 'max-wear': string | null; vanilla?: boolean; weight?: number };

      // For covert trade-ups: track how many inputs came from each collection
      // so probability can be split proportionally (e.g. 4 from A + 1 from B = 80%/20%)
      const collectionContributions: Record<string, number> = {};
      const collectionPools: Record<string, KnifeEntry[]> = {};

      // For normal trade-ups: collect possible output skins
      const seenSkins: string[] = [];

      arrayOfItems.forEach((element) => {
        if (isStattrak) {
          element.item_name = element.item_name.replace('StatTrak™ ', '');
        }
        const collection = this.directory[element.item_name];
        const skinData = this.collections[collection][element.item_name];

        if (parseInt(skinData.best_quality) === 10) {
          isCovert = true;
          collectionContributions[collection] = (collectionContributions[collection] || 0) + 1;
          // Build per-collection pool once (deduplicated within the collection)
          if (!collectionPools[collection]) {
            const seen = new Set<string>();
            collectionPools[collection] = (this.knifeCollections[collection] || []).filter(k => {
              if (seen.has(k.name)) return false;
              seen.add(k.name);
              return true;
            });
          }
        } else {
          // Normal trade-up: find next-tier skins in same collection
          const possible = this.getPossible(collection, parseInt(skinData.best_quality));
          possible.forEach((skin) => {
            if (!seenSkins.includes(skin)) seenSkins.push(skin);
          });
        }

        const minWear = parseFloat(skinData['min-wear']);
        const maxWear = parseFloat(skinData['max-wear']);
        avgNormalized += (element.item_paint_wear - minWear) / (maxWear - minWear);
      });

      avgNormalized = avgNormalized / arrayOfItems.length;

      if (isCovert) {
        const totalInputs = arrayOfItems.length;
        // Accumulate probabilities per skin name (same skin can appear in multiple collection pools)
        const outcomeMap = new Map<string, { knife: KnifeEntry; probability: number }>();

        for (const [collection, count] of Object.entries(collectionContributions)) {
          const collectionShare = count / totalInputs; // e.g. 4/5 = 0.8
          const pool = collectionPools[collection] || [];
          const totalWeight = pool.reduce((sum, k) => sum + (k.weight ?? 1), 0);
          if (totalWeight === 0) continue;

          pool.forEach((knife) => {
            const prob = collectionShare * ((knife.weight ?? 1) / totalWeight) * 100;
            const existing = outcomeMap.get(knife.name);
            if (existing) {
              existing.probability += prob;
            } else {
              outcomeMap.set(knife.name, { knife, probability: prob });
            }
          });
        }

        for (const { knife, probability } of outcomeMap.values()) {
          let item_wear_name: string | null = null;
          let float_chance: number | null = null;
          if (!knife.vanilla && knife['min-wear'] !== null && knife['max-wear'] !== null) {
            const skinRarity = this.getRarity(knife['min-wear'], knife['max-wear'], avgNormalized);
            item_wear_name = skinRarity[0] as string;
            float_chance = skinRarity[1] as number;
          }
          let item_name = knife.name;
          if (isStattrak) item_name = 'StatTrak™ ' + item_name;
          // @ts-ignore
          finalResult.push({
            item_name,
            item_wear_name,
            percentage: probability.toFixed(2),
            image: knife.imageURL,
            float_chance,
          });
        }
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
