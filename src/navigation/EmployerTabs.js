// Employer tabs: Сводка · Смены · Чат · Профиль. «Создать смену» is not a tab
// any more — the tab bar is navigation only; creating lives in the
// dashboard toolbar as a round accent button.
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../design/TabBar';
import useStore from '../store/useStore';

import DashboardScreen from '../screens/employer/DashboardScreen';
import EmployerShiftsScreen from '../screens/employer/EmployerShiftsScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import EmployerProfileScreen from '../screens/employer/EmployerProfileScreen';

const Tab = createBottomTabNavigator();

export default function EmployerTabs() {
  const unreadChat = useStore((s) => s.getUnreadChatCount());
  const pending = useStore((s) => {
    const uid = s.currentUser?.id;
    const own = new Set(s.shifts.filter((sh) => sh.companyId === uid && sh.status === 'active').map((sh) => sh.id));
    return s.applications.filter((a) => own.has(a.shiftId) && a.status === 'pending').length;
  });

  const tabs = {
    Dashboard: { label: 'Сводка', icon: 'chart.bar', iconActive: 'chart.bar.fill' },
    EmpShifts: { label: 'Смены', icon: 'briefcase', iconActive: 'briefcase.fill', badge: pending },
    EmpChat: { label: 'Чат', icon: 'bubble.left.and.bubble.right', iconActive: 'bubble.left.and.bubble.right.fill', badge: unreadChat },
    EmpProfile: { label: 'Профиль', icon: 'person.crop.circle', iconActive: 'person.crop.circle.fill' },
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="EmpShifts" component={EmployerShiftsScreen} />
      <Tab.Screen name="EmpChat" component={ChatListScreen} />
      <Tab.Screen name="EmpProfile" component={EmployerProfileScreen} />
    </Tab.Navigator>
  );
}
