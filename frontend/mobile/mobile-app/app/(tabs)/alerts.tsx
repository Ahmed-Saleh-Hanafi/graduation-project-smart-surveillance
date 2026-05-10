import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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

const TABS = ['All', 'Intrusion', 'Motion'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '--';
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(ts) {
  if (!ts) return '--:--';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildAbsoluteUrl(raw) {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${BASE_URL}/${raw.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchCameras() {
  try {
    const res = await api.get('/api/Camera');
    const data = res.data?.data ?? res.data;
    if (!Array.isArray(data)) return {};
    return Object.fromEntries(data.map(c => [c.id, c.name]));
  } catch {
    return {};
  }
}

// GET /api/Detection/camera/{cameraId}  أو  GET /api/Detection للكل
async function fetchDetections(cameraMap) {
  const res = await api.get('/api/Detection');
  const raw = res.data?.data ?? res.data ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, idx) => {
      const ts      = item.timestamp ?? item.createdAt;
      const typeKey = (item.type ?? '').toLowerCase();
      return {
        id:          String(item.id ?? idx),
        title:       item.name || (item.type
          ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
          : 'Detection'),
        description: item.description ?? '',
        cameraId:    item.cameraId,
        cameraName:  cameraMap[item.cameraId] ?? `Camera ${item.cameraId ?? '?'}`,
        date:        formatDate(ts),
        time:        formatTime(ts),
        severity:    typeKey === 'intrusion' ? 'intrusion'
                   : typeKey === 'motion'    ? 'motion'
                   : 'default',
        iconType:    typeKey === 'intrusion' ? 'door' : 'camera',
        snapshotUrl: buildAbsoluteUrl(item.snapshotUrl),
        videoUrl:    buildAbsoluteUrl(item.videoUrl),
      };
    })
    .reverse(); // الأحدث أولاً
}

// GET /api/Detection/camera/{cameraId}
async function fetchDetectionsByCamera(cameraId, cameraMap) {
  const res = await api.get(`/api/Detection/camera/${cameraId}`);
  const raw = res.data?.data ?? res.data ?? [];
  if (!Array.isArray(raw)) return [];

  return raw.map((item, idx) => {
    const ts      = item.timestamp ?? item.createdAt;
    const typeKey = (item.type ?? '').toLowerCase();
    return {
      id:          String(item.id ?? idx),
      title:       item.name || (item.type
        ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
        : 'Detection'),
      description: item.description ?? '',
      cameraId:    item.cameraId,
      cameraName:  cameraMap[item.cameraId] ?? `Camera ${item.cameraId ?? '?'}`,
      date:        formatDate(ts),
      time:        formatTime(ts),
      severity:    typeKey === 'intrusion' ? 'intrusion'
                 : typeKey === 'motion'    ? 'motion'
                 : 'default',
      iconType:    typeKey === 'intrusion' ? 'door' : 'camera',
      snapshotUrl: buildAbsoluteUrl(item.snapshotUrl),
      videoUrl:    buildAbsoluteUrl(item.videoUrl),
    };
  }).reverse();
}

// ─── Download ─────────────────────────────────────────────────────────────────

async function downloadFile(url, filename, onProgress) {
  if (!url) return 'no_url';
  try {
    const token    = await AsyncStorage.getItem('userToken');
    const headers  = token ? { Authorization: `Bearer ${token}` } : {};
    const localUri = `${FileSystem.cacheDirectory}${filename}`;

    const dl = FileSystem.createDownloadResumable(
      url, localUri, { headers },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0)
          onProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
      }
    );

    const result = await dl.downloadAsync();
    if (!result || result.status !== 200) return 'error';

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType:    filename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
        dialogTitle: 'Save file',
      });
    }
    return 'saved';
  } catch (e) {
    console.error('downloadFile error:', e);
    return 'error';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeIcon({ type, size = 26, color = '#aaa' }) {
  if (type === 'door')
    return <MaterialCommunityIcons name="door-open" size={size} color={color} />;
  return <Ionicons name="camera-outline" size={size} color={color} />;
}

function SeverityPill({ severity }) {
  const color = SEVERITY_COLOR[severity] ?? SEVERITY_COLOR.default;
  const label = severity === 'intrusion' ? 'Intrusion'
              : severity === 'motion'    ? 'Motion'
              : 'Detection';
  return (
    <View style={[spStyles.pill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <View style={[spStyles.dot, { backgroundColor: color }]} />
      <Text style={[spStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const spStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 0.5,
  },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

function DownloadButton({ item, fileType }) {
  const [pct,  setPct]  = useState(null);
  const [done, setDone] = useState(false);

  const url      = fileType === 'video' ? item.videoUrl : item.snapshotUrl;
  const filename = fileType === 'video'
    ? `detection_${item.id}_video.mp4`
    : `detection_${item.id}_snapshot.jpg`;
  const icon  = fileType === 'video' ? 'videocam-outline' : 'image-outline';
  const label = fileType === 'video' ? 'Video' : 'Snapshot';

  const handlePress = async () => {
    if (!url) {
      Alert.alert('Not available', `No ${label.toLowerCase()} attached.`);
      return;
    }
    setPct(0); setDone(false);
    const result = await downloadFile(url, filename, setPct);
    setPct(null);
    if (result === 'saved') setDone(true);
    else if (result === 'no_url') Alert.alert('Not available', `No ${label.toLowerCase()} attached.`);
    else Alert.alert('Error', 'Download failed.');
  };

  const busy = pct !== null;

  return (
    <TouchableOpacity
      style={[
        dbStyles.btn,
        done && dbStyles.btnDone,
        !url && dbStyles.btnDisabled,
      ]}
      onPress={handlePress}
      disabled={busy || !url}
      activeOpacity={0.75}
    >
      {busy && <View style={[dbStyles.progressFill, { width: `${pct ?? 0}%` }]} />}
      <Ionicons
        name={done ? 'checkmark-circle' : busy ? 'cloud-download-outline' : icon}
        size={14}
        color={done ? '#166534' : !url ? '#C7C7CC' : '#1D4ED8'}
      />
      <Text style={[dbStyles.text, done && dbStyles.textDone, !url && dbStyles.textDisabled]}>
        {busy ? `${pct}%` : done ? 'Saved' : label}
      </Text>
    </TouchableOpacity>
  );
}

const dbStyles = StyleSheet.create({
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#EFF6FF', borderWidth: 0.5, borderColor: '#BFDBFE',
    overflow: 'hidden', position: 'relative',
  },
  btnDone:     { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  btnDisabled: { backgroundColor: '#F5F5F5', borderColor: 'rgba(0,0,0,0.06)' },
  progressFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: '#BFDBFE60',
  },
  text:         { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  textDone:     { color: '#166534' },
  textDisabled: { color: '#C7C7CC' },
});

// ─── Detection Card ───────────────────────────────────────────────────────────

function DetectionCard({ item, onPress }) {
  const accentColor = SEVERITY_COLOR[item.severity] ?? SEVERITY_COLOR.default;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.78} onPress={() => onPress(item)}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardInner}>
        <View style={[styles.iconBox, { backgroundColor: accentColor + '15' }]}>
          <TypeIcon type={item.iconType} size={24} color={accentColor} />
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <SeverityPill severity={item.severity} />
          </View>
          {!!item.description && (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
          )}
          <View style={styles.cardMeta}>
            <Ionicons name="videocam-outline" size={11} color="#8E8E93" />
            <Text style={styles.metaText}>{item.cameraName}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="calendar-outline" size={11} color="#8E8E93" />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ item, onClose }) {
  if (!item) return null;
  const accentColor = SEVERITY_COLOR[item.severity] ?? SEVERITY_COLOR.default;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={dmStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={dmStyles.sheet}>
          <View style={dmStyles.handle} />

          {/* Header */}
          <View style={dmStyles.headerRow}>
            <View style={[dmStyles.headerIcon, { backgroundColor: accentColor + '18' }]}>
              <TypeIcon type={item.iconType} size={22} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={dmStyles.title}>{item.title}</Text>
              <Text style={dmStyles.sub}>{item.cameraName} · {item.date}</Text>
            </View>
            <SeverityPill severity={item.severity} />
          </View>

          {/* Preview */}
          <View style={[dmStyles.preview, { borderColor: accentColor + '30' }]}>
            <TypeIcon type={item.iconType} size={40} color={accentColor + '60'} />
            <Text style={[dmStyles.previewLabel, { color: accentColor + '80' }]}>
              {item.severity.toUpperCase()} DETECTED
            </Text>
          </View>

          {!!item.description && (
            <Text style={dmStyles.desc}>{item.description}</Text>
          )}

          {/* Download */}
          <Text style={dmStyles.sectionLabel}>EVIDENCE</Text>
          <View style={dmStyles.downloadRow}>
            <DownloadButton item={item} fileType="snapshot" />
            <DownloadButton item={item} fileType="video" />
          </View>

          {/* Details */}
          <Text style={dmStyles.sectionLabel}>DETAILS</Text>
          <View style={dmStyles.grid}>
            {[
              ['Camera', item.cameraName],
              ['Type',   item.severity.charAt(0).toUpperCase() + item.severity.slice(1)],
              ['Date',   item.date],
              ['Time',   item.time],
            ].map(([label, value]) => (
              <View key={label} style={dmStyles.cell}>
                <Text style={dmStyles.cellLabel}>{label}</Text>
                <Text style={dmStyles.cellValue}>{value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={dmStyles.closeBtn} onPress={onClose}>
            <Text style={dmStyles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dmStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36, maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sub:        { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  preview: {
    width: '100%', height: 140, backgroundColor: '#0D0D0D',
    borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
  },
  previewLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  desc:         { fontSize: 13, color: '#555', marginBottom: 16, fontStyle: 'italic' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#AEAEB2', letterSpacing: 1, marginBottom: 8 },
  downloadRow:  { flexDirection: 'row', gap: 8, marginBottom: 20 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  cell:         { flex: 1, minWidth: '45%', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12 },
  cellLabel:    { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cellValue:    { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  closeBtn:     { backgroundColor: '#1C1C1E', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const [items,      setItems]      = useState([]);
  const [cameras,    setCameras]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('All');
  const [selected,   setSelected]   = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const cameraMap = await fetchCameras();
      setCameras(cameraMap);
      const data = await fetchDetections(cameraMap);
      setItems(data);
    } catch (e) {
      Alert.alert('Could not load detections', e?.message ?? String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const filtered = items.filter(a => {
    if (activeTab === 'Intrusion') return a.severity === 'intrusion';
    if (activeTab === 'Motion')    return a.severity === 'motion';
    return true;
  });

  const counts = {
    Intrusion: items.filter(a => a.severity === 'intrusion').length,
    Motion:    items.filter(a => a.severity === 'motion').length,
  };

  return (
    <View style={styles.container}>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const count = counts[tab];
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1C1C1E" />
          <Text style={styles.loadingText}>Loading detections…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1C1C1E" />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No detections</Text>
            </View>
          ) : (
            filtered.map(item => (
              <DetectionCard key={item.id} item={item} onPress={setSelected} />
            ))
          )}
        </ScrollView>
      )}

      <DetailModal item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#AEAEB2' },

  tabBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 16, paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99, borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff',
  },
  tabActive:        { backgroundColor: '#1C1C1E', borderColor: 'transparent' },
  tabText:          { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  tabTextActive:    { color: '#fff' },
  tabBadge:         { backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive:   { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText:     { fontSize: 9, fontWeight: '700', color: '#8E8E93' },
  tabBadgeTextActive: { color: '#fff' },

  list:       { padding: 12, gap: 8, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText:  { fontSize: 15, color: '#AEAEB2', fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingLeft: 18, gap: 12,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  timeBadge: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 2, borderRadius: 5, alignItems: 'center',
  },
  timeText:   { color: '#fff', fontSize: 8, fontWeight: '600' },
  cardBody:   { flex: 1 },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 6, marginBottom: 4,
  },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  cardDesc:   { fontSize: 11, color: '#8E8E93', fontStyle: 'italic', marginBottom: 5 },
  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:   { fontSize: 11, color: '#8E8E93' },
  metaDot:    { fontSize: 11, color: '#C7C7CC' },
});