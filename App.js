import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts as useUnbounded, Unbounded_600SemiBold, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { useFonts as useOnest, Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
import { useFonts as useBonaNova, BonaNova_400Regular_Italic } from '@expo-google-fonts/bona-nova';
import { useFonts as useSpaceMono, SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import AppNavigator from './src/navigation/AppNavigator';
import useStore from './src/store/useStore';
import { COLORS } from './src/constants/theme';

function Heartbeat() {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const updateLastSeen = useStore(s => s.updateLastSeen);
  const initializeFromFirestore = useStore(s => s.initializeFromFirestore);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);

    initializeFromFirestore()
      .then(cleanup => { cleanupRef.current = cleanup; })
      .catch(err => { console.warn('[Heartbeat init]', err?.message); });

    return () => {
      clearInterval(interval);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  const [unboundedLoaded] = useUnbounded({ Unbounded_600SemiBold, Unbounded_700Bold });
  const [onestLoaded] = useOnest({ Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold });
  const [bonaLoaded] = useBonaNova({ BonaNova_400Regular_Italic });
  const [monoLoaded] = useSpaceMono({ SpaceMono_400Regular });

  const fontsReady = unboundedLoaded && onestLoaded && bonaLoaded && monoLoaded;

  if (!fontsReady) {
    // Splash-style loader on parchment background while fonts hydrate
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, color: COLORS.ink, fontWeight: '700', letterSpacing: -1 }}>
          смена·бел
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Heartbeat />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
