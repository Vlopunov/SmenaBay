// Root stack. There is no onboarding and no auth wall: a guest lands on the
// shift feed, and sign-in is pushed on top only when an action needs it
// (handoff: «Классического онбординга нет»).
import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useStore from '../store/useStore';

import WorkerTabs from './WorkerTabs';
import EmployerTabs from './EmployerTabs';

// Auth
import SignInScreen from '../screens/auth/SignInScreen';
import CodeScreen from '../screens/auth/CodeScreen';
import NameScreen from '../screens/auth/NameScreen';
import RegisterEmployerScreen from '../screens/auth/RegisterEmployerScreen';

// Shared
import ShiftDetailScreen from '../screens/shared/ShiftDetailScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import RateShiftScreen from '../screens/shared/RateShiftScreen';
import PublicCompanyProfileScreen from '../screens/shared/PublicCompanyProfileScreen';
import PublicWorkerProfileScreen from '../screens/shared/PublicWorkerProfileScreen';
import FAQScreen from '../screens/shared/FAQScreen';

// Worker
import WorkerSettingsScreen from '../screens/worker/WorkerSettingsScreen';
import SavedShiftsScreen from '../screens/worker/SavedShiftsScreen';

// Employer
import CreateShiftScreen from '../screens/employer/CreateShiftScreen';
import ManageApplicationsScreen from '../screens/employer/ManageApplicationsScreen';
import ShiftManageScreen from '../screens/employer/ShiftManageScreen';
import EmployerSettingsScreen from '../screens/employer/EmployerSettingsScreen';
import PlansScreen from '../screens/employer/PlansScreen';
import LocationsScreen from '../screens/employer/LocationsScreen';
import FavoritesScreen from '../screens/employer/FavoritesScreen';
import WorkerDirectoryScreen from '../screens/employer/WorkerDirectoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const role = useStore((s) => s.currentUser?.role);
  const isEmployer = role === 'employer';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, fullScreenGestureEnabled: true }}>
      <Stack.Screen name="Tabs" component={isEmployer ? EmployerTabs : WorkerTabs} />

      {/* Sign-in, pushed only when an action needs an account */}
      <Stack.Screen name="SignIn" component={SignInScreen} initialParams={{ pushed: true }} />
      <Stack.Screen name="Code" component={CodeScreen} />
      <Stack.Screen name="Name" component={NameScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="RegisterEmployer" component={RegisterEmployerScreen} />

      {/* Shared */}
      <Stack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
      <Stack.Screen name="ChatConversation" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="RateShift" component={RateShiftScreen} />
      <Stack.Screen name="PublicCompanyProfile" component={PublicCompanyProfileScreen} />
      <Stack.Screen name="PublicWorkerProfile" component={PublicWorkerProfileScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />

      {/* Worker */}
      <Stack.Screen name="PersonalData" component={WorkerSettingsScreen} />
      <Stack.Screen name="SavedShifts" component={SavedShiftsScreen} />

      {/* Employer */}
      <Stack.Screen
        name="CreateShift"
        component={CreateShiftScreen}
        options={{ presentation: Platform.OS === 'ios' ? 'modal' : 'card', gestureEnabled: true }}
      />
      <Stack.Screen name="Applications" component={ManageApplicationsScreen} />
      <Stack.Screen name="ShiftManage" component={ShiftManageScreen} />
      <Stack.Screen name="CompanyData" component={EmployerSettingsScreen} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="Locations" component={LocationsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="WorkerDirectory" component={WorkerDirectoryScreen} />
    </Stack.Navigator>
  );
}
