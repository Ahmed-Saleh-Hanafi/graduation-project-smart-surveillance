import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated, Easing, Modal, Pressable,
  PanResponder, Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const STREAM_H = 200;
const STREAM_W = width - 32;
const H        = 20;
const MIN_SZ   = 50;

type CameraStatus = 'LIVE' | 'IDLE';
type Camera = { id: string; name: string; location: string; status: CameraStatus; res: string };

type SensorKey = 'gas' | 'motion' | 'temperature' | 'sound';
type Sensor = {
  key: SensorKey; icon: string; label: string; value: number; unit: string;
  status: string; statusColor: string; bg: string; color: string; max: number;
  history: number[]; description: string; thresholds: { safe: number; warn: number };
};

type Detection = {
  id: string; name: string; confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  isBlocked: boolean;
};

// ─── Event type (for Events page) ─────────────────────────────────────────────
export type CameraEvent = {
  id: string;
  type: 'recording' | 'snapshot';
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  duration?: number;
  label: string;
};

// ─── Global events store ──────────────────────────────────────────────────────
let _eventsStore: CameraEvent[] = [];
export const getEvents = () => _eventsStore;
export const addEvent  = (e: CameraEvent) => { _eventsStore = [e, ..._eventsStore]; };

type Zone = { id: string; x: number; y: number; w: number; h: number };

