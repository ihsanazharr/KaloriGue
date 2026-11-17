import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';
import { ArrowRight, Database, Zap, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, useStatusBar } from '../constants/theme';
import { useApp } from '../data/dummyData';

const RINGS = [
  { r: 108, pct: 0.72, color: colors.lime },
  { r: 94, pct: 0.55, color: colors.orange },
  { r: 80, pct: 0.38, color: colors.mint },
];

function FoodBowl() {
  return (
    <Svg width={240} height={240} viewBox="0 0 240 240">
      {RINGS.map((ring) => {
        const c = 2 * Math.PI * ring.r;
        return (
          <React.Fragment key={ring.r}>
            <Circle cx="120" cy="120" r={ring.r} stroke="rgba(255,255,255,0.12)" strokeWidth="6" fill="none" />
            <Circle
              cx="120" cy="120" r={ring.r} stroke={ring.color} strokeWidth="6" fill="none"
              strokeLinecap="round" strokeDasharray={`${ring.pct * c} ${c}`}
              rotation="-90" origin="120, 120"
            />
          </React.Fragment>
        );
      })}
      {/* uap */}
      <Path d="M104 78 q-7 -9 0 -17 q7 -8 0 -16" stroke="rgba(255,255,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M126 74 q-7 -9 0 -17 q7 -8 0 -16" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* nasi */}
      <Path d="M72 128 Q120 66 168 128 Z" fill="#FFFFFF" />
      {/* telur */}
      <Circle cx="140" cy="108" r="15" fill="#FFFFFF" stroke="#E6E8E2" strokeWidth="2" />
      <Circle cx="140" cy="108" r="6.5" fill="#F2B01E" />
      {/* timun & tomat */}
      <Circle cx="96" cy="112" r="9" fill="#8FBF4D" />
      <Circle cx="96" cy="112" r="5" fill="#B9DB80" />
      <Circle cx="113" cy="98" r="7" fill="#E4572E" />
      {/* cabai */}
      <Path d="M150 128 q10 -10 22 -4 q-8 10 -22 4 Z" fill="#C0392B" />
      {/* mangkuk */}
      <Path d="M52 126 H188 A68 68 0 0 1 52 126 Z" fill="#F4F5F2" />
      <Path d="M60 142 H180" stroke={colors.lime} strokeWidth="5" strokeLinecap="round" />
      <Ellipse cx="120" cy="126" rx="68" ry="5" fill="#E6E8E2" />
      <Path d="M96 196 H144 L139 208 H101 Z" fill="#F4F5F2" />
    </Svg>
  );
}

export default function OnboardingScreen({ navigation }) {
  useStatusBar('light');
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useApp();

  const go = () => {
    setOnboarded(true);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('MainTabs');
  };

  const login = () =>
    Alert.alert('Masuk', 'KaloriGue berjalan secara lokal. Semua datamu tersimpan aman di iPhone ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Lanjutkan', onPress: go },
    ]);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.illustration}>
          <FoodBowl />
        </View>
        <View style={[styles.floatPill, { top: insets.top + 24, left: 20 }]}>
          <Text style={styles.floatText}>+450 Kkal Siang</Text>
        </View>
        <View style={[styles.floatPill, { bottom: 56, right: 20 }]}>
          <Text style={styles.floatText}>+780 Kkal</Text>
        </View>
        <Svg width="100%" height={36} viewBox="0 0 375 36" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0 }}>
          <Path d="M0 36 L0 18 Q 94 -8 188 18 T 375 14 L375 36 Z" fill={colors.white} />
        </Svg>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <View style={styles.tagRow}>
            <View style={styles.dot} />
            <Text style={styles.tag}>KALORI GUE • INDONESIA</Text>
          </View>
          <Text style={styles.headline}>Pantau Kalori Makanan Lokal Lebih Mudah</Text>
          <Text style={styles.sub}>
            Hitung asupan harian mulai dari Nasi Padang hingga jajanan favoritmu secara akurat dengan database makanan khas Nusantara.
          </Text>
          <View style={styles.featRow}>
            {[
              { l: 'Database Lokal', I: Database },
              { l: 'Hitung Cepat', I: Zap },
              { l: 'Capai Ideal', I: Target },
            ].map(({ l, I }) => (
              <View key={l} style={styles.feat}>
                <I size={13} color={colors.olive} />
                <Text style={styles.featText}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.dots}>
            <View style={[styles.pg, { width: 22, backgroundColor: colors.lime }]} />
            <View style={styles.pg} />
            <View style={styles.pg} />
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.cta} onPress={go}>
            <Text style={styles.ctaText}>Mulai Hitung Target Kalori</Text>
            <ArrowRight size={18} color={colors.olive} strokeWidth={2.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={login} style={{ alignItems: 'center', paddingTop: 14 }}>
            <Text style={styles.link}>
              Sudah punya akun? <Text style={{ fontWeight: '800', color: colors.olive }}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  top: { flex: 0.45, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  illustration: { marginTop: 10 },
  floatPill: {
    position: 'absolute', backgroundColor: colors.lime, borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 7, ...shadow,
  },
  floatText: { fontSize: 12, fontWeight: '800', color: colors.charcoal },
  bottom: { flex: 0.55, paddingHorizontal: 20, justifyContent: 'space-between', paddingTop: 6 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lime },
  tag: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: colors.muted },
  headline: { fontSize: 25, lineHeight: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13.5, lineHeight: 20, color: colors.muted, marginTop: 8 },
  featRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  feat: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border,
  },
  featText: { fontSize: 12, fontWeight: '700', color: colors.text },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14 },
  pg: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  cta: {
    height: 54, borderRadius: 99, backgroundColor: colors.lime, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: colors.olive },
  link: { fontSize: 13.5, color: colors.muted },
});