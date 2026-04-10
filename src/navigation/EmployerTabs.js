import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

import DashboardScreen from '../screens/employer/DashboardScreen';
import EmployerShiftsScreen from '../screens/employer/EmployerShiftsScreen';
import CreateShiftScreen from '../screens/employer/CreateShiftScreen';
import MessagesPlaceholder from '../screens/shared/MessagesPlaceholder';
import EmployerProfileScreen from '../screens/employer/EmployerProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = {
  Dashboard:      { active: 'grid',          inactive: 'grid-outline',          label: 'Главная' },
  EmployerShifts: { active: 'list',          inactive: 'list-outline',          label: 'Смены' },
  CreateShift:    { active: 'add-circle',    inactive: 'add-circle-outline',    label: 'Создать' },
  EmpMessages:    { active: 'chatbubbles',   inactive: 'chatbubbles-outline',   label: 'Чат' },
  EmpProfile:     { active: 'person',        inactive: 'person-outline',        label: 'Профиль' },
};

export default function EmployerTabs() {
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="EmployerShifts" component={EmployerShiftsScreen} />
      <Tab.Screen name="CreateShift" component={CreateShiftScreen} />
      <Tab.Screen name="EmpMessages" component={MessagesPlaceholder} />
      <Tab.Screen name="EmpProfile" component={EmployerProfileScreen} />
    </Tab.Navigator>
  );
}
