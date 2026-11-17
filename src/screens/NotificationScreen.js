import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Utensils, Trophy, Droplets, FileText, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, Pill, ScreenHeader, useStatusBar } from '../constants/theme';
import { useApp } from '../data/dummyData';

const FILTERS = [
  { key: 'semua', label: 'Semua' },
  { key: 'pengingat', label: 'Pengingat Makan' },
  { key: 'target', label: 'Target & Pencapaian' },
];
const ICONS = { meal: Utensils, activity: Trophy, water: Droplets, summary: FileText };

export default function NotificationScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useSafeAreaInsets();
  const { notifications, markAllRead, markRead, addWater } = useApp();
  const [filter, setFilter] = useState('semua');

  const unreadCount = notifications.filter((n) => n.unread).length;
  const list = notifications.filter((n) => filter === 'semua' || n.category === filter);

  const runAction = (n) => {
    markRead(n.id);
    if (n.action?.type === 'meal') navigation.navigate('FoodSearch', { meal: 'Makan Malam' });
    if (n.action?.type === 'water') addWater(250, 'Dari pengingat');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScreenHeader title="Notifikasi" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Pusat Kabar</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.olive }}>{unreadCount} Baru</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={markAllRead} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} disabled={unreadCount === 0}>
            <CheckCheck size={16} color={unreadCount === 0 ? colors.muted : colors.olive} />
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: unreadCount === 0 ? colors.muted : colors.olive }}>Tandai Dibaca</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
          {FILTERS.map((f) => (
            <Pill key={f.key} small label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>

        {list.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 40 }}>Belum ada notifikasi di kategori ini.</Text>
        )}

        {list.map((n) => {
          const Icon = ICONS[n.kind] || FileText;
          return (
            <TouchableOpacity
              key={n.id}
              activeOpacity={0.9}
              onPress={() => markRead(n.id)}
              style={[styles.card, n.unread && { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 }]}
            >
              <View style={[styles.icon, n.unread && { backgroundColor: colors.olive }]}>
                <Icon size={18} color={n.unread ? colors.lime : colors.olive} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.text, flexShrink: 1 }}>{n.title}</Text>
                    {n.unread && <View style={styles.dot} />}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 6 }}>{n.time}</Text>
                </View>
                <Text style={{ fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 4 }}>{n.body}</Text>
                {n.action && (
                  <TouchableOpacity activeOpacity={0.85} style={styles.action} onPress={() => runAction(n)}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.olive }}>
                      {n.action.label}{n.action.type === 'meal' ? ' ›' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 20, padding: 14, marginBottom: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.lime, borderWidth: 1, borderColor: colors.olive },
  action: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
});