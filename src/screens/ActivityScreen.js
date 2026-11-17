import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard } from 'react-native';
import Slider from '@react-native-community/slider';
import { Search, X, Check, Droplets, Footprints, Activity, Bike, Dumbbell, Trophy, Wind } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, cardStyle, shadow, num, fmt, Pill, RoundButton, WaveHeader, useStatusBar } from '../constants/theme';
import { WORKOUTS, EXTRA_WORKOUTS, INTENSITIES, ACTIVITY_TARGET, useApp } from '../data/dummyData';
import { ArrowLeft } from 'lucide-react-native';

const ICONS = { footprints: Footprints, activity: Activity, bike: Bike, dumbbell: Dumbbell, trophy: Trophy, wind: Wind };

export default function ActivityScreen({ navigation }) {
  useStatusBar('light');
  const insets = useSafeAreaInsets();
  const { profile, addActivity } = useApp();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('beban');
  const [minutes, setMinutes] = useState(45);
  const [intensity, setIntensity] = useState('Sedang');

  const all = useMemo(() => [...WORKOUTS, ...EXTRA_WORKOUTS], []);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((w) => w.name.toLowerCase().includes(q)) : WORKOUTS;
  }, [query, all]);

  const selected = all.find((w) => w.id === selectedId) || WORKOUTS[3];
  const mult = INTENSITIES.find((i) => i.key === intensity).mult;
  const rate = (w) => Math.round(w.met * profile.weight);
  const estimate = Math.round(selected.met * profile.weight * (minutes / 60) * mult);
  const waterMl = Math.max(250, Math.round((estimate * 0.9) / 50) * 50);

  const save = () => {
    addActivity({ name: selected.name, minutes, intensity, kcal: estimate });
    navigation.navigate('MainTabs', { screen: 'Dashboard' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <WaveHeader wave={18} style={{ paddingBottom: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <RoundButton onPress={() => navigation.goBack()} bg="rgba(255,255,255,0.14)" size={38}>
              <ArrowLeft size={20} color={colors.white} />
            </RoundButton>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>TARGET HARIAN: {ACTIVITY_TARGET} KKAL</Text>
            </View>
          </View>
          <Text style={styles.title}>Catat Aktivitas</Text>
        </WaveHeader>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.search}>
            <Search size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari jenis olahraga atau kegiatan..."
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Pilihan Cepat</Text>
            <Text style={styles.sectionTag}>{query ? `${list.length} HASIL` : '6 POPULER'}</Text>
          </View>

          {list.length === 0 && <Text style={{ color: colors.muted, textAlign: 'center', marginVertical: 20 }}>Aktivitas tidak ditemukan.</Text>}

          <View style={styles.grid}>
            {list.map((w) => {
              const Icon = ICONS[w.icon] || Activity;
              const active = w.id === selectedId;
              return (
                <TouchableOpacity
                  key={w.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelectedId(w.id);
                  }}
                  style={[styles.sport, active && { backgroundColor: colors.white, borderColor: colors.olive }]}
                >
                  <View style={styles.sportTop}>
                    <View style={[styles.sportIcon, active && { backgroundColor: colors.olive }]}>
                      <Icon size={18} color={active ? colors.lime : colors.olive} />
                    </View>
                    {active ? (
                      <View style={styles.check}><Check size={12} color={colors.olive} strokeWidth={3.5} /></View>
                    ) : (
                      <Text style={styles.sportBadge}>{w.badge}</Text>
                    )}
                  </View>
                  <Text style={styles.sportName} numberOfLines={1}>{w.name}</Text>
                  <Text style={styles.sportRate}>~{fmt(rate(w))} Kkal/jam</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[cardStyle, { marginTop: 8 }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 }} numberOfLines={1}>Detail: {selected.name}</Text>
              <View style={styles.active}><Text style={styles.activeText}>AKTIF</Text></View>
            </View>

            <Text style={styles.label}>Durasi Latihan</Text>
            <Text style={[num, { fontSize: 38, color: colors.text, textAlign: 'center' }]}>
              {minutes} <Text style={{ fontSize: 15, fontWeight: '700', color: colors.muted }}>Menit</Text>
            </Text>
            <Slider
              style={{ width: '100%', height: 36 }}
              minimumValue={10}
              maximumValue={120}
              step={5}
              value={minutes}
              onValueChange={setMinutes}
              minimumTrackTintColor={colors.olive}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.olive}
            />
            <View style={styles.rowBetween}>
              {['10m', '30m', '60m', '90m', '120m'].map((t) => (
                <Text key={t} style={{ fontSize: 10.5, color: colors.muted, fontWeight: '600' }}>{t}</Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {[15, 30, 45].map((m) => (
                <Pill
                  key={m} small label={`+${m}m`} variant="lime"
                  onPress={() => setMinutes((v) => Math.min(120, v + m))}
                  style={{ flex: 1, justifyContent: 'center' }}
                />
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Tingkat Intensitas</Text>
            <View style={styles.segment}>
              {INTENSITIES.map((i) => (
                <TouchableOpacity
                  key={i.key}
                  activeOpacity={0.85}
                  onPress={() => setIntensity(i.key)}
                  style={[styles.segItem, intensity === i.key && { backgroundColor: colors.olive }]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: intensity === i.key ? colors.white : colors.text }}>{i.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.estimate}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.charcoal, opacity: 0.7 }}>ESTIMASI TERBAKAR</Text>
              <Text style={[num, { fontSize: 36, color: colors.charcoal }]}>
                {fmt(estimate)} <Text style={{ fontSize: 15, fontWeight: '800' }}>Kkal</Text>
              </Text>
              <Text style={{ fontSize: 11.5, color: colors.charcoal, opacity: 0.75, marginTop: 2 }}>
                Berat {profile.weight} kg • MET {selected.met} • {intensity}
              </Text>
            </View>
            <View style={styles.estDot} />
          </View>

          <View style={styles.hydro}>
            <Droplets size={20} color={colors.olive} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.olive }}>Selesai Berlatih?</Text>
              <Text style={{ fontSize: 12, color: colors.olive, opacity: 0.85, marginTop: 1, lineHeight: 17 }}>
                Jangan lupa minum air putih minimal {waterMl} ml untuk menjaga hidrasi dan pemulihan tubuhmu.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.saveBtn} onPress={save}>
          <Check size={18} color={colors.white} strokeWidth={3} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.white }}>Simpan Aktivitas Fisik</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.olive, letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: '800', color: colors.white, marginTop: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: 99, paddingHorizontal: 16, height: 46, marginTop: 4,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, height: 46 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginVertical: 12 },
  sectionTag: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sport: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 12, borderWidth: 1.5, borderColor: 'transparent' },
  sportTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sportIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  sportBadge: { fontSize: 10.5, fontWeight: '800', color: colors.muted },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  sportName: { fontSize: 14, fontWeight: '800', color: colors.text },
  sportRate: { fontSize: 11.5, color: colors.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
  active: { backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  activeText: { fontSize: 10.5, fontWeight: '800', color: colors.olive },
  label: { fontSize: 12, fontWeight: '800', color: colors.muted, marginTop: 14, marginBottom: 4 },
  segment: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 99, padding: 4, marginTop: 6 },
  segItem: { flex: 1, height: 38, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  estimate: {
    marginTop: 14, backgroundColor: colors.lime, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', ...shadow,
  },
  estDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.charcoal },
  hydro: { flexDirection: 'row', gap: 10, backgroundColor: colors.softGreen, borderRadius: 16, padding: 14, marginTop: 12, alignItems: 'flex-start' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white,
    paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  saveBtn: {
    height: 52, borderRadius: 99, backgroundColor: colors.charcoal, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
});