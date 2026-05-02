import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';
import useStore from '../store/useStore';

import FeedScreen from '../screens/worker/FeedScreen';
import MapScreen from '../screens/worker/MapScreen';
import MyShiftsScreen from '../screens/worker/MyShiftsScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = {
  Feed:    { active: 'search',        inactive: 'search-outline',        label: 'Поиск' },
  Map:     { active: 'map',           inactive: 'map-outline',           label: 'Карта' },
  MyShifts:{ active: 'calendar',      inactive: 'calendar-outline',      label: 'Мои смены' },
  Chat:    { active: 'chatbubbles',   inactive: 'chatbubbles-outline',   label: 'Чат' },
  WorkerProfile: { active: 'person',  inactive: 'person-outline',        label: 'Профиль' },
};

export default function WorkerTabs() {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const conversations = useStore(s => s.conversations);
  const unreadChat = conversations
    .filter(c => c.workerId === currentUser?.id || c.companyId === currentUser?.id)
    .reduce((total, c) => total + c.messages.filter(m => m.senderId !== currentUser?.id && !m.read).length, 0);

  const bottomPadding = Math.max(insets.bottom, 12);
  const tabBarHeight = 56 + bottomPadding;

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
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          ...SHADOWS.lg,
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="MyShifts" component={MyShiftsScreen} />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarBadge: unreadChat > 0 ? unreadChat : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.error,
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 17,
            borderRadius: 9,
          },
        }}
      />
      <Tab.Screen name="WorkerProfile" component={WorkerProfileScreen} />
    </Tab.Navigator>
  );
}
