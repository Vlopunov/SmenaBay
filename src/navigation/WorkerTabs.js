import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FAMILIES } from '../constants/theme';
import { Icon } from '../components/ui/Atoms';
import useStore from '../store/useStore';

import FeedScreen from '../screens/worker/FeedScreen';
import MapScreen from '../screens/worker/MapScreen';
import MyShiftsScreen from '../screens/worker/MyShiftsScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = {
  Feed:          { icon: 'search', label: 'Лента' },
  Map:           { icon: 'map',    label: 'Карта' },
  MyShifts:      { icon: 'cal',    label: 'Мои' },
  Chat:          { icon: 'chat',   label: 'Чат' },
  WorkerProfile: { icon: 'user',   label: 'Я' },
};

function TabIcon({ focused, route, badge }) {
  const tab = TABS[route];
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <View
        style={{
          width: 36, height: 36, borderRadius: 999,
          backgroundColor: focused ? COLORS.ink : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon
          name={tab.icon}
          size={20}
          color={focused ? COLORS.signal : COLORS.fgMuted}
          strokeWidth={focused ? 2 : 1.6}
        />
      </View>
      {badge > 0 && (
        <View style={{
          position: 'absolute', top: 0, right: -4,
          minWidth: 16, height: 16, paddingHorizontal: 4,
          borderRadius: 999, backgroundColor: COLORS.live,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: COLORS.paper,
        }}>
          <Text style={{ fontFamily: FAMILIES.textBold, fontSize: 9, color: COLORS.white }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function WorkerTabs() {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const conversations = useStore(s => s.conversations);
  const unreadChat = conversations
    .filter(c => c.workerId === currentUser?.id || c.companyId === currentUser?.id)
    .reduce((total, c) => total + c.messages.filter(m => m.senderId !== currentUser?.id && !m.read).length, 0);

  const bottomPadding = Math.max(insets.bottom, 12);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} route={route.name} badge={route.name === 'Chat' ? unreadChat : 0} />
        ),
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontFamily: focused ? FAMILIES.textSemi : FAMILIES.textMed,
            fontSize: 10,
            color: focused ? COLORS.ink : COLORS.fgFaint,
            letterSpacing: 0.2,
            marginTop: -2,
          }}>
            {TABS[route.name]?.label}
          </Text>
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.paper,
          borderTopWidth: 1,
          borderTopColor: COLORS.line,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          elevation: 0,
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="MyShifts" component={MyShiftsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="WorkerProfile" component={WorkerProfileScreen} />
    </Tab.Navigator>
  );
}
