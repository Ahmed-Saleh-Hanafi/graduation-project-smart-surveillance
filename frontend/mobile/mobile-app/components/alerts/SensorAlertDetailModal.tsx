// ─── components/alerts/SensorAlertDetailModal.tsx ────────────────────────────

import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SensorAlertItem } from '../../constants/alerts/types';
import { getSensorTypeDisplay } from '../../constants/alerts/alerts';
import { resolveSensorAlert } from '../../hooks/alerts/useAlerts';

interface Props {
  item:       SensorAlertItem | null;
  onClose:    () => void;
  onResolved: (id: string) => void;
}

export const SensorAlertDetailModal = ({ item, onClose, onResolved }: Props) => {
  const [resolving, setResolving] = useState(false);
  const startY = useRef(0);

  if (!item) return null;

  const display  = getSensorTypeDisplay(item.sensorType);
  const pct      = Math.min(100, Math.round((item.triggeredValue / (item.threshold * 1.5)) * 100));
  const barColor = item.triggeredValue <= item.threshold * 0.6
    ? '#34C759'
    : item.triggeredValue <= item.threshold
    ? '#FF9500'
    : '#FF3B30';

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveSensorAlert(item.id);
      onResolved(item.id);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not resolve.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={S.sheet}>

          {/* handle */}
          <View
            style={S.handleWrap}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={()  => true}
            onResponderGrant={e  => { startY.current = e.nativeEvent.pageY; }}
            onResponderRelease={e => { if (e.nativeEvent.pageY - startY.current > 80) onClose(); }}
          >
            <View style={S.handle} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={S.headerRow}>
              <View style={[S.iconBox, { backgroundColor: display.color + '18' }]}>
                <Ionicons name={display.icon} size={24} color={display.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.title}>{item.sensorName}</Text>
                <Text style={[S.sub, { color: display.color }]}>{display.label}</Text>
              </View>
              <View style={[S.statusChip, {
                backgroundColor: item.isResolved ? '#F0FDF4' : '#FFF5F5',
                borderColor:     item.isResolved ? '#BBF7D0' : '#FECACA',
              }]}>
                <Ionicons
                  name={item.isResolved ? 'checkmark-circle' : 'warning'}
                  size={12}
                  color={item.isResolved ? '#34C759' : '#FF3B30'}
                />
                <Text style={[S.statusTxt, { color: item.isResolved ? '#166534' : '#FF3B30' }]}>
                  {item.isResolved ? 'Resolved' : 'Active'}
                </Text>
              </View>
            </View>

            {/* Date + Time */}
            <View style={S.dateRow}>
              <View style={S.dateChip}>
                <Ionicons name="calendar-outline" size={13} color="#8E8E93" />
                <Text style={S.dateChipTxt}>{item.date}</Text>
              </View>
              <View style={S.dateChip}>
                <Ionicons name="time-outline" size={13} color="#8E8E93" />
                <Text style={S.dateChipTxt}>{item.time}</Text>
              </View>
            </View>

            {/* القيمة الكبيرة */}
            <View style={S.bigCard}>
              <Text style={[S.bigValue, { color: barColor }]}>{item.triggeredValue}</Text>
              <Text style={S.bigSub}>triggered value</Text>
              <View style={S.barTrack}>
                <View style={[S.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
              </View>
              <View style={S.barLabels}>
                <Text style={S.barLbl}>0</Text>
                <Text style={S.barLbl}>threshold {item.threshold}</Text>
              </View>
            </View>

            {/* message */}
            {!!item.message && (
              <View style={S.msgCard}>
                <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
                <Text style={S.msgTxt}>{item.message}</Text>
              </View>
            )}

            {/* Details */}
            <Text style={S.sec}>DETAILS</Text>
            <View style={S.grid}>
              {([
                ['Sensor',          item.sensorName],
                ['Type',            display.label],
                ['Triggered Value', String(item.triggeredValue)],
                ['Threshold',       String(item.threshold)],
                ['Date',            item.date],
                ['Time',            item.time],
              ] as [string, string][]).map(([label, value]) => (
                <View key={label} style={S.cell}>
                  <Text style={S.cellL}>{label}</Text>
                  <Text style={S.cellV}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Resolve */}
            {!item.isResolved && (
              <>
                <Text style={S.sec}>ACTION</Text>
                <TouchableOpacity
                  style={[S.resolveBtn, resolving && { opacity: 0.7 }]}
                  onPress={handleResolve}
                  disabled={resolving}
                >
                  {resolving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={S.resolveTxt}>Mark as Resolved</Text>
                      </>
                  }
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%' },
  handleWrap: { alignItems: 'center', paddingBottom: 12 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)' },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  sub:        { fontSize: 13, fontWeight: '600', marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusTxt:  { fontSize: 11, fontWeight: '700' },
  dateRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dateChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  dateChipTxt:{ fontSize: 12, color: '#3C3C43' },
  bigCard:    { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 10, marginBottom: 16, alignItems: 'center' },
  bigValue:   { fontSize: 56, fontWeight: '800' },
  bigSub:     { fontSize: 12, color: '#AEAEB2', marginTop: 2, marginBottom: 12 },
  barTrack:   { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.07)', width: '100%', overflow: 'hidden' },
  barFill:    { height: 8, borderRadius: 4 },
  barLabels:  { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 6 },
  barLbl:     { fontSize: 10, color: '#AEAEB2' },
  msgCard:    { flexDirection: 'row', gap: 10, backgroundColor: '#EAF4FF', borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'flex-start' },
  msgTxt:     { flex: 1, fontSize: 13, color: '#004A8F', lineHeight: 19 },
  sec:        { fontSize: 11, fontWeight: '700', color: '#AEAEB2', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  cell:       { flex: 1, minWidth: '45%', backgroundColor: '#f1f1f1', borderRadius: 12, padding: 12 },
  cellL:      { fontSize: 11, color: '#AEAEB2', marginBottom: 4 },
  cellV:      { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  resolveBtn: { backgroundColor: '#34C759', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginBottom: 8 },
  resolveTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});