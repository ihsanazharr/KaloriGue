import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
import { colors, cardStyle, num, fmt, RoundButton, useStatusBar } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DAYS_SHORT, MONTHS, dateKey, getDayKcal, getFood, useApp } from '../data/dummyData';

const CHART_W = 303;
const CHART_H = 160;
const PAD_T = 18;
const PAD_B = 22;

export default function HistoryScreen() {
  useStatusBar('dark');
  const insets = useSafeAreaInsets();
  const { profile, foodLogs, activityLogs, removeFood, removeActivity } = useApp();

  const todayIdx = (new Date().getDay() + 6) % 7;
  const [weekOffset, setWeekOffset] = useState(0);
  const [selIdx, setSelIdx] = useState(todayIdx);

  const days = useMemo(() => {
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    const monday = new Date(base);
    monday.setDate(base.getDate() - todayIdx + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = dateKey(d);
      return { i, d, key, label: DAYS_SHORT[i], date: d.getDate(), kcal: getDayKcal(foodLogs, key, i) };
    });
  }, [weekOffset, foodLogs, todayIdx]);

  const todayKey = dateKey();
  const sel = days[selIdx];
  const target = profile.target;
  const filled = days.filter((d) => d.kcal > 0);
  const avg = filled.length ? Math.round(filled.reduce((s, d) => s + d.kcal, 0) / filled.length) : 0;
  const midDate = days[3].d;
  const monthLabel = `${MONTHS[midDate.getMonth()]} ${midDate.getFullYear()}`;

  const meals = foodLogs.filter((l) => l.date === sel.key).sort((a, b) => a.time.localeCompare(b.time));
  const acts = activityLogs.filter((l) => l.date === sel.key).sort((a, b) => a.time.localeCompare(b.time));
  const intake = meals.length ? meals.reduce((s, m) => s + m.kcal, 0) : sel.kcal;
  const burned = acts.reduce((s, a) => s + a.kcal, 0);
  const net = intake - burned;
  const safe = net <= target;

  const maxV = Math.max(target * 1.15, ...days.map((d) => d.kcal), 1);
  const innerH = CHART_H - PAD_T - PAD_B;
  const slot = CHART_W / 7;
  const barW = 26;
  const yOf = (v) => PAD_T + innerH - (v / maxV) * innerH;

  const confirmDelete = (title, onConfirm) =>
    Alert.alert('Hapus catatan?', title, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: onConfirm },
    ]);

  const changeWeek = (delta) => {
    const next = weekOffset + delta;
    if (next > 0) return;
    setWeekOffset(next);
    setSelIdx(next === 0 ? todayIdx : 0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 130, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.muted }}>KALENDER KALORI</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Riwayat Kalori</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RoundButton size={32} onPress={() => changeWeek(-1)}><ChevronLeft size={16} color={colors.text} /></RoundButton>
            <View style={styles.monthPill}><Text style={styles.monthText}>{monthLabel}</Text></View>
            <RoundButton size={32} onPress={() => changeWeek(1)} style={{ opacity: weekOffset === 0 ? 0.35 : 1 }}>
              <ChevronRight size={16} color={colors.text} />
            </RoundButton>
          </View>
        </View>

        <View style={styles.strip}>
          {days.map((d) => {
            const active = d.i === selIdx;
            return (
              <TouchableOpacity
                key={d.key}
                activeOpacity={0.85}
                onPress={() => setSelIdx(d.i)}
                style={[styles.day, active && { backgroundColor: colors.olive }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: active ? 'rgba(255,255,255,0.75)' : colors.muted }}>{d.label}</Text>
                <Text style={[num, { fontSize: 17, color: active ? colors.white : colors.text, marginVertical: 2 }]}>{d.date}</Text>
                <View style={{ width: 14, height: 4, borderRadius: 2, backgroundColor: active ? colors.lime : d.key === todayKey ? colors.olive : 'transparent' }} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[cardStyle, { marginTop: 14 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.muted }}>STATISTIK MINGGUAN</Text>
              <Text style={[num, { fontSize: 24, color: colors.text, marginTop: 4 }]}>
                {fmt(avg)} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>Kkal rata-rata/hari</Text>
              </Text>
            </View>
            <View style={styles.targetBadge}><Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.olive }}>Target: {fmt(target)}</Text></View>
          </View>

          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Svg width={CHART_W} height={CHART_H}>
              <Line x1={0} x2={CHART_W} y1={yOf(target)} y2={yOf(target)} stroke={colors.charcoal} strokeWidth={1} strokeDasharray="4 4" />
              <SvgText x={CHART_W} y={yOf(target) - 4} textAnchor="end" fontSize={9} fontWeight="700" fill={colors.muted}>
                Target ({fmt(target)})
              </SvgText>
              {days.map((d, i) => {
                const h = Math.max((d.kcal / maxV) * innerH, d.kcal > 0 ? 3 : 0);
                const x = i * slot + (slot - barW) / 2;
                const active = i === selIdx;
                return (
                  <G key={d.key} onPress={() => setSelIdx(i)}>
                    <Rect x={i * slot} y={0} width={slot} height={CHART_H} fill="transparent" />
                    <Rect x={x} y={yOf(d.kcal)} width={barW} height={h} rx={8} fill={active ? colors.olive : colors.lime} />
                    {active && d.kcal > 0 && (
                      <SvgText x={x + barW / 2} y={yOf(d.kcal) - 5} textAnchor="middle" fontSize={9} fontWeight="800" fill={colors.text}>
                        {fmt(d.kcal)}
                      </SvgText>
                    )}
                    <SvgText x={x + barW / 2} y={CHART_H - 6} textAnchor="middle" fontSize={10} fontWeight="700" fill={active ? colors.text : colors.muted}>
                      {d.label}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
              {sel.key === todayKey ? 'Log Hari Ini' : `Log ${sel.label}, ${sel.date} ${MONTHS[sel.d.getMonth()].slice(0, 3)}`}
            </Text>
            <View style={[styles.netBadge, !safe && { backgroundColor: colors.orange }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.charcoal, fontVariant: ['tabular-nums'] }}>
                Net: {fmt(net)} Kkal ({safe ? 'Aman' : 'Lewat Target'})
              </Text>
            </View>
          </View>

          <View style={[cardStyle, { marginTop: 12 }]}>
            <View style={styles.logHead}>
              <Text style={styles.logTitle}>Asupan Makanan</Text>
              <Text style={[num, { fontSize: 14, color: colors.olive }]}>{fmt(intake)} Kkal Masuk</Text>
            </View>
            <Text style={styles.logSub}>{meals.length ? `${meals.length} catatan makanan` : 'Ringkasan harian'}</Text>
            {meals.length === 0 && (
              <Text style={styles.empty}>
                {intake > 0 ? 'Rincian makanan hari ini tidak tersimpan, hanya ringkasan total kalori.' : 'Belum ada makanan tercatat.'}
              </Text>
            )}
            {meals.map((m) => (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.8}
                onLongPress={() => confirmDelete(m.name, () => removeFood(m.id))}
                style={styles.logRow}
              >
                <View style={styles.logIcon}><Text style={{ fontSize: 20 }}>{getFood(m.foodId)?.emoji || '🍽️'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTime}>{m.time} • {m.meal}</Text>
                  <Text style={styles.logName} numberOfLines={1}>{m.name}</Text>
                </View>
                <Text style={[num, { fontSize: 14, color: colors.text }]}>{fmt(m.kcal)}</Text>
              </TouchableOpacity>
            ))}
            {meals.length > 0 && <Text style={styles.hint}>Tekan lama untuk menghapus catatan.</Text>}
          </View>

          <View style={[cardStyle, { marginTop: 12 }]}>
            <View style={styles.logHead}>
              <Text style={styles.logTitle}>Aktivitas Fisik</Text>
              <Text style={[num, { fontSize: 14, color: colors.danger }]}>-{fmt(burned)} Kkal Terbakar</Text>
            </View>
            <Text style={styles.logSub}>{acts.length} sesi latihan</Text>
            {acts.length === 0 && <Text style={styles.empty}>Belum ada aktivitas tercatat.</Text>}
            {acts.map((a) => (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.8}
                onLongPress={() => confirmDelete(a.name, () => removeActivity(a.id))}
                style={styles.logRow}
              >
                <View style={[styles.logIcon, { backgroundColor: colors.lime }]}><Flame size={18} color={colors.charcoal} fill={colors.charcoal} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTime}>{a.time} • {a.minutes} menit • {a.intensity}</Text>
                  <Text style={styles.logName} numberOfLines={1}>{a.name}</Text>
                </View>
                <Text style={[num, { fontSize: 14, color: colors.danger }]}>-{fmt(a.kcal)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthPill: { backgroundColor: colors.olive, borderRadius: 99, paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  monthText: { fontSize: 12, fontWeight: '800', color: colors.white },
  strip: { flexDirection: 'row', gap: 6, marginTop: 16 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 16, backgroundColor: colors.surface },
  targetBadge: { backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  netBadge: { backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  logHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  logSub: { fontSize: 11.5, color: colors.muted, marginTop: 2, marginBottom: 6 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  logIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logTime: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  logName: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },
  empty: { fontSize: 12.5, color: colors.muted, paddingVertical: 10 },
  hint: { fontSize: 10.5, color: colors.muted, textAlign: 'center', marginTop: 4 },
});