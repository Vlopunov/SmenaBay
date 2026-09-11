// The pass: a confirmed shift becomes a thing in hand. The metaphor lives
// in structure and motion — a sky header and a countdown. No paper, no
// perforation, no barcodes.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, useReducedMotion, Easing,
} from 'react-native-reanimated';
import T from './Text';
import Icon from './Icon';
import Money from './Money';
import { Press, Progress } from './ui';
import { useTheme } from './theme';
import { SkyView, Sheen, skyKey } from './Sky';
import { StatusBadge } from './Status';
import { shiftStart, shiftEnd, dayLabel, timeRange, hours, plural } from './format';
import { haptic } from './haptics';

/** Re-renders on a clock; the countdown is derived from the shift start. */
export function useNow(intervalMs = 10000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function span(ms, withSeconds) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d >= 2) return `${d} ${plural(d, ['день', 'дня', 'дней'])} ${h} ч`;
  if (d === 1) return `${24 + h} ч ${m} мин`;
  if (h > 0) return `${h} ч ${m} мин`;
  return withSeconds ? `${m} мин ${String(s).padStart(2, '0')} с` : `${m} мин`;
}

/**
 * Phase of a confirmed shift and its words.
 * → { phase: 'before'|'running'|'ended', label, value, progress, endedAt }
 */
export function passClock(shift, now = new Date()) {
  const start = shiftStart(shift);
  const end = shiftEnd(shift);
  if (now < start) {
    const diff = start - now;
    return { phase: 'before', label: 'Начнётся через', value: span(diff, diff < 3600 * 1000), soon: diff < 2 * 3600 * 1000 };
  }
  if (now < end) {
    return { phase: 'running', label: 'Осталось', value: span(end - now, false), progress: ((now - start) / (end - start)) * 100 };
  }
  return { phase: 'ended', label: `Закончилась в ${shift.timeEnd}`, value: 'Оцени смену' };
}

export function whenLine(shift, now = new Date()) {
  return `${dayLabel(shift.date, now)} · ${timeRange(shift)}`;
}

/** timing.number: each new countdown value surfaces over 400 ms (tabular
 *  digits, so the width never jumps). Reduce Motion: instant. */
export function Ticking({ value, children }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    o.value = 0.72;
    o.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [value, reduced, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={st}>{children}</Animated.View>;
}

/** Just confirmed: the sky grows 62 → 126, the countdown rises, one sheen. */
function useGrow(play) {
  const reduced = useReducedMotion();
  const sky = useSharedValue(play && !reduced ? 0.49 : 1);
  const count = useSharedValue(play ? 0 : 1);
  useEffect(() => {
    if (!play) return;
    haptic.success();
    // The card may already be on screen (tab visited earlier): start from
    // the collapsed pose every time the moment plays.
    count.value = 0;
    if (reduced) {
      count.value = withTiming(1, { duration: 200 });
      return;
    }
    sky.value = 0.49;
    sky.value = withSpring(1, { damping: 20, stiffness: 400, mass: 1 });
    count.value = withDelay(200, withSpring(1, { damping: 20, stiffness: 400, mass: 1 }));
  }, [play, reduced, sky, count]);
  const skyStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: sky.value }] }));
  const countStyle = useAnimatedStyle(() => ({ opacity: count.value, transform: reduced ? [] : [{ translateY: (1 - count.value) * 14 }] }));
  return { skyStyle, countStyle };
}

