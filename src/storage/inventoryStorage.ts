import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem } from '../models/inventory';
import { INITIAL_EMERGENCY_INVENTORY } from '../services/seedData';

const STORAGE_KEYS = {
  INVENTORY_ITEMS: '@pantrylens:inventory_items_v1',
  SEED_INITIALIZED: '@pantrylens:seed_initialized_v1',
};

export const InventoryStorage = {
  /**
   * Loads the inventory from AsyncStorage.
   * On the very first launch (when SEED_INITIALIZED is not set), populates
   * and saves the Swiss Emergency Plan seed data. Never overwrites existing user data.
   */
  async loadInventory(): Promise<InventoryItem[]> {
    try {
      const [rawItems, isSeeded] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.SEED_INITIALIZED),
      ]);

      if (rawItems !== null) {
        let parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) {
          const seedMap = new Map(
            INITIAL_EMERGENCY_INVENTORY.map(i => [i.id, i]),
          );

          // Enrich existing items that lack metadata with full seed metadata
          let hasChanges = false;
          parsed = parsed.map((item: InventoryItem) => {
            const seed = seedMap.get(item.id);
            if (
              seed &&
              (!item.location || !item.expiryDate || !item.notes) &&
              (seed.location || seed.expiryDate || seed.notes)
            ) {
              hasChanges = true;
              return {
                ...item,
                location: item.location || seed.location,
                expiryDate: item.expiryDate || seed.expiryDate,
                notes: item.notes || seed.notes,
                checked: item.checked !== undefined ? item.checked : seed.checked,
              };
            }
            return item;
          });

          // Ensure Beverages has both Swiss Emergency items if one was missing
          const existingIds = new Set(parsed.map((i: InventoryItem) => i.id));
          const beverageItems = parsed.filter(
            (i: InventoryItem) => i.category === 'Beverages',
          );
          if (beverageItems.length < 2 && !existingIds.has('swiss-emergency-01')) {
            const waterSeed = seedMap.get('swiss-emergency-01');
            if (waterSeed) {
              hasChanges = true;
              parsed.unshift(waterSeed);
            }
          }

          if (hasChanges) {
            await AsyncStorage.setItem(
              STORAGE_KEYS.INVENTORY_ITEMS,
              JSON.stringify(parsed),
            );
          }

          if (!isSeeded) {
            await AsyncStorage.setItem(STORAGE_KEYS.SEED_INITIALIZED, 'true');
          }
          return parsed as InventoryItem[];
        }
      }

      if (!isSeeded) {
        await Promise.all([
          AsyncStorage.setItem(
            STORAGE_KEYS.INVENTORY_ITEMS,
            JSON.stringify(INITIAL_EMERGENCY_INVENTORY),
          ),
          AsyncStorage.setItem(STORAGE_KEYS.SEED_INITIALIZED, 'true'),
        ]);
        return INITIAL_EMERGENCY_INVENTORY;
      }

      return [];
    } catch (error) {
      console.error('Failed to load inventory from AsyncStorage:', error);
      return INITIAL_EMERGENCY_INVENTORY;
    }
  },

  /**
   * Persists the current ordered inventory array to AsyncStorage.
   */
  async saveInventory(items: InventoryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.INVENTORY_ITEMS,
        JSON.stringify(items),
      );
    } catch (error) {
      console.error('Failed to save inventory to AsyncStorage:', error);
    }
  },

  /**
   * Restores the default Swiss Emergency Plan checklist if the user explicitly requests a reset.
   */
  async resetToDefaultSeed(): Promise<InventoryItem[]> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.INVENTORY_ITEMS,
          JSON.stringify(INITIAL_EMERGENCY_INVENTORY),
        ),
        AsyncStorage.setItem(STORAGE_KEYS.SEED_INITIALIZED, 'true'),
      ]);
      return INITIAL_EMERGENCY_INVENTORY;
    } catch (error) {
      console.error('Failed to reset inventory in AsyncStorage:', error);
      return INITIAL_EMERGENCY_INVENTORY;
    }
  },
};

