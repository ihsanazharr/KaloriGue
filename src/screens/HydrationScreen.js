import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, Modal, Alert } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { ArrowLeft, GlassWater, Droplets, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, cardStyle, shadow, num, fmt, fmt1, RoundButton, WaveHeader, useStatusBar } from '../constants/theme';
import { GLASS_ML, REMINDER_END, REMINDER_START, WATER_GOAL, useApp } from '../data/dummyData';

const SIZE = 190;
const R = 80;
const STROKE = 14;
const CIRC = 2 * Math.PI * R;
const pad = (n) => String(n).padStart(2, '0');

async function enableReminders() {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (let h = REMINDER_START; h <= REMINDER_END; h += 2) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Waktunya minum air 💧', body: 'Segarkan dirimu dengan segelas air putih (250 ml).' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: 0 },
    });
  }
  return true;
}

export default function HydrationScreen({ navigation }) {
  useStatusBar('light');
  const insets = useSafeAreaInsets();
  const { totals, reminderOn, setReminderOn, addWater, removeWater } = useApp();
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const water = totals.water;
  const goalGlasses = Math.round(WATER_GOAL / GLASS_ML);
  const glasses = Math.min(goalGlasses, Math.floor(water / GLASS_ML));
  const pct = Math.min(water / WATER_GOAL, 1);
  const left = Math.max(WATER_GOAL - water, 0);
  const history = [...totals.waterToday].reverse();

  const tapGlass = (i) => {
    if (i >= glasses) addWater((i + 1 - glasses) * GLASS_ML, 'Catatan gelas');
    else if (i === glasses - 1) removeWater(GLASS_ML);
  };

  const addCustom = () => {
    const ml = parseInt(customVal, 10);
    if (!(ml >= 50 && ml <= 2000)) {
      Alert.alert('Jumlah tidak valid', 'Masukkan jumlah antara 50 – 2000 ml.');
      return;
    }
    addWater(ml, 'Catatan manual');
    setCustomVal('');
    setCustomOpen(false);
  };

  const toggleReminder = async (value) => {
    try {
      if (value) {
        const ok = await enableReminders();
        if (!ok) {
          Alert.alert('Izin notifikasi ditolak', 'Aktifkan izin notifikasi untuk KaloriGue di Pengaturan iPhone agar pengingat dapat berjalan.');
          return;
        }
        setReminderOn(true);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        setReminderOn(false);
      }
    } catch (e) {
      Alert.alert('Gagal mengatur pengingat', 'Terjadi kendala saat menjadwalkan notifikasi. Coba lagi.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <WaveHeader wave={20} style={{ paddingBottom: 34 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <RoundButton onPress={() => navigation.goBack()} bg="rgba(255,255,255,0.14)" size={38}>
              <ArrowLeft size={20} color={colors.white} />
            </RoundButton>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>Hidrasi Harian</Text>
          </View>
          <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 18 }}>
            Jaga kebutuhan cairan tubuhmu setiap hari agar tetap fokus & berenergi
          </Text>
        </WaveHeader>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.ringCard}>
            <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={SIZE} height={SIZE}>
                <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.olive} strokeWidth={STROKE} fill="none" />
                <Circle
                  cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.lime} strokeWidth={STROKE} fill="none"
                  strokeLinecap="round" strokeDasharray={`${CIRC}`} strokeDashoffset={CIRC * (1 - pct)}
                  rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
              </Svg>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[num, { fontSize: 34, color: colors.olive }]}>{fmt(water)}</Text>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.muted, fontVariant: ['tabular-nums'] }}>/ {fmt(WATER_GOAL)} ml</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.olive, marginTop: 2 }}>{fmt1((water / WATER_GOAL) * 100)}%</Text>
                </View>
              </View>
            </View>
            <Text style={styles.caption}>
              {left > 0
                ? `${glasses} dari ${goalGlasses} Gelas Tercapai • Kurang ${fmt(left)} ml lagi`
                : `${goalGlasses} dari ${goalGlasses} Gelas Tercapai • Target hari ini selesai 🎉`}
            </Text>
            <View style={styles.glasses}>
              {Array.from({ length: goalGlasses }).map((_, i) => {
                const on = i < glasses;
                return (
                  <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => tapGlass(i)} style={[styles.glass, on && { backgroundColor: colors.lime }]}>
                    <GlassWater size={18} color={on ? colors.olive : colors.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.section}>Catat Minum Cepat</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity activeOpacity={0.85} style={styles.quick} onPress={() => addWater(250)}>
              <Text style={styles.quickText}>+250 ml</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.quick, { backgroundColor: colors.lime, borderColor: colors.lime }]} onPress={() => addWater(500)}>
              <Text style={[styles.quickText, { color: colors.olive }]}>+500 ml</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.quick} onPress={() => setCustomOpen(true)}>
              <Text style={styles.quickText}>+ Custom</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Riwayat Minum Hari Ini</Text>
          <View style={cardStyle}>
            {history.length === 0 && <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 10 }}>Belum ada catatan minum hari ini.</Text>}
            {history.map((h, idx) => (
              <View key={h.id} style={[styles.hRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={styles.hIcon}><Droplets size={16} color={colors.olive} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: colors.text }}>{h.label}</Text>
                  <Text style={{ fontSize: 11.5, color: colors.muted }}>{h.time}</Text>
                </View>
                <Text style={[num, { fontSize: 14, color: colors.olive }]}>+{fmt(h.ml)} ml</Text>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Jadwal Pengingat Otomatis</Text>
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.text }}>Ingatkan Setiap 2 Jam</Text>
                <Text style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>Notifikasi mengingatkanmu minum air secara berkala</Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={toggleReminder}
                trackColor={{ false: colors.border, true: colors.olive }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
              />
            </View>
            <View style={styles.activeHours}>
              <Clock size={16} color={colors.olive} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.text }}>Jam Aktif</Text>
              <Text style={[num, { fontSize: 13, color: colors.olive }]}>{pad(REMINDER_START)}:00 - {pad(REMINDER_END)}:00 WIB</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={customOpen} transparent animationType="fade" onRequestClose={() => setCustomOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Jumlah Minum Custom</Text>
            <Text style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>Masukkan jumlah air dalam mililiter.</Text>
            <View style={styles.modalInput}>
              <TextInput
                value={customVal}
                onChangeText={setCustomVal}
                keyboardType="number-pad"
                placeholder="300"
                placeholderTextColor={colors.muted}
                style={{ flex: 1, fontSize: 22, fontWeight: '800', color: colors.text }}
                maxLength={4}
                autoFocus
              />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted }}>ml</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.mBtn, { backgroundColor: colors.surface }]} onPress={() => setCustomOpen(false)}>
                <Text style={{ fontWeight: '800', color: colors.text }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mBtn, { backgroundColor: colors.lime }]} onPress={addCustom}>
                <Text style={{ fontWeight: '800', color: colors.olive }}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  ringCard: { backgroundColor: colors.white, borderRadius: 24, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow, marginTop: 4 },
  caption: { fontSize: 12.5, fontWeight: '700', color: colors.text, marginTop: 10, textAlign: 'center' },
  glasses: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 14 },
  glass: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  quick: { flex: 1, height: 46, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  hIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  activeHours: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 14, padding: 12, marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { width: '100%', backgroundColor: colors.white, borderRadius: 24, padding: 20 },
  modalInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, height: 56, marginTop: 14 },
  mBtn: { flex: 1, height: 48, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
});