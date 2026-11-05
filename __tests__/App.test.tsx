import { INITIAL_EMERGENCY_INVENTORY } from '../src/services/seedData';
import { InventoryStorage } from '../src/storage/inventoryStorage';
import {
  formatDisplayDate,
  getExpiryStatus,
  toIsoDateString,
} from '../src/utils/dateUtils';
import { validateInventoryForm } from '../src/utils/validation';

const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) =>
    Object.prototype.hasOwnProperty.call(mockStore, key)
      ? mockStore[key]
      : null,
  ),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete mockStore[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
  }),
}));

describe('PantryLens Core Suite', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
  });

  test('Swiss Emergency Plan initial inventory has 24 properly initialized items', () => {
    expect(INITIAL_EMERGENCY_INVENTORY).toHaveLength(24);

    const ids = new Set(INITIAL_EMERGENCY_INVENTORY.map(i => i.id));
    expect(ids.size).toBe(24);

    const beverages = INITIAL_EMERGENCY_INVENTORY.filter(
      i => i.category === 'Beverages',
    );
    const food = INITIAL_EMERGENCY_INVENTORY.filter(i => i.category === 'Food');
    const supplies = INITIAL_EMERGENCY_INVENTORY.filter(
      i => i.category === 'Additional supplies',
    );

    expect(beverages).toHaveLength(2);
    expect(food).toHaveLength(17);
    expect(supplies).toHaveLength(5);

    for (const item of INITIAL_EMERGENCY_INVENTORY) {
      expect(item.location).toBe('');
      expect(item.expiryDate).toBeNull();
      expect(item.notes).toBe('');
      expect(item.checked).toBe(false);
    }
  });

  test('InventoryStorage seeds on first launch and preserves user modifications on restart', async () => {
    // 1. First launch loads seed data
    const initial = await InventoryStorage.loadInventory();
    expect(initial).toHaveLength(24);

    // 2. Simulate checking an item, editing metadata, adding a custom item, and reordering
    const modified = [
      {
        id: 'custom-test-1',
        name: 'First Aid Kit',
        category: 'Additional supplies' as const,
        location: 'Hallway closet',
        expiryDate: '2028-06-15',
        notes: 'Checked bandages',
        checked: true,
      },
      {
        ...initial[0],
        checked: true,
        location: 'Basement rack 1',
        expiryDate: '2027-12-01',
        notes: '6x 1.5L bottles',
      },
    ];

    await InventoryStorage.saveInventory(modified);

    // 3. Reloading must return the modified list and NOT overwrite with seed data
    const reloaded = await InventoryStorage.loadInventory();
    expect(reloaded).toHaveLength(2);
    expect(reloaded[0].id).toBe('custom-test-1');
    expect(reloaded[0].checked).toBe(true);
    expect(reloaded[1].location).toBe('Basement rack 1');
    expect(reloaded[1].notes).toBe('6x 1.5L bottles');
  });

  test('validateInventoryForm enforces required item name and field constraints', () => {
    const emptyResult = validateInventoryForm({
      name: '   ',
      category: 'Food',
      location: '',
      expiryDate: null,
      notes: '',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.name).toBeDefined();

    const validResult = validateInventoryForm({
      name: 'Canned Lentils',
      category: 'Food',
      location: 'Pantry Shelf 2',
      expiryDate: '2027-05-10',
      notes: '4 cans stocked',
    });
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual({});
  });

  test('dateUtils formats dates and computes expiry status accurately', () => {
    expect(formatDisplayDate(null)).toBe('Not set');
    expect(getExpiryStatus(null).status).toBe('none');

    const pastStatus = getExpiryStatus('2020-01-01');
    expect(pastStatus.status).toBe('expired');

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const futureIso = toIsoDateString(futureDate);
    expect(getExpiryStatus(futureIso).status).toBe('valid');
  });
});
