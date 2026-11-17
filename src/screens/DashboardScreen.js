import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Bell, ChevronRight, Flame, Plus, Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import { colors, cardStyle, shadow, num, fmt, ProgressBar, WaveHeader, useStatusBar } from '../constants/theme';
import { MEALS, useApp } from '../data/dummyData';

const MEAL_ICON = { Sarapan: Coffee, 'Makan Siang': Sun, 'Makan Malam': Moon, Camilan: Cookie };

export default function DashboardScreen({ navigation }) {
  useStatusBar('light');
  const { profile, totals, notifications } = useApp();
  const unread = notifications.some((n) => n.unread);
  const topFoods = [...totals.foodsToday].sort((a, b) => b.kcal - a.kcal).slice(0, 3);
  const remaining = Math.max(profile.target - totals.intake, 0);

  const macros = [
    { k: 'Karbo', v: totals.carbs, max: profile.macros.carbs, color: colors.lime },
    { k: 'Protein', v: totals.protein, max: profile.macros.protein, color: colors.olive },
    { k: 'Lemak', v: totals.fat, max: profile.macros.fat, color: colors.charcoal },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <WaveHeader>
          <View style={styles.headRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.hello}>Halo, {profile.name}.</Text>
              <Text style={styles.helloSub}>Mulai untuk menghitung kalori harianmu, yuk!</Text>
            </View>
            <TouchableOpacity style={styles.bell} activeOpacity={0.8} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={20} color={colors.white} />
              {unread && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.88} style={styles.hero} onPress={() => navigation.navigate('CalorieDetail')}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Overview Kalori Hari Ini</Text>
              <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={styles.heroRow}>
              <Text style={styles.heroBig}>
                {fmt(totals.intake)} <Text style={styles.heroUnit}>Kkal</Text>
              </Text>
              <Text style={styles.heroTarget}>/ {fmt(profile.target)} Kkal</Text>
            </View>
            <ProgressBar value={totals.intake} max={profile.target} color={colors.lime} track="rgba(255,255,255,0.2)" height={10} />
            <Text style={styles.heroRemain}>Sisa {fmt(remaining)} Kkal</Text>
          </TouchableOpacity>
        </WaveHeader>

        <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
          <View style={styles.bento}>
            <View style={[styles.bentoCard, { backgroundColor: colors.lime }]}>
              <View style={styles.bentoTop}>
                <Text style={styles.bentoLabelDark}>Pembakaran Kalori</Text>
                <Flame size={20} color="#000" fill="#000" />
              </View>
              <Text style={[num, { fontSize: 30, color: colors.charcoal, marginTop: 6 }]}>
                {fmt(totals.burned)} <Text style={{ fontSize: 13, fontWeight: '700' }}>Kkal</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.charcoal, opacity: 0.7, fontWeight: '600' }}>Sudah terbakar</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity activeOpacity={0.85} style={styles.darkBtn} onPress={() => navigation.navigate('Activity')}>
                <Text style={styles.darkBtnText}>Tambahkan Aktivitas ›</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.bentoCard, { backgroundColor: colors.charcoal }]}>
              <Text style={styles.bentoLabelLight}>Asupan Hari Ini</Text>
              <View style={{ marginTop: 8, gap: 7 }}>
                {topFoods.length === 0 && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Belum ada asupan tercatat.</Text>}
                {topFoods.map((f, i) => (
                  <View key={f.id} style={{ flexDirection: 'row', gap: 6 }}>
                    <Text style={{ color: colors.lime, fontSize: 11, fontWeight: '800' }}>{i + 1}.</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.white, fontSize: 11.5, fontWeight: '700' }} numberOfLines={1}>{f.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontVariant: ['tabular-nums'] }}>{fmt(f.kcal)} Kkal</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.limeBtn}
                onPress={() => navigation.navigate('FoodSearch')}
              >
                <Text style={styles.limeBtnText}>Tambahkan Asupan ›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[cardStyle, { marginTop: 14 }]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Makronutrisi Harian</Text>
              <Text style={styles.cardTag}>Target Seimbang</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {macros.map((m) => (
                <View key={m.k} style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.macroK}>{m.k}</Text>
                    <Text style={styles.macroPct}>{m.max ? Math.round((m.v / m.max) * 100) : 0}%</Text>
                  </View>
                  <ProgressBar value={m.v} max={m.max} color={m.color} track={colors.border} height={8} />
                  <Text style={styles.macroV}>
                    {Math.round(m.v)}/{m.max}g
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[cardStyle, { marginTop: 14 }]}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Log Waktu Makan</Text>
              <Text style={styles.cardTag}>4 Sesi</Text>
            </View>
            <View style={{ marginTop: 6 }}>
              {MEALS.map((meal, idx) => {
                const Icon = MEAL_ICON[meal];
                const data = totals.byMeal[meal];
                const names = data.items.map((i) => i.name).join(', ');
                return (
                  <TouchableOpacity
                    key={meal}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('FoodSearch', { meal })}
                    style={[styles.mealRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                  >
                    <View style={styles.mealIcon}>
                      <Icon size={18} color={colors.olive} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealName}>{meal}</Text>
                      <Text style={styles.mealSub} numberOfLines={1}>{names || 'Belum ada catatan'}</Text>
                    </View>
                    <Text style={[num, { fontSize: 14, color: colors.text, marginRight: 10 }]}>{fmt(data.kcal)} Kkal</Text>
                    <View style={styles.plus}>
                      <Plus size={16} color={colors.olive} strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  hello: { fontSize: 22, fontWeight: '800', color: colors.white },
  helloSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  bell: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.lime, borderWidth: 1.5, borderColor: colors.olive,
  },
  hero: {
    marginTop: 16, borderRadius: 20, padding: 14, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginVertical: 8 },
  heroBig: { ...num, fontSize: 34, color: colors.white },
  heroUnit: { fontSize: 14, fontWeight: '700' },
  heroTarget: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontVariant: ['tabular-nums'] },
  heroRemain: { alignSelf: 'flex-end', marginTop: 7, fontSize: 12, color: colors.lime, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bento: { flexDirection: 'row', gap: 12 },
  bentoCard: { flex: 1, minHeight: 178, borderRadius: 20, padding: 14, ...shadow },
  bentoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bentoLabelDark: { fontSize: 12, fontWeight: '800', color: colors.charcoal },
  bentoLabelLight: { fontSize: 12, fontWeight: '800', color: colors.white },
  darkBtn: { height: 34, borderRadius: 99, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  darkBtnText: { fontSize: 11, fontWeight: '800', color: colors.white },
  limeBtn: { height: 34, borderRadius: 99, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  limeBtnText: { fontSize: 11, fontWeight: '800', color: colors.charcoal },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardTag: { fontSize: 11, fontWeight: '700', color: colors.muted },
  macroK: { fontSize: 12, fontWeight: '700', color: colors.text },
  macroPct: { fontSize: 11, fontWeight: '800', color: colors.muted, fontVariant: ['tabular-nums'] },
  macroV: { fontSize: 11, color: colors.muted, marginTop: 5, fontVariant: ['tabular-nums'] },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  mealIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: 14, fontWeight: '800', color: colors.text },
  mealSub: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  plus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});