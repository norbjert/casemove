import { describe, it, expect } from 'vitest';
import { filterItemRows } from '../custom';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeItem(overrides: Record<string, any> = {}) {
  return {
    item_name: 'AK-47 | Redline',
    item_wear_name: 'Field-Tested',
    item_url: 'https://steamcommunity.com/economy/image/abc123',
    category: 'Rifles',
    major: '',
    stattrak: false,
    equipped_ct: false,
    ...overrides,
  } as any;
}

function makeFilter(commandType: string, valueToCheck: string, include: boolean = true) {
  return { commandType, valueToCheck, include } as any;
}

// filterItemRows is async, so wrap calls in await
const filter = (items: any[], filters: any[]) => filterItemRows(items, filters);

// --------------------------------------------------------------------------
// filterItemRows — include mode
// --------------------------------------------------------------------------

describe('filterItemRows', () => {
  describe('checkName', () => {
    it('keeps items whose item_name includes the value', async () => {
      const items = [makeItem({ item_name: 'AK-47 | Redline' }), makeItem({ item_name: 'AWP | Dragon Lore' })];
      const result = await filter(items, [makeFilter('checkName', 'AK-47')]);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('AK-47 | Redline');
    });

    it('removes items that do not include the value (include=true)', async () => {
      const items = [makeItem({ item_name: 'AWP | Dragon Lore' })];
      const result = await filter(items, [makeFilter('checkName', 'AK-47')]);
      expect(result).toHaveLength(0);
    });

    it('excludes items whose name includes the value (include=false)', async () => {
      const items = [makeItem({ item_name: 'AK-47 | Redline' }), makeItem({ item_name: 'AWP | Dragon Lore' })];
      const result = await filter(items, [makeFilter('checkName', 'AK-47', false)]);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('AWP | Dragon Lore');
    });
  });

  describe('checkURL', () => {
    it('keeps items whose item_url includes the value', async () => {
      const items = [
        makeItem({ item_url: 'https://cdn/abc123' }),
        makeItem({ item_url: 'https://cdn/xyz789' }),
      ];
      const result = await filter(items, [makeFilter('checkURL', 'abc123')]);
      expect(result).toHaveLength(1);
    });
  });

  describe('checkBooleanVariable', () => {
    it('keeps items where the boolean field is truthy', async () => {
      const items = [
        makeItem({ stattrak: true }),
        makeItem({ stattrak: false }),
      ];
      const result = await filter(items, [makeFilter('checkBooleanVariable', 'stattrak')]);
      expect(result).toHaveLength(1);
      expect(result[0].stattrak).toBe(true);
    });

    it('excludes items where the boolean field is truthy (include=false)', async () => {
      const items = [makeItem({ stattrak: true }), makeItem({ stattrak: false })];
      const result = await filter(items, [makeFilter('checkBooleanVariable', 'stattrak', false)]);
      expect(result).toHaveLength(1);
      expect(result[0].stattrak).toBe(false);
    });
  });

  describe('checkMajor', () => {
    it('keeps items whose major includes the value', async () => {
      const items = [
        makeItem({ major: 'IEM Cologne 2024' }),
        makeItem({ major: '' }),
      ];
      const result = await filter(items, [makeFilter('checkMajor', 'Cologne')]);
      expect(result).toHaveLength(1);
    });
  });

  describe('checkNameAndContainer', () => {
    it('keeps container items whose name includes the value', async () => {
      const items = [
        makeItem({ category: 'Containers', item_name: 'Chroma 2 Case' }),
        makeItem({ category: 'Rifles', item_name: 'Chroma Collection' }),   // not a container
        makeItem({ category: 'Containers', item_name: 'Operation Bravo Case' }),
      ];
      const result = await filter(items, [makeFilter('checkNameAndContainer', 'Chroma')]);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('Chroma 2 Case');
    });
  });

  describe('checkCapsule', () => {
    it('matches container items whose name includes the value', async () => {
      const items = [makeItem({ category: 'Containers', item_name: 'CS20 Capsule' })];
      const result = await filter(items, [makeFilter('checkCapsule', 'Capsule')]);
      expect(result).toHaveLength(1);
    });

    it('matches Challengers/Legends/Contenders capsules even without explicit name match', async () => {
      const items = [
        makeItem({ category: 'Containers', item_name: 'Paris 2023 Challengers' }),
        makeItem({ category: 'Containers', item_name: 'Paris 2023 Challengers Patch' }),
      ];
      // valueToCheck won't match — but Challengers without "Patch" still passes
      const result = await filter(items, [makeFilter('checkCapsule', 'NOMATCH')]);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('Paris 2023 Challengers');
    });

    it('excludes Challengers Patch capsules from auto-match', async () => {
      const items = [makeItem({ category: 'Containers', item_name: 'Paris 2023 Challengers Patch' })];
      const result = await filter(items, [makeFilter('checkCapsule', 'NOMATCH')]);
      expect(result).toHaveLength(0);
    });

    it('supports Legends capsules', async () => {
      const items = [makeItem({ category: 'Containers', item_name: 'Paris 2023 Legends' })];
      const result = await filter(items, [makeFilter('checkCapsule', 'NOMATCH')]);
      expect(result).toHaveLength(1);
    });

    it('supports Contenders capsules', async () => {
      const items = [makeItem({ category: 'Containers', item_name: 'Paris 2023 Contenders' })];
      const result = await filter(items, [makeFilter('checkCapsule', 'NOMATCH')]);
      expect(result).toHaveLength(1);
    });
  });

  describe('multiple filters (AND logic)', () => {
    it('applies all filters sequentially', async () => {
      const items = [
        makeItem({ item_name: 'AK-47 | Redline', stattrak: true }),
        makeItem({ item_name: 'AK-47 | Asiimov', stattrak: false }),
        makeItem({ item_name: 'AWP | Dragon Lore', stattrak: true }),
      ];
      const result = await filter(items, [
        makeFilter('checkName', 'AK-47'),
        makeFilter('checkBooleanVariable', 'stattrak'),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('AK-47 | Redline');
    });
  });

  describe('unknown commandType', () => {
    it('returns false (removes items) for unknown commandType with include=true', async () => {
      const items = [makeItem()];
      const result = await filter(items, [makeFilter('unknownType', 'anything')]);
      expect(result).toHaveLength(0);
    });

    it('returns true (keeps items) for unknown commandType with include=false', async () => {
      const items = [makeItem()];
      const result = await filter(items, [makeFilter('unknownType', 'anything', false)]);
      expect(result).toHaveLength(1);
    });
  });
});