/** Large pass (Мои смены, the top of «Мои смены»). */
export default function PassCard({ shift, company, location, onPress, onRate, now: nowProp, celebrate, style }) {
  const t = useTheme();
  const { c } = t;
  const tick = useNow(1000);
  const now = nowProp || tick;
  const clockState = passClock(shift, now);
  const ended = clockState.phase === 'ended';
  const running = clockState.phase === 'running';
  const s = t.sky(ended ? 'closed' : skyKey(shift, { ignoreClosed: true }));
  const { skyStyle, countStyle } = useGrow(!!celebrate && !ended);

  const badge = ended
    ? <StatusBadge state="done" label="Выполнена" size="sm" />
    : running
      ? <StatusBadge state="running" label="Идёт" size="sm" />
      : <StatusBadge state="confirmed" size="sm" style={{ backgroundColor: c.surface, opacity: 0.94 }} />;

  const a11y = ended
    ? `Смена выполнена. ${shift.title}. Оцени смену`
    : `Смена подтверждена. ${clockState.label} ${clockState.value}. ${shift.title}, ${whenLine(shift, now)}`;

  return (
    <Press onPress={onPress} scaleTo={0.985} accessibilityLabel={a11y} style={[{ borderRadius: 24 }, !ended && t.sh.e2, style]}>
      <View style={[{ borderRadius: 24, overflow: 'hidden', backgroundColor: c.surface }, ended && { borderWidth: 1, borderColor: c.line }]}>
        <View style={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
          <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, transformOrigin: 'top' }, skyStyle]}>
            <SkyView sky={s} style={{ flex: 1 }}>
              {celebrate && !ended ? <Sheen delay={300} /> : null}
            </SkyView>
          </Animated.View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {badge}
            <T v="caption" c={s.ink2} weight="700">Пропуск</T>
          </View>
          <Animated.View style={[{ marginTop: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }, countStyle]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="caption" c={s.ink2} weight="600">{clockState.label}</T>
              <Ticking value={clockState.value}>
                <T v="countdown" c={s.ink} style={{ marginTop: 3, fontSize: ended ? 26 : 34, lineHeight: ended ? 30 : 38 }}>{clockState.value}</T>
              </Ticking>
              {running ? <Progress value={clockState.progress} color={s.ink} track={c.onSky} height={6} style={{ marginTop: 10 }} /> : null}
            </View>
            {!ended ? <Money value={shift.pay} size="card" fontSize={26} c={s.ink} suffixC={s.ink2} /> : null}
          </Animated.View>
        </View>
        <View style={{ backgroundColor: c.surface, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {ended ? (
            <Press onPress={onRate} feedback="none" style={{ flexDirection: 'row', gap: 5, flex: 1 }} accessibilityLabel="Оценить смену">
              {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star.fill" size={22} c={c.line} />)}
            </Press>
          ) : (
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="rowTitle" style={{ fontSize: 16.5, lineHeight: 20 }} numberOfLines={2}>{shift.title}</T>
              <T v="caption" c="ink2" style={{ marginTop: 3 }} numberOfLines={2}>
                {whenLine(shift, now)}{location?.address ? ` · ${location.address}` : ''}
              </T>
            </View>
          )}
          <Icon name="chevron.right" size={16} c="ink2" weight="semibold" style={{ opacity: 0.7 }} />
        </View>
      </View>
    </Press>
  );
}

/** Compact pass: a row with a sky tile and the countdown on the right. */
export function PassCompact({ shift, onPress, style }) {
  const t = useTheme();
  const now = useNow(30000);
  const st = passClock(shift, now);
  return (
    <Press onPress={onPress} scaleTo={0.985} style={[{ backgroundColor: t.c.surface, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, paddingHorizontal: 12 }, t.sh.e1, style]}>
      <SkyView sky={skyKey(shift, { ignoreClosed: true })} radius={12} style={{ width: 36, height: 36 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="rowTitle" style={{ fontSize: 14, lineHeight: 17 }} numberOfLines={1}>{shift.title}</T>
        <T v="caption" c="ink2" style={{ fontSize: 11.5, lineHeight: 15, marginTop: 2 }}>{`${dayLabel(shift.date, now)} ${shift.timeStart} · ${shift.pay} BYN`}</T>
      </View>
      <T v="moneyInline" c="success" style={{ fontSize: 13, lineHeight: 16 }}>{st.phase === 'before' ? st.value : st.phase === 'running' ? 'идёт' : 'выполнена'}</T>
    </Press>
  );
}

/** Legacy export kept for screens that render a countdown line. */
export function Countdown({ shift }) {
  const now = useNow(1000);
  const st = passClock(shift, now);
  return <T v="bodyStrong">{`${st.label} ${st.phase === 'ended' ? '' : st.value}`}</T>;
}

export { hours };
