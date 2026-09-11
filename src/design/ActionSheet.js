// Action menus: the native UIActionSheet on iOS (Apple canon — no Alert with
// a list of buttons). Android's Alert shows at most three buttons, so there
// the same options are rendered in our own sheet via a host at the app root.
import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Platform, View } from 'react-native';
import Sheet from './Sheet';
import T from './Text';
import { Press, Divider } from './ui';

let listener = null;

/**
 * showActions({ title, message, options: [{ label, destructive, onPress }] })
 */
export function showActions({ title, message, options, cancelLabel = 'Отмена' }) {
  if (Platform.OS === 'ios') {
    const labels = [...options.map((o) => o.label), cancelLabel];
    const destructive = options.map((o, i) => (o.destructive ? i : -1)).filter((i) => i >= 0);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title, message, options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: destructive.length ? destructive : undefined,
      },
      (i) => { if (i < options.length) options[i].onPress?.(); },
    );
    return;
  }
  listener?.({ title, message, options, cancelLabel });
}

export function ActionSheetHost() {
  const [req, setReq] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    listener = (r) => { setReq(r); setVisible(true); };
    return () => { listener = null; };
  }, []);
  if (Platform.OS === 'ios' || !req) return null;
  const pick = (o) => { setVisible(false); setTimeout(() => o?.onPress?.(), 320); };
  return (
    <Sheet visible={visible} onClose={() => setVisible(false)}>
      {req.title ? <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 4 }}>{req.title}</T> : null}
      {req.message ? <T v="caption" c="secondary" style={{ paddingHorizontal: 22, paddingBottom: 8 }}>{req.message}</T> : null}
      {req.options.map((o) => (
        <View key={o.label}>
          <Press onPress={() => pick(o)} feedback="highlight" style={{ paddingHorizontal: 22, paddingVertical: 15 }}>
            <T v="value" c={o.destructive ? 'destructive' : 'label'} style={{ fontSize: 17, lineHeight: 22 }}>{o.label}</T>
          </Press>
          <Divider style={{ marginHorizontal: 20 }} />
        </View>
      ))}
      <Press onPress={() => pick(null)} feedback="highlight" style={{ paddingHorizontal: 22, paddingVertical: 15 }}>
        <T v="bodyStrong" c="accent" style={{ fontSize: 17, lineHeight: 22 }}>{req.cancelLabel}</T>
      </Press>
    </Sheet>
  );
}
