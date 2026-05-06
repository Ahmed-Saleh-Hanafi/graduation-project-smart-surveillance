import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Modal, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';

const BASE_URL = 'http://192.168.1.229:5198';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Config ───────────────────────────────────────────────────────────────────
const SEVERITY_COLOR = {
  intrusion: '#FF3B30',
  motion:    '#FF9500',
  default:   '#378ADD',
};

const STATUS_BADGE = {
  pending:  { bg: '#FFF0F0', text: '#B91C1C', label: 'Pending' },
  resolved: { bg: '#F0FDF4', text: '#166534', label: 'Resolved' },
};

const TABS = ['All', 'Pending', 'Resolved'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(ts) {
  if (!ts) return '--:--';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── API Functions ────────────────────────────────────────────────────────────
async function fetchCameras() {
  try {
    const res = await api.get('/api/cameras');
    const data = res.data?.data ?? res.data;
    if (!Array.isArray(data)) return {};
    // نحول الـ array لـ map: { 2: "street", 3: "Camera_Entrance", ... }
    return Object.fromEntries(data.map(c => [c.id, c.name]));
  } catch {
    return {};
  }
}

async function fetchAlerts(cameraMap) {
  try {
    const res = await api.get('/api/alerts');
    const data = res.data?.data ?? res.data;
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => {
      try {
        return {
          id: item.id?.toString() ?? `item-${index}`,
          title: item.type
            ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
            : 'Alert',
          description: item.description ?? '',
          cameraName: cameraMap[item.cameraId] ?? `Camera ${item.cameraId ?? '?'}`,
          date: formatDate(item.timestamp),
          time: formatTime(item.timestamp),
          createdAt: formatTime(item.createdAt),
          severity: item.type === 'intrusion' ? 'intrusion' : 'motion',
          status: item.isResolved ? 'resolved' : 'pending',
          type: item.type === 'motion' ? 'camera' : 'door',
          snapshotUrl: item.snapshotUrl ?? null,
          videoUrl: item.videoUrl ?? null,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

  } catch (err) {
    if (err.response) {
      throw new Error(`Server returned ${err.response.status}`);
    }
    throw new Error(`Network error — is the server running? (${err.message})`);
  }
}

async function resolveAlert(id) {
  try {
    await api.put(`/api/alerts/${id}/resolve`);
    return true;
  } catch (err) {
    throw new Error(err.response ? `Failed: ${err.response.status}` : err.message);
  }
}

// ─── Download Helper ──────────────────────────────────────────────────────────
export async function downloadEvidence(url, filename, onProgress) {
  if (!url) return 'no_url';
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return 'permission_denied';
  try {
    const localUri = FileSystem.cacheDirectory + filename;
    const dl = FileSystem.createDownloadResumable(
      url, localUri, {},
      onProgress
        ? ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            if (totalBytesExpectedToWrite > 0)
              onProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        : undefined
    );
    const { uri } = await dl.downloadAsync();
    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync('Security Alerts', asset, false);
    return 'saved';
  } catch (e) {
    console.error('downloadEvidence error:', e);
    return 'error';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypeIcon({ type, size = 26, color = '#aaa' }) {
  if (type === 'door')
    return <MaterialCommunityIcons name="door-open" size={size} color={color} />;
  return <Ionicons name="camera-outline" size={size} color={color} />;
}

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

function DownloadButton({ alert, type }) {
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(false);

  const url      = type === 'video' ? alert.videoUrl : alert.snapshotUrl;
  const filename = type === 'video'
    ? `alert_${alert.id}_video.mp4`
    : `alert_${alert.id}_snapshot.jpg`;
  const label = type === 'video' ? 'Download video' : 'Download snapshot';
  const icon  = type === 'video' ? 'videocam-outline' : 'image-outline';

  const handlePress = async () => {
    if (!url) {
      Alert.alert('Not available', `No ${type} attached to this alert yet.`);
      return;
    }
    setProgress(0); setDone(false);
    const result = await downloadEvidence(url, filename, setProgress);
    setProgress(null);
    if (result === 'saved') {
      setDone(true);
      Alert.alert('Saved', `${type === 'video' ? 'Video' : 'Snapshot'} saved to gallery.`);
    } else if (result === 'permission_denied') {
      Alert.alert('Permission denied', 'Allow media library access in Settings.');
    } else if (result === 'no_url') {
      Alert.alert('Not available', `No ${type} attached yet.`);
    } else {
      Alert.alert('Error', 'Download failed. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.downloadBtn, done && styles.downloadBtnDone]}
      onPress={handlePress}
      disabled={progress !== null}
    >
      <Ionicons
        name={done ? 'checkmark-circle-outline' : icon}
        size={13}
        color={done ? '#166534' : '#1D4ED8'}
      />
      <Text style={[styles.downloadBtnText, done && styles.downloadBtnTextDone]}>
        {progress !== null ? `${Math.round(progress * 100)}%` : done ? 'Saved' : label}
      </Text>
      {progress !== null && (
        <View style={styles.downloadProgress}>
          <View style={[styles.downloadProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function AlertCard({ alert, onResolve, onViewEvent }) {
  const accentColor = SEVERITY_COLOR[alert.severity] || SEVERITY_COLOR.default;

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.cardInner}>

        <View style={styles.thumb}>
          <TypeIcon type={alert.type} />
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{alert.time}</Text>
          </View>
          {alert.status === 'pending' && <View style={styles.liveDot} />}
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
            <StatusBadge status={alert.status} />
          </View>

          {/* Description */}
          {!!alert.description && (
            <Text style={styles.descText} numberOfLines={1}>{alert.description}</Text>
          )}

          {/* Camera name + date */}
          <View style={styles.metaRow}>
            <Ionicons name="camera-outline" size={11} color="#8E8E93" />
            <Text style={styles.metaText}>{alert.cameraName}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="calendar-outline" size={11} color="#8E8E93" />
            <Text style={styles.metaText}>{alert.date}</Text>
          </View>

          <View style={styles.btnRow}>
            {alert.status === 'pending' && (
              <TouchableOpacity style={styles.btnGreen} onPress={() => onResolve(alert.id)}>
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.btnGreenText}>Resolve</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnBlue} onPress={() => onViewEvent(alert)}>
              <Ionicons name="eye-outline" size={12} color="#1D4ED8" />
              <Text style={styles.btnBlueText}>View details</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        // نجيب الكاميرات الأول عشان نعمل map للأسماء
        const cameraMap = await fetchCameras();
        const data = await fetchAlerts(cameraMap);
        if (!cancelled) setAlerts(data);
      } catch (e) {
        console.error('load error:', e);
        if (!cancelled) Alert.alert('Could not load alerts', e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = alerts.filter(a => {
    if (activeTab === 'Pending')  return a.status === 'pending';
    if (activeTab === 'Resolved') return a.status === 'resolved';
    return true;
  });

  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      setAlerts(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a)
      );
      setSelected(prev =>
        prev?.id === id ? { ...prev, status: 'resolved' } : prev
      );
    } catch {
      Alert.alert('Error', 'Could not resolve alert. Try again.');
    }
  };

  return (
    <View style={styles.container}>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}{tab === 'Pending' && pendingCount > 0 ? `  ${pendingCount}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#1C1C1E" />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <Text style={styles.empty}>No alerts here</Text>
          )}
          {filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={handleResolve}
              onViewEvent={setSelected}
            />
          ))}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modal}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {selected && (
              <>
                <View style={styles.modalHandle} />

                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{selected.title}</Text>
                  <StatusBadge status={selected.status} />
                </View>

                {/* Description */}
                {!!selected.description && (
                  <Text style={styles.modalDesc}>{selected.description}</Text>
                )}

                {/* Event preview */}
                <View style={styles.eventShot}>
                  <TypeIcon type={selected.type} size={36} color="rgba(52,199,89,0.4)" />
                </View>

                {/* Download buttons */}
                <View style={styles.downloadRow}>
                  <DownloadButton alert={selected} type="snapshot" />
                  <DownloadButton alert={selected} type="video" />
                </View>

                {/* Detail grid — بدون ID */}
                <View style={styles.detailGrid}>
                  {[
                    ['Camera',      selected.cameraName],
                    ['Status',      STATUS_BADGE[selected.status]?.label || selected.status],
                    ['Date',        selected.date],
                    ['Time',        selected.time],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.detailCell}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  {selected.status === 'pending' ? (
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.modalBtnPrimary]}
                      onPress={() => { handleResolve(selected.id); setSelected(null); }}
                    >
                      <Text style={styles.modalBtnPrimaryText}>Mark resolved</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary]}
                    onPress={() => setSelected(null)}
                  >
                    <Text style={styles.modalBtnSecondaryText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F2F3F7' },
  tabBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 16, paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 99, borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff',
  },
  tabActive:          { backgroundColor: '#1C1C1E', borderColor: 'transparent' },
  tabText:            { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
  tabTextActive:      { color: '#fff' },
  list:               { padding: 12, gap: 10 },
  empty:              { textAlign: 'center', marginTop: 60, fontSize: 13, color: '#8E8E93' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', overflow: 'hidden',
  },
  accent:             { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardInner:          { flexDirection: 'row', padding: 12, paddingLeft: 16, gap: 11, alignItems: 'flex-start' },
  thumb: {
    width: 84, height: 84, borderRadius: 14,
    backgroundColor: '#E5E8EE', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  timeBadge: {
    position: 'absolute', bottom: 5, left: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  timeText:           { color: '#fff', fontSize: 9, fontWeight: '500' },
  liveDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#fff',
  },
  info:               { flex: 1, gap: 5 },
  titleRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 5 },
  alertTitle:         { fontSize: 13, fontWeight: '500', color: '#1C1C1E', flex: 1 },
  descText:           { fontSize: 11, color: '#555', fontStyle: 'italic' },
  badge:              { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  badgeText:          { fontSize: 10, fontWeight: '500' },
  metaRow:            { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot:            { color: '#8E8E93', fontSize: 11 },
  metaText:           { fontSize: 11, color: '#8E8E93' },
  btnRow:             { flexDirection: 'row', gap: 5, marginTop: 2 },
  btnGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#34C759', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9,
  },
  btnGreenText:       { fontSize: 11, fontWeight: '500', color: '#fff' },
  btnBlue: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 9, borderWidth: 0.5, borderColor: '#BFDBFE',
  },
  btnBlueText:        { fontSize: 11, fontWeight: '500', color: '#1D4ED8' },

  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalScroll:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modal:              { padding: 18, paddingBottom: 32 },
  modalHandle:        { width: 36, height: 4, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  modalHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle:         { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  modalDesc:          { fontSize: 13, color: '#555', marginBottom: 14, fontStyle: 'italic' },
  eventShot: {
    width: '100%', height: 148, backgroundColor: '#111827',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  downloadRow:        { flexDirection: 'row', gap: 7, marginBottom: 12 },
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 11,
    backgroundColor: '#EFF6FF', borderWidth: 0.5, borderColor: '#BFDBFE',
    overflow: 'hidden', position: 'relative',
  },
  downloadBtnDone:    { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  downloadBtnText:    { fontSize: 12, fontWeight: '500', color: '#1D4ED8' },
  downloadBtnTextDone:{ color: '#166534' },
  downloadProgress:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#BFDBFE' },
  downloadProgressFill:{ height: '100%', backgroundColor: '#1D4ED8' },
  detailGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  detailCell:         { flex: 1, minWidth: '45%', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 10 },
  detailLabel:        { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue:        { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  modalActions:       { flexDirection: 'row', gap: 7, marginTop: 14 },
  modalBtn:           { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalBtnPrimary:    { backgroundColor: '#1C1C1E' },
  modalBtnPrimaryText:{ fontSize: 13, fontWeight: '500', color: '#fff' },
  modalBtnSecondary:  { backgroundColor: '#F2F2F7', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  modalBtnSecondaryText:{ fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
});