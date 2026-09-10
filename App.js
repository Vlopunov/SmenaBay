import React, { useEffect, useRef } from 'react';
import { Linking, Platform, Settings } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, getStateFromPath as parsePath } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import useStore from './src/store/useStore';
import { ThemeProvider, useTheme } from './src/design/theme';
import { ActionSheetHost } from './src/design/ActionSheet';

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

// Deep links: com.smenabay.app://shift/s1 opens that shift. Push
// notifications and shared links land on the right screen through these.
const linking = {
  prefixes: ['com.smenabay.app://', 'smenabay://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Shifts: 'shifts', MyShifts: 'my', Chat: 'chats', Profile: 'profile',
          Dashboard: 'dashboard', EmpShifts: 'emp/shifts', EmpChat: 'emp/chats', EmpProfile: 'emp/profile',
        },
      },
      ShiftDetail: 'shift/:shiftId',
      ShiftManage: 'manage/:shiftId',
      Applications: 'applications/:shiftId',
      RateShift: 'rate/:shiftId',
      ChatConversation: 'chat/:conversationId',
      Notifications: 'notifications',
      CreateShift: 'create',
      SignIn: 'signin',
      FAQ: 'help',
      PersonalData: 'me',
      SavedShifts: 'saved',
      PublicCompanyProfile: 'company/:companyId',
      PublicWorkerProfile: 'worker/:workerId',
      Plans: 'plan',
      Locations: 'locations',
      Favorites: 'favorites',
      WorkerDirectory: 'workers',
      CompanyData: 'company-data',
      RegisterEmployer: 'employer',
    },
  },
  // «rate/<shift>» without a worker is the worker rating the company. An
  // employer rates a person, so for them it opens the shift to pick whom.
  getStateFromPath(path, options) {
    const rate = path.match(/^\/?rate\/([^/?#]+)(\?.*)?$/);
    const employer = useStore.getState().currentUser?.role === 'employer';
    if (rate && employer && !/[?&]workerId=/.test(rate[2] || '')) return parsePath(`manage/${rate[1]}`, options);
    return parsePath(path, options);
  },
};

// Development only: launch arguments open a screen as a given user, so every
// state can be checked on a simulator without tapping through the flow:
//   xcrun simctl launch <udid> com.smenabay.app --initialUrl http://localhost:8081 \
//     -devUser +375291234567 -devRoute shift/s7
// `__DEV__` is false in release bundles, so none of this ships.
const devArg = (key) => (__DEV__ && Platform.OS === 'ios' ? Settings.get(key) : null);
if (__DEV__) {
  const route = devArg('devRoute');
  linking.getInitialURL = async () => (route ? `com.smenabay.app://${route}` : Linking.getInitialURL());
}

function DevUser() {
  // -devPush <route> opens a second screen over the first, the way a tap
  // would (a modal presented over the tabs, not as the launch screen).
  useEffect(() => {
    const push = devArg('devPush');
    if (!push) return;
    const t = setTimeout(() => Linking.openURL(`com.smenabay.app://${push}`), 2500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const who = devArg('devUser');
    const approve = devArg('devApprove');
    if (!who && !approve) return;
    const apply = () => {
      const s = useStore.getState();
      if (who === 'guest') s.logout();
      else if (who && s.currentUser?.phone !== who) s.login(who);
      const app = approve && s.applications.find((a) => a.id === approve);
      if (app && app.status === 'pending') s.approveApplication(approve);
    };
    if (useStore.persist.hasHydrated()) apply();
    else return useStore.persist.onFinishHydration(apply);
  }, []);
  return null;
}

function Root() {
  const { c, dark } = useTheme();
  // Navigation surfaces take the ledger colour so pushes and modals never
  // flash white in dark mode.
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.ledger,
      card: c.ledger,
      text: c.label,
      border: c.separator,
      notification: c.destructive,
    },
  };
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.ledger }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme} linking={linking}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Heartbeat />
          {__DEV__ ? <DevUser /> : null}
          <AppNavigator />
          <ActionSheetHost />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
