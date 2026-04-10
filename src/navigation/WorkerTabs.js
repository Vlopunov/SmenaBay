import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

import FeedScreen from '../screens/worker/FeedScreen';
import MapScreen from '../screens/worker/MapScreen';
import MyShiftsScreen from '../screens/worker/MyShiftsScreen';
import MessagesPlaceholder from '../screens/shared/MessagesPlaceholder';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = {
  Feed:    { active: 'search',        inactive: 'search-outline',        label: 'Поиск' },
  Map:     { active: 'map',           inactive: 'map-outline',           label: 'Карта' },
  MyShifts:{ active: 'calendar',      inactive: 'calendar-outline',      label: 'Мои смены' },
  Messages:{ active: 'chatbubbles',   inactive: 'chatbubbles-outline',   label: 'Чат' },
  WorkerProfile: { active: 'person',  inactive: 'person-outline',        label: 'Профиль' },
};

export default function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS[route.name];
          return <Ionicons name={focused ? tab.active : tab.inactive} size={24} color={color} />;
        },
        tabBarLabel: TABS[route.name]?.label,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: { fontSize: 11, ...FONTS.medium, marginTop: -2 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: SIZES.tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          ...SHADOWS.lg,
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="MyShifts" component={MyShiftsScreen} />
      <Tab.Screen name="Messages" component={MessagesPlaceholder} />
      <Tab.Screen name="WorkerProfile" component={WorkerProfileScreen} />
    </Tab.Navigator>
  );
}
