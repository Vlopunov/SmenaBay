import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useStore from '../store/useStore';

import AuthStack from './AuthStack';
import WorkerTabs from './WorkerTabs';
import EmployerTabs from './EmployerTabs';

import ShiftDetailScreen from '../screens/shared/ShiftDetailScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import WriteReviewScreen from '../screens/shared/WriteReviewScreen';
import PublicCompanyProfileScreen from '../screens/shared/PublicCompanyProfileScreen';
import PublicWorkerProfileScreen from '../screens/shared/PublicWorkerProfileScreen';
import ManageApplicationsScreen from '../screens/employer/ManageApplicationsScreen';

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
      <Stack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="PublicCompanyProfile" component={PublicCompanyProfileScreen} />
      <Stack.Screen name="PublicWorkerProfile" component={PublicWorkerProfileScreen} />
      <Stack.Screen name="ManageApplications" component={ManageApplicationsScreen} />
    </Stack.Navigator>
  );
}