const makeZoneId = () => `z_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const LOCATIONS = ['All', 'Main Gate', 'Lobby', 'Parking', 'Kitchen', 'Backyard'];

const CAMERAS: Camera[] = [
  { id: '1', name: 'Main Gate',   location: 'Front entrance', status: 'LIVE', res: '1080p' },
  { id: '2', name: 'Lobby',       location: 'Building lobby', status: 'LIVE', res: '1080p' },
  { id: '3', name: 'Parking Lot', location: 'North parking',  status: 'IDLE', res: '720p'  },
];

const makeSensors = (): Sensor[] => [
  {
    key: 'gas', icon: 'smoke-detector', label: 'Gas / Smoke', value: 0, unit: 'PPM',
    status: 'Normal', statusColor: '#34C759', bg: '#E8F5E9', color: '#34C759', max: 500,
    history: [0, 0, 0, 0, 0, 0],
    description: 'MQ-2 detects gas leaks and smoke. Above 100 PPM triggers an alert.',
    thresholds: { safe: 50, warn: 150 },
  },
  {
    key: 'motion', icon: 'motion-sensor', label: 'Motion (PIR)', value: 0, unit: 'events',
    status: 'Clear', statusColor: '#34C759', bg: '#E8F5E9', color: '#34C759', max: 20,
    history: [0, 0, 0, 0, 0, 0],
    description: 'PIR sensor detects movement. Spikes may indicate intrusion.',
    thresholds: { safe: 3, warn: 8 },
  },
  {
    key: 'temperature', icon: 'thermometer', label: 'Temperature', value: 0, unit: '°C',
    status: 'Loading…', statusColor: '#AEAEB2', bg: '#FFF3E0', color: '#FF9500', max: 50,
    history: [0, 0, 0, 0, 0, 0],
    description: 'DHT22 measures ambient temperature. Optimal range 18–26°C.',
    thresholds: { safe: 26, warn: 35 },
  },
  {
    key: 'sound', icon: 'volume-vibrate', label: 'Sound / Vibration', value: 0, unit: 'dB',
    status: 'Quiet', statusColor: '#007AFF', bg: '#E3F2FD', color: '#007AFF', max: 120,
    history: [0, 0, 0, 0, 0, 0],
    description: 'KY-038 detects unusual noise or vibrations. High readings may indicate intrusion.',
    thresholds: { safe: 40, warn: 80 },
  },
];

// ─── Sparkline ────────────────────────────────────────────────────────────────

const Sparkline = ({ data, color, width: w, height: h }: {
  data: number[]; color: string; width: number; height: number;
}) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: h, gap: 3, width: w }}>
      {data.map((v, i) => (
        <View key={i} style={{
          flex: 1, height: Math.max(2, (v / max) * h), borderRadius: 2,
          backgroundColor: color, opacity: 0.3 + (i / data.length) * 0.7,
        }} />
      ))}
    </View>
  );
};

// ─── ZoneBox ──────────────────────────────────────────────────────────────────

const ZoneBox = ({
  zone, cW, cH, editMode, onDelete, onUpdate,
}: {
  zone: Zone; cW: number; cH: number; editMode: boolean;
  onDelete: (id: string) => void;
  onUpdate: (z: Zone) => void;
}) => {
  const snap = useRef<Zone>(zone);

  const bodyPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editMode,
      onMoveShouldSetPanResponder:  () => editMode,
      onPanResponderGrant: () => { snap.current = zone; },
      onPanResponderMove: (_, gs) => {
        const s = snap.current;
        onUpdate({
          ...s,
          x: clamp(s.x + gs.dx, 0, cW - s.w),
          y: clamp(s.y + gs.dy, 0, cH - s.h),
        });
      },
    })
  ).current;

  const makeCorner = (corner: 'tl'|'tr'|'bl'|'br') => PanResponder.create({
    onStartShouldSetPanResponder: () => editMode,
    onMoveShouldSetPanResponder:  () => editMode,
    onPanResponderGrant: () => { snap.current = zone; },
    onPanResponderMove: (_, gs) => {
      const { dx, dy } = gs;
      const s = snap.current;
      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
      if (corner === 'tl') {
        nx = clamp(s.x + dx, 0, s.x + s.w - MIN_SZ);
        ny = clamp(s.y + dy, 0, s.y + s.h - MIN_SZ);
        nw = s.w - (nx - s.x); nh = s.h - (ny - s.y);
      } else if (corner === 'tr') {
        ny = clamp(s.y + dy, 0, s.y + s.h - MIN_SZ);
        nw = clamp(s.w + dx, MIN_SZ, cW - s.x);
        nh = s.h - (ny - s.y);
      } else if (corner === 'bl') {
        nx = clamp(s.x + dx, 0, s.x + s.w - MIN_SZ);
        nw = s.w - (nx - s.x);
        nh = clamp(s.h + dy, MIN_SZ, cH - s.y);
      } else {
        nw = clamp(s.w + dx, MIN_SZ, cW - s.x);
        nh = clamp(s.h + dy, MIN_SZ, cH - s.y);
      }
      onUpdate({ ...s, x: nx, y: ny, w: nw, h: nh });
    },
  });

  const tlPan = useRef(makeCorner('tl')).current;
  const trPan = useRef(makeCorner('tr')).current;
  const blPan = useRef(makeCorner('bl')).current;
  const brPan = useRef(makeCorner('br')).current;

  useEffect(() => { snap.current = zone; }, [zone]);

  return (
    <View style={{ position: 'absolute', left: zone.x, top: zone.y, width: zone.w, height: zone.h }}>
      <View
        {...bodyPan.panHandlers}
        style={{
          position: 'absolute',
          top: H / 2, left: H / 2, right: H / 2, bottom: H / 2,
          borderWidth: 2, borderColor: '#34C759', borderStyle: 'solid',
          backgroundColor: 'rgba(51, 255, 48, 0.11)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {editMode && (
          <Ionicons name="move-outline" size={11} color="rgba(255,59,48,0.45)" style={{ marginTop: 3 }} />
        )}
      </View>

      {editMode && (
        <TouchableOpacity
          style={styles.zoneDeleteBtn}
          onPress={() => onDelete(zone.id)}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        >
          <Ionicons name="close" size={10} color="#fff" />
        </TouchableOpacity>
      )}

      {editMode && [
        { pan: tlPan, pos: { top: 0,    left: 0    } },
        { pan: trPan, pos: { top: 0,    right: 0   } },
        { pan: blPan, pos: { bottom: 0, left: 0    } },
        { pan: brPan, pos: { bottom: 0, right: 0   } },
      ].map(({ pan, pos }, i) => (
        <View key={i} {...pan.panHandlers} style={[styles.cornerHandle, pos]}>
          <Ionicons name="resize-outline" size={10} color="#fff" />
        </View>
      ))}
    </View>
  );
};

// ─── DrawCanvas ───────────────────────────────────────────────────────────────

const DrawCanvas = ({
  zones, cW, cH, onAdd,
}: {
  zones: Zone[]; cW: number; cH: number;
  onAdd: (z: Zone) => void;
}) => {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { locationX: lx, locationY: ly } = e.nativeEvent;
        start.current = { x: clamp(lx, 0, cW), y: clamp(ly, 0, cH) };
        setDraft({ x: start.current.x, y: start.current.y, w: 0, h: 0 });
      },
      onPanResponderMove: (_, gs) => {
        if (!start.current) return;
        const sx = start.current.x, sy = start.current.y;
        const ex = clamp(sx + gs.dx, 0, cW);
        const ey = clamp(sy + gs.dy, 0, cH);
        setDraft({
          x: Math.min(sx, ex), y: Math.min(sy, ey),
          w: Math.abs(ex - sx), h: Math.abs(ey - sy),
        });
      },
      onPanResponderRelease: () => {
        const d = draftRef.current;
        if (d && d.w >= MIN_SZ && d.h >= MIN_SZ) {
          onAdd({ id: makeZoneId(), ...d });
        }
        start.current = null;
        setDraft(null);
      },
    })
  ).current;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 15 }]} {...pan.panHandlers}>
      {zones.map(z => (
        <View key={`ghost_${z.id}`} pointerEvents="none" style={{
          position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h,
        }}>
          <View style={{
            flex: 1, margin: H / 2, borderWidth: 2,
            borderColor: '#34C759', borderStyle: 'solid',
            backgroundColor: 'rgba(48, 255, 65, 0.11)',
          }} />
        </View>
      ))}

      {draft && draft.w > 4 && draft.h > 4 && (
        <View pointerEvents="none" style={{
          position: 'absolute',
          left: draft.x, top: draft.y, width: draft.w, height: draft.h,
          borderWidth: 2, borderColor: '#34C759', borderStyle: 'dashed',
          backgroundColor: 'rgba(51, 255, 48, 0.11)',
        }}>
          {draft.w >= MIN_SZ && draft.h >= MIN_SZ && (
            <View style={styles.draftLabel}>
              <Text style={styles.draftLabelText}>{Math.round(draft.w)} × {Math.round(draft.h)}</Text>
            </View>
          )}
        </View>
      )}

      {!draft && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.drawHintOverlay]}>
          <Ionicons name="crop-outline" size={24} color="rgba(255,149,0,0.65)" />
          <Text style={styles.drawHintText}>Drag to draw a restricted zone</Text>
        </View>
      )}
    </View>
  );
};

// ─── Camera Info Sheet ────────────────────────────────────────────────────────

const CameraInfoSheet = ({ camera, onClose }: { camera: Camera; onClose: () => void }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  const rows = [
    { label: 'Location',   value: camera.location },
    { label: 'Resolution', value: camera.res },
    { label: 'Status',     value: camera.status, highlight: true },
    { label: 'Frame rate', value: '30 fps' },
    { label: 'Bitrate',    value: '4 Mbps' },
    { label: 'IP address', value: '192.168.1.41' },
    { label: 'Last event', value: '2 min ago' },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.sheetCamThumb}>
              <Ionicons name="videocam" size={16} color="rgba(255,255,255,0.3)" />
            </View>
            <View>
              <Text style={styles.sheetTitle}>{camera.name}</Text>
              <Text style={styles.sheetSub}>{camera.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
            <Ionicons name="close" size={16} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoCard}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.infoRow, i < rows.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{r.label}</Text>
              <Text style={[
                styles.infoValue,
                r.highlight && { color: camera.status === 'LIVE' ? '#34C759' : '#AEAEB2', fontWeight: '700' },
              ]}>{r.value}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Recording Timer ──────────────────────────────────────────────────────────

const RecordingTimer = ({ startTime }: { startTime: Date }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <View style={styles.recTimerPill}>
      <View style={styles.recDot} />
      <Text style={styles.recTimerText}>{mm}:{ss}</Text>
    </View>
  );
};

// ─── Camera Options Sheet ─────────────────────────────────────────────────────

const CameraOptionsSheet = ({
  camera,
  onClose,
  onRecordToggle,
  onSnapshot,
  isRecording,
  recordingStart,
}: {
  camera: Camera;
  onClose: () => void;
  onRecordToggle: () => void;
  onSnapshot: () => void;
  isRecording: boolean;
  recordingStart: Date | null;
}) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  const handleRecord = () => { onRecordToggle(); dismiss(); };
  const handleSnapshot = () => { onSnapshot(); dismiss(); };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle2}>{camera.name}</Text>
        <Text style={styles.sheetSub2}>Choose an action</Text>

        <View style={styles.optionsCard}>
          {/* Record Row */}
          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={handleRecord}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconBg, { backgroundColor: '#FF3B3018' }]}>
              <MaterialCommunityIcons
                name={isRecording ? 'stop-circle-outline' : 'record-circle-outline'}
                size={18}
                color="#FF3B30"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>
                {isRecording ? 'Stop recording' : 'Start recording'}
              </Text>
              <Text style={styles.optionSub}>
                {isRecording ? 'Save clip to events' : 'Save clip to storage'}
              </Text>
            </View>
            {isRecording && recordingStart ? (
              <RecordingTimer startTime={recordingStart} />
            ) : (
              <Ionicons name="chevron-forward" size={14} color="#AEAEB2" />
            )}
          </TouchableOpacity>

          {/* Snapshot Row */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={handleSnapshot}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconBg, { backgroundColor: '#34C75918' }]}>
              <Ionicons name="download-outline" size={18} color="#34C759" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Download snapshot</Text>
              <Text style={styles.optionSub}>Save current frame to events</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#AEAEB2" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Fullscreen Modal ─────────────────────────────────────────────────────────

const FullscreenView = ({ camera, zones, onClose }: {
  camera: Camera; zones: Zone[]; onClose: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [ctrlVisible, setCtrlVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCtrlVisible(false), 3000);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    scheduleHide();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const dismiss = () =>
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose);

  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    if (camera.status === 'LIVE') loop.start();
    return () => loop.stop();
  }, [camera.status]);

  const scaleX = width / STREAM_W;
  const scaleY = (height * 0.72) / STREAM_H;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.fsContainer, { opacity: fadeAnim }]}>
        <Pressable style={styles.fsVideo} onPress={() => { setCtrlVisible(v => !v); scheduleHide(); }}>
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-around', opacity: 0.03 }]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ height: 1, backgroundColor: '#00ff44' }} />
            ))}
          </View>
          {camera.status === 'LIVE' && (
            <Animated.View style={[styles.fsScanLine, {
              transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-(height * 0.36), height * 0.36] }) }],
            }]} />
          )}
          <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.06)" />
          {zones.map(z => (
            <View key={z.id} pointerEvents="none" style={{
              position: 'absolute',
              left: z.x * scaleX, top: z.y * scaleY,
              width: z.w * scaleX, height: z.h * scaleY,
            }}>
              <View style={{
                flex: 1, margin: 4, borderWidth: 2,
                borderColor: '#34C759', borderStyle: 'solid',
                backgroundColor: 'rgba(48, 255, 76, 0.17)',
                alignItems: 'center', justifyContent: 'center',
              }} />
            </View>
          ))}
        </Pressable>

        {ctrlVisible && (
          <View style={styles.fsTopBar}>
            <TouchableOpacity style={styles.fsBtn} onPress={dismiss}>
              <Ionicons name="chevron-down" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.fsLivePill}>
              <View style={[styles.fsDot, { backgroundColor: camera.status === 'LIVE' ? '#34C759' : '#AEAEB2' }]} />
              <Text style={styles.fsLiveText}>{camera.status}</Text>
            </View>
            {zones.length > 0 && (
              <View style={styles.fsZoneBadge}>
                <Ionicons name="crop-outline" size={11} color="#FF3B30" />
                <Text style={styles.fsZoneBadgeText}>{zones.length} zone{zones.length > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        )}

        {ctrlVisible && (
          <View style={styles.fsBottomBar}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.fsCamName}>{camera.name}</Text>
              <Text style={styles.fsCamSub}>{camera.location} · {camera.res}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['mic-outline', 'volume-medium-outline', 'scan-outline'] as const).map(icon => (
                <TouchableOpacity key={icon} style={styles.fsActionBtn}>
                  <Ionicons name={icon} size={18} color="white" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── Sensor Detail Sheet ──────────────────────────────────────────────────────

const SensorDetail = ({ sensor, onClose }: { sensor: Sensor; onClose: () => void }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  const pct = Math.min(100, Math.round((sensor.value / sensor.max) * 100));
  const barColor =
    sensor.value <= sensor.thresholds.safe ? '#34C759' :
    sensor.value <= sensor.thresholds.warn ? '#FF9500' : '#FF3B30';

  const readings = [
    { label: 'Current',       value: `${sensor.value} ${sensor.unit}` },
    { label: 'Min (session)', value: `${Math.min(...sensor.history)} ${sensor.unit}` },
    { label: 'Max (session)', value: `${Math.max(...sensor.history)} ${sensor.unit}` },
    { label: 'Avg (session)', value: `${Math.round(sensor.history.reduce((a, b) => a + b, 0) / sensor.history.length)} ${sensor.unit}` },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.detailHeader}>
          <View style={[styles.detailIconBg, { backgroundColor: sensor.bg }]}>
            <MaterialCommunityIcons name={sensor.icon as any} size={24} color={sensor.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{sensor.label}</Text>
            <Text style={[styles.sheetSub, { color: sensor.statusColor }]}>{sensor.status}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
            <Ionicons name="close" size={16} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.bigValueCard}>
            <Text style={styles.bigValue}>{sensor.value}<Text style={styles.bigUnit}> {sensor.unit}</Text></Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLbl}>0</Text>
              <Text style={styles.progressLbl}>{sensor.max} {sensor.unit}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Last 6 readings</Text>
            <Sparkline data={sensor.history} color={sensor.color} width={width - 80} height={48} />
            <View style={styles.sparkLabels}>
              {sensor.history.map((v, i) => <Text key={i} style={styles.sparkLbl}>{v}</Text>)}
            </View>
          </View>

          <View style={styles.statsGrid}>
            {readings.map(r => (
              <View key={r.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{r.label}</Text>
                <Text style={styles.statValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.descCard}>
            <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
            <Text style={styles.descText}>{sensor.description}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Alert thresholds</Text>
            {[
              { label: 'Safe',    color: '#34C759', range: `0 – ${sensor.thresholds.safe} ${sensor.unit}` },
              { label: 'Warning', color: '#FF9500', range: `${sensor.thresholds.safe + 1} – ${sensor.thresholds.warn} ${sensor.unit}` },
              { label: 'Danger',  color: '#FF3B30', range: `Above ${sensor.thresholds.warn} ${sensor.unit}` },
            ].map(t => (
              <View key={t.label} style={styles.threshRow}>
                <View style={[styles.threshDot, { backgroundColor: t.color }]} />
                <Text style={styles.threshLabel}>{t.label}</Text>
                <Text style={styles.threshVal}>{t.range}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main LiveScreen ──────────────────────────────────────────────────────────

type ActiveSheet = 'info' | 'options' | 'fullscreen' | null;
type ZoneMode   = 'off' | 'draw' | 'edit';

export default function LiveScreen() {
  const navigation = useNavigation<any>();

  const [selectedLocation, setSelectedLocation] = useState('All');
  const [activeCamera, setActiveCamera]         = useState<Camera>(CAMERAS[0]);
  const [sensors, setSensors]                   = useState<Sensor[]>(makeSensors());
  const [activeSensor, setActiveSensor]         = useState<Sensor | null>(null);
  const [activeSheet, setActiveSheet]           = useState<ActiveSheet>(null);
  const [detections, setDetections]             = useState<Detection[]>([]);
  const [alertVisible, setAlertVisible]         = useState(false);
  const [blockedFace, setBlockedFace]           = useState<Detection | null>(null);
  const [zones, setZones]                       = useState<Record<string, Zone[]>>({});
  const [zoneMode, setZoneMode]                 = useState<ZoneMode>('off');

  // ── Per-camera recording state ───────────────────────────────────────────
  // Key = camera id, Value = recording start Date
  const [recordings, setRecordings] = useState<Record<string, Date>>({});

  // Helpers for the active camera
  const isRecording    = !!recordings[activeCamera.id];
  const recordingStart = recordings[activeCamera.id] ?? null;

  const handleZoneUpdate = (z: Zone) => {
    setZones(prev => ({
      ...prev,
      [activeCamera.id]: prev[activeCamera.id]?.map(p => p.id === z.id ? z : p) || []
    }));
  };
  const handleZoneAdd = (z: Zone) => {
    setZones(prev => ({
      ...prev,
      [activeCamera.id]: [...(prev[activeCamera.id] || []), z]
    }));
  };
  const handleZoneDelete = (id: string) => {
    setZones(prev => ({
      ...prev,
      [activeCamera.id]: (prev[activeCamera.id] || []).filter(z => z.id !== id)
    }));
  };

  const cycleZoneMode = () =>
    setZoneMode(m => m === 'off' ? 'draw' : m === 'draw' ? 'edit' : 'off');

  // ── Per-camera record toggle ─────────────────────────────────────────────
  const handleRecordToggle = () => {
    const camId = activeCamera.id;

    if (!recordings[camId]) {
      // Start recording for this camera
      setRecordings(prev => ({ ...prev, [camId]: new Date() }));
    } else {
      // Stop recording for this camera → save event
      const start    = recordings[camId];
      const duration = Math.floor((Date.now() - start.getTime()) / 1000);

      const event: CameraEvent = {
        id:         `rec_${Date.now()}`,
        type:       'recording',
        cameraId:   camId,
        cameraName: activeCamera.name,
        timestamp:  start,
        duration,
        label:      `Recording · ${activeCamera.name} · ${duration}s`,
      };
      addEvent(event);

      // Remove only this camera's recording
      setRecordings(prev => {
        const next = { ...prev };
        delete next[camId];
        return next;
      });

      Alert.alert(
        'Recording saved',
        `${duration}s clip from ${activeCamera.name} saved to Events.`,
        [
          { text: 'View Events', onPress: () => navigation.navigate('events') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  const handleSnapshot = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const localUri = FileSystem.cacheDirectory + `snapshot_${Date.now()}.jpg`;

      const downloadResult = await FileSystem.downloadAsync(
        `http://192.168.1.229:5198/api/Camera/${activeCamera.id}/snapshot`,
        localUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (downloadResult.status !== 200) {
        Alert.alert('Failed', 'Could not fetch snapshot from camera.');
        return;
      }

      const event: CameraEvent = {
        id:         `snap_${Date.now()}`,
        type:       'snapshot',
        cameraId:   activeCamera.id,
        cameraName: activeCamera.name,
        timestamp:  new Date(),
        label:      `Snapshot · ${activeCamera.name}`,
      };
      addEvent(event);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save Snapshot',
        });
      } else {
        Alert.alert('📸 Snapshot saved', 'Saved to Events.', [
          { text: 'View Events', onPress: () => navigation.navigate('events') },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (error) {
      console.error('Snapshot error:', error);
      Alert.alert('Error', 'Could not save snapshot.');
    }
  };

  // ─── Sensor simulation ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setSensors(prev => prev.map(s => {
        if (s.key === 'temperature') {
          const v = Math.round(Math.max(18, Math.min(40, s.value + (Math.random() - 0.5) * 1.5)));
          return { ...s, value: v, history: [...s.history.slice(1), v],
            status: v <= s.thresholds.safe ? 'Stable' : v <= s.thresholds.warn ? 'High' : 'Critical',
            statusColor: v > s.thresholds.warn ? '#FF3B30' : '#FF9500' };
        }
        if (s.key === 'sound') {
          const v = Math.round(Math.max(0, Math.min(120, s.value + (Math.random() - 0.5) * 6)));
          return { ...s, value: v, history: [...s.history.slice(1), v],
            status: v <= 40 ? 'Quiet' : v <= 80 ? 'Noisy' : 'Alert!',
            statusColor: v <= 40 ? '#007AFF' : v <= 80 ? '#FF9500' : '#FF3B30' };
        }
        if (s.key === 'motion') {
          const v = Math.max(0, Math.round(Math.random() * 3));
          return { ...s, value: v, history: [...s.history.slice(1), v],
            status: v === 0 ? 'Clear' : v <= 3 ? 'Active' : 'Alert!',
            statusColor: v === 0 ? '#34C759' : v <= 3 ? '#FF9500' : '#FF3B30' };
        }
        if (s.key === 'gas') {
          const v = Math.round(Math.max(0, Math.min(500, s.value + (Math.random() - 0.5) * 5)));
          return { ...s, value: v, history: [...s.history.slice(1), v],
            status: v <= 50 ? 'Normal' : v <= 150 ? 'Warning' : 'Danger!',
            statusColor: v <= 50 ? '#34C759' : v <= 150 ? '#FF9500' : '#FF3B30' };
        }
        return s;
      }));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // ─── Poll detections ─────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res   = await axios.get(
          `http://192.168.1.229:5198/api/Detection/latest?cameraId=${activeCamera.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data: Detection[] = res.data.data ?? [];
        setDetections(data);
        const blocked = data.find(d => d.isBlocked);
        if (blocked) { setBlockedFace(blocked); setAlertVisible(true); }
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [activeCamera.id]);

  // ─── Scan line ───────────────────────────────────────────────────────────
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    scanAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    if (activeCamera.status === 'LIVE') loop.start();
    return () => loop.stop();
  }, [activeCamera.id, activeCamera.status]);

  const filteredCameras = selectedLocation === 'All'
    ? CAMERAS
    : CAMERAS.filter(c => c.name.includes(selectedLocation));

  const zoneBtnColor = zoneMode === 'draw' ? '#FF9500' : zoneMode === 'edit' ? '#FF3B30' : undefined;
  const zoneBtnIcon  = zoneMode === 'draw' ? 'pencil-outline' : 'crop-outline';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={zoneMode === 'off'}
      >
        {/* ── Location filter ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterList} contentContainerStyle={styles.filterContent}>
          {LOCATIONS.map(loc => (
            <TouchableOpacity key={loc}
              style={[styles.chip, selectedLocation === loc && styles.chipActive]}
              onPress={() => setSelectedLocation(loc)} activeOpacity={0.7}>
              <Text style={[styles.chipText, selectedLocation === loc && styles.chipTextActive]}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Main stream ── */}
        <View style={styles.streamCard}>
          <View style={styles.streamPlaceholder}>
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-around', opacity: 0.04 }]} pointerEvents="none">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ height: 1, backgroundColor: '#00ff44' }} />
              ))}
            </View>

            {activeCamera.status === 'LIVE' && (
              <Animated.View style={[styles.scanLine, {
                transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) }],
              }]} pointerEvents="none" />
            )}

            <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.1)" />

            {/* Recording indicator — only for active camera */}
            {isRecording && recordingStart && (
              <View style={styles.streamRecBadge} pointerEvents="none">
                <RecordingTimer startTime={recordingStart} />
              </View>
            )}

            {/* Detection boxes */}
            {detections.map(det => (
              <View key={det.id} pointerEvents="none" style={[styles.detectionBox, {
                left: `${det.bbox.x * 100}%` as any,
                top:  `${det.bbox.y * 100}%` as any,
                width:  `${det.bbox.w * 100}%` as any,
                height: `${det.bbox.h * 100}%` as any,
                borderColor: det.isBlocked ? '#FF3B30' : '#34C759',
              }]}>
                <View style={[styles.detectionLabel, { backgroundColor: det.isBlocked ? '#FF3B30' : '#34C759' }]}>
                  <Text style={styles.detectionLabelText}>{det.isBlocked ? '🚫 ' : '✓ '}{det.name}</Text>
                  <Text style={styles.detectionConfText}>{Math.round(det.confidence * 100)}%</Text>
                </View>
              </View>
            ))}

            {/* ── Zones ── */}
            {(zones[activeCamera.id] || []).map(z =>
              zoneMode === 'off' ? (
                <View key={z.id} pointerEvents="none" style={{
                  position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h,
                }}>
                  <View style={{
                    flex: 1, margin: H / 2, borderWidth: 2,
                    borderColor: '#34C759', borderStyle: 'solid',
                    backgroundColor: 'rgba(51, 255, 48, 0.11)',
                    alignItems: 'center', justifyContent: 'center',
                  }} />
                </View>
              ) : (
                <ZoneBox
                  key={z.id}
                  zone={z}
                  cW={STREAM_W}
                  cH={STREAM_H}
                  editMode={zoneMode === 'edit'}
                  onDelete={handleZoneDelete}
                  onUpdate={handleZoneUpdate}
                />
              )
            )}

            {zoneMode === 'draw' && (
              <DrawCanvas
                zones={zones[activeCamera.id] || []}
                cW={STREAM_W}
                cH={STREAM_H}
                onAdd={handleZoneAdd}
              />
            )}

            {zoneMode === 'off' && (
              <Pressable
                style={[StyleSheet.absoluteFill, { alignItems: 'flex-end', justifyContent: 'flex-end', padding: 10 }]}
                onPress={() => setActiveSheet('fullscreen')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="expand-outline" size={11} color="rgba(255,255,255,0.35)" />
                  <Text style={styles.expandHintText}>Tap to expand</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Stream footer */}
          <View style={styles.streamFooter}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.livePill}>
                <View style={[styles.statusDot, { backgroundColor: activeCamera.status === 'LIVE' ? '#34C759' : '#AEAEB2' }]} />
                <Text style={styles.liveText}>{activeCamera.status}</Text>
                {/* REC badge — only for active camera */}
                {isRecording && <View style={styles.recDotSmall} />}
                {isRecording && <Text style={[styles.liveText, { color: '#FF3B30' }]}>REC</Text>}
              </View>
              <Text style={styles.camName} numberOfLines={1}>{activeCamera.name}</Text>
              <Text style={styles.camSub}>{activeCamera.location} · {activeCamera.res}</Text>
            </View>

            <View style={styles.streamActions}>
              <TouchableOpacity
                style={[styles.actionBtn, activeSheet === 'info' && styles.actionBtnActive]}
                onPress={() => setActiveSheet(p => p === 'info' ? null : 'info')} activeOpacity={0.7}>
                <Ionicons name="information-circle-outline" size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn}
                onPress={() => setActiveSheet('fullscreen')} activeOpacity={0.7}>
                <Ionicons name="expand-outline" size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, zoneMode !== 'off' && { backgroundColor: (zoneBtnColor ?? '#fff') + '30' }]}
                onPress={cycleZoneMode} activeOpacity={0.7}>
                <Ionicons name={zoneBtnIcon as any} size={18} color={zoneMode !== 'off' ? zoneBtnColor : 'white'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, activeSheet === 'options' && styles.actionBtnActive]}
                onPress={() => setActiveSheet(p => p === 'options' ? null : 'options')} activeOpacity={0.7}>
                <Ionicons name="ellipsis-horizontal" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {zoneMode !== 'off' && (
            <View style={[styles.zoneModeBar, { backgroundColor: zoneMode === 'draw' ? '#FF9500' : '#FF3B30' }]}>
              <Ionicons name={zoneMode === 'draw' ? 'pencil-outline' : 'move-outline'} size={12} color="#fff" />
              <Text style={styles.zoneModeText}>
                {zoneMode === 'draw'
                  ? `Draw mode  ·  ${zones[activeCamera.id]?.length || 0} zone${(zones[activeCamera.id]?.length || 0) !== 1 ? 's' : ''}  ·  tap icon to switch to Edit`
                  : `Edit mode  ·  drag to move  ·  corners to resize  ·  tap icon to exit`}
              </Text>
            </View>
          )}
        </View>

        {/* ── Camera picker ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cameras</Text>
          {/* Show count of cameras currently recording */}
          {Object.keys(recordings).length > 0 && (
            <View style={styles.recCountBadge}>
              <View style={styles.recCountDot} />
              <Text style={styles.recCountText}>
                {Object.keys(recordings).length} recording{Object.keys(recordings).length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.camScroll} contentContainerStyle={{ paddingRight: 16 }}>
          {filteredCameras.map(cam => (
            <TouchableOpacity key={cam.id}
              style={[styles.camThumb, activeCamera.id === cam.id && styles.camThumbActive]}
              onPress={() => setActiveCamera(cam)} activeOpacity={0.8}>
              <View style={styles.camThumbImg}>
                <Ionicons name="videocam-outline" size={20} color="rgba(255,255,255,0.18)" />
                {/* 🔴 REC badge per camera */}
                {!!recordings[cam.id] && (
                  <View style={styles.camRecBadge} />
                )}
              </View>
              <View style={styles.camThumbFooter}>
                <Text style={styles.camThumbName} numberOfLines={1}>{cam.name}</Text>
                <View style={[styles.statusDotSm, { backgroundColor: cam.status === 'LIVE' ? '#34C759' : '#AEAEB2' }]} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Sensors ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sensors</Text>
          <Text style={styles.sectionHint}>Tap for details</Text>
        </View>
        <View style={styles.sensorsGrid}>
          {sensors.map(s => {
            const pct = Math.min(100, (s.value / s.max) * 100);
            return (
              <TouchableOpacity key={s.key} style={styles.sensorCard}
                onPress={() => setActiveSensor(s)} activeOpacity={0.75}>
                <View style={[styles.sensorIconBg, { backgroundColor: s.bg }]}>
                  <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={styles.sensorLabel}>{s.label}</Text>
                <Text style={styles.sensorValue}>
                  {s.value}<Text style={styles.sensorUnit}> {s.unit}</Text>
                </Text>
                <Text style={[styles.sensorStatus, { color: s.statusColor }]}>{s.status}</Text>
                <View style={styles.sensorBarTrack}>
                  <View style={[styles.sensorBarFill, { width: `${pct}%` as any, backgroundColor: s.color }]} />
                </View>
                <View style={{ marginTop: 8 }}>
                  <Sparkline data={s.history} color={s.color} width={(width - 56) / 2 - 28} height={28} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ── Blocked face alert ── */}
      {alertVisible && blockedFace && (
        <View style={styles.blockedAlert}>
          <View style={styles.blockedAlertInner}>
            <View style={styles.blockedAlertIcon}>
              <Ionicons name="warning" size={28} color="#FF3B30" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.blockedAlertTitle}>Blocked Person Detected</Text>
              <Text style={styles.blockedAlertSub}>
                {blockedFace.name} · {activeCamera.name} · {Math.round(blockedFace.confidence * 100)}%
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAlertVisible(false)}>
              <Ionicons name="close-circle" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Sheets ── */}
      {activeSheet === 'info' && (
        <CameraInfoSheet camera={activeCamera} onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'options' && (
        <CameraOptionsSheet
          camera={activeCamera}
          onClose={() => setActiveSheet(null)}
          onRecordToggle={handleRecordToggle}
          onSnapshot={handleSnapshot}
          isRecording={isRecording}
          recordingStart={recordingStart}
        />
      )}
      {activeSheet === 'fullscreen' && (
        <FullscreenView camera={activeCamera} zones={zones[activeCamera.id] || []} onClose={() => setActiveSheet(null)} />
      )}
      {activeSensor && (
        <SensorDetail sensor={activeSensor} onClose={() => setActiveSensor(null)} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingBottom: 32 },

  filterList:    { marginTop: 14, marginBottom: 14 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  chipActive:     { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive: { color: '#fff' },

  streamCard:        { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111', marginBottom: 4 },
  streamPlaceholder: { height: STREAM_H, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanLine:          { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,255,68,0.25)' },
  expandHintText:    { fontSize: 10, color: 'rgba(255,255,255,0.35)' },

  streamRecBadge: { position: 'absolute', top: 10, left: 10, zIndex: 10 },
  recTimerPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,59,48,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  recDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  recTimerText:   { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  recDotSmall:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF3B30', marginLeft: 4 },

  streamFooter:    { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E' },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 4 },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  liveText:        { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  camName:         { fontSize: 15, fontWeight: '700', color: '#fff' },
  camSub:          { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  streamActions:   { flexDirection: 'row', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  actionBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },

  zoneModeBar:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  zoneModeText: { fontSize: 11, color: '#fff', fontWeight: '600', flex: 1 },

  zoneDeleteBtn: {
    position: 'absolute', top: 0, right: 0, zIndex: 30,
    width: H, height: H, borderRadius: H / 2,
    backgroundColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
    elevation: 5,
  },
  cornerHandle: {
    position: 'absolute',
    width: H, height: H, borderRadius: 5,
    backgroundColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, elevation: 5,
  },

  drawHintOverlay: { alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.15)' },
  drawHintText:    { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  draftLabel:      { position: 'absolute', top: 4, left: 4, backgroundColor: '#FF9500', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  draftLabelText:  { fontSize: 9, color: '#fff', fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, marginTop: 20 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sectionHint:   { fontSize: 12, color: '#AEAEB2' },

  // Recording count badge next to "Cameras" title
  recCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF3B3015', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.25)' },
  recCountDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  recCountText:  { fontSize: 11, fontWeight: '700', color: '#FF3B30' },

  camScroll:      { paddingLeft: 16, marginBottom: 24 },
  camThumb:       { width: 130, marginRight: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  camThumbActive: { borderColor: '#007AFF' },
  camThumbImg:    { height: 80, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  camThumbFooter: { backgroundColor: '#1C1C1E', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  camThumbName:   { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },
  statusDotSm:    { width: 5, height: 5, borderRadius: 3 },

  // 🔴 Red dot badge on camera thumbnail when recording
  camRecBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5, borderColor: '#2C2C2E',
  },

  sensorsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  sensorCard:     { width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  sensorIconBg:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sensorLabel:    { fontSize: 11, color: '#AEAEB2', fontWeight: '500', marginBottom: 2 },
  sensorValue:    { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  sensorUnit:     { fontSize: 12, fontWeight: '500', color: '#AEAEB2' },
  sensorStatus:   { fontSize: 10, fontWeight: '700', marginTop: 4 },
  sensorBarTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 8, overflow: 'hidden' },
  sensorBarFill:  { height: 3, borderRadius: 2 },

  detectionBox:       { position: 'absolute', borderWidth: 2, borderRadius: 4 },
  detectionLabel:     { position: 'absolute', top: -22, left: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  detectionLabelText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  detectionConfText:  { fontSize: 9, color: 'rgba(255,255,255,0.8)' },

  blockedAlert:      { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, zIndex: 999 },
  blockedAlertInner: { backgroundColor: '#FFF0F0', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FF3B30', elevation: 8 },
  blockedAlertIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFE5E5', alignItems: 'center', justifyContent: 'center' },
  blockedAlertTitle: { fontSize: 14, fontWeight: '800', color: '#FF3B30' },
  blockedAlertSub:   { fontSize: 11, color: '#8E3030', marginTop: 2 },

  overlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  sheetTitle:  { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sheetSub:    { fontSize: 12, color: '#AEAEB2', marginTop: 1 },

  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetCamThumb:  { width: 44, height: 36, borderRadius: 8, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  infoCard:       { backgroundColor: '#F9F9F9', borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  infoRowBorder:  { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  infoLabel:      { fontSize: 13, color: '#AEAEB2' },
  infoValue:      { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },

  sheetTitle2:     { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  sheetSub2:       { fontSize: 12, color: '#AEAEB2', marginBottom: 16 },
  optionsCard:     { backgroundColor: '#F9F9F9', borderRadius: 16, overflow: 'hidden' },
  optionRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  optionRowBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  optionIconBg:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLabel:     { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  optionSub:       { fontSize: 11, color: '#AEAEB2', marginTop: 1 },

  fsContainer: { flex: 1, backgroundColor: '#000' },
  fsVideo:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fsScanLine:  { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,255,68,0.2)' },
  fsTopBar:    { position: 'absolute', top: 52, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  fsBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  fsLivePill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  fsDot:       { width: 6, height: 6, borderRadius: 3 },
  fsLiveText:  { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  fsZoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,59,48,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.4)' },
  fsZoneBadgeText: { fontSize: 10, fontWeight: '700', color: '#FF3B30' },
  fsBottomBar: { position: 'absolute', bottom: 48, left: 20, right: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  fsCamName:   { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 3 },
  fsCamSub:    { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  fsActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  detailHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  detailIconBg:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bigValueCard:    { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 20, marginBottom: 12, alignItems: 'center' },
  bigValue:        { fontSize: 48, fontWeight: '700', color: '#1C1C1E' },
  bigUnit:         { fontSize: 20, fontWeight: '500', color: '#AEAEB2' },
  progressTrack:   { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.07)', width: '100%', marginTop: 16, overflow: 'hidden' },
  progressFill:    { height: 6, borderRadius: 3 },
  progressLabels:  { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 },
  progressLbl:     { fontSize: 10, color: '#AEAEB2' },
  detailCard:      { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, marginBottom: 12 },
  detailCardTitle: { fontSize: 12, fontWeight: '600', color: '#AEAEB2', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sparkLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sparkLbl:        { fontSize: 10, color: '#AEAEB2', flex: 1, textAlign: 'center' },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard:        { flex: 1, minWidth: '45%', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12 },
  statLabel:       { fontSize: 11, color: '#AEAEB2', marginBottom: 4 },
  statValue:       { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  descCard:        { flexDirection: 'row', gap: 10, backgroundColor: '#EAF4FF', borderRadius: 14, padding: 14, marginBottom: 12, alignItems: 'flex-start' },
  descText:        { flex: 1, fontSize: 13, color: '#004A8F', lineHeight: 19 },
  threshRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  threshDot:       { width: 8, height: 8, borderRadius: 4 },
  threshLabel:     { fontSize: 13, color: '#1C1C1E', flex: 1 },
  threshVal:       { fontSize: 12, color: '#AEAEB2' },
});
