import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Modal, ActivityIndicator, RefreshControl,
  Image, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as signalR from '@microsoft/signalr';

// ─── Notification setup ───────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const registerForNotifications = async () => {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('security', {
      name:             'Security Alerts',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#FF3B30',
      sound:            'default',
    });
  }
};

const sendLocalNotification = async (title: string, body: string, data?: object) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default', priority: Notifications.AndroidNotificationPriority.MAX },
    trigger: null,
  });
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'http://192.168.1.229:5198';
const HUB_URL  = `${BASE_URL}/hub/alerts`;

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async (c) => {
  const t = await AsyncStorage.getItem('userToken');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const SEV: Record<string, { color: string; label: string; icon: any }> = {
  intrusion: { color: '#FF3B30', label: 'Intrusion', icon: 'warning'  },
  motion:    { color: '#FF9500', label: 'Motion',    icon: 'walk'      },
  default:   { color: '#378ADD', label: 'Detection', icon: 'camera'    },
};

const TABS = ['All', 'Not Resolved', 'Resolved'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetectionItem {
  id: string;
  name: string;
  description: string;
  type: string;
  cameraId: number;
  cameraName: string;
  date: string;
  time: string;
  severity: 'intrusion' | 'motion' | 'default';
  snapshotUrl: string | null;
  videoUrl: string | null;
  resolved: boolean;
  isNew?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (ts: string) => !ts ? '--' :
  new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtTime = (ts: string) => !ts ? '--:--' :
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const buildUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  const clean = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${BASE_URL}/${clean}`;
};

const getSeverity = (type: string): 'intrusion' | 'motion' | 'default' => {
  const t = (type ?? '').toLowerCase();
  if (t === 'intrusion') return 'intrusion';
  if (t === 'motion')    return 'motion';
  return 'default';
};

const mapItem = (item: any, cameraMap: Record<number, string>): DetectionItem => {
  const ts = item.detectedAt ?? item.timestamp ?? item.createdAt ?? '';
  return {
    id:          String(item.id ?? Math.random()),
    name:        item.name        ?? 'Detection',
    description: item.description ?? '',
    type:        item.type        ?? '',
    cameraId:    item.cameraId,
    cameraName:  cameraMap[item.cameraId] ?? `Camera ${item.cameraId ?? '?'}`,
    date:        fmtDate(ts),
    time:        fmtTime(ts),
    severity:    getSeverity(item.type),
    snapshotUrl: buildUrl(item.snapShotUrl ?? item.snapshotUrl),
    videoUrl:    buildUrl(item.videoUrl),
    resolved:    item.isResolved ?? item.resolved ?? false,
  };
};

// ─── API ──────────────────────────────────────────────────────────────────────

const fetchCameraMap = async (): Promise<Record<number, string>> => {
  try {
    const res = await api.get('/api/Camera');
    const data: any[] = res.data?.data ?? res.data ?? [];
    return Object.fromEntries(data.map((c: any) => [c.id, c.name]));
  } catch { return {}; }
};

const fetchAllowedCameraIds = async (): Promise<Set<number>> => {
  try {
    const res = await api.get('/api/Camera');
    const data: any[] = res.data?.data ?? res.data ?? [];
    return new Set(data.map((c: any) => c.id));
  } catch { return new Set(); }
};

const fetchAllDetections = async (
  cameraMap: Record<number, string>,
  allowedIds: Set<number>,
): Promise<DetectionItem[]> => {
  const res = await api.get('/api/Detection');
  const raw: any[] = res.data?.data ?? res.data ?? [];
  return raw
    .filter(d => allowedIds.size === 0 || allowedIds.has(d.cameraId))
    .map(d => mapItem(d, cameraMap))
    .reverse();
};

const resolveDetection = async (id: string) => { await api.post(`/api/Detection/${id}/resolve`); };

// ─── Download ─────────────────────────────────────────────────────────────────

const downloadToGallery = async (
  url: string, filename: string, onProgress: (p: number) => void,
): Promise<'saved' | 'error'> => {
  try {
    console.log('⬇️ downloading:', url);

    // 1. اطلب الـ permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    console.log('Permission status:', status);

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow media library access from Settings to save files.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return 'error';
    }

    // 2. حمّل الملف في الـ cache
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
    console.log('Download result:', result?.status, result?.uri);

    if (!result || result.status !== 200) {
      Alert.alert('Error', `Server returned status: ${result?.status}`);
      return 'error';
    }

    // 3. احفظ في الـ gallery باستخدام saveToLibraryAsync (بيتجنب مشكلة الـ album permission)
    await MediaLibrary.saveToLibraryAsync(result.uri);

    // 4. جرب تضيف لـ album بشكل آمن — لو فشل مش مشكلة، الملف اتحفظ
    try {
      const asset  = await MediaLibrary.createAssetAsync(result.uri);
      const albums = await MediaLibrary.getAlbumsAsync();
      const existing = albums.find(a => a.title === 'Security Detections');
      if (existing) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], existing, false);
      } else {
        await MediaLibrary.createAlbumAsync('Security Detections', asset, false);
      }
    } catch {
      console.warn('Album step failed — file already saved to gallery');
    }

    // 5. امسح الـ cache
    await FileSystem.deleteAsync(result.uri, { idempotent: true });

    return 'saved';

  } catch (e: any) {
    console.error('dl error:', e);
    console.error('dl error message:', JSON.stringify(e));
    return 'error';
  }
};

// ─── SeverityPill ─────────────────────────────────────────────────────────────

const SeverityPill = ({ severity }: { severity: string }) => {
  const { color, label } = SEV[severity] ?? SEV.default;
  return (
    <View style={[pill.wrap, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <View style={[pill.dot, { backgroundColor: color }]} />
      <Text style={[pill.txt, { color }]}>{label}</Text>
    </View>
  );
};
const pill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 0.5 },
  dot:  { width: 5, height: 5, borderRadius: 3 },
  txt:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── DownloadBtn ──────────────────────────────────────────────────────────────

const DownloadBtn = ({ url, filename, icon, label }: {
  url: string | null; filename: string; icon: any; label: string;
}) => {
  const [pct, setPct]   = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const press = async () => {
    if (!url) { Alert.alert('Not available', `No ${label} attached.`); return; }
    setPct(0); setDone(false);
    const r = await downloadToGallery(url, filename, setPct);
    setPct(null);
    if (r === 'saved') { setDone(true); Alert.alert('✅ Saved', `${label} saved to gallery.`); }
    else Alert.alert('Error', 'Download failed.');
  };
  const busy = pct !== null;
  return (
    <TouchableOpacity
      style={[db.btn, done && db.done, !url && db.dis]}
      onPress={press}
      disabled={busy || !url}
      activeOpacity={0.75}
    >
      {busy && <View style={[db.bar, { width: `${pct ?? 0}%` as any }]} />}
      <Ionicons
        name={done ? 'checkmark-circle' : busy ? 'cloud-download-outline' : icon}
        size={14}
        color={done ? '#166534' : !url ? '#C7C7CC' : '#1D4ED8'}
      />
      <Text style={[db.txt, done && db.doneTxt, !url && db.disTxt]}>
        {busy ? `${pct}%` : done ? 'Saved' : label}
      </Text>
    </TouchableOpacity>
  );
};
const db = StyleSheet.create({
  btn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 0.5, borderColor: '#BFDBFE', overflow: 'hidden', position: 'relative' },
  done:    { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  dis:     { backgroundColor: '#F5F5F5', borderColor: 'rgba(0,0,0,0.06)' },
  bar:     { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#BFDBFE60' },
  txt:     { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  doneTxt: { color: '#166534' },
  disTxt:  { color: '#C7C7CC' },
});

// ─── LiveBadge ────────────────────────────────────────────────────────────────

const LiveBadge = ({ connected }: { connected: boolean }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!connected) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [connected]);
  return (
    <View style={lb.wrap}>
      <Animated.View style={[lb.dot, { opacity: pulse, backgroundColor: connected ? '#34C759' : '#FF3B30' }]} />
      <Text style={[lb.txt, { color: connected ? '#34C759' : '#FF3B30' }]}>{connected ? 'Live' : 'Offline'}</Text>
    </View>
  );
};
const lb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  txt:  { fontSize: 11, fontWeight: '700' },
});

// ─── Detection Card ───────────────────────────────────────────────────────────

const DetectionCard = ({ item, onPress }: { item: DetectionItem; onPress: (i: DetectionItem) => void }) => {
  const { color } = SEV[item.severity] ?? SEV.default;

  return (
    <View style={[card.wrap, item.resolved && card.resolved]}>
      <TouchableOpacity activeOpacity={0.74} onPress={() => onPress(item)}>
        <View style={card.inner}>
          <View style={[card.strip, { backgroundColor: color }]} />
          <View style={[card.imgBox, { backgroundColor: color + '10' }]}>
            {item.snapshotUrl ? (
              <Image source={{ uri: item.snapshotUrl }} style={card.img} resizeMode="cover" />
            ) : (
              <Ionicons name={SEV[item.severity]?.icon ?? 'camera'} size={24} color={color} />
            )}
          </View>
          <View style={card.content}>
            <View style={card.row}>
              <Text style={card.name} numberOfLines={1}>{item.name}</Text>
              <SeverityPill severity={item.severity} />
            </View>
            {!!item.description && (
              <Text style={card.desc} numberOfLines={1}>{item.description}</Text>
            )}
            <View style={card.meta}>
              <Ionicons name="videocam-outline" size={11} color="#AEAEB2" />
              <Text style={card.metaTxt}>{item.cameraName}</Text>
              <View style={card.sep} />
              <Ionicons name="calendar-outline" size={11} color="#AEAEB2" />
              <Text style={card.metaTxt}>{item.date}</Text>
              <View style={card.sep} />
              <Ionicons name="time-outline" size={11} color="#AEAEB2" />
              <Text style={card.metaTxt}>{item.time}</Text>
            </View>
          </View>
          <View style={card.right}>
            {item.resolved
              ? <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              : <Ionicons name="chevron-forward"  size={18} color="#C7C7CC" />
            }
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};
const card = StyleSheet.create({
  wrap:    { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  resolved:{ opacity: 0.55 },
  inner:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strip:   { width: 4, alignSelf: 'stretch', borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  imgBox:  { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  img:     { width: 52, height: 52 },
  content: { flex: 1, paddingVertical: 14 },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 },
  name:    { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  desc:    { fontSize: 11, color: '#8E8E93', marginBottom: 5, fontStyle: 'italic' },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaTxt: { fontSize: 11, color: '#AEAEB2' },
  sep:     { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D1D6', marginHorizontal: 2 },
  right:   { paddingRight: 14 },
});

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const DetailModal = ({ item, onClose, onResolved }: {
  item: DetectionItem | null; onClose: () => void; onResolved: (id: string) => void;
}) => {
  const [resolving, setResolving] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  useEffect(() => { setImgError(false); }, [item?.id]);
  if (!item) return null;
  const { color } = SEV[item.severity] ?? SEV.default;

  const handleResolve = async () => {
    setResolving(true);
    try { await resolveDetection(item.id); onResolved(item.id); onClose(); }
    catch (e: any) { Alert.alert('Error', e?.message ?? 'Could not resolve.'); }
    finally { setResolving(false); }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={dm.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={dm.sheet}>
          <View style={dm.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>

            <View style={dm.headerRow}>
              <View style={[dm.headerIcon, { backgroundColor: color + '18' }]}>
                <Ionicons name={SEV[item.severity]?.icon ?? 'camera'} size={22} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dm.title}>{item.name}</Text>
                <Text style={dm.sub}>{item.cameraName}</Text>
              </View>
              <SeverityPill severity={item.severity} />
            </View>

            <View style={dm.dateRow}>
              <View style={dm.dateChip}>
                <Ionicons name="calendar-outline" size={13} color="#8E8E93" />
                <Text style={dm.dateChipTxt}>{item.date}</Text>
              </View>
              <View style={dm.dateChip}>
                <Ionicons name="time-outline" size={13} color="#8E8E93" />
                <Text style={dm.dateChipTxt}>{item.time}</Text>
              </View>
              <View style={[dm.statusChip, {
                backgroundColor: item.resolved ? '#F0FDF4' : '#FFF5F5',
                borderColor:     item.resolved ? '#BBF7D0' : '#FECACA',
              }]}>
                <Ionicons name={item.resolved ? 'checkmark-circle' : 'ellipse'} size={12} color={item.resolved ? '#34C759' : '#FF3B30'} />
                <Text style={[dm.dateChipTxt, { color: item.resolved ? '#166534' : '#FF3B30' }]}>
                  {item.resolved ? 'Resolved' : 'Active'}
                </Text>
              </View>
            </View>

            {item.snapshotUrl && !imgError ? (
              <Image
                source={{ uri: item.snapshotUrl }}
                style={[dm.snapshot, { borderColor: color + '30' }]}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[dm.snapPh, { borderColor: color + '30' }]}>
                <Ionicons name="image-outline" size={36} color={color + '50'} />
                <Text style={[dm.snapPhTxt, { color: color + '80' }]}>
                  {item.snapshotUrl ? 'Image unavailable' : 'No snapshot'}
                </Text>
              </View>
            )}

            {!!item.description && <Text style={dm.desc}>{item.description}</Text>}

            <Text style={dm.sec}>DETAILS</Text>
            <View style={dm.grid}>
              {([
                ['Camera', item.cameraName],
                ['Type',   SEV[item.severity]?.label ?? 'Detection'],
                ['Date',   item.date],
                ['Time',   item.time],
              ] as [string, string][]).map(([l, v]) => (
                <View key={l} style={dm.cell}>
                  <Text style={dm.cellL}>{l}</Text>
                  <Text style={dm.cellV}>{v}</Text>
                </View>
              ))}
            </View>

            <Text style={dm.sec}>EVIDENCE</Text>
            <View style={dm.dlRow}>
              <DownloadBtn
                url={item.snapshotUrl}
                filename={`snap_${item.id}.jpg`}
                icon="image-outline"
                label="Snapshot"
              />
              <DownloadBtn
                url={item.videoUrl}
                filename={`vid_${item.id}.mp4`}
                icon="videocam-outline"
                label="Video"
              />
            </View>

            {!item.resolved && (
              <>
                <Text style={dm.sec}>ACTION</Text>
                <TouchableOpacity
                  style={[dm.resolveBtn, resolving && { opacity: 0.7 }]}
                  onPress={handleResolve}
                  disabled={resolving}
                >
                  {resolving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={dm.resolveTxt}>Mark as Resolved</Text></>
                  }
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
              <Text style={dm.closeTxt}>Close</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const dm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '92%', overflow: 'hidden' },
  accent:      { height: 0 },
  handle:      { width: 36, height: 4, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sub:         { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  dateRow:     { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  dateChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5 },
  dateChipTxt: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
  snapshot:    { width: '100%', height: 200, borderRadius: 16, borderWidth: 1, marginBottom: 14, backgroundColor: '#0D0D0D' },
  snapPh:      { width: '100%', height: 130, borderRadius: 16, borderWidth: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  snapPhTxt:   { fontSize: 12, fontWeight: '600' },
  desc:        { fontSize: 13, color: '#555', marginBottom: 16, fontStyle: 'italic' },
  sec:         { fontSize: 10, fontWeight: '700', color: '#AEAEB2', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  cell:        { flex: 1, minWidth: '45%', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12 },
  cellL:       { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cellV:       { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  dlRow:       { flexDirection: 'row', gap: 8, marginBottom: 20 },
  resolveBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#34C759', borderRadius: 14, paddingVertical: 14, marginBottom: 10 },
  resolveTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn:    { backgroundColor: '#F2F2F7', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeTxt:    { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [items,      setItems]      = useState<DetectionItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('All');
  const [selected,   setSelected]   = useState<DetectionItem | null>(null);
  const [connected,  setConnected]  = useState(false);
  const hubRef           = useRef<signalR.HubConnection | null>(null);
  const cameraMapRef     = useRef<Record<number, string>>({});
  const allowedCamIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => { registerForNotifications(); }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const cameraMap  = await fetchCameraMap();
      const allowedIds = await fetchAllowedCameraIds();
      cameraMapRef.current     = cameraMap;
      allowedCamIdsRef.current = allowedIds;
      const data = await fetchAllDetections(cameraMap, allowedIds);
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not load detections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let conn: signalR.HubConnection;
    const startHub = async () => {
      const token = await AsyncStorage.getItem('userToken');
      conn = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token ?? '',
          
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      conn.on('ReceiveDetectionAlert', (payload: any) => {
        const allowed = allowedCamIdsRef.current;
        if (allowed.size > 0 && !allowed.has(payload.cameraId)) return;

        const newItem: DetectionItem = { ...mapItem(payload, cameraMapRef.current), isNew: true };

        setItems(prev => {
          if (prev.some(i => i.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });

        const { label } = SEV[newItem.severity] ?? SEV.default;
        sendLocalNotification(
          `🚨 ${label} Alert`,
          `${newItem.name} detected on ${newItem.cameraName}`,
          { detectionId: newItem.id },
        );

        setTimeout(() => {
          setItems(prev => prev.map(i => i.id === newItem.id ? { ...i, isNew: false } : i));
        }, 2500);
      });

      conn.onreconnecting(() => setConnected(false));
      conn.onreconnected(() => setConnected(true));
      conn.onclose(() => setConnected(false));

      try { await conn.start(); setConnected(true); }
      catch (e) { console.warn('SignalR error:', e); setConnected(false); }
      hubRef.current = conn;
    };
    startHub();
    return () => { conn?.stop(); hubRef.current = null; };
  }, []);

  const handleResolved = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i));

  const filtered = items.filter(a => {
    if (activeTab === 'Not Resolved') return !a.resolved;
    if (activeTab === 'Resolved')     return  a.resolved;
    return true;
  });

  const total      = items.length;
  const unresolved = items.filter(i => !i.resolved).length;

  return (
    <View style={S.container}>

      <View style={S.selectorCard}>
        <View style={S.topRow}>
          <View>
            <Text style={S.selectorLabel}>ALERTS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={S.statsHighlight}>{unresolved}</Text>
              <Text style={S.statsDim}>active · {total} total</Text>
            </View>
          </View>
          <LiveBadge connected={connected} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.selectorRow}>
          {TABS.map(tab => {
            const active = activeTab === tab;
            const dotColor = active
              ? tab === 'Resolved' ? '#34C759' : tab === 'Not Resolved' ? '#FF3B30' : '#007AFF'
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

      {loading ? (
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
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor="#1C1C1E"
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={S.empty}>
              <Ionicons name="shield-checkmark-outline" size={56} color="#D1D1D6" />
              <Text style={S.emptyTitle}>No detections</Text>
              <Text style={S.emptySub}>Pull down to refresh</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map(item => (
                <DetectionCard key={item.id} item={item} onPress={setSelected} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <DetailModal item={selected} onClose={() => setSelected(null)} onResolved={handleResolved} />
    </View>
  );
}

// ─── Screen Styles ────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F2F2F7' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:    { fontSize: 14, color: '#AEAEB2' },
  selectorCard:   { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  topRow:         { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
  selectorLabel:  { fontSize: 11, fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statsHighlight: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
  statsDim:       { fontSize: 13, color: '#AEAEB2' },
  selectorRow:    { paddingHorizontal: 16, gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F2F2F7', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  chipActive:     { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipDot:        { width: 6, height: 6, borderRadius: 3 },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive: { color: '#fff' },
  list:           { padding: 16 },
  empty:          { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle:     { fontSize: 16, color: '#AEAEB2', fontWeight: '600' },
  emptySub:       { fontSize: 13, color: '#C7C7CC' },
});