import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Droplets, HeartPulse, FileDown, ChevronRight, ChevronDown, Sparkles, Trash2, Lock } from 'lucide-react-native';
import { colors, cardStyle, num, fmt, Pill, WaveHeader, useStatusBar } from '../constants/theme';
import {
  ACTIVITY_LEVELS, GOALS, computeTargets, dateKey, formatLongDate, getDayKcal, MONTHS_SHORT, useApp,
} from '../data/dummyData';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildReportHtml({ profile, totals, foodLogs, activityLogs, waterGoal }) {
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const kcal = getDayKcal(foodLogs, dateKey(d), (d.getDay() + 6) % 7);
    return `<tr><td>${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}</td><td style="text-align:right">${fmt(kcal)} Kkal</td></tr>`;
  }).join('');
  const foods = totals.foodsToday
    .map((f) => `<tr><td>${esc(f.time)}</td><td>${esc(f.meal)}</td><td>${esc(f.name)}</td><td style="text-align:right">${fmt(f.kcal)}</td></tr>`)
    .join('') || '<tr><td colspan="4">Belum ada asupan tercatat.</td></tr>';
  const acts = totals.activitiesToday
    .map((a) => `<tr><td>${esc(a.time)}</td><td>${esc(a.name)}</td><td>${a.minutes} menit</td><td style="text-align:right">-${fmt(a.kcal)}</td></tr>`)
    .join('') || '<tr><td colspan="4">Belum ada aktivitas tercatat.</td></tr>';

  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1E1E1E;padding:28px}
    h1{color:#364C23;margin:0 0 4px} h2{color:#364C23;margin:22px 0 8px;font-size:16px}
    .sub{color:#6B7062;font-size:12px} table{width:100%;border-collapse:collapse;font-size:12px}
    td,th{padding:7px 6px;border-bottom:1px solid #E6E8E2;text-align:left}
    .box{display:inline-block;background:#F4F5F2;border-radius:12px;padding:10px 14px;margin:0 8px 8px 0}
    .big{font-size:20px;font-weight:800;color:#364C23}
  </style></head><body>
  <h1>Laporan KaloriGue</h1>
  <div class="sub">${esc(profile.name)} • ${esc(formatLongDate())} • Target: ${esc(GOALS[profile.goal].full)}</div>
  <h2>Ringkasan Hari Ini</h2>
  <div class="box"><div class="sub">Target</div><div class="big">${fmt(profile.target)} Kkal</div></div>
  <div class="box"><div class="sub">Asupan</div><div class="big">${fmt(totals.intake)} Kkal</div></div>
  <div class="box"><div class="sub">Terbakar</div><div class="big">${fmt(totals.burned)} Kkal</div></div>
  <div class="box"><div class="sub">Sisa Kuota</div><div class="big">${fmt(totals.remaining)} Kkal</div></div>
  <div class="box"><div class="sub">Air Minum</div><div class="big">${fmt(totals.water)} / ${fmt(waterGoal)} ml</div></div>
  <h2>Makronutrisi</h2>
  <table><tr><th>Nutrisi</th><th style="text-align:right">Asupan</th><th style="text-align:right">Target</th></tr>
  <tr><td>Karbohidrat</td><td style="text-align:right">${Math.round(totals.carbs)} g</td><td style="text-align:right">${profile.macros.carbs} g</td></tr>
  <tr><td>Protein</td><td style="text-align:right">${Math.round(totals.protein)} g</td><td style="text-align:right">${profile.macros.protein} g</td></tr>
  <tr><td>Lemak</td><td style="text-align:right">${Math.round(totals.fat)} g</td><td style="text-align:right">${profile.macros.fat} g</td></tr></table>
  <h2>Log Makanan</h2><table><tr><th>Jam</th><th>Waktu</th><th>Makanan</th><th style="text-align:right">Kkal</th></tr>${foods}</table>
  <h2>Aktivitas Fisik</h2><table><tr><th>Jam</th><th>Aktivitas</th><th>Durasi</th><th style="text-align:right">Kkal</th></tr>${acts}</table>
  <h2>Kalori 7 Hari Terakhir</h2><table>${week}</table>
  <p class="sub" style="margin-top:24px">Dibuat oleh KaloriGue. Angka bersifat estimasi dan bukan pengganti saran medis.</p>
  </body></html>`;
}

export default function ProfileScreen({ navigation }) {
  useStatusBar('light');
  const app = useApp();
  const { profile, totals, foodLogs, activityLogs, reminderOn, saveProfile, clearLogs } = app;

  const [weight, setWeight] = useState(String(profile.weight));
  const [height, setHeight] = useState(String(profile.height));
  const [age, setAge] = useState(String(profile.age));
  const [gender, setGender] = useState(profile.gender);
  const [activity, setActivity] = useState(profile.activity);
  const [goal, setGoal] = useState(profile.goal);
  const [openActivity, setOpenActivity] = useState(false);
  const [exporting, setExporting] = useState(false);

  const level = ACTIVITY_LEVELS.find((a) => a.key === activity) || ACTIVITY_LEVELS[2];
  const initials = profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const [pc, pp, pf] = profile.split;

  const recalc = () => {
    const w = parseFloat(weight.replace(',', '.'));
    const h = parseFloat(height.replace(',', '.'));
    const a = parseInt(age, 10);
    if (!(w >= 30 && w <= 250) || !(h >= 100 && h <= 250) || !(a >= 10 && a <= 100)) {
      Alert.alert('Data belum valid', 'Periksa kembali berat (30–250 kg), tinggi (100–250 cm), dan usia (10–100 tahun).');
      return;
    }
    const res = computeTargets({ weight: w, height: h, age: a, gender, activity, goal });
    saveProfile({ weight: w, height: h, age: a, gender, activity, goal, target: res.target, split: res.split, macros: res.macros });
    Alert.alert('Target tersimpan', `BMR ${fmt(res.bmr)} Kkal • TDEE ${fmt(res.tdee)} Kkal\nTarget harianmu: ${fmt(res.target)} Kkal.`);
  };

  const exportPdf = async () => {
    try {
      setExporting(true);
      const html = buildReportHtml({ profile, totals, foodLogs, activityLogs, waterGoal: 2000 });
      const { uri } = await Print.printToFileAsync({ html });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Tidak tersedia', 'Fitur berbagi file tidak tersedia di perangkat ini.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Bagikan Laporan KaloriGue' });
    } catch (e) {
      Alert.alert('Gagal mengekspor', 'Laporan PDF tidak dapat dibuat. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const appleHealth = () =>
    Alert.alert(
      'Integrasi Apple Health',
      'Sinkronisasi HealthKit membutuhkan development build (belum didukung di Expo Go). Untuk sementara, catat aktivitasmu lewat menu Catat Aktivitas.'
    );

  const wipe = () =>
    Alert.alert('Hapus semua catatan?', 'Log makanan, aktivitas, dan minum akan dihapus permanen dari perangkat ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: clearLogs },
    ]);

  const Row = ({ Icon, title, sub, onPress, right }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.prefRow}>
      <View style={styles.prefIcon}><Icon size={18} color={colors.olive} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 11.5, color: colors.muted, marginTop: 1 }}>{sub}</Text>
      </View>
      {right || <ChevronRight size={18} color={colors.muted} />}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <WaveHeader>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.white }}>{profile.name}</Text>
              <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>{profile.email}</Text>
              <View style={styles.goalBadge}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.olive }}>Target: {GOALS[profile.goal].full}</Text>
              </View>
            </View>
          </View>
        </WaveHeader>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.tdee}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.muted }}>TARGET KALORI HARIAN (TDEE)</Text>
            <Text style={[num, { fontSize: 34, color: colors.olive, marginTop: 4 }]}>
              {fmt(profile.target)} <Text style={{ fontSize: 14, fontWeight: '800' }}>Kkal</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>Per hari untuk tujuan {GOALS[profile.goal].full.toLowerCase()}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {[['Karbo', pc, profile.macros.carbs, colors.lime], ['Protein', pp, profile.macros.protein, colors.olive], ['Lemak', pf, profile.macros.fat, colors.charcoal]].map(([k, pct, g, c]) => (
                <View key={k} style={styles.macroCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{k}</Text>
                  </View>
                  <Text style={[num, { fontSize: 17, color: colors.text, marginTop: 2 }]}>{pct}%</Text>
                  <Text style={{ fontSize: 11.5, color: colors.muted, fontVariant: ['tabular-nums'] }}>{g}g</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.section}>Fokus Sasaran</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.entries(GOALS).map(([k, g]) => (
              <Pill key={k} label={g.label} active={goal === k} onPress={() => setGoal(k)} style={{ flex: 1, justifyContent: 'center' }} />
            ))}
          </View>

          <View style={[cardStyle, { marginTop: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Data Tubuh & Parameter</Text>
              <Lock size={14} color={colors.muted} />
            </View>

            <View style={styles.grid}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>BERAT BADAN</Text>
                <View style={styles.fieldRow}>
                  <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.fieldInput} maxLength={5} />
                  <Text style={styles.unit}>kg</Text>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>TINGGI BADAN</Text>
                <View style={styles.fieldRow}>
                  <TextInput value={height} onChangeText={setHeight} keyboardType="decimal-pad" style={styles.fieldInput} maxLength={5} />
                  <Text style={styles.unit}>cm</Text>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>USIA</Text>
                <View style={styles.fieldRow}>
                  <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.fieldInput} maxLength={3} />
                  <Text style={styles.unit}>thn</Text>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>JENIS KELAMIN</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {['Laki-laki', 'Perempuan'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={[styles.gBtn, gender === g && { backgroundColor: colors.olive }]}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: gender === g ? colors.white : colors.text }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>TINGKAT AKTIVITAS</Text>
            <TouchableOpacity activeOpacity={0.85} style={styles.select} onPress={() => setOpenActivity((o) => !o)}>
              <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text }}>
                {level.label} <Text style={{ fontWeight: '500', color: colors.muted }}>({level.sub})</Text>
              </Text>
              <ChevronDown size={18} color={colors.muted} />
            </TouchableOpacity>
            {openActivity && (
              <View style={styles.options}>
                {ACTIVITY_LEVELS.map((a) => (
                  <TouchableOpacity
                    key={a.key}
                    onPress={() => {
                      setActivity(a.key);
                      setOpenActivity(false);
                    }}
                    style={[styles.option, a.key === activity && { backgroundColor: colors.softGreen }]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>{a.label}</Text>
                    <Text style={{ fontSize: 11.5, color: colors.muted }}>{a.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity activeOpacity={0.85} style={styles.limeCta} onPress={recalc}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.olive }}>Hitung Ulang Target & Simpan</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Preferensi & Ekosistem</Text>
          <View style={[cardStyle, { paddingVertical: 4 }]}>
            <Row Icon={Droplets} title="Pengingat Minum Air" sub={`Setiap 2 jam • ${reminderOn ? 'Aktif' : 'Nonaktif'}`} onPress={() => navigation.navigate('Hydration')} />
            <Row Icon={HeartPulse} title="Integrasi Apple Health" sub="Sinkronisasi langkah & kalori aktif" onPress={appleHealth} />
            <Row
              Icon={FileDown}
              title="Ekspor Laporan PDF"
              sub="Rekap nutrisi & progres harian"
              onPress={exportPdf}
              right={exporting ? <ActivityIndicator color={colors.olive} /> : undefined}
            />
            <Row Icon={Sparkles} title="Lihat Panduan Awal" sub="Tampilkan kembali layar perkenalan" onPress={() => navigation.navigate('Onboarding')} />
            <Row Icon={Trash2} title="Hapus Semua Catatan" sub="Mulai dari nol, profil tetap tersimpan" onPress={wipe} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.olive },
  goalBadge: { alignSelf: 'flex-start', marginTop: 7, backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  tdee: { backgroundColor: colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 2 },
  macroCol: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 10 },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  field: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.border },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: colors.muted },
  fieldRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  fieldInput: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text, paddingVertical: 4, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 12, fontWeight: '700', color: colors.muted },
  gBtn: { flex: 1, height: 30, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  select: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46, marginTop: 6 },
  options: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: 6, overflow: 'hidden' },
  option: { paddingHorizontal: 12, paddingVertical: 10 },
  limeCta: { height: 52, borderRadius: 99, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  prefIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});