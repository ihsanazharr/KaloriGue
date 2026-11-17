import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Circle } from 'react-native-svg';
import { ScanLine, Pencil, Plus, Minus, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, num, fmt, Pill, ScreenHeader, useStatusBar } from '../constants/theme';
import { MEALS, MEAL_SHORT, getFood, guessMeal, r1, useApp } from '../data/dummyData';
import { lookupBarcode } from '../services/fatsecretApi';

const PRESETS = [
  { label: 'Soto Ayam', id: 'soto-ayam' },
  { label: 'Gado-Gado', id: 'gado-gado' },
  { label: 'Martabak', id: 'martabak-telur' },
];
const toNum = (s) => parseFloat(String(s).replace(',', '.')) || 0;

export default function ManualFoodScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useSafeAreaInsets();
  const { profile, addFood } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState('manual');
  const [name, setName] = useState('');
  const [meal, setMeal] = useState(guessMeal());
  const [portion, setPortion] = useState(1);
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [note, setNote] = useState('');
  const [scanLock, setScanLock] = useState(false);
  const [looking, setLooking] = useState(false);

  const kcal = Math.round((toNum(carbs) * 4 + toNum(protein) * 4 + toNum(fat) * 9) * portion);
  const pct = profile.target ? Math.min(kcal / profile.target, 1) : 0;
  const R = 26;
  const C = 2 * Math.PI * R;

  const applyPreset = (id) => {
    const f = getFood(id);
    if (!f) return;
    setName(f.name);
    setCarbs(String(f.carbs));
    setProtein(String(f.protein));
    setFat(String(f.fat));
    setPortion(1);
  };

  const handleScan = async (code) => {
    if (scanLock) return;
    setScanLock(true);
    setLooking(true);
    const res = await lookupBarcode(code);
    setLooking(false);
    if (res) {
      setName(res.name);
      setCarbs(String(res.carbs));
      setProtein(String(res.protein));
      setFat(String(res.fat));
      setPortion(1);
      setNote(`Barcode ${code} • ${res.serving}`);
      setMode('manual');
      setScanLock(false);
    } else {
      Alert.alert('Produk tidak ditemukan', `Kode ${code} belum ada di database. Coba pindai ulang atau input manual.`, [
        { text: 'Pindai Ulang', onPress: () => setScanLock(false) },
        { text: 'Input Manual', onPress: () => { setMode('manual'); setScanLock(false); } },
      ]);
    }
  };

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Nama makanan kosong', 'Isi nama makanan atau minuman terlebih dahulu.');
      return;
    }
    if (kcal <= 0) {
      Alert.alert('Nutrisi belum diisi', 'Isi minimal salah satu: karbo, protein, atau lemak.');
      return;
    }
    addFood({
      foodId: null,
      name: name.trim(),
      meal,
      portion,
      serving: note.trim() || `${portion.toFixed(1)} porsi`,
      kcal,
      carbs: r1(toNum(carbs) * portion),
      protein: r1(toNum(protein) * portion),
      fat: r1(toNum(fat) * portion),
      fiber: 0,
      sugar: 0,
      sodium: 0,
    });
    navigation.navigate('MainTabs', { screen: 'Dashboard' });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title="Input Makanan Baru"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity activeOpacity={0.85} style={styles.scanBtn} onPress={() => setMode(mode === 'scan' ? 'manual' : 'scan')}>
            <ScanLine size={14} color={colors.olive} strokeWidth={2.8} />
            <Text style={styles.scanText}>Scan Barcode</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.segment}>
          {[['manual', 'Input Manual', Pencil], ['scan', 'Pemindai Barcode', ScanLine]].map(([k, l, I]) => (
            <TouchableOpacity key={k} activeOpacity={0.85} onPress={() => setMode(k)} style={[styles.segItem, mode === k && { backgroundColor: colors.olive }]}>
              <I size={14} color={mode === k ? colors.white : colors.text} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: mode === k ? colors.white : colors.text }}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'scan' && (
          <View style={{ marginTop: 16 }}>
            {!permission && <ActivityIndicator color={colors.olive} style={{ margin: 40 }} />}
            {permission && !permission.granted && (
              <View style={styles.permBox}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, textAlign: 'center' }}>Izin kamera diperlukan</Text>
                <Text style={{ fontSize: 12.5, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
                  KaloriGue memakai kamera hanya untuk memindai barcode kemasan makanan.
                </Text>
                <TouchableOpacity style={styles.limeCta} onPress={requestPermission}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.olive }}>Izinkan Kamera</Text>
                </TouchableOpacity>
              </View>
            )}
            {permission && permission.granted && (
              <View style={styles.cameraWrap}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
                  onBarcodeScanned={scanLock ? undefined : ({ data }) => handleScan(data)}
                />
                <View style={styles.frame} pointerEvents="none">
                  <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                  <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                  <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                  <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                  <View style={styles.scanLine} />
                </View>
                {looking && (
                  <View style={styles.overlay}>
                    <ActivityIndicator color={colors.lime} />
                    <Text style={{ color: colors.white, fontWeight: '700', marginTop: 8 }}>Mencari produk...</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={{ fontSize: 12.5, color: colors.muted, textAlign: 'center', marginTop: 12 }}>
              Arahkan kamera ke barcode kemasan. Data diambil dari OpenFoodFacts.
            </Text>
            <TouchableOpacity onPress={() => handleScan('8999999000011')} style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.olive }}>Coba dengan barcode contoh</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'manual' && (
          <View>
            <Text style={styles.label}>Nama Makanan / Minuman *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Contoh: Batagor Kuah Spesial"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {PRESETS.map((p) => (
                <Pill key={p.id} small label={p.label} onPress={() => applyPreset(p.id)} />
              ))}
            </View>

            <Text style={styles.label}>Kategori Waktu Makan</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MEALS.map((m) => (
                <Pill key={m} small label={MEAL_SHORT[m]} active={meal === m} onPress={() => setMeal(m)} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 0 }} />
              ))}
            </View>

            <Text style={styles.label}>Jumlah Porsi</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setPortion((p) => Math.max(0.5, r1(p - 0.5)))}>
                <Minus size={16} color={colors.olive} strokeWidth={3} />
              </TouchableOpacity>
              <Text style={[num, { fontSize: 20, flex: 1, textAlign: 'center', color: colors.text }]}>{portion.toFixed(1)}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setPortion((p) => Math.min(10, r1(p + 0.5)))}>
                <Plus size={16} color={colors.olive} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <View style={styles.preview}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.65)' }}>ESTIMASI TOTAL ENERGI</Text>
                <Text style={[num, { fontSize: 36, color: colors.white, marginTop: 2 }]}>
                  {fmt(kcal)} <Text style={{ fontSize: 15, fontWeight: '800', color: colors.lime }}>Kkal</Text>
                </Text>
                <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>≈ {Math.round(pct * 100)}% dari target harian</Text>
              </View>
              <Svg width={64} height={64} viewBox="0 0 64 64">
                <Circle cx="32" cy="32" r={R} stroke="rgba(255,255,255,0.18)" strokeWidth="7" fill="none" />
                <Circle
                  cx="32" cy="32" r={R} stroke={colors.lime} strokeWidth="7" fill="none" strokeLinecap="round"
                  strokeDasharray={`${pct * C} ${C}`} rotation="-90" origin="32, 32"
                />
              </Svg>
            </View>

            <Text style={styles.label}>Rincian Makronutrisi (per porsi)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[['Karbo (g)', carbs, setCarbs], ['Protein (g)', protein, setProtein], ['Lemak (g)', fat, setFat]].map(([l, v, s]) => (
                <View key={l} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted, marginBottom: 5 }}>{l}</Text>
                  <TextInput
                    value={v}
                    onChangeText={s}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { textAlign: 'center', fontWeight: '800', fontVariant: ['tabular-nums'] }]}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Contoh: tanpa sambal, bumbu kacang dipisah"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={80}
            />

            <TouchableOpacity activeOpacity={0.85} style={[styles.limeCta, { marginTop: 22 }]} onPress={save}>
              <Check size={18} color={colors.olive} strokeWidth={3} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.olive }}>Simpan & Tambahkan ke Log</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 12, height: 34 },
  scanText: { fontSize: 12, fontWeight: '800', color: colors.olive },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 99, padding: 4 },
  segItem: { flex: 1, height: 40, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '800', color: colors.muted, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14.5, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, padding: 5 },
  stepBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.olive, borderRadius: 20, padding: 16, marginTop: 18 },
  limeCta: {
    height: 52, borderRadius: 99, backgroundColor: colors.lime, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24, marginTop: 14,
  },
  cameraWrap: { height: 300, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.charcoal },
  frame: { position: 'absolute', top: 50, bottom: 50, left: 40, right: 40, justifyContent: 'center' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.lime, borderRadius: 6 },
  scanLine: { height: 2, backgroundColor: colors.lime, opacity: 0.9 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  permBox: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center' },
});