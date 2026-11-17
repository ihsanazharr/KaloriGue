import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CalendarDays, User } from 'lucide-react-native';
import { colors, shadow } from '../constants/theme';
import { useApp } from '../data/dummyData';

import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FoodSearchScreen from '../screens/FoodSearchScreen';
import ActivityScreen from '../screens/ActivityScreen';
import CalorieDetailScreen from '../screens/CalorieDetailScreen';
import ManualFoodScreen from '../screens/ManualFoodScreen';
import HydrationScreen from '../screens/HydrationScreen';
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = {
  Dashboard: { label: 'Beranda', Icon: Home },
  History: { label: 'Riwayat', Icon: CalendarDays },
  Profile: { label: 'Profil', Icon: User },
};

function FloatingTabBar({ state, navigation }) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { label, Icon } = TABS[route.name];
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.item, focused && styles.itemActive]}
          >
            <Icon size={20} color={focused ? colors.olive : 'rgba(255,255,255,0.75)'} strokeWidth={focused ? 2.6 : 2} />
            <Text style={[styles.label, { color: focused ? colors.olive : 'rgba(255,255,255,0.75)' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { ready, onboarded } = useApp();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.olive }} />;

  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.white } }}>
      <Stack.Navigator initialRouteName={onboarded ? 'MainTabs' : 'Onboarding'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="CalorieDetail" component={CalorieDetailScreen} />
        <Stack.Screen name="ManualFood" component={ManualFoodScreen} />
        <Stack.Screen name="Hydration" component={HydrationScreen} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 64,
    borderRadius: 99,
    backgroundColor: colors.olive,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
    ...shadow,
  },
  item: { flex: 1, height: 48, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  itemActive: { backgroundColor: colors.lime },
  label: { fontSize: 12, fontWeight: '800' },
});