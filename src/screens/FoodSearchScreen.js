import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import { Search, X, Plus, Check, Minus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, num, fmt, Pill, ScreenHeader, useStatusBar } from '../constants/theme';
import { MEALS, MEAL_SHORT, guessMeal, r1, useApp } from '../data/dummyData';
import { searchLocalFoods, searchRemoteFoods, isFatSecretConfigured } from '../services/fatsecretApi';

const FILTERS = ['Semua', 'Sering Dimakan', 'Makanan Lokal'];
const CHIPS = [0.5, 1, 1.5, 2];

export default function FoodSearchScreen({ navigation, route }) {
  useStatusBar('dark');
  const insets = useSafeAreaInsets();
  const { foodLogs, addFood } = useApp();
  const params = route.params || {};

  const [query, setQuery] = useState(params.query || '');
  const [filter, setFilter] = useState('Semua');
  const [selected, setSelected] = useState(null);
  const [meal, setMeal] = useState(params.meal || guessMeal());
  const [portion, setPortion] = useState(1);
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);

  const usedIds = useMemo(() => new Set(foodLogs.map((l) => l.foodId)), [foodLogs]);

  const results = useMemo(() => {
    let list = searchLocalFoods(query);
    if (filter === 'Sering Dimakan') list = list.filter((f) => f.frequent || usedIds.has(f.id));
    if (filter === 'Makanan Lokal') list = list.filter((f) => f.local);
    if (params.sortBy === 'protein') list = [...list].sort((a, b) => b.protein - a.protein);
    return list;
  }, [query, filter, usedIds, params.sortBy]);

  useEffect(() => {
    if (!isFatSecretConfigured() || query.trim().length < 3) {
      setRemote([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const list = await searchRemoteFoods(query.trim());
      if (!cancelled) {
        setRemote(list);
        setLoading(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const shown = filter === 'Semua' ? [...results, ...remote] : results;

  const choose = (f) => {
    Keyboard.dismiss();
    if (selected && selected.id === f.id) {
      setSelected(null);
      return;
    }
    setSelected(f);
    setPortion(1);
  };

  const save = () => {
    if (!selected) return;
    const p = portion;
    addFood({
      foodId: selected.id,
      name: selected.name,
      meal,
      portion: p,
      serving: selected.serving,
      kcal: Math.round(selected.kcal * p),
      carbs: r1(selected.carbs * p),
      protein: r1(selected.protein * p),
      fat: r1(selected.fat * p),
      fiber: r1((selected.fiber || 0) * p),
      sugar: r1((selected.sugar || 0) * p),
      sodium: Math.round((selected.sodium || 0) * p),
    });
    navigation.navigate('MainTabs', { screen: 'Dashboard' });
  };

  const scaled = selected
    ? {
        kcal: Math.round(selected.kcal * portion),
        carbs: Math.round(selected.carbs * portion),
        protein: Math.round(selected.protein * portion),
        fat: Math.round(selected.fat * portion),
      }
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScreenHeader
        title="Tambah Asupan"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity activeOpacity={0.85} style={styles.manualBtn} onPress={() => navigation.navigate('ManualFood')}>
            <Plus size={14} color={colors.olive} strokeWidth={3} />
            <Text style={styles.manualText}>Manual</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.search}>
          <Search size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari makanan Indo (misal: Nasi Padang, Seblak)..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 12, paddingBottom: 4 }}>
          {FILTERS.map((f) => (
            <Pill key={f} label={f} small active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </ScreenHeader>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: selected ? 420 : insets.bottom + 40 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
          <Text style={styles.sectionLabel}>HASIL PENCARIAN ({shown.length})</Text>
          {loading && <ActivityIndicator size="small" color={colors.olive} />}
        </View>

        {shown.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Makanan tidak ditemukan</Text>
            <Text style={{ fontSize: 12.5, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
              Coba kata kunci lain atau tambahkan lewat tombol “+ Manual”.
            </Text>
          </View>
        )}

        {shown.map((f) => {
          const active = selected && selected.id === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.85}
              onPress={() => choose(f)}
              style={[styles.card, active && { borderColor: colors.olive, backgroundColor: colors.white }]}
            >
              <View style={styles.emojiBox}>
                <Text style={{ fontSize: 26 }}>{f.emoji || '🍽️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.foodSub} numberOfLines={1}>
                  <Text style={{ fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] }}>{fmt(f.kcal)} Kkal</Text> • {f.serving}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {[['K', f.carbs], ['P', f.protein], ['L', f.fat]].map(([k, v]) => (
                    <View key={k} style={styles.tag}>
                      <Text style={styles.tagText}>{k}: {Math.round(v)}g</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[styles.addBtn, active && { backgroundColor: colors.olive }]}>
                {active ? <Check size={16} color={colors.lime} strokeWidth={3} /> : <Plus size={16} color={colors.olive} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selected && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.grabber} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }} numberOfLines={1}>{selected.name}</Text>
              <Text style={[num, { fontSize: 20, color: colors.text, marginTop: 2 }]}>
                {fmt(scaled.kcal)} <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>Kkal total</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetLabel}>Waktu Makan</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MEALS.map((m) => (
              <Pill key={m} small label={MEAL_SHORT[m]} active={meal === m} onPress={() => setMeal(m)} style={{ flex: 1, justifyContent: 'center' }} />
            ))}
          </View>

          <Text style={styles.sheetLabel}>Ukuran Porsi</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setPortion((p) => Math.max(0.5, r1(p - 0.5)))}>
                <Minus size={16} color={colors.olive} strokeWidth={3} />
              </TouchableOpacity>
              <Text style={[num, { fontSize: 17, minWidth: 40, textAlign: 'center', color: colors.text }]}>{portion.toFixed(1)}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setPortion((p) => Math.min(10, r1(p + 0.5)))}>
                <Plus size={16} color={colors.olive} strokeWidth={3} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
              {CHIPS.map((c) => (
                <Pill key={c} small variant="lime" label={`${c}x`} active={portion === c} onPress={() => setPortion(c)} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 0 }} />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[['Karbo', scaled.carbs, colors.lime], ['Protein', scaled.protein, colors.olive], ['Lemak', scaled.fat, colors.charcoal]].map(([k, v, c]) => (
              <View key={k} style={styles.macroBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.muted }}>{k.toUpperCase()}</Text>
                </View>
                <Text style={[num, { fontSize: 16, color: colors.text, marginTop: 3 }]}>{v}g</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.saveBtn} onPress={save}>
            <Check size={18} color={colors.olive} strokeWidth={3} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.olive }}>Simpan ke Log Asupan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.lime,
    paddingHorizontal: 12, height: 34, borderRadius: 99,
  },
  manualText: { fontSize: 12.5, fontWeight: '800', color: colors.olive },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: 99, paddingHorizontal: 16, height: 46, marginTop: 6,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, height: 46 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.muted },
  empty: { alignItems: 'center', padding: 30 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 20,
    padding: 12, marginBottom: 10, borderWidth: 1.5, borderColor: 'transparent',
  },
  emojiBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  foodName: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  foodSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  tag: { backgroundColor: colors.white, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 10.5, fontWeight: '700', color: colors.muted, fontVariant: ['tabular-nums'] },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 8,
    borderTopWidth: 1, borderColor: colors.border, ...shadow, shadowOffset: { width: 0, height: -6 },
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 10 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sheetLabel: { fontSize: 11.5, fontWeight: '800', color: colors.muted, marginTop: 12, marginBottom: 7 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 99, padding: 4 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  macroBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 10 },
  saveBtn: {
    marginTop: 14, height: 52, borderRadius: 99, backgroundColor: colors.lime,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
});