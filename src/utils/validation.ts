import { InventoryItemFormValues } from '../models/inventory';

export interface ValidationErrors {
  name?: string;
  location?: string;
  notes?: string;
}

export function validateInventoryForm(
  values: InventoryItemFormValues,
): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};
  const trimmedName = values.name.trim();

  if (!trimmedName) {
    errors.name = 'Item name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Item name must be at least 2 characters.';
  } else if (trimmedName.length > 140) {
    errors.name = 'Item name must be 140 characters or fewer.';
  }

  if (values.location.trim().length > 100) {
    errors.location = 'Location must be 100 characters or fewer.';
  }

  if (values.notes.trim().length > 500) {
    errors.notes = 'Notes must be 500 characters or fewer.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

