// ─── (tabs)/alerts.tsx ────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TABS, SCREEN_TABS } from '../../constants/alerts/alerts';
import { DetectionItem, SensorAlertItem } from '../../constants/alerts/types';
import { useAlerts } from '../../hooks/alerts/useAlerts';
import { registerForNotifications } from '../../hooks/alerts/useNotifications';
import { DetectionCard } from '../../components/alerts/DetectionCard';
import { DetailModal } from '../../components/alerts/DetailModal';
import { SensorAlertCard } from '../../components/alerts/SensorAlertCard';
import { SensorAlertDetailModal } from '../../components/alerts/SensorAlertDetailModal';
import { alertsScreenStyles as S } from '../../styles/alerts/styles';

type UnifiedItem =
  | { kind: 'detection';   data: DetectionItem;   sortTs: string }
  | { kind: 'sensorAlert'; data: SensorAlertItem; sortTs: string };

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();

  const {
    items, loading, refreshing, onRefresh, handleResolved,
    sensorAlerts, loadingSensorAlerts, handleSensorResolved,
  } = useAlerts();

  const [activeScreen, setActiveScreen] = useState<'Detections' | 'Sensor Alerts'>('Detections');
  const [activeTab,    setActiveTab]    = useState('All');
  const [selected,       setSelected]       = useState<DetectionItem | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorAlertItem | null>(null);

  useEffect(() => { registerForNotifications(); }, []);

  const isLoading = loading || loadingSensorAlerts;

  // ── ادمج الاتنين في list واحدة مرتبة بالـ raw timestamp ──────────────────
  const unified: UnifiedItem[] = [
    ...items.map(d => ({
      kind:   'detection' as const,
      data:   d,
      // استخدام _rawTs لو موجود، غير كده d.date
      sortTs: (d as any)._rawTs ?? d.date ?? '',
    })),
    ...sensorAlerts.map(a => ({
      kind:   'sensorAlert' as const,
      data:   a,
      sortTs: a.triggeredAt ?? '',
    })),
  ].sort((a, b) => {
    const tA = a.sortTs ? new Date(a.sortTs).getTime() : 0;
    const tB = b.sortTs ? new Date(b.sortTs).getTime() : 0;
    if (isNaN(tA) && isNaN(tB)) return 0;
    if (isNaN(tA)) return 1;
    if (isNaN(tB)) return -1;
    return tB - tA; // الأحدث أول
  });

  // ── فلتر Screen + Status ──────────────────────────────────────────────────
  const filtered = unified.filter(item => {
    if (activeScreen === 'Detections'    && item.kind !== 'detection')   return false;
    if (activeScreen === 'Sensor Alerts' && item.kind !== 'sensorAlert') return false;

    const resolved = item.kind === 'detection'
      ? item.data.resolved
      : item.data.isResolved;

    if (activeTab === 'Not Resolved') return !resolved;
    if (activeTab === 'Resolved')     return  resolved;
    return true;
  });

  return (
    <View style={S.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={S.selectorCard}>
        <View style={S.topRow}>
          <Text style={S.selectorLabel}>ALERTS</Text>
        </View>

        {/* ── Segment Control ────────────────────────────────────────── */}
        <View style={S.screenTabRow}>
          {SCREEN_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[S.screenTab, activeScreen === tab && S.screenTabActive]}
              onPress={() => { setActiveScreen(tab as any); setActiveTab('All'); }}
              activeOpacity={0.75}
            >
              <Text style={[S.screenTabText, activeScreen === tab && S.screenTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Status Chips ───────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.selectorRow}
        >
          {TABS.map(tab => {
            const active = activeTab === tab;
            const dotColor = active
              ? tab === 'Resolved'     ? '#34C759'
              : tab === 'Not Resolved' ? '#FF3B30'
              : '#007AFF'
              : '#AEAEB2';

            return (
              <TouchableOpacity
                key={tab}
                style={[S.chip, active && S.chipActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.75}
              >
                <View style={[S.chipDot, { backgroundColor: dotColor }]} />
                <Text style={[S.chipText, active && S.chipTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={S.centered}>
          <ActivityIndicator size="large" color="#1C1C1E" />
          <Text style={S.loadingText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[S.list, { paddingBottom: insets.bottom + 55 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1C1C1E"
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={S.empty}>
              <Ionicons name="shield-checkmark-outline" size={56} color="#D1D1D6" />
              <Text style={S.emptyTitle}>No alerts</Text>
              <Text style={S.emptySub}>Pull down to refresh</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map(item =>
                item.kind === 'detection' ? (
                  <DetectionCard
                    key={`det_${item.data.id}`}
                    item={item.data}
                    onPress={setSelected}
                  />
                ) : (
                  <SensorAlertCard
                    key={`sen_${item.data.id}`}
                    item={item.data}
                    onPress={setSelectedSensor}
                  />
                )
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Detail Modals ───────────────────────────────────────────────── */}
      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onResolved={handleResolved}
      />
      <SensorAlertDetailModal
        item={selectedSensor}
        onClose={() => setSelectedSensor(null)}
        onResolved={handleSensorResolved}
      />
    </View>
  );
}