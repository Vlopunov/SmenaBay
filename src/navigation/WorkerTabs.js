// Worker tabs: Смены · Мои смены · Чат · Профиль. The feed and the map are
// one space with a view switch. A guest sees «Войти» in place of
// «Профиль»; «Мои смены» and «Чат» are muted but tappable — they open the
// «Нужен номер» sheet rather than an empty screen.
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../design/TabBar';
import useStore from '../store/useStore';
import PhoneSheet from '../components/PhoneSheet';

import FeedScreen from '../screens/worker/FeedScreen';
import MyShiftsScreen from '../screens/worker/MyShiftsScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import SignInScreen from '../screens/auth/SignInScreen';

const Tab = createBottomTabNavigator();

export default function WorkerTabs({ navigation }) {
  const currentUser = useStore((s) => s.currentUser);
  const guest = !currentUser;
  const unreadChat = useStore((s) => (s.currentUser ? s.getUnreadChatCount() : 0));
  const myBadge = useStore((s) => (s.currentUser ? s.getMyShiftsBadge() : 0));
  const [phoneSheet, setPhoneSheet] = useState(false);

  const tabs = {
    Shifts: { label: 'Смены', icon: 'briefcase', iconActive: 'briefcase.fill' },
    MyShifts: { label: 'Мои смены', icon: 'calendar.badge.checkmark', muted: guest, badge: myBadge },
    Chat: { label: 'Чат', icon: 'bubble.left', iconActive: 'bubble.left.fill', muted: guest, dot: unreadChat > 0 },
    Profile: guest
      ? { label: 'Войти', icon: 'rectangle.portrait.and.arrow.right' }
      : { label: 'Профиль', icon: 'person.crop.circle', iconActive: 'person.crop.circle.fill' },
  };

  const guardGuest = {
    tabPress: (e) => {
      if (!guest) return;
      e.preventDefault();
      setPhoneSheet(true);
    },
  };

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} tabs={tabs} />}
        screenOptions={{ headerShown: false, animation: 'fade', transitionSpec: { animation: 'timing', config: { duration: 200 } } }}
      >
        <Tab.Screen name="Shifts" component={FeedScreen} />
        <Tab.Screen name="MyShifts" component={MyShiftsScreen} listeners={guardGuest} />
        <Tab.Screen name="Chat" component={ChatListScreen} listeners={guardGuest} />
        <Tab.Screen name="Profile" component={guest ? SignInScreen : WorkerProfileScreen} />
      </Tab.Navigator>
      {guest ? (
        <PhoneSheet
          visible={phoneSheet}
          onClose={() => setPhoneSheet(false)}
          navigation={navigation}
          intent={null}
          title="Нужен номер"
          text="Смены, отклики и переписка с заказчиками появятся после входа. Смотреть ленту можно и без него."
        />
      ) : null}
    </>
  );
}
