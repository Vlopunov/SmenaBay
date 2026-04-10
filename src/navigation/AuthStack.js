import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import RegisterWorkerScreen from '../screens/auth/RegisterWorkerScreen';
import RegisterEmployerScreen from '../screens/auth/RegisterEmployerScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="RegisterWorker" component={RegisterWorkerScreen} />
      <Stack.Screen name="RegisterEmployer" component={RegisterEmployerScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
