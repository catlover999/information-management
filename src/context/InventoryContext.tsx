import React, { createContext, useContext } from 'react';
import { useInventoryState } from '../hooks/useInventory';

export type InventoryContextValue = ReturnType<typeof useInventoryState>;

const InventoryContext = createContext<InventoryContextValue | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const inventory = useInventoryState();
  return (
    <InventoryContext.Provider value={inventory}>
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
