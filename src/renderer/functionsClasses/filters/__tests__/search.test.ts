import { describe, it, expect } from 'vitest';
import { searchFilter } from '../search';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeItem(overrides: Record<string, any> = {}) {
  return {
    item_name: 'AK-47 | Redline',
    item_wear_name: 'Field-Tested',
    item_customname: null,
    bgColorClass: 'bg-pink-400',
    ...overrides,
  } as any;
}

function makeFilters(overrides: Record<string, any> = {}) {
  return {
    categoryFilter: [] as string[],
    ...overrides,
  } as any;
}

function makeReducer(searchInput: string) {
  return { searchInput } as any;
}

// --------------------------------------------------------------------------

describe('searchFilter', () => {
  describe('text search', () => {
    it('returns all items when search string is empty', () => {
      const items = [makeItem(), makeItem({ item_name: 'AWP | Dragon Lore' })];
      const result = searchFilter(items, makeFilters(), makeReducer(''));
      expect(result).toHaveLength(2);
    });

    it('filters by item_name (case-insensitive)', () => {
      const items = [makeItem({ item_name: 'AK-47 | Redline' }), makeItem({ item_name: 'AWP | Dragon Lore' })];
      const result = searchFilter(items, makeFilters(), makeReducer('ak-47'));
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('AK-47 | Redline');
    });

    it('filters by item_wear_name', () => {
      const items = [
        makeItem({ item_wear_name: 'Factory New' }),
        makeItem({ item_wear_name: 'Battle-Scarred' }),
      ];
      const result = searchFilter(items, makeFilters(), makeReducer('factory'));
      expect(result).toHaveLength(1);
      expect(result[0].item_wear_name).toBe('Factory New');
    });

    it('filters by item_customname', () => {
      const items = [
        makeItem({ item_customname: 'My Lucky AK' }),
        makeItem({ item_customname: null }),
      ];
      const result = searchFilter(items, makeFilters(), makeReducer('lucky'));
      expect(result).toHaveLength(1);
    });

    it('matches by wear name even if item_name does not match', () => {
      const items = [makeItem({ item_name: 'AK-47 | Redline', item_wear_name: 'Factory New' })];
      const result = searchFilter(items, makeFilters(), makeReducer('Factory New'));
      expect(result).toHaveLength(1);
    });

    it('trims whitespace from search string', () => {
      const items = [makeItem({ item_name: 'AK-47 | Redline' })];
      const result = searchFilter(items, makeFilters(), makeReducer('  AK-47  '));
      expect(result).toHaveLength(1);
    });
  });

  describe('category filter', () => {
    it('removes items not matching categoryFilter', () => {
      const items = [
        makeItem({ bgColorClass: 'bg-pink-400' }),
        makeItem({ bgColorClass: 'bg-gray-400' }),
      ];
      const result = searchFilter(items, makeFilters({ categoryFilter: ['bg-pink-400'] }), makeReducer(''));
      expect(result).toHaveLength(1);
      expect(result[0].bgColorClass).toBe('bg-pink-400');
    });

    it('allows all items when categoryFilter is empty', () => {
      const items = [
        makeItem({ bgColorClass: 'bg-pink-400' }),
        makeItem({ bgColorClass: 'bg-gray-400' }),
      ];
      const result = searchFilter(items, makeFilters({ categoryFilter: [] }), makeReducer(''));
      expect(result).toHaveLength(2);
    });

    it('category filter and search string work together', () => {
      const items = [
        makeItem({ item_name: 'AK-47 | Redline', bgColorClass: 'bg-pink-400' }),
        makeItem({ item_name: 'AWP | Dragon Lore', bgColorClass: 'bg-pink-400' }),
        makeItem({ item_name: 'AK-47 | Asiimov', bgColorClass: 'bg-gray-400' }),
      ];
      const result = searchFilter(
        items,
        makeFilters({ categoryFilter: ['bg-pink-400'] }),
        makeReducer('AK-47')
      );
      expect(result).toHaveLength(1);
      expect(result[0].item_name).toBe('AK-47 | Redline');
    });
  });

  describe('undefined chosenReducer', () => {
    it('returns all items when chosenReducer is undefined (no search)', () => {
      const items = [makeItem(), makeItem({ item_name: 'AWP | Dragon Lore' })];
      const result = searchFilter(items, makeFilters(), undefined);
      expect(result).toHaveLength(2);
    });
  });
});
