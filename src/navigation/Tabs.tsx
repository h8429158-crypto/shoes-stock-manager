import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { TabParamList } from '@/navigation/types';
import { HomeScreen } from '@/screens/HomeScreen';
import { WorkoutStack } from '@/navigation/WorkoutStack';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useTheme } from '@/theme/useTheme';

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Workout: 'barbell',
  History: 'calendar',
  Progress: 'stats-chart',
  Settings: 'settings',
};

export function Tabs() {
  const t = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.faint,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? icons[route.name] : (`${icons[route.name]}-outline` as keyof typeof Ionicons.glyphMap)}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workout" component={WorkoutStack} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
