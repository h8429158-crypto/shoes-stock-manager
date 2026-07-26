import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from '@/navigation/types';
import { Tabs } from '@/navigation/Tabs';
import { ActiveWorkoutScreen } from '@/screens/ActiveWorkoutScreen';
import { ExercisePickerScreen } from '@/screens/ExercisePickerScreen';
import { PlateCalculatorScreen } from '@/screens/PlateCalculatorScreen';
import { useTheme } from '@/theme/useTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const t = useTheme();
  const base = t.mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme: NavTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: t.primary,
      background: t.bg,
      card: t.surface,
      text: t.text,
      border: t.border,
      notification: t.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="Main" component={Tabs} />
        <Stack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ExercisePicker"
          component={ExercisePickerScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="PlateCalculator" component={PlateCalculatorScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
