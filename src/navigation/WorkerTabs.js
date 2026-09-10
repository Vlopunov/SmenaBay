// Worker tabs: Смены · Мои смены · Чат · Профиль (four, not five — the feed
// and the map are one space with a view switch). A guest sees «Войти» in
// place of «Профиль», and «Мои смены» / «Чат» dimmed to tertiary: visible
// what is there, visible that it is empty for now.
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../design/TabBar';
import useStore from '../store/useStore';

import FeedScreen from '../screens/worker/FeedScreen';
import MyShiftsScreen from '../screens/worker/MyShiftsScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import SignInScreen from '../screens/auth/SignInScreen';

const Tab = createBottomTabNavigator();

export default function WorkerTabs() {
  const currentUser = useStore((s) => s.currentUser);
  const guest = !currentUser;
  const unreadChat = useStore((s) => (s.currentUser ? s.getUnreadChatCount() : 0));
  const myBadge = useStore((s) => (s.currentUser ? s.getMyShiftsBadge() : 0));

  const tabs = {
    Shifts: { label: 'Смены', icon: 'briefcase', iconActive: 'briefcase.fill' },
    MyShifts: { label: 'Мои смены', icon: 'ticket', iconActive: 'ticket.fill', muted: guest, badge: myBadge },
    Chat: { label: 'Чат', icon: 'bubble.left.and.bubble.right', iconActive: 'bubble.left.and.bubble.right.fill', muted: guest, badge: unreadChat },
    Profile: { label: guest ? 'Войти' : 'Профиль', icon: 'person.crop.circle', iconActive: 'person.crop.circle.fill' },
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tab.Screen name="Shifts" component={FeedScreen} />
      <Tab.Screen name="MyShifts" component={MyShiftsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={guest ? SignInScreen : WorkerProfileScreen} />
    </Tab.Navigator>
  );
}
