import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';

export const colors = {
  olive: '#364C23',
  lime: '#D7CD00',
  charcoal: '#2B2B2B',
  text: '#1E1E1E',
  white: '#FFFFFF',
  surface: '#F4F5F2',
  border: '#E6E8E2',
  muted: '#6B7062',
  softGreen: '#E3EBD6',
  danger: '#C0392B',
  orange: '#F4A261',
  mint: '#A8D5BA',
};

export const radius = { card: 20, pill: 99 };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};

export const num = { fontVariant: ['tabular-nums'], fontWeight: '800' };

export const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: 16,
};

// 1250 -> "1.250"
export const fmt = (n) =>
  Math.round(Number(n) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// 62.5 -> "62,5"
export const fmt1 = (n) => (Math.round((Number(n) || 0) * 10) / 10).toFixed(1).replace('.', ',');

export function useStatusBar(style) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style])
  );
}

export function ProgressBar({ value, max, color = colors.lime, track = colors.border, height = 8 }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height, borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

export function WaveHeader({ children, style, wave = 22 }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          backgroundColor: colors.olive,
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: wave + 12,
        },
        style,
      ]}
    >
      {children}
      <Svg
        width="100%"
        height={wave}
        viewBox="0 0 375 22"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: -1, left: 0 }}
      >
        <Path d="M0 22 L0 10 Q 47 -2 94 10 T 188 10 T 282 10 T 375 10 L375 22 Z" fill={colors.white} />
      </Svg>
    </View>
  );
}

export function RoundButton({ onPress, children, size = 40, bg = colors.surface, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ScreenHeader({ title, onBack, right, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: colors.white }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
        <RoundButton onPress={onBack}>
          <ArrowLeft size={20} color={colors.text} />
        </RoundButton>
        <Text style={{ flex: 1, marginLeft: 12, fontSize: 18, fontWeight: '800', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Pill({ label, active, onPress, variant = 'olive', icon, small, style }) {
  const lime = variant === 'lime';
  const bg = active ? (lime ? colors.lime : colors.olive) : colors.white;
  const fg = active ? (lime ? colors.olive : colors.white) : colors.text;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: small ? 12 : 16,
          paddingVertical: small ? 7 : 9,
          borderRadius: 99,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: active ? bg : colors.border,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: fg, fontSize: small ? 12 : 13, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}