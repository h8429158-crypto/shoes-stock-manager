import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WorkoutStackParamList } from '@/navigation/types';
import { SplitListScreen } from '@/screens/workout/SplitListScreen';
import { SplitEditorScreen } from '@/screens/workout/SplitEditorScreen';
import { DayEditorScreen } from '@/screens/workout/DayEditorScreen';
import { useTheme } from '@/theme/useTheme';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export function WorkoutStack() {
  const t = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="SplitList" component={SplitListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SplitEditor" component={SplitEditorScreen} options={{ title: 'Edit Split' }} />
      <Stack.Screen name="DayEditor" component={DayEditorScreen} options={{ title: 'Edit Day' }} />
    </Stack.Navigator>
  );
}
