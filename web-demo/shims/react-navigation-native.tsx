import React, { createContext, useContext } from 'react';
import { View } from 'react-native';

export type NavigationProp<T = Record<string, any>> = {
  navigate: (routeName: keyof T | string, params?: any) => void;
  goBack: () => void;
};

interface NavContextValue {
  activeRoute: string;
  navigate: (routeName: string) => void;
}

export const NavContext = createContext<NavContextValue>({
  activeRoute: 'Pantry',
  navigate: () => {},
});

export const ScreenFocusContext = createContext<boolean>(true);

export const NavigationContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={{ flex: 1 }}>{children}</View>;
};

export function useNavigation<T = Record<string, any>>(): NavigationProp<T> {
  const ctx = useContext(NavContext);
  return {
    navigate: (routeName: keyof T | string) => ctx.navigate(String(routeName)),
    goBack: () => ctx.navigate('Pantry'),
  };
}

export function useIsFocused(): boolean {
  return useContext(ScreenFocusContext);
}
