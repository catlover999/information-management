import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={{ flex: 1, width: '100%', height: '100%' }}>{children}</View>;
};

export const SafeAreaView: React.FC<{
  children: React.ReactNode;
  style?: any;
  edges?: string[];
}> = ({ children, style }) => {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
};

export const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });
