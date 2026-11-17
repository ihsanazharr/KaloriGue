import { FOODS, BARCODE_MOCK } from '../data/dummyData';

// Isi kredensial FatSecret (platform.fatsecret.com) agar pencarian online aktif.
// Jika kosong, aplikasi otomatis memakai database lokal di dummyData.js (100% offline).
// Catatan keamanan: untuk rilis publik, sebaiknya tukar token lewat backend milikmu sendiri.
export const CLIENT_ID = '';
export const CLIENT_SECRET = '';

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL = 'https://platform.fatsecret.com/rest/server.api';
const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';

let tokenCache = { token: null, expiresAt: 0 };

export const isFatSecretConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toBase64(input) {
  let out = '';
  for (let i = 0; i < input.length; i += 3) {
    const a = input.charCodeAt(i);
    const b = input.charCodeAt(i + 1);
    const c = input.charCodeAt(i + 2);
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += Number.isNaN(b) ? '=' : B64[(n >> 6) & 63];
    out += Number.isNaN(c) ? '=' : B64[n & 63];
  }
  return out;
}

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;
  const res = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${toBase64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });
  if (!res.ok) throw new Error(`FatSecret token error ${res.status}`);
  const json = await res.json();
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

// "Per 100g - Calories: 52kcal | Fat: 0.17g | Carbs: 13.81g | Protein: 0.26g"
function parseDescription(desc = '') {
  const pick = (re) => {
    const m = desc.match(re);
    return m ? parseFloat(m[1]) : 0;
  };
  const head = desc.split(' - ')[0] || '';
  return {
    serving: head.replace(/^Per\s*/i, '') || '1 porsi',
    kcal: Math.round(pick(/Calories:\s*([\d.]+)/i)),
    fat: pick(/Fat:\s*([\d.]+)/i),
    carbs: pick(/Carbs:\s*([\d.]+)/i),
    protein: pick(/Protein:\s*([\d.]+)/i),
  };
}

export function normalizeFatSecretFood(item) {
  const n = parseDescription(item.food_description);
  return {
    id: `fs-${item.food_id}`,
    emoji: '🍽️',
    name: item.brand_name ? `${item.food_name} (${item.brand_name})` : item.food_name,
    serving: n.serving,
    kcal: n.kcal,
    carbs: n.carbs,
    protein: n.protein,
    fat: n.fat,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    remote: true,
  };
}

export function searchLocalFoods(query, list = FOODS) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return list;
  const tokens = q.split(/\s+/);
  return list.filter((f) => tokens.every((t) => f.name.toLowerCase().includes(t)));
}

export async function searchRemoteFoods(query, max = 15) {
  if (!isFatSecretConfigured()) return [];
  try {
    const token = await getAccessToken();
    const url = `${API_URL}?method=foods.search&search_expression=${encodeURIComponent(query)}&max_results=${max}&format=json`;
    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = json?.foods?.food;
    if (!raw) return [];
    return (Array.isArray(raw) ? raw : [raw]).map(normalizeFatSecretFood);
  } catch (e) {
    return [];
  }
}

// Lokal selalu dipakai; hasil FatSecret ditambahkan bila kunci API terisi.
export async function searchFoods(query) {
  const local = searchLocalFoods(query);
  if (!isFatSecretConfigured() || (query || '').trim().length < 3) return { source: 'lokal', foods: local };
  const remote = await searchRemoteFoods(query);
  return { source: remote.length ? 'fatsecret' : 'lokal', foods: [...local, ...remote] };
}

// OpenFoodFacts (gratis, tanpa API key) dengan fallback mock saat offline.
export async function lookupBarcode(code) {
  try {
    const res = await fetchWithTimeout(
      `${OFF_URL}/${encodeURIComponent(code)}.json?fields=product_name,nutriments,serving_size`
    );
    if (res.ok) {
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const n = json.product.nutriments || {};
        return {
          name: json.product.product_name || `Produk ${code}`,
          kcal: Math.round(n['energy-kcal_100g'] || 0),
          carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
          protein: Math.round((n.proteins_100g || 0) * 10) / 10,
          fat: Math.round((n.fat_100g || 0) * 10) / 10,
          serving: 'Per 100 g',
        };
      }
    }
  } catch (e) {
    // jaringan gagal -> lanjut ke mock
  }
  return BARCODE_MOCK[code] || null;
}