import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// ─── Mock Data (replace with API call) ───────────────────────────────────────
const MOCK_ALERTS = [
  {
    id: '1',
    title: 'Unrecognized Person',
    location: 'Main Gate',
    camera: 'Camera 03',
    time: '10:42 AM',
    severity: 'critical',
    status: 'pending',
    confidence: 94,
    type: 'face',
    snapshotUrl: null,   // TODO: 'https://your-api.com/snapshots/1.jpg'
    videoUrl: null,      // TODO: 'https://your-api.com/videos/1.mp4'
    log: [
      { time: '10:42:18', text: 'Face detection triggered',           color: '#FF3B30' },
      { time: '10:42:19', text: 'AI identity check — no match found', color: '#FF9500' },
      { time: '10:42:20', text: 'Alert dispatched to security team',  color: '#8E8E93' },
    ],
  },
  {
    id: '2',
    title: 'Door Forced Open',
    location: 'Back Exit',
    camera: 'Sensor D1',
    time: '09:15 AM',
    severity: 'warning',
    status: 'resolved',
    confidence: 99,
    type: 'door',
    snapshotUrl: null,
    videoUrl: null,
    log: [
      { time: '09:15:02', text: 'Sensor D1 tamper signal received',          color: '#FF9500' },
      { time: '09:15:04', text: 'Door forced-open event logged',             color: '#FF3B30' },
      { time: '09:20:11', text: 'Guard verified — false alarm (wind)',        color: '#34C759' },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const SEVERITY_COLOR = {
  critical: '#FF3B30',
  warning:  '#FF9500',
  info:     '#378ADD',
};

const STATUS_BADGE = {
  pending:       { bg: '#FFF0F0', text: '#B91C1C', label: 'Pending' },
  resolved:      { bg: '#F0FDF4', text: '#166534', label: 'Resolved' },
  investigating: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Investigating' },
};

const TABS = ['All', 'Pending', 'Resolved'];

// ─── API Hooks (wire these up) ────────────────────────────────────────────────
async function fetchAlerts() {
  // TODO: const res = await fetch('https://your-api.com/alerts');
  // TODO: return res.json();
  return MOCK_ALERTS;
}

async function resolveAlert(id) {
  const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to resolve alert');
  }
  console.log('resolveAlert:', id);
}

async function escalateAlert(id) {
  const res = await fetch(`/api/alerts/${id}/escalate`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to escalate alert');
  }
  console.log('escalateAlert:', id);
}

// ─── Download Helper ──────────────────────────────────────────────────────────
/**
 * Downloads a file (snapshot or video) and saves it to the device gallery.
 *
 * @param {string} url       - Remote URL of the file
 * @param {string} filename  - e.g. 'alert_1_snapshot.jpg' or 'alert_1_video.mp4'
 * @param {function} onProgress - optional (progress: 0–1) => void
 * @returns {Promise<'saved' | 'no_url' | 'permission_denied' | 'error'>}
 */
export async function downloadEvidence(url, filename, onProgress) {
  if (!url) return 'no_url';

  // 1. Request media library permission
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return 'permission_denied';

  try {
    const localUri = FileSystem.cacheDirectory + filename;

    // 2. Download with optional progress callback
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localUri,
      {},
      onProgress
        ? ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            if (totalBytesExpectedToWrite > 0) {
              onProgress(totalBytesWritten / totalBytesExpectedToWrite);
            }
          }
        : undefined
    );

    const { uri } = await downloadResumable.downloadAsync();

    // 3. Save to device gallery / files
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
  if (type === 'door') {
    return <MaterialCommunityIcons name="door-open" size={size} color={color} />;
  }
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

function ConfidenceBar({ value, color }) {
  return (
    <View>
      <View style={styles.confBarTrack}>
        <View style={[styles.confBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.confLabelRow}>
        <Text style={styles.confLabel}>Confidence</Text>
        <Text style={styles.confLabel}>{value}%</Text>
      </View>
    </View>
  );
}

function DownloadButton({ alert, type }) {
  const [progress, setProgress] = useState(null); // null | 0–1
  const [done, setDone]         = useState(false);

  const url      = type === 'video' ? alert.videoUrl    : alert.snapshotUrl;
  const filename = type === 'video'
    ? `alert_${alert.id}_video.mp4`
    : `alert_${alert.id}_snapshot.jpg`;

  const label    = type === 'video' ? 'Download video'    : 'Download snapshot';
  const icon     = type === 'video' ? 'videocam-outline'  : 'image-outline';

  const handlePress = async () => {
    if (!url) {
      Alert.alert('Not available', `No ${type} URL attached to this alert yet.`);
      return;
    }
    setProgress(0);
    setDone(false);

    const result = await downloadEvidence(url, filename, setProgress);

    setProgress(null);
    if (result === 'saved') {
      setDone(true);
      Alert.alert('Saved', `${type === 'video' ? 'Video' : 'Snapshot'} saved to your gallery.`);
    } else if (result === 'permission_denied') {
      Alert.alert('Permission denied', 'Allow access to your media library in Settings.');
    } else if (result === 'no_url') {
      Alert.alert('Not available', `No ${type} URL attached to this alert yet.`);
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
        {progress !== null
          ? `${Math.round(progress * 100)}%`
          : done
          ? 'Saved'
          : label}
      </Text>
      {progress !== null && (
        <View style={styles.downloadProgress}>
          <View style={[styles.downloadProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function AlertCard({ alert, onResolve, onEscalate, onViewEvent }) {
  const accentColor = SEVERITY_COLOR[alert.severity] || '#8E8E93';

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

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={11} color="#8E8E93" />
            <Text style={styles.metaText}>{alert.location} · {alert.camera}</Text>
          </View>

          <ConfidenceBar value={alert.confidence} color={accentColor} />

          <View style={styles.btnRow}>
            {alert.status === 'pending' && (
              <TouchableOpacity style={styles.btnGreen} onPress={() => onResolve(alert.id)}>
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.btnGreenText}>Resolve</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnBlue} onPress={() => onViewEvent(alert)}>
              <Ionicons name="eye-outline" size={12} color="#1D4ED8" />
              <Text style={styles.btnBlueText}>View event</Text>
            </TouchableOpacity>
            {alert.status === 'pending' && (
              <TouchableOpacity style={styles.btnGray} onPress={() => onEscalate(alert.id)}>
                <Text style={styles.btnGrayText}>Escalate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const [alerts, setAlerts]     = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selected, setSelected]   = useState(null);

  const filtered = alerts.filter(a => {
    if (activeTab === 'All')      return true;
    if (activeTab === 'Pending')  return a.status === 'pending';
    if (activeTab === 'Resolved') return a.status === 'resolved';
    return true;
  });

  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  const handleResolve = async (id: string) => {
  await resolveAlert(id);
  const newLog = { time: 'Now', text: 'Marked resolved by operator', color: '#34C759' };
  setAlerts(prev =>
    prev.map(a => a.id === id
      ? { ...a, status: 'resolved', log: [...(a.log || []), newLog] }
      : a
    )
  );
  if (selected?.id === id) {
    setSelected(prev => prev ? {
      ...prev,
      status: 'resolved',
      log: [...(prev.log || []), newLog],
    } : null);
  }
};

  const handleEscalate = async (id: string) => {
  await escalateAlert(id);
  const newLog = { time: 'Now', text: 'Escalated to supervisor', color: '#2563EB' };
  setAlerts(prev =>
    prev.map(a => a.id === id
      ? { ...a, status: 'investigating', log: [...(a.log || []), newLog] }
      : a
    )
  );
  if (selected?.id === id) {
    setSelected(prev => prev ? {
      ...prev,
      status: 'investigating',
      log: [...(prev.log || []), newLog],
    } : null);
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
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <Text style={styles.empty}>No alerts here</Text>
        )}
        {filtered.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onResolve={handleResolve}
            onEscalate={handleEscalate}
            onViewEvent={setSelected}
          />
        ))}
      </ScrollView>

      {/* Event Modal */}
      {/* Event Modal */}
<Modal
  visible={!!selected}
  animationType="slide"
  transparent
  onRequestClose={() => setSelected(null)}
>
  <View style={styles.modalOverlay}>
    <TouchableOpacity
      style={StyleSheet.absoluteFill}
      onPress={() => setSelected(null)}
    />
    <ScrollView
      style={styles.modalScroll}
      contentContainerStyle={styles.modal}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {selected && (
        <>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{selected.title}</Text>
          <Text style={styles.modalSub}>
            {selected.location} · {selected.camera} · {selected.time}
          </Text>

          <View style={styles.eventShot}>
            <TypeIcon type={selected.type} size={36} color="rgba(52,199,89,0.4)" />
          </View>

          <View style={styles.downloadRow}>
            <DownloadButton alert={selected} type="snapshot" />
            <DownloadButton alert={selected} type="video" />
          </View>

          <View style={styles.detailGrid}>
            {[
              ['Status',     STATUS_BADGE[selected.status]?.label || selected.status],
              ['Confidence', `${selected.confidence}%`],
              ['Location',   selected.location],
              ['Camera',     selected.camera],
            ].map(([label, value]) => (
              <View key={label} style={styles.detailCell}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.logTitle}>Event log</Text>
          {selected.log.map((entry, i) => (
            <View key={i} style={styles.logItem}>
              <View style={[styles.logDot, { backgroundColor: entry.color }]} />
              <Text style={styles.logText}>{entry.text}</Text>
              <Text style={styles.logTime}>{entry.time}</Text>
            </View>
          ))}

          <View style={styles.modalActions}>
            {selected.status === 'pending' ? (
              <>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={() => { handleResolve(selected.id); setSelected(null); }}
                >
                  <Text style={styles.modalBtnPrimaryText}>Mark resolved</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={() => { handleEscalate(selected.id); setSelected(null); }}
                >
                  <Text style={styles.modalBtnSecondaryText}>Escalate</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.modalBtnSecondaryText}>Close</Text>
              </TouchableOpacity>
            )}
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
  container: {
    flex: 1,
    
    backgroundColor: '#F2F3F7',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)',
      backgroundColor: 'transparent',
      backgroundColor: '#ffffff',
  },
  tabActive: {
    backgroundColor: '#1C1C1E',
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 12,
    gap: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 13,
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 12,
    paddingLeft: 16,
    gap: 11,
    alignItems: 'flex-start',
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#E5E8EE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  timeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '500',
  },
  liveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 5,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  confBarTrack: {
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  confLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  confLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  btnGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  btnGreenText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
  },
  btnBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: '#BFDBFE',
  },
  btnBlueText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  btnGray: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  btnGrayText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 32,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  modalScroll: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 14,
  },
  eventShot: {
    width: '100%',
    height: 148,
    backgroundColor: '#111827',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  // Download buttons
  downloadRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    borderWidth: 0.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
    position: 'relative',
  },
  downloadBtnDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  downloadBtnTextDone: {
    color: '#166534',
  },
  downloadProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#BFDBFE',
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#1D4ED8',
  },

  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  detailCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
  },
  detailLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  logTitle: {
    fontSize: 10,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '500',
    marginBottom: 7,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  logDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 4,
    flexShrink: 0,
  },
  logText: {
    flex: 1,
    fontSize: 12,
    color: '#3C3C43',
  },
  logTime: {
    fontSize: 10,
    color: '#8E8E93',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: '#1C1C1E',
  },
  modalBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  modalBtnSecondary: {
    backgroundColor: '#F2F2F7',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  modalBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
});
