import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, cardStyle, shadow, num, fmt, ProgressBar, ScreenHeader, useStatusBar } from '../constants/theme';
import { formatLongDate, useApp } from '../data/dummyData';

const MICRO_TARGET = { fiber: 30, sugar: 50, sodium: 2300 };

export default function CalorieDetailScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useSafeAreaInsets();
  const { profile, totals } = useApp();
  const [tab, setTab] = useState('macro');

  const remaining = totals.remaining;
  const safe = remaining >= 0;
  const proteinLeft = Math.round(profile.macros.protein - totals.protein);

  const macros = [
    { k: 'Karbohidrat', v: totals.carbs, max: profile.macros.carbs, kcalPer: 4, color: colors.lime },
    { k: 'Protein', v: totals.protein, max: profile.macros.protein, kcalPer: 4, color: colors.olive },
    { k: 'Lemak', v: totals.fat, max: profile.macros.fat, kcalPer: 9, color: colors.charcoal },
  ];
  const micros = [
    { k: 'Serat', v: totals.fiber, max: MICRO_TARGET.fiber, unit: 'g', color: colors.olive, lowIsBad: true },
    { k: 'Gula', v: totals.sugar, max: MICRO_TARGET.sugar, unit: 'g', color: colors.orange },
    { k: 'Natrium', v: totals.sodium, max: MICRO_TARGET.sodium, unit: 'mg', color: colors.charcoal },
  ];

  let insight;
  if (proteinLeft > 5) {
    insight = `Asupan protein masih kurang ${proteinLeft}g lagi untuk mencapai target harianmu. Rekomendasi: konsumsi dada ayam panggang, tempe bacem, atau susu tinggi protein pada waktu makan berikutnya.`;
  } else if (totals.sugar > MICRO_TARGET.sugar) {
    insight = `Asupan gula hari ini sudah ${Math.round(totals.sugar)}g, melebihi batas ${MICRO_TARGET.sugar}g. Kurangi minuman manis dan pilih air putih atau teh tawar untuk sisa hari ini.`;
  } else {
    insight = 'Asupan proteinmu sudah mencapai target hari ini. Pertahankan pola makan seimbang dan jangan lupa minum air yang cukup.';
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScreenHeader
        title="Detail Overview Kalori"
        onBack={() => navigation.goBack()}
        right={<View style={styles.datePill}><Text style={styles.dateText}>{formatLongDate()}</Text></View>}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <View style={cardStyle}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Kalkulasi Energi Net</Text>
            <View style={styles.tag}><Text style={styles.tagText}>BMR & TDEE</Text></View>
          </View>
          <View style={styles.equation}>
            <View style={styles.eqBox}>
              <Text style={styles.eqLabel}>Target</Text>
              <Text style={styles.eqVal}>{fmt(profile.target)}</Text>
              <Text style={styles.eqUnit}>Kkal</Text>
            </View>
            <Text style={styles.op}>−</Text>
            <View style={styles.eqBox}>
              <Text style={styles.eqLabel}>Asupan</Text>
              <Text style={styles.eqVal}>{fmt(totals.intake)}</Text>
              <Text style={styles.eqUnit}>Kkal</Text>
            </View>
            <Text style={styles.op}>+</Text>
            <View style={styles.eqBox}>
              <Text style={styles.eqLabel}>Bakar</Text>
              <Text style={styles.eqVal}>{fmt(totals.burned)}</Text>
              <Text style={styles.eqUnit}>Kkal</Text>
            </View>
          </View>

          <View style={styles.remain}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.charcoal, opacity: 0.75 }}>SISA KUOTA KALORI</Text>
              <View style={styles.statusBadge}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.lime }}>{safe ? 'Aman' : 'Terlampaui'}</Text>
              </View>
            </View>
            <Text style={[num, { fontSize: 38, color: colors.charcoal, marginTop: 4 }]}>
              {fmt(Math.abs(remaining))} <Text style={{ fontSize: 15, fontWeight: '800' }}>Kkal</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.charcoal, opacity: 0.75, marginTop: 2 }}>
              {safe
                ? 'Defisit kalorimu masih dalam batas aman. Kamu bisa makan sedikit lagi hari ini.'
                : 'Asupanmu melewati target. Pertimbangkan aktivitas ringan atau kurangi camilan.'}
            </Text>
          </View>
        </View>

        <View style={[cardStyle, { marginTop: 14 }]}>
          <Text style={styles.cardTitle}>Rincian Nutrisi Harian</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Target disesuaikan berat badan {profile.weight} kg</Text>
          <View style={styles.segment}>
            {[['macro', 'Makronutrisi'], ['micro', 'Mikronutrisi & Elektrolit']].map(([k, l]) => (
              <TouchableOpacity
                key={k}
                activeOpacity={0.85}
                onPress={() => setTab(k)}
                style={[styles.segItem, tab === k && { backgroundColor: colors.olive }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: tab === k ? colors.white : colors.text }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'macro' &&
            macros.map((m) => {
              const pct = m.max ? Math.round((m.v / m.max) * 100) : 0;
              return (
                <View key={m.k} style={{ marginTop: 16 }}>
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.color }} />
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }}>{m.k}</Text>
                    </View>
                    <Text style={{ fontSize: 12.5, color: colors.muted, fontVariant: ['tabular-nums'] }}>
                      <Text style={{ fontWeight: '800', color: colors.text }}>{Math.round(m.v)}g</Text> / {m.max}g • {pct}%
                    </Text>
                  </View>
                  <View style={{ marginTop: 7 }}>
                    <ProgressBar value={m.v} max={m.max} color={m.color} track={colors.border} height={9} />
                  </View>
                  <View style={[styles.rowBetween, { marginTop: 5 }]}>
                    <Text style={styles.small}>Energi: {fmt(m.v * m.kcalPer)} Kkal</Text>
                    <Text style={styles.small}>Sisa: {Math.max(Math.round(m.max - m.v), 0)}g</Text>
                  </View>
                </View>
              );
            })}

          {tab === 'micro' &&
            micros.map((m) => {
              const over = !m.lowIsBad && m.v > m.max;
              return (
                <View key={m.k} style={{ marginTop: 16 }}>
                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }}>{m.k}</Text>
                    <Text style={{ fontSize: 12.5, color: over ? colors.danger : colors.muted, fontVariant: ['tabular-nums'] }}>
                      <Text style={{ fontWeight: '800', color: over ? colors.danger : colors.text }}>{fmt(m.v)}{m.unit}</Text> / {fmt(m.max)}{m.unit}
                    </Text>
                  </View>
                  <View style={{ marginTop: 7 }}>
                    <ProgressBar value={m.v} max={m.max} color={over ? colors.danger : m.color} track={colors.border} height={9} />
                  </View>
                  <Text style={[styles.small, { marginTop: 5 }]}>
                    {m.lowIsBad ? 'Target minimal harian' : 'Batas maksimal harian'}
                    {over ? ' • Terlampaui' : ''}
                  </Text>
                </View>
              );
            })}
        </View>

        <View style={styles.ai}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.aiIcon}><Sparkles size={16} color={colors.charcoal} /></View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.white }}>Saran Ahli Gizi AI</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Rekomendasi menu harian</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.88)', marginTop: 12 }}>{insight}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[['Ayam Panggang', '+25g', 'Ayam Panggang'], ['Tempe Bacem', '+18g', 'Tempe Bacem']].map(([n, g, q]) => (
              <TouchableOpacity
                key={n}
                activeOpacity={0.85}
                style={styles.chip}
                onPress={() => navigation.navigate('FoodSearch', { meal: 'Makan Malam', query: q })}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.white }}>{n} </Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.lime }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.aiBtn}
            onPress={() => navigation.navigate('FoodSearch', { meal: 'Makan Malam', sortBy: 'protein' })}
          >
            <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.charcoal }}>+ Rekomendasi Menu Protein</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  datePill: { backgroundColor: colors.surface, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  dateText: { fontSize: 11, fontWeight: '800', color: colors.olive },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  tag: { backgroundColor: colors.white, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 10.5, fontWeight: '800', color: colors.muted },
  equation: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 },
  eqBox: { flex: 1, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  eqLabel: { fontSize: 11, fontWeight: '700', color: colors.muted },
  eqVal: { ...num, fontSize: 19, color: colors.text, marginTop: 2 },
  eqUnit: { fontSize: 10.5, color: colors.muted, fontWeight: '600' },
  op: { fontSize: 18, fontWeight: '800', color: colors.muted },
  remain: { backgroundColor: colors.lime, borderRadius: 18, padding: 14, marginTop: 12, ...shadow },
  statusBadge: { backgroundColor: colors.olive, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  segment: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 99, padding: 4, marginTop: 14 },
  segItem: { flex: 1, height: 36, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  small: { fontSize: 11.5, color: colors.muted, fontVariant: ['tabular-nums'] },
  ai: { backgroundColor: colors.charcoal, borderRadius: 20, padding: 16, marginTop: 14 },
  aiIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  aiBtn: { height: 48, borderRadius: 99, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
});