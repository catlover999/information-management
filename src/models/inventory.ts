export type InventoryCategory =
  | 'Beverages'
  | 'Food'
  | 'Additional supplies';

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'Beverages',
  'Food',
  'Additional supplies',
];

export type FilterCategory = 'All' | InventoryCategory;

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  location: string;
  expiryDate: string | null; // ISO date string YYYY-MM-DD or null
  notes: string;
  checked: boolean;
}

export interface InventoryItemFormValues {
  name: string;
  category: InventoryCategory;
  location: string;
  expiryDate: string | null;
  notes: string;
}

export interface CapturedPhotoInfo {
  uri: string;
  width: number;
  height: number;
  capturedAt: string;
}

