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
import { ToastHost } from './src/design/Toast';
import { useFonts, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { registerForPush, unregisterPush, attachNotificationTaps, setBadge } from './src/services/push';
import { screen as trackScreen } from './src/services/telemetry';

function Heartbeat() {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const updateLastSeen = useStore(s => s.updateLastSeen);
  const startSync = useStore(s => s.startSync);
  const cleanupRef = useRef(null);

  // Pull from the server whether or not anyone is signed in: a guest is
  // looking at the same feed, just without a token.
  useEffect(() => {
    let stopped = false;
    startSync().then((stop) => {
      if (stopped) stop?.();
      else cleanupRef.current = stop;
    }).catch(err => console.warn('[sync]', err?.message));
    return () => {
      stopped = true;
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = null;
    };
  }, [isAuthenticated]);

  // «в сети» for the person on the other end of the chat.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return null;
}

/**
 * Push notifications: ask once someone is signed in (asking a guest to
 * allow notifications before they have anything to be notified about is
 * how permission prompts get denied), hand the token to the server, and
 * send a tapped notification to the screen it belongs to.
 */
function PushBridge() {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  const unread = useStore(s => (s.currentUser ? s.getUnreadCount() + s.getUnreadChatCount() : 0));

  useEffect(() => {
    if (!isAuthenticated) { unregisterPush(); return undefined; }
    registerForPush();
    return attachNotificationTaps((route) => {
      Linking.openURL(`com.smenabay.app://${route}`).catch(() => {});
    });
  }, [isAuthenticated]);

  useEffect(() => { setBadge(unread); }, [unread]);

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
  // Sign-in steps that are otherwise reached only through a live SMS.
  Object.assign(linking.config.screens, { Code: 'dev/code', Name: 'dev/name' });
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
  // -devApplyLater <shiftId>: apply 5 s after launch, while the shift is on
  // screen, so the button's «sent» morph can be recorded.
  useEffect(() => {
    const shiftId = devArg('devApplyLater');
    if (!shiftId) return;
    const t = setTimeout(() => useStore.getState().applyToShift(shiftId), 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const who = devArg('devUser');
    const approve = devArg('devApprove');
    const applyTo = devArg('devApply');
    if (!who && !approve && !applyTo) return undefined;
    // Everything here is a server round-trip now, so it runs in order.
    const run = async () => {
      const s = useStore.getState();
      if (who === 'guest') s.logout();
      else if (who && s.currentUser?.phone !== who) await s.login(who);

      if (approve) {
        const app = useStore.getState().applications.find((a) => a.id === approve);
        if (app && app.status === 'pending') await useStore.getState().approveApplication(approve);
      }

      // -devApply <shiftId>: apply as the dev user and get confirmed (pass state).
      if (applyTo && useStore.getState().currentUser?.role === 'worker') {
        await useStore.getState().applyToShift(applyTo);
        const me = useStore.getState().currentUser;
        const mine = useStore.getState().applications.find(
          (a) => a.shiftId === applyTo && a.workerId === me.id && a.status === 'pending'
        );
        if (mine) await useStore.getState().approveApplication(mine.id);
      }
    };
    if (useStore.persist.hasHydrated()) run();
    else return useStore.persist.onFinishHydration(run);
    return undefined;
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
        <NavigationContainer
          theme={navTheme}
          linking={linking}
          // Which screens people actually reach, so the funnel has context.
          onStateChange={(state) => {
            const route = state?.routes?.[state.index];
            const nested = route?.state?.routes?.[route.state.index];
            trackScreen(nested?.name || route?.name || 'unknown');
          }}
        >
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Heartbeat />
          <PushBridge />
          {__DEV__ ? <DevUser /> : null}
          <AppNavigator />
          <ToastHost />
          <ActionSheetHost />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// The display face is SF Pro Rounded on iOS (a system font); Android gets
// Nunito, bundled, one file per weight.
const useDisplayFonts = Platform.OS === 'android'
  ? () => useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black })[0]
  : () => true;

export default function App() {
  const fontsReady = useDisplayFonts();
  if (!fontsReady) return null;
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
