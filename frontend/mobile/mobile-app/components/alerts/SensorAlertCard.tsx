// ─── components/alerts/SensorAlertCard.tsx ───────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SensorAlertItem } from '../../constants/alerts/types';
import { getSensorTypeDisplay } from '../../constants/alerts/alerts';
//import { detailModalStyles as S } from '../../styles/alerts/styles';

interface Props {
  item:    SensorAlertItem;
  onPress: (item: SensorAlertItem) => void;
}

export const SensorAlertCard = ({ item, onPress }: Props) => {
  const display = getSensorTypeDisplay(item.sensorType);

  return (
    <View style={[S.wrap, item.isResolved && S.resolved]}>
      <TouchableOpacity activeOpacity={0.74} onPress={() => onPress(item)}>
        <View style={S.inner}>

          {/* شريط اللون الجانبي */}
          <View style={[S.strip, { backgroundColor: display.color }]} />

          {/* الأيقونة */}
          <View style={[S.iconBox, { backgroundColor: display.color + '15' }]}>
            <Ionicons name={display.icon} size={22} color={display.color} />
          </View>

          {/* المحتوى */}
          <View style={S.content}>
            <View style={S.row}>
              <Text style={S.name} numberOfLines={1}>{item.sensorName}</Text>
              {/* badge النوع */}
              <View style={[S.typeBadge, { backgroundColor: display.color + '18', borderColor: display.color + '40' }]}>
                <Text style={[S.typeTxt, { color: display.color }]}>-{display.label}</Text>
              </View>
            </View>

            {/* القيمة مقارنة بالـ threshold */}
            <View style={S.valueRow}>
              <Text style={[S.valueTxt, { color: display.color }]}>
                {item.triggeredValue}
              </Text>
              <Text style={S.threshTxt}>
                {' '}/ threshold {item.threshold}
              </Text>
            </View>

            {/* message من الـ API لو موجودة */}
            {!!item.message && (
              <Text style={S.message} numberOfLines={1}>{item.message}</Text>
            )}

            {/* Meta: date + time */}
            <View style={S.meta}>
              <Ionicons name="calendar-outline" size={11} color="#AEAEB2" />
              <Text style={S.metaTxt}>{item.date}</Text>
              <View style={S.sep} />
              <Ionicons name="time-outline" size={11} color="#AEAEB2" />
              <Text style={S.metaTxt}>{item.time}</Text>
            </View>
          </View>

          {/* الحالة */}
          <View style={S.right}>
            {item.isResolved
              ? <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              : <Ionicons name="chevron-forward"  size={18} color="#C7C7CC" />
            }
          </View>

        </View>
      </TouchableOpacity>

      {/* شريط التقدم: القيمة vs الـ max (2× threshold) */}
      {!item.isResolved && (
        <View style={S.barTrack}>
          <View style={[
            S.barFill,
            {
              width: `${Math.min(100, (item.triggeredValue / (item.threshold * 1.5)) * 100)}%` as any,
              backgroundColor: display.color,
            },
          ]} />
        </View>
      )}
    </View>
  );
};

const S = StyleSheet.create({
  wrap:     { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  resolved: { opacity: 0.55 },
  inner:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strip:    { width: 4, alignSelf: 'stretch', borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  iconBox:  { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  content:  { flex: 1, paddingVertical: 14 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 },
  name:     { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  typeBadge:{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 0.5 },
  typeTxt:  { fontSize: 10, fontWeight: '700' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  valueTxt: { fontSize: 18, fontWeight: '800' },
  threshTxt:{ fontSize: 11, color: '#AEAEB2' },
  message:  { fontSize: 11, color: '#636366', marginTop: 1 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaTxt:  { fontSize: 11, color: '#AEAEB2' },
  sep:      { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D1D6', marginHorizontal: 2 },
  right:    { paddingRight: 14 },
  barTrack: { height: 3, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 12, marginBottom: 8, borderRadius: 2, overflow: 'hidden' },
  barFill:  { height: 3, borderRadius: 2 },
});