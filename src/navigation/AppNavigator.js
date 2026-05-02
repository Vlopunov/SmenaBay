import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useStore from '../store/useStore';

import AuthStack from './AuthStack';
import WorkerTabs from './WorkerTabs';
import EmployerTabs from './EmployerTabs';

// Shared screens
import ShiftDetailScreen from '../screens/shared/ShiftDetailScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import WriteReviewScreen from '../screens/shared/WriteReviewScreen';
import PublicCompanyProfileScreen from '../screens/shared/PublicCompanyProfileScreen';
import PublicWorkerProfileScreen from '../screens/shared/PublicWorkerProfileScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import FAQScreen from '../screens/shared/FAQScreen';

// Worker screens
import WorkerSettingsScreen from '../screens/worker/WorkerSettingsScreen';
import SavedShiftsScreen from '../screens/worker/SavedShiftsScreen';

// Employer screens
import ManageApplicationsScreen from '../screens/employer/ManageApplicationsScreen';
import EmployerSettingsScreen from '../screens/employer/EmployerSettingsScreen';
import PlansScreen from '../screens/employer/PlansScreen';
import LocationsScreen from '../screens/employer/LocationsScreen';
import FavoritesScreen from '../screens/employer/FavoritesScreen';
import WorkerDirectoryScreen from '../screens/employer/WorkerDirectoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const currentUser = useStore(s => s.currentUser);

  if (!currentUser) {
    return <AuthStack />;
  }

  const isEmployer = currentUser.role === 'employer';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MainTabs"
        component={isEmployer ? EmployerTabs : WorkerTabs}
      />
      {/* Shared */}
      <Stack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="PublicCompanyProfile" component={PublicCompanyProfileScreen} />
      <Stack.Screen name="PublicWorkerProfile" component={PublicWorkerProfileScreen} />
      <Stack.Screen name="ChatConversation" component={ChatScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      {/* Worker */}
      <Stack.Screen name="Settings" component={isEmployer ? EmployerSettingsScreen : WorkerSettingsScreen} />
      <Stack.Screen name="SavedShifts" component={SavedShiftsScreen} />
      {/* Employer */}
      <Stack.Screen name="ManageApplications" component={ManageApplicationsScreen} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="Locations" component={LocationsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="WorkerDirectory" component={WorkerDirectoryScreen} />
    </Stack.Navigator>
  );
}
