import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PantryScreen } from '../screens/PantryScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { BorderRadius, Colors, Fonts } from '../theme';

export type RootTabParamList = {
  Pantry: undefined;
  Scan: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabIconProps {
  focused: boolean;
  type: 'Pantry' | 'Scan';
}

const TabIcon: React.FC<TabIconProps> = ({ focused, type }) => {
  return (
    <View
      style={[
        styles.iconPill,
        focused ? styles.iconPillActive : null,
      ]}>
      {type === 'Pantry' ? (
        <View style={styles.checklistIconBox}>
          <View
            style={[
              styles.checkLine,
              { backgroundColor: focused ? Colors.greenPrimary : Colors.textMuted },
            ]}
          />
          <View
            style={[
              styles.checkLineShort,
              { backgroundColor: focused ? Colors.navyPrimary : Colors.textMuted },
            ]}
          />
        </View>
      ) : (
        <View
          style={[
            styles.cameraIconRing,
            { borderColor: focused ? Colors.navyPrimary : Colors.textMuted },
          ]}>
          <View
            style={[
              styles.cameraIconDot,
              { backgroundColor: focused ? Colors.greenPrimary : Colors.textMuted },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const renderPantryIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} type="Pantry" />
);

const renderScanIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} type="Scan" />
);

const renderPantryLabel = ({ focused }: { focused: boolean }) => (
  <Text
    style={[
      styles.tabBarLabel,
      focused ? styles.tabBarLabelActive : null,
    ]}>
    Pantry
  </Text>
);

const renderScanLabel = ({ focused }: { focused: boolean }) => (
  <Text
    style={[
      styles.tabBarLabel,
      focused ? styles.tabBarLabelActive : null,
    ]}>
    Scan
  </Text>
);

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Pantry"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.navyPrimary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}>
        <Tab.Screen
          name="Pantry"
          component={PantryScreen}
          options={{
            tabBarLabel: renderPantryLabel,
            tabBarIcon: renderPantryIcon,
            tabBarButtonTestID: 'tab-pantry',
          }}
        />
        <Tab.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            tabBarLabel: renderScanLabel,
            tabBarIcon: renderScanIcon,
            tabBarButtonTestID: 'tab-scan',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
  },
  tabBarLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabBarLabelActive: {
    fontFamily: Fonts.bold,
    color: Colors.navyPrimary,
  },
  iconPill: {
    width: 48,
    height: 28,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: Colors.greenLight,
  },
  checklistIconBox: {
    width: 18,
    height: 16,
    justifyContent: 'center',
    gap: 4,
  },
  checkLine: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
  },
  checkLineShort: {
    width: 13,
    height: 3,
    borderRadius: 1.5,
  },
  cameraIconRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
