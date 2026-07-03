import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';

import './src/webAlert';
import { auth, isConfigured } from './src/firebase';
import { COLORS } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import AddEditShoeScreen from './src/screens/AddEditShoeScreen';
import ShoeDetailScreen from './src/screens/ShoeDetailScreen';
import SalesScreen from './src/screens/SalesScreen';

const Stack = createNativeStackNavigator();

function SetupHelpScreen() {
  return (
    <View style={styles.setup}>
      <Text style={styles.setupEmoji}>👟</Text>
      <Text style={styles.setupTitle}>Almost ready!</Text>
      <Text style={styles.setupText}>
        The app is not connected to Firebase yet, so it cannot save your stock.
      </Text>
      <Text style={styles.setupText}>
        Open the file <Text style={styles.setupBold}>firebaseConfig.js</Text> and
        paste your Firebase keys there. The{' '}
        <Text style={styles.setupBold}>README.md</Text> file explains every step
        in simple words — it takes about 10 minutes and is free.
      </Text>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setChecking(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (!isConfigured) {
    return <SetupHelpScreen />;
  }

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: COLORS.background },
          // On web the default back-arrow icon asset may not load, so show a
          // clear text chevron instead. No effect on phone builds.
          headerLeft:
            Platform.OS === 'web'
              ? (props) =>
                  props.canGoBack ? (
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700' }}>‹</Text>
                    </TouchableOpacity>
                  ) : null
              : undefined,
        })}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Inventory"
              component={InventoryScreen}
              options={{ title: 'Shoe Stock' }}
            />
            <Stack.Screen
              name="AddEditShoe"
              component={AddEditShoeScreen}
              options={({ route }) => ({
                title: route.params?.shoe ? 'Edit Shoes' : 'Add New Shoes',
              })}
            />
            <Stack.Screen
              name="ShoeDetail"
              component={ShoeDetailScreen}
              options={{ title: 'Shoe Details' }}
            />
            <Stack.Screen
              name="Sales"
              component={SalesScreen}
              options={{ title: 'Sales' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  setup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: COLORS.background,
  },
  setupEmoji: { fontSize: 56, marginBottom: 12 },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  setupText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 23,
  },
  setupBold: { fontWeight: '700', color: COLORS.text },
});
