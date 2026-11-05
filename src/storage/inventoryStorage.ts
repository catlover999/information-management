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
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) {
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

