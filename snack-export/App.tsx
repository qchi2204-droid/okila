import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import AddScreen from './src/screens/AddScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/constants/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Stats: '📊',
  Add: '+',
  Settings: '⚙️',
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: '#CCCCCC',
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter_500Medium' },
            tabBarIcon: ({ focused }) => {
              if (route.name === 'Add') {
                return (
                  <View style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                  </View>
                );
              }
              return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{TAB_ICONS[route.name]}</Text>;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
          <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Thống kê' }} />
          <Tab.Screen
            name="Add"
            component={AddScreen}
            options={{ title: '', tabBarLabel: () => null }}
          />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopColor: colors.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '700',
    marginTop: -2,
  },
});
