import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ------------------------------ Util tanggal ------------------------------ */
const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const timeLabel = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const DAYS_LONG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const formatLongDate = (d = new Date()) =>
  `${DAYS_LONG[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
export const r1 = (x) => Math.round((Number(x) || 0) * 10) / 10;

export const MEALS = ['Sarapan', 'Makan Siang', 'Makan Malam', 'Camilan'];
export const MEAL_SHORT = { Sarapan: 'Sarapan', 'Makan Siang': 'Siang', 'Makan Malam': 'Malam', Camilan: 'Camilan' };

export function guessMeal(d = new Date()) {
  const h = d.getHours();
  if (h < 10) return 'Sarapan';
  if (h < 15) return 'Makan Siang';
  if (h < 18) return 'Camilan';
  return 'Makan Malam';
}

export function waterLabel(d = new Date()) {
  const h = d.getHours();
  if (h < 9) return 'Pagi Hari';
  if (h < 12) return 'Saat Bekerja';
  if (h < 15) return 'Setelah Makan Siang';
  if (h < 18) return 'Sore Hari';
  return 'Malam Hari';
}

export const ACTIVITY_TARGET = 450;
export const WATER_GOAL = 2000;
export const GLASS_ML = 250;
export const REMINDER_START = 7;
export const REMINDER_END = 21;

/* ------------------------------ Makanan Indonesia ------------------------------ */
// (id, emoji, nama, takaran, kkal, karbo, protein, lemak, serat, gula, natrium mg, tags)
const F = (id, emoji, name, serving, kcal, carbs, protein, fat, fiber, sugar, sodium, tags = {}) => ({
  id, emoji, name, serving, kcal, carbs, protein, fat, fiber, sugar, sodium, ...tags,
});

export const FOODS = [
  F('nasi-padang-rendang', '🍛', 'Nasi Padang Rendang', '1 porsi (350 g)', 680, 72, 28, 32, 4, 3, 1250, { frequent: true, local: true }),
  F('seblak-ceker', '🍜', 'Seblak Ceker Komplit', '1 mangkuk (300 g)', 420, 43, 21, 20, 3, 2, 1400, { local: true }),
  F('indomie-telur', '🍜', 'Indomie Goreng + Telur', '1 porsi (110 g)', 380, 50, 13, 14, 2, 4, 1100, { frequent: true, local: true }),
  F('gado-gado', '🥗', 'Gado-Gado Lontong', '1 piring (300 g)', 310, 38, 12, 12, 7, 8, 720, { local: true }),
  F('sate-ayam', '🍢', 'Sate Ayam Madura', '5 tusuk (150 g)', 380, 22, 32, 18, 2, 9, 600, { frequent: true, local: true }),
  F('nasi-goreng-ayam', '🍳', 'Nasi Goreng Ayam', '1 piring (300 g)', 550, 70, 22, 20, 3, 4, 1100, { frequent: true, local: true }),
  F('kerupuk-udang', '🍘', 'Kerupuk Udang', '1 porsi (60 g)', 300, 36, 4, 16, 1, 1, 480, { local: true }),
  F('semangka', '🍉', 'Buah Semangka', '1 mangkuk (300 g)', 90, 20, 2, 0, 1, 17, 3),
  F('soto-ayam', '🍲', 'Soto Ayam', '1 mangkuk (350 g)', 312, 28, 24, 12, 2, 3, 980, { frequent: true, local: true }),
  F('bakso-sapi', '🍲', 'Bakso Sapi', '1 mangkuk (350 g)', 350, 38, 20, 13, 2, 3, 1100, { local: true }),
  F('nasi-uduk', '🍚', 'Nasi Uduk Komplit', '1 porsi (300 g)', 680, 80, 22, 30, 4, 3, 900, { local: true }),
  F('bubur-ayam', '🥣', 'Bubur Ayam', '1 mangkuk (300 g)', 340, 48, 14, 10, 2, 2, 850, { frequent: true, local: true }),
  F('mie-ayam', '🍜', 'Mie Ayam Bakso', '1 mangkuk (400 g)', 460, 62, 18, 16, 3, 4, 1300, { local: true }),
  F('martabak-telur', '🥞', 'Martabak Telur', '1 potong (150 g)', 300, 28, 12, 16, 2, 2, 520, { local: true }),
  F('pisang-goreng', '🍌', 'Pisang Goreng', '2 buah (100 g)', 220, 30, 2, 10, 2, 12, 60, { local: true }),
  F('kopi-susu', '☕', 'Kopi Susu Gula Aren', '1 gelas (250 ml)', 180, 26, 4, 7, 0, 22, 60, { frequent: true }),
  F('teh-manis', '🍵', 'Teh Manis', '1 gelas (250 ml)', 100, 25, 0, 0, 0, 24, 10, { frequent: true }),
  F('tempe-goreng', '🟫', 'Tempe Goreng', '3 potong (60 g)', 190, 10, 10, 12, 3, 0, 240, { local: true }),
  F('ayam-kalasan', '🍗', 'Ayam Goreng Kalasan', '1 potong paha (110 g)', 280, 4, 24, 18, 0, 2, 520, { local: true }),
  F('rawon', '🥘', 'Rawon Daging', '1 mangkuk (300 g)', 270, 8, 26, 15, 2, 2, 950, { local: true }),
  F('ketoprak', '🥗', 'Ketoprak', '1 piring (300 g)', 410, 52, 14, 16, 5, 7, 800, { local: true }),
  F('nasi-putih', '🍚', 'Nasi Putih', '1 piring (150 g)', 200, 44, 4, 1, 1, 0, 2, { frequent: true, local: true }),
  F('telur-dadar', '🍳', 'Telur Dadar', '1 butir (60 g)', 113, 1, 7, 9, 0, 0, 160, { local: true }),
  F('ayam-panggang', '🍗', 'Ayam Panggang', '1 potong dada (120 g)', 163, 0, 25, 7, 0, 0, 380),
  F('tempe-bacem', '🟫', 'Tempe Bacem', '4 potong (100 g)', 208, 16, 18, 8, 4, 8, 420, { local: true }),
];

export const getFood = (id) => FOODS.find((f) => f.id === id);

/* ------------------------------ Aktivitas fisik (MET) ------------------------------ */
export const WORKOUTS = [
  { id: 'jalan', name: 'Jalan Kaki', badge: 'Santai', met: 4.7, icon: 'footprints' },
  { id: 'lari', name: 'Lari / Jogging', badge: 'Kardio', met: 10, icon: 'activity' },
  { id: 'sepeda', name: 'Bersepeda', badge: 'Outdoor', met: 6.8, icon: 'bike' },
  { id: 'beban', name: 'Angkat Beban', badge: 'Gym', met: 6.3, icon: 'dumbbell' },
  { id: 'futsal', name: 'Futsal', badge: 'Tim', met: 7.7, icon: 'trophy' },
  { id: 'badminton', name: 'Bulu Tangkis', badge: 'Agilitas', met: 5.9, icon: 'wind' },
];

export const EXTRA_WORKOUTS = [
  { id: 'renang', name: 'Renang', badge: 'Kardio', met: 6.0, icon: 'activity' },
  { id: 'yoga', name: 'Yoga', badge: 'Santai', met: 2.5, icon: 'footprints' },
  { id: 'aerobik', name: 'Senam Aerobik', badge: 'Kardio', met: 6.5, icon: 'activity' },
  { id: 'tangga', name: 'Naik Tangga', badge: 'Kardio', met: 8.8, icon: 'footprints' },
  { id: 'lompat-tali', name: 'Lompat Tali', badge: 'Agilitas', met: 11, icon: 'wind' },
  { id: 'basket', name: 'Basket', badge: 'Tim', met: 6.5, icon: 'trophy' },
  { id: 'sepak-bola', name: 'Sepak Bola', badge: 'Tim', met: 7, icon: 'trophy' },
  { id: 'silat', name: 'Pencak Silat', badge: 'Agilitas', met: 7, icon: 'wind' },
];

export const INTENSITIES = [
  { key: 'Ringan', mult: 0.8 },
  { key: 'Sedang', mult: 1 },
  { key: 'Berat', mult: 1.25 },
];

/* ------------------------------ Riwayat contoh minggu berjalan (Sen..Min) ------------------------------ */
export const SAMPLE_WEEK = [1980, 2210, 1760, 2320, 2400, 2250, 2060];

export function getDayKcal(foodLogs, key, weekdayIdx) {
  const items = foodLogs.filter((l) => l.date === key);
  const total = items.reduce((s, l) => s + (l.kcal || 0), 0);
  if (items.length > 0) return total;
  return key < dateKey() ? SAMPLE_WEEK[weekdayIdx] : 0;
}

/* ------------------------------ Barcode mock (fallback offline) ------------------------------ */
export const BARCODE_MOCK = {
  '8999999000011': { name: 'Indomie Soto Mie (1 bungkus)', kcal: 380, carbs: 52, protein: 8, fat: 15, serving: '1 bungkus (75 g)' },
  '8992761111014': { name: 'Biskuit Roma Kelapa (3 keping)', kcal: 130, carbs: 19, protein: 2, fat: 5, serving: '3 keping (26 g)' },
  '8996001600146': { name: 'Teh Botol Sosro (1 botol)', kcal: 110, carbs: 27, protein: 0, fat: 0, serving: '1 botol (350 ml)' },
};

/* ------------------------------ Profil, TDEE & target ------------------------------ */
export const ACTIVITY_LEVELS = [
  { key: 'sedenter', label: 'Sedenter', sub: 'Jarang berolahraga', factor: 1.2 },
  { key: 'ringan', label: 'Aktif Ringan', sub: 'Olahraga 1–3x seminggu', factor: 1.375 },
  { key: 'sedang', label: 'Aktif Sedang', sub: 'Olahraga 3–5x seminggu', factor: 1.55 },
  { key: 'berat', label: 'Sangat Aktif', sub: 'Olahraga 6–7x seminggu', factor: 1.725 },
];

export const GOALS = {
  turunkan: { label: 'Turunkan BB', full: 'Turunkan Berat Badan', delta: -500, split: [40, 35, 25] },
  jaga: { label: 'Jaga BB', full: 'Jaga Berat Badan', delta: 0, split: [45, 30, 25] },
  naikkan: { label: 'Naikkan BB', full: 'Naikkan Berat Badan', delta: 400, split: [50, 25, 25] },
};

// Mifflin-St Jeor
export function computeTargets({ weight, height, age, gender, activity, goal }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'Perempuan' ? -161 : 5);
  const level = ACTIVITY_LEVELS.find((a) => a.key === activity) || ACTIVITY_LEVELS[2];
  const g = GOALS[goal] || GOALS.jaga;
  const tdee = bmr * level.factor;
  const minimum = gender === 'Perempuan' ? 1200 : 1500;
  const target = Math.max(Math.round(tdee + g.delta), minimum);
  const [c, p, f] = g.split;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target,
    split: g.split,
    macros: {
      carbs: Math.round((target * c) / 100 / 4),
      protein: Math.round((target * p) / 100 / 4),
      fat: Math.round((target * f) / 100 / 9),
    },
  };
}

const INITIAL_PROFILE = {
  name: 'Ihsan Ertansa',
  email: 'ihsan.ertansa@gmail.com',
  weight: 68,
  height: 173,
  age: 21,
  gender: 'Laki-laki',
  activity: 'sedang',
  goal: 'jaga',
  target: 2250,
  split: [45, 30, 25],
  macros: { carbs: 253, protein: 169, fat: 63 },
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1', category: 'pengingat', kind: 'meal', unread: true, time: '18:30',
    title: 'Waktunya Makan Malam!',
    body: 'Kamu masih punya sisa kuota kalori hari ini. Yuk catat makan malammu agar nutrisi tetap seimbang.',
    action: { type: 'meal', label: 'Catat Makan Sekarang' },
  },
  {
    id: 'n2', category: 'target', kind: 'activity', unread: true, time: '16:45',
    title: 'Target Aktivitas Tercapai!',
    body: 'Hebat! Kamu sudah menyelesaikan latihan hari ini. Pertahankan konsistensimu!',
    action: null,
  },
  {
    id: 'n3', category: 'pengingat', kind: 'water', unread: true, time: '14:05',
    title: 'Jangan Lupa Minum Air',
    body: 'Asupan airmu belum mencapai target. Segelas air putih sekarang bisa membantu fokus dan energimu.',
    action: { type: 'water', label: '+ Tambah 1 Gelas' },
  },
  {
    id: 'n4', category: 'target', kind: 'summary', unread: false, time: 'Kemarin',
    title: 'Ringkasan Nutrisi Kemarin Siap',
    body: 'Laporan nutrisi kemarin sudah tersedia. Buka tab Riwayat untuk melihat rinciannya.',
    action: null,
  },
];

/* ------------------------------ State awal (data contoh saat pertama dibuka) ------------------------------ */
const uid = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

function seedFood(id, meal, time) {
  const f = getFood(id);
  return {
    id: `seed-${id}`, foodId: id, name: f.name, meal, portion: 1, serving: f.serving,
    kcal: f.kcal, carbs: f.carbs, protein: f.protein, fat: f.fat,
    fiber: f.fiber, sugar: f.sugar, sodium: f.sodium, time, date: dateKey(),
  };
}

function buildInitialState() {
  const d = dateKey();
  return {
    onboarded: false,
    profile: INITIAL_PROFILE,
    foodLogs: [
      seedFood('nasi-goreng-ayam', 'Sarapan', '07:30'),
      seedFood('kerupuk-udang', 'Makan Siang', '12:30'),
      seedFood('semangka', 'Makan Siang', '12:45'),
    ],
    activityLogs: [
      { id: 'seed-a1', name: 'Jogging Pagi', minutes: 30, intensity: 'Sedang', kcal: 220, time: '06:30', date: d },
      { id: 'seed-a2', name: 'Angkat Beban', minutes: 25, intensity: 'Sedang', kcal: 130, time: '16:00', date: d },
    ],
    waterLogs: [
      { id: 'seed-w1', ml: 250, label: 'Bangun Tidur', time: '07:10', date: d },
      { id: 'seed-w2', ml: 250, label: 'Saat Bekerja', time: '10:00', date: d },
      { id: 'seed-w3', ml: 250, label: 'Setelah Makan Siang', time: '12:30', date: d },
      { id: 'seed-w4', ml: 500, label: 'Sore Hari', time: '15:30', date: d },
    ],
    reminderOn: false,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

/* ------------------------------ Store global ------------------------------ */
const STORAGE_KEY = 'kaloriGue:state:v1';
const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setState(raw ? { ...buildInitialState(), ...JSON.parse(raw) } : buildInitialState());
      } catch (e) {
        setState(buildInitialState());
      }
    })();
  }, []);

  useEffect(() => {
    if (state) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const actions = useMemo(
    () => ({
      addFood: (entry) =>
        setState((p) => ({
          ...p,
          foodLogs: [...p.foodLogs, { fiber: 0, sugar: 0, sodium: 0, ...entry, id: uid(), date: dateKey(), time: timeLabel() }],
        })),
      removeFood: (id) => setState((p) => ({ ...p, foodLogs: p.foodLogs.filter((x) => x.id !== id) })),
      addActivity: (entry) =>
        setState((p) => ({
          ...p,
          activityLogs: [...p.activityLogs, { ...entry, id: uid(), date: dateKey(), time: timeLabel() }],
        })),
      removeActivity: (id) => setState((p) => ({ ...p, activityLogs: p.activityLogs.filter((x) => x.id !== id) })),
      addWater: (ml, label) =>
        setState((p) => ({
          ...p,
          waterLogs: [...p.waterLogs, { id: uid(), ml, label: label || waterLabel(), time: timeLabel(), date: dateKey() }],
        })),
      removeWater: (ml) =>
        setState((p) => {
          let left = ml;
          const logs = [...p.waterLogs];
          const today = dateKey();
          for (let i = logs.length - 1; i >= 0 && left > 0; i--) {
            if (logs[i].date !== today) continue;
            if (logs[i].ml <= left) {
              left -= logs[i].ml;
              logs.splice(i, 1);
            } else {
              logs[i] = { ...logs[i], ml: logs[i].ml - left };
              left = 0;
            }
          }
          return { ...p, waterLogs: logs };
        }),
      saveProfile: (patch) => setState((p) => ({ ...p, profile: { ...p.profile, ...patch } })),
      setReminderOn: (v) => setState((p) => ({ ...p, reminderOn: v })),
      setOnboarded: (v) => setState((p) => ({ ...p, onboarded: v })),
      markAllRead: () => setState((p) => ({ ...p, notifications: p.notifications.map((n) => ({ ...n, unread: false })) })),
      markRead: (id) =>
        setState((p) => ({ ...p, notifications: p.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
      clearLogs: () => setState((p) => ({ ...p, foodLogs: [], activityLogs: [], waterLogs: [] })),
    }),
    []
  );

  const value = useMemo(() => {
    if (!state) return { ready: false };
    const today = dateKey();
    const foodsToday = state.foodLogs.filter((l) => l.date === today);
    const activitiesToday = state.activityLogs.filter((l) => l.date === today);
    const waterToday = state.waterLogs.filter((l) => l.date === today);
    const sum = (arr, k) => arr.reduce((s, x) => s + (Number(x[k]) || 0), 0);
    const byMeal = {};
    MEALS.forEach((m) => {
      const items = foodsToday.filter((f) => f.meal === m);
      byMeal[m] = { kcal: sum(items, 'kcal'), items };
    });
    const intake = sum(foodsToday, 'kcal');
    const burned = sum(activitiesToday, 'kcal');
    const totals = {
      today, foodsToday, activitiesToday, waterToday, byMeal, intake, burned,
      carbs: r1(sum(foodsToday, 'carbs')),
      protein: r1(sum(foodsToday, 'protein')),
      fat: r1(sum(foodsToday, 'fat')),
      fiber: r1(sum(foodsToday, 'fiber')),
      sugar: r1(sum(foodsToday, 'sugar')),
      sodium: Math.round(sum(foodsToday, 'sodium')),
      water: sum(waterToday, 'ml'),
      remaining: state.profile.target - intake + burned,
    };
    return { ready: true, ...state, totals, ...actions };
  }, [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}