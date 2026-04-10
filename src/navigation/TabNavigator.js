import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import WorkScreen from '../screens/WorkScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { active: 'home', inactive: 'home-outline' },
  Work: { active: 'briefcase', inactive: 'briefcase-outline' },
  Chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const TAB_LABELS = {
  Home: 'Главная',
  Work: 'Заказы',
  Chat: 'Чат',
  Profile: 'Профиль',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarLabel: TAB_LABELS[route.name],
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          ...FONTS.medium,
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: SIZES.tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          ...SHADOWS.lg,
        },
        tabBarBadgeStyle: {
          backgroundColor: COLORS.accent,
          fontSize: 10,
          ...FONTS.bold,
          minWidth: 18,
          height: 18,
          lineHeight: 14,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Work"
        component={WorkScreen}
        options={{ tabBarBadge: 3 }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarBadge: 3 }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
