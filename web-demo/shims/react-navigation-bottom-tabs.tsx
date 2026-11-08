import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavContext, ScreenFocusContext } from './react-navigation-native';

interface TabScreenProps {
  name: string;
  component: React.ComponentType<any>;
  options?: {
    tabBarLabel?: ((props: { focused: boolean; color: string }) => React.ReactNode) | string;
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
    tabBarButtonTestID?: string;
  };
}

interface TabNavigatorProps {
  initialRouteName?: string;
  screenOptions?: {
    headerShown?: boolean;
    tabBarActiveTintColor?: string;
    tabBarInactiveTintColor?: string;
    tabBarStyle?: any;
    tabBarLabelStyle?: any;
  };
  children: React.ReactNode;
}

export function createBottomTabNavigator<T = Record<string, any>>() {
  const Screen: React.FC<TabScreenProps> = () => null;

  const Navigator: React.FC<TabNavigatorProps> = ({
    initialRouteName,
    screenOptions,
    children,
  }) => {
    const screens = useMemo(() => {
      const list: TabScreenProps[] = [];
      React.Children.forEach(children, child => {
        if (React.isValidElement(child) && child.props) {
          list.push(child.props as TabScreenProps);
        }
      });
      return list;
    }, [children]);

    const urlTab =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null;
    const [activeRoute, setActiveRoute] = useState<string>(
      urlTab || initialRouteName || (screens[0]?.name ?? 'Pantry'),
    );

    const navValue = useMemo(
      () => ({
        activeRoute,
        navigate: (routeName: string) => setActiveRoute(routeName),
      }),
      [activeRoute],
    );

    return (
      <NavContext.Provider value={navValue}>
        <View style={styles.container}>
          <View style={styles.contentArea}>
            {screens.map(screen => {
              const isFocused = activeRoute === screen.name;
              const Component = screen.component;
              return (
                <ScreenFocusContext.Provider key={screen.name} value={isFocused}>
                  <View
                    style={[
                      styles.screenSlot,
                      !isFocused ? styles.screenHidden : null,
                    ]}>
                    <Component />
                  </View>
                </ScreenFocusContext.Provider>
              );
            })}
          </View>

          <View style={[styles.defaultTabBar, screenOptions?.tabBarStyle]}>
            {screens.map(screen => {
              const focused = activeRoute === screen.name;
              const color = focused
                ? screenOptions?.tabBarActiveTintColor || '#0F2942'
                : screenOptions?.tabBarInactiveTintColor || '#94A3B8';

              const labelNode =
                typeof screen.options?.tabBarLabel === 'function' ? (
                  screen.options.tabBarLabel({ focused, color })
                ) : (
                  <Text style={[screenOptions?.tabBarLabelStyle, { color }]}>
                    {screen.options?.tabBarLabel ?? screen.name}
                  </Text>
                );

              return (
                <TouchableOpacity
                  key={screen.name}
                  style={styles.tabButton}
                  onPress={() => setActiveRoute(screen.name)}
                  activeOpacity={0.8}
                  testID={screen.options?.tabBarButtonTestID}>
                  {screen.options?.tabBarIcon?.({ focused, color, size: 22 })}
                  {labelNode}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </NavContext.Provider>
    );
  };

  return {
    Navigator,
    Screen,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  screenSlot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  screenHidden: {
    display: 'none',
  },
  defaultTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
