import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import useStore from './src/store/useStore';

function Heartbeat() {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const updateLastSeen = useStore(s => s.updateLastSeen);
  const initializeFromFirestore = useStore(s => s.initializeFromFirestore);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);

    // Initialize Firestore sync (loads data + sets up real-time listeners)
    initializeFromFirestore().then(cleanup => {
      cleanupRef.current = cleanup;
    });

    return () => {
      clearInterval(interval);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Heartbeat />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
