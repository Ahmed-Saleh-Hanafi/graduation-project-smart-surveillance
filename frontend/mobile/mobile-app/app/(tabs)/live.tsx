import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated, Easing, Modal, Pressable,
  PanResponder, Alert, ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const STREAM_H = 220;
const STREAM_W  = width - 32;
const H         = 20;
const MIN_SZ    = 50;

const BASE_URL = 'http://192.168.1.229:5198';

// ─── Types ────────────────────────────────────────────────────────────────────

type CameraStatus = 'LIVE' | 'IDLE';

type Camera = {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
  status?: CameraStatus;
  location?: string;
  res?: string;
};

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

export type CameraEvent = {
  id: string;
  type: 'recording' | 'snapshot';
  cameraId: number;
  cameraName: string;
  timestamp: Date;
  duration?: number;
  label: string;
};

let _eventsStore: CameraEvent[] = [];
export const getEvents = () => _eventsStore;
export const addEvent  = (e: CameraEvent) => { _eventsStore = [e, ..._eventsStore]; };

type Zone = { id: string; x: number; y: number; w: number; h: number };

const makeZoneId = () => `z_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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
    description: 'KY-038 detects unusual noise or vibrations.',
    thresholds: { safe: 40, warn: 80 },
  },
];

// ─── Clock ────────────────────────────────────────────────────────────────────

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <Text style={streamStyles.clockText}>
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </Text>
  );
};

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
          borderWidth: 1.5, borderColor: '#00FF88', borderStyle: 'dashed',
          backgroundColor: 'rgba(0,255,136,0.07)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {editMode && (
          <Ionicons name="move-outline" size={11} color="rgba(0,255,136,0.5)" style={{ marginTop: 3 }} />
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
            flex: 1, margin: H / 2, borderWidth: 1.5,
            borderColor: '#00FF88', borderStyle: 'dashed',
            backgroundColor: 'rgba(0,255,136,0.07)',
          }} />
        </View>
      ))}
      {draft && draft.w > 4 && draft.h > 4 && (
        <View pointerEvents="none" style={{
          position: 'absolute',
          left: draft.x, top: draft.y, width: draft.w, height: draft.h,
          borderWidth: 1.5, borderColor: '#FF9500', borderStyle: 'dashed',
          backgroundColor: 'rgba(255,149,0,0.08)',
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
          <Ionicons name="crop-outline" size={22} color="rgba(255,149,0,0.7)" />
          <Text style={styles.drawHintText}>Drag to draw a restricted zone</Text>
        </View>
      )}
    </View>
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

// ─── Pro Stream Overlay ───────────────────────────────────────────────────────
// Renders the professional CCTV HUD on top of the video feed

const StreamHUD = ({
  camera,
  detections,
  zones,
  zoneMode,
  isRecording,
  recordingStart,
  onZoneAdd,
  onZoneUpdate,
  onZoneDelete,
  onExpand,
}: {
  camera: Camera;
  detections: Detection[];
  zones: Zone[];
  zoneMode: ZoneMode;
  isRecording: boolean;
  recordingStart: Date | null;
  onZoneAdd: (z: Zone) => void;
  onZoneUpdate: (z: Zone) => void;
  onZoneDelete: (id: string) => void;
  onExpand: () => void;
}) => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    if (isRecording) loop.start();
    else { loop.stop(); blinkAnim.setValue(1); }
    return () => loop.stop();
  }, [isRecording]);

  return (
    <View style={streamStyles.hudRoot}>

      {/* Scanlines overlay */}
      <View style={streamStyles.scanlines} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={streamStyles.scanlineRow} />
        ))}
      </View>

      {/* Moving scan line */}
      <Animated.View
        pointerEvents="none"
        style={[streamStyles.movingScan, {
          transform: [{
            translateY: scanAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-STREAM_H / 2, STREAM_H / 2],
            }),
          }],
        }]}
      />

      {/* Corner brackets */}
      {[
        { top: 8, left: 8, rotate: '0deg' },
        { top: 8, right: 8, rotate: '90deg' },
        { bottom: 8, left: 8, rotate: '-90deg' },
        { bottom: 8, right: 8, rotate: '180deg' },
      ].map((pos, i) => (
        <View key={i} pointerEvents="none" style={[streamStyles.bracket, pos]}>
          <View style={streamStyles.bracketH} />
          <View style={streamStyles.bracketV} />
        </View>
      ))}

      {/* Top-left: Camera ID + REC */}
      <View style={streamStyles.topLeft} pointerEvents="none">
        <View style={streamStyles.camIdPill}>
          <View style={[streamStyles.statusDotTiny, { backgroundColor: camera.status === 'IDLE' ? '#FF9500' : '#00FF88' }]} />
          <Text style={streamStyles.camIdText}>CAM {String(camera.id).padStart(2, '0')}</Text>
        </View>
        {isRecording && recordingStart && (
          <Animated.View style={{ opacity: blinkAnim }}>
            <RecordingTimer startTime={recordingStart} />
          </Animated.View>
        )}
      </View>

      {/* Top-right: Clock + Resolution */}
      <View style={streamStyles.topRight} pointerEvents="none">
        <LiveClock />
        <Text style={streamStyles.resText}>{camera.res ?? '1080p'} · 30fps</Text>
      </View>

      {/* Bottom-left: Camera name + IP */}
      <View style={streamStyles.bottomLeft} pointerEvents="none">
        <Text style={streamStyles.camNameHud} numberOfLines={1}>{camera.name.toUpperCase()}</Text>
        <Text style={streamStyles.camSubHud}>{camera.ipAddress}:{camera.port}</Text>
      </View>

      {/* Bottom-right: AI detection count */}
      <View style={streamStyles.bottomRight} pointerEvents="none">
        {detections.length > 0 && (
          <View style={[streamStyles.detCountBadge, {
            borderColor: detections.some(d => d.isBlocked) ? '#FF3B30' : '#00FF88',
          }]}>
            <Ionicons
              name="person-outline"
              size={10}
              color={detections.some(d => d.isBlocked) ? '#FF3B30' : '#00FF88'}
            />
            <Text style={[streamStyles.detCountText, {
              color: detections.some(d => d.isBlocked) ? '#FF3B30' : '#00FF88',
            }]}>
              {detections.length} detected
            </Text>
          </View>
        )}
        {zones.length > 0 && (
          <View style={streamStyles.zoneBadgeHud}>
            <Ionicons name="crop-outline" size={10} color="#FF9500" />
            <Text style={streamStyles.zoneBadgeText}>{zones.length} zone{zones.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Detection boxes */}
      {detections.map(det => (
        <View key={det.id} pointerEvents="none" style={[streamStyles.detBox, {
          left: `${det.bbox.x * 100}%` as any,
          top:  `${det.bbox.y * 100}%` as any,
          width:  `${det.bbox.w * 100}%` as any,
          height: `${det.bbox.h * 100}%` as any,
          borderColor: det.isBlocked ? '#FF3B30' : '#00FF88',
        }]}>
          {/* Corner accents on detection box */}
          <View style={[streamStyles.detCorner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderColor: det.isBlocked ? '#FF3B30' : '#00FF88' }]} />
          <View style={[streamStyles.detCorner, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderColor: det.isBlocked ? '#FF3B30' : '#00FF88' }]} />
          <View style={[streamStyles.detCorner, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: det.isBlocked ? '#FF3B30' : '#00FF88' }]} />
          <View style={[streamStyles.detCorner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderColor: det.isBlocked ? '#FF3B30' : '#00FF88' }]} />
          <View style={[streamStyles.detLabel, { backgroundColor: det.isBlocked ? 'rgba(255,59,48,0.85)' : 'rgba(0,255,136,0.85)' }]}>
            <Text style={streamStyles.detLabelText}>
              {det.isBlocked ? '✕ ' : '✓ '}{det.name.toUpperCase()}
            </Text>
            <Text style={streamStyles.detConfText}>{Math.round(det.confidence * 100)}%</Text>
          </View>
        </View>
      ))}

      {/* Zones */}
      {zones.map(z =>
        zoneMode === 'off' ? (
          <View key={z.id} pointerEvents="none" style={{
            position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h,
          }}>
            <View style={{
              flex: 1, margin: H / 2, borderWidth: 1.5,
              borderColor: '#00FF88', borderStyle: 'dashed',
              backgroundColor: 'rgba(0,255,136,0.06)',
            }} />
          </View>
        ) : (
          <ZoneBox
            key={z.id} zone={z}
            cW={STREAM_W} cH={STREAM_H}
            editMode={zoneMode === 'edit'}
            onDelete={onZoneDelete}
            onUpdate={onZoneUpdate}
          />
        )
      )}

      {zoneMode === 'draw' && (
        <DrawCanvas zones={zones} cW={STREAM_W} cH={STREAM_H} onAdd={onZoneAdd} />
      )}

      {/* Expand tap target */}
      {zoneMode === 'off' && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
          onPress={onExpand}
        />
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
    { label: 'IP Address',  value: camera.ipAddress },
    { label: 'Port',        value: String(camera.port) },
    { label: 'Stream URL',  value: camera.streamUrl },
    { label: 'Status',      value: camera.status ?? 'LIVE', highlight: true },
    { label: 'Location',    value: camera.location ?? '—' },
    { label: 'Resolution',  value: camera.res ?? '1080p' },
    { label: 'Frame rate',  value: '30 fps' },
    { label: 'Last event',  value: '2 min ago' },
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
              <Text style={styles.sheetSub}>{camera.ipAddress}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
            <Ionicons name="close" size={16} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.infoRow, i < rows.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>{r.label}</Text>
                <Text
                  style={[
                    styles.infoValue,
                    r.highlight && { color: (camera.status ?? 'LIVE') === 'LIVE' ? '#34C759' : '#AEAEB2', fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {r.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Camera Options Sheet ─────────────────────────────────────────────────────

const CameraOptionsSheet = ({
  camera, onClose, onRecordToggle, onSnapshot, isRecording, recordingStart,
}: {
  camera: Camera; onClose: () => void; onRecordToggle: () => void;
  onSnapshot: () => void; isRecording: boolean; recordingStart: Date | null;
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

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle2}>{camera.name}</Text>
        <Text style={styles.sheetSub2}>Choose an action</Text>
        <View style={styles.optionsCard}>
          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={() => { onRecordToggle(); dismiss(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconBg, { backgroundColor: '#FF3B3018' }]}>
              <MaterialCommunityIcons
                name={isRecording ? 'stop-circle-outline' : 'record-circle-outline'}
                size={18} color="#FF3B30"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{isRecording ? 'Stop recording' : 'Start recording'}</Text>
              <Text style={styles.optionSub}>{isRecording ? 'Save clip to events' : 'Save clip to storage'}</Text>
            </View>
            {isRecording && recordingStart
              ? <RecordingTimer startTime={recordingStart} />
              : <Ionicons name="chevron-forward" size={14} color="#AEAEB2" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => { onSnapshot(); dismiss(); }}
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
  const [isMuted, setIsMuted] = useState(false);
  const [isAIOn, setIsAIOn]   = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scanAnim  = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const scheduleHide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCtrlVisible(false), 4000);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    scheduleHide();

    const loop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();

    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    blink.start();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      loop.stop();
      blink.stop();
    };
  }, []);

  const dismiss = () =>
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose);

  const scaleX = width / STREAM_W;
  const scaleY = (height * 0.72) / STREAM_H;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[fsStyles.container, { opacity: fadeAnim }]}>

        {/* Video area */}
        <Pressable
          style={fsStyles.videoArea}
          onPress={() => { setCtrlVisible(v => !v); scheduleHide(); }}
        >
          {/* Scanlines */}
          <View style={fsStyles.scanlines} pointerEvents="none">
            {Array.from({ length: 16 }).map((_, i) => (
              <View key={i} style={fsStyles.scanlineRow} />
            ))}
          </View>

          {/* Moving scan */}
          <Animated.View
            pointerEvents="none"
            style={[fsStyles.movingScan, {
              transform: [{
                translateY: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-(height * 0.36), height * 0.36],
                }),
              }],
            }]}
          />

          {/* Corner brackets */}
          {[
            { top: 16, left: 16, rotate: '0deg' },
            { top: 16, right: 16, rotate: '90deg' },
            { bottom: 80, left: 16, rotate: '-90deg' },
            { bottom: 80, right: 16, rotate: '180deg' },
          ].map((pos, i) => (
            <View key={i} pointerEvents="none" style={[fsStyles.bracket, pos]}>
              <View style={fsStyles.bracketH} />
              <View style={fsStyles.bracketV} />
            </View>
          ))}

          <Ionicons name="videocam-outline" size={56} color="rgba(255,255,255,0.04)" />

          {/* Detection zones scaled to fullscreen */}
          {zones.map(z => (
            <View key={z.id} pointerEvents="none" style={{
              position: 'absolute',
              left: z.x * scaleX, top: z.y * scaleY,
              width: z.w * scaleX, height: z.h * scaleY,
            }}>
              <View style={{
                flex: 1, borderWidth: 1.5,
                borderColor: '#00FF88', borderStyle: 'dashed',
                backgroundColor: 'rgba(0,255,136,0.07)',
              }} />
            </View>
          ))}
        </Pressable>

        {/* Top bar */}
        {ctrlVisible && (
          <View style={fsStyles.topBar}>
            <TouchableOpacity style={fsStyles.iconBtn} onPress={dismiss}>
              <Ionicons name="chevron-down" size={20} color="white" />
            </TouchableOpacity>

            <View style={fsStyles.topCenter}>
              {/* Live indicator */}
              <Animated.View style={[fsStyles.liveDot, { opacity: blinkAnim }]} />
              <Text style={fsStyles.liveLabel}>LIVE</Text>
              <Text style={fsStyles.camNameFs}>{camera.name.toUpperCase()}</Text>
            </View>

            <View style={fsStyles.topRight}>
              <LiveClock />
            </View>
          </View>
        )}

        {/* Bottom control bar */}
        {ctrlVisible && (
          <View style={fsStyles.bottomBar}>
            {/* Camera info */}
            <View style={fsStyles.bottomInfo}>
              <Text style={fsStyles.camIdFs}>CAM {String(camera.id).padStart(2, '0')}</Text>
              <Text style={fsStyles.camSubFs}>{camera.ipAddress} · {camera.res ?? '1080p'}</Text>
            </View>

            {/* Tool buttons */}
            <View style={fsStyles.toolRow}>
              <TouchableOpacity
                style={[fsStyles.toolBtn, isMuted && fsStyles.toolBtnActive]}
                onPress={() => setIsMuted(v => !v)}
              >
                <Ionicons name={isMuted ? 'volume-mute-outline' : 'volume-medium-outline'} size={18} color={isMuted ? '#FF3B30' : 'white'} />
                <Text style={[fsStyles.toolLabel, isMuted && { color: '#FF3B30' }]}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[fsStyles.toolBtn, isAIOn && fsStyles.toolBtnGreen]}
                onPress={() => setIsAIOn(v => !v)}
              >
                <Ionicons name="scan-outline" size={18} color={isAIOn ? '#00FF88' : 'white'} />
                <Text style={[fsStyles.toolLabel, isAIOn && { color: '#00FF88' }]}>AI</Text>
              </TouchableOpacity>

              <TouchableOpacity style={fsStyles.toolBtn}>
                <Ionicons name="camera-outline" size={18} color="white" />
                <Text style={fsStyles.toolLabel}>Snap</Text>
              </TouchableOpacity>

              <TouchableOpacity style={fsStyles.toolBtn}>
                <MaterialCommunityIcons name="record-circle-outline" size={18} color="white" />
                <Text style={fsStyles.toolLabel}>Record</Text>
              </TouchableOpacity>

              <TouchableOpacity style={fsStyles.toolBtn}>
                <Ionicons name="share-outline" size={18} color="white" />
                <Text style={fsStyles.toolLabel}>Share</Text>
              </TouchableOpacity>
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

  // ── Camera + location state from API ─────────────────────────────────────
  const [cameras, setCameras]           = useState<Camera[]>([]);
  const [locations, setLocations]       = useState<string[]>(['All']);
  const [loadingCams, setLoadingCams]   = useState(true);
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('All');

  // ── Other state ──────────────────────────────────────────────────────────
  const [sensors, setSensors]       = useState<Sensor[]>(makeSensors());
  const [activeSensor, setActiveSensor] = useState<Sensor | null>(null);
  const [activeSheet, setActiveSheet]   = useState<ActiveSheet>(null);
  const [detections, setDetections]     = useState<Detection[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [blockedFace, setBlockedFace]   = useState<Detection | null>(null);
  const [zones, setZones]               = useState<Record<number, Zone[]>>({});
  const [zoneMode, setZoneMode]         = useState<ZoneMode>('off');
  const [recordings, setRecordings]     = useState<Record<number, Date>>({});

  const isRecording    = activeCamera ? !!recordings[activeCamera.id] : false;
  const recordingStart = activeCamera ? (recordings[activeCamera.id] ?? null) : null;

  // ── Fetch cameras + derive locations from API ────────────────────────────
  const fetchCameras = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${BASE_URL}/api/Camera`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data: Camera[] = res.data.data ?? [];
      setCameras(data);

      // Build unique location list from camera data
      const locs = Array.from(
        new Set(data.map(c => c.location).filter(Boolean) as string[])
      ).sort();
      setLocations(['All', ...locs]);

      if (data.length > 0 && !activeCamera) {
        setActiveCamera(data[0]);
      }
    } catch (e) {
      console.error('Failed to fetch cameras:', e);
    } finally {
      setLoadingCams(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Zone handlers ────────────────────────────────────────────────────────
  const handleZoneUpdate = (z: Zone) => {
    if (!activeCamera) return;
    setZones(prev => ({
      ...prev,
      [activeCamera.id]: prev[activeCamera.id]?.map(p => p.id === z.id ? z : p) || [],
    }));
  };
  const handleZoneAdd = (z: Zone) => {
    if (!activeCamera) return;
    setZones(prev => ({
      ...prev,
      [activeCamera.id]: [...(prev[activeCamera.id] || []), z],
    }));
  };
  const handleZoneDelete = (id: string) => {
    if (!activeCamera) return;
    setZones(prev => ({
      ...prev,
      [activeCamera.id]: (prev[activeCamera.id] || []).filter(z => z.id !== id),
    }));
  };

  const cycleZoneMode = () =>
    setZoneMode(m => m === 'off' ? 'draw' : m === 'draw' ? 'edit' : 'off');

  // ── Record toggle ────────────────────────────────────────────────────────
  const handleRecordToggle = () => {
    if (!activeCamera) return;
    const camId = activeCamera.id;
    if (!recordings[camId]) {
      setRecordings(prev => ({ ...prev, [camId]: new Date() }));
    } else {
      const start    = recordings[camId];
      const duration = Math.floor((Date.now() - start.getTime()) / 1000);
      addEvent({
        id: `rec_${Date.now()}`, type: 'recording',
        cameraId: camId, cameraName: activeCamera.name,
        timestamp: start, duration,
        label: `Recording · ${activeCamera.name} · ${duration}s`,
      });
      setRecordings(prev => { const n = { ...prev }; delete n[camId]; return n; });
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

  // ── Snapshot ─────────────────────────────────────────────────────────────
  const handleSnapshot = async () => {
    if (!activeCamera) return;
    try {
      const token    = await AsyncStorage.getItem('userToken');
      const localUri = FileSystem.cacheDirectory + `snapshot_${Date.now()}.jpg`;
      const result   = await FileSystem.downloadAsync(
        `${BASE_URL}/api/Camera/${activeCamera.id}/snapshot`,
        localUri,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (result.status !== 200) {
        Alert.alert('Failed', 'Could not fetch snapshot from camera.');
        return;
      }
      addEvent({
        id: `snap_${Date.now()}`, type: 'snapshot',
        cameraId: activeCamera.id, cameraName: activeCamera.name,
        timestamp: new Date(), label: `Snapshot · ${activeCamera.name}`,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(result.uri, { mimeType: 'image/jpeg', dialogTitle: 'Save Snapshot' });
      } else {
        Alert.alert('Snapshot saved', 'Saved to Events.', [
          { text: 'View Events', onPress: () => navigation.navigate('events') },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (error) {
      console.error('Snapshot error:', error);
      Alert.alert('Error', 'Could not save snapshot.');
    }
  };

  // ── Sensor simulation ─────────────────────────────────────────────────────
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

  // ── Poll detections ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeCamera) return;
    const poll = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res   = await axios.get(
          `${BASE_URL}/api/Detection/latest?cameraId=${activeCamera.id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
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
  }, [activeCamera?.id]);

  // ── Filtered cameras ──────────────────────────────────────────────────────
  const filteredCameras = selectedLocation === 'All'
    ? cameras
    : cameras.filter(c => c.location === selectedLocation);

  const zoneBtnColor = zoneMode === 'draw' ? '#FF9500' : zoneMode === 'edit' ? '#FF3B30' : undefined;
  const zoneBtnIcon  = zoneMode === 'draw' ? 'pencil-outline' : 'crop-outline';
  const currentZones = activeCamera ? (zones[activeCamera.id] || []) : [];

  // ── Loading / empty states ────────────────────────────────────────────────
  if (loadingCams) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading cameras...</Text>
      </View>
    );
  }

  if (!activeCamera) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="videocam-off-outline" size={48} color="#AEAEB2" />
        <Text style={styles.emptyText}>No cameras found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCameras}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={zoneMode === 'off'}
      >
        {/* Location filter — from API */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
        >
          {locations.map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.chip, selectedLocation === loc && styles.chipActive]}
              onPress={() => setSelectedLocation(loc)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedLocation === loc && styles.chipTextActive]}>
                {loc}
              </Text>
              {loc !== 'All' && (
                <Text style={[styles.chipCount, selectedLocation === loc && styles.chipCountActive]}>
                  {cameras.filter(c => c.location === loc).length}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main stream */}
        <View style={styles.streamCard}>
          <View style={styles.streamPlaceholder}>
            <StreamHUD
              camera={activeCamera}
              detections={detections}
              zones={currentZones}
              zoneMode={zoneMode}
              isRecording={isRecording}
              recordingStart={recordingStart}
              onZoneAdd={handleZoneAdd}
              onZoneUpdate={handleZoneUpdate}
              onZoneDelete={handleZoneDelete}
              onExpand={() => setActiveSheet('fullscreen')}
            />
          </View>

          {/* Stream footer */}
          <View style={styles.streamFooter}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.livePill}>
                <View style={[styles.statusDot, { backgroundColor: '#00FF88' }]} />
                <Text style={styles.liveText}>LIVE</Text>
                {isRecording && <View style={styles.recDotSmall} />}
                {isRecording && <Text style={[styles.liveText, { color: '#FF3B30' }]}>REC</Text>}
              </View>
              <Text style={styles.camName} numberOfLines={1}>{activeCamera.name}</Text>
              <Text style={styles.camSub}>
                {activeCamera.ipAddress} · port {activeCamera.port}
                {activeCamera.location ? ` · ${activeCamera.location}` : ''}
              </Text>
            </View>
            <View style={styles.streamActions}>
              <TouchableOpacity
                style={[styles.actionBtn, activeSheet === 'info' && styles.actionBtnActive]}
                onPress={() => setActiveSheet(p => p === 'info' ? null : 'info')}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle-outline" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setActiveSheet('fullscreen')}
                activeOpacity={0.7}
              >
                <Ionicons name="expand-outline" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, zoneMode !== 'off' && { backgroundColor: (zoneBtnColor ?? '#fff') + '30' }]}
                onPress={cycleZoneMode}
                activeOpacity={0.7}
              >
                <Ionicons name={zoneBtnIcon as any} size={18} color={zoneMode !== 'off' ? zoneBtnColor : 'white'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, activeSheet === 'options' && styles.actionBtnActive]}
                onPress={() => setActiveSheet(p => p === 'options' ? null : 'options')}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {zoneMode !== 'off' && (
            <View style={[styles.zoneModeBar, { backgroundColor: zoneMode === 'draw' ? '#FF9500' : '#FF3B30' }]}>
              <Ionicons name={zoneMode === 'draw' ? 'pencil-outline' : 'move-outline'} size={12} color="#fff" />
              <Text style={styles.zoneModeText}>
                {zoneMode === 'draw'
                  ? `Draw mode  ·  ${currentZones.length} zone${currentZones.length !== 1 ? 's' : ''}  ·  tap icon to switch to Edit`
                  : `Edit mode  ·  drag to move  ·  corners to resize  ·  tap icon to exit`}
              </Text>
            </View>
          )}
        </View>

        {/* Camera picker */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cameras</Text>
          {Object.keys(recordings).length > 0 && (
            <View style={styles.recCountBadge}>
              <View style={styles.recCountDot} />
              <Text style={styles.recCountText}>
                {Object.keys(recordings).length} recording{Object.keys(recordings).length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {filteredCameras.length === 0 ? (
          <View style={styles.noCamsBox}>
            <Text style={styles.noCamsText}>No cameras in "{selectedLocation}"</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.camScroll}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {filteredCameras.map(cam => (
              <TouchableOpacity
                key={cam.id}
                style={[styles.camThumb, activeCamera.id === cam.id && styles.camThumbActive]}
                onPress={() => setActiveCamera(cam)}
                activeOpacity={0.8}
              >
                <View style={styles.camThumbImg}>
                  <Ionicons name="videocam-outline" size={20} color="rgba(255,255,255,0.18)" />
                  {!!recordings[cam.id] && <View style={styles.camRecBadge} />}
                </View>
                <View style={styles.camThumbFooter}>
                  <Text style={styles.camThumbName} numberOfLines={1}>{cam.name}</Text>
                  <View style={[styles.statusDotSm, {
                    backgroundColor: cam.status === 'IDLE' ? '#FF9500' : '#00FF88',
                  }]} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Sensors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sensors</Text>
          <Text style={styles.sectionHint}>Tap for details</Text>
        </View>
        <View style={styles.sensorsGrid}>
          {sensors.map(s => {
            const pct = Math.min(100, (s.value / s.max) * 100);
            return (
              <TouchableOpacity
                key={s.key}
                style={styles.sensorCard}
                onPress={() => setActiveSensor(s)}
                activeOpacity={0.75}
              >
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

      {/* Blocked face alert */}
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

      {/* Sheets */}
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
        <FullscreenView camera={activeCamera} zones={currentZones} onClose={() => setActiveSheet(null)} />
      )}
      {activeSensor && (
        <SensorDetail sensor={activeSensor} onClose={() => setActiveSensor(null)} />
      )}
    </View>
  );
}

// ─── Stream HUD Styles ────────────────────────────────────────────────────────

const streamStyles = StyleSheet.create({
  hudRoot: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'space-around',
    pointerEvents: 'none' as any,
  },
  scanlineRow: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  movingScan: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,255,136,0.18)',
  },
  bracket: {
    position: 'absolute',
    width: 18,
    height: 18,
  },
  bracketH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 18,
    height: 2,
    backgroundColor: '#00FF88',
    opacity: 0.8,
  },
  bracketV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 18,
    backgroundColor: '#00FF88',
    opacity: 0.8,
  },
  topLeft: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRight: {
    position: 'absolute',
    top: 10,
    right: 12,
    alignItems: 'flex-end',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 12,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    alignItems: 'flex-end',
    gap: 4,
  },
  camIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  statusDotTiny: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  camIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00FF88',
    letterSpacing: 1.5,
    fontFamily: 'monospace' as any,
  },
  clockText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    fontFamily: 'monospace' as any,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  resText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'right',
    fontFamily: 'monospace' as any,
  },
  camNameHud: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.5,
    fontFamily: 'monospace' as any,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  camSubHud: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
    marginTop: 2,
    fontFamily: 'monospace' as any,
  },
  detCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  detCountText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'monospace' as any,
  },
  zoneBadgeHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,149,0,0.4)',
  },
  zoneBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF9500',
    letterSpacing: 0.5,
    fontFamily: 'monospace' as any,
  },

  // Detection boxes
  detBox: {
    position: 'absolute',
    borderWidth: 0,
  },
  detCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  detLabel: {
    position: 'absolute',
    top: -20,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 4,
  },
  detLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
    fontFamily: 'monospace' as any,
  },
  detConfText: {
    fontSize: 8,
    color: 'rgba(0,0,0,0.7)',
    fontFamily: 'monospace' as any,
  },
});

// ─── Fullscreen Styles ────────────────────────────────────────────────────────

const fsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  scanlineRow: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  movingScan: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,255,136,0.15)',
  },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  bracketH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 2,
    backgroundColor: '#00FF88',
    opacity: 0.7,
  },
  bracketV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 24,
    backgroundColor: '#00FF88',
    opacity: 0.7,
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,255,136,0.15)',
  },
  topCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  topRight: {
    alignItems: 'flex-end',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF3B30',
    letterSpacing: 2,
    fontFamily: 'monospace' as any,
  },
  camNameFs: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    fontFamily: 'monospace' as any,
  },
  clockFs: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace' as any,
    letterSpacing: 0.5,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 36,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,255,136,0.15)',
    gap: 14,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  camIdFs: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00FF88',
    letterSpacing: 1.5,
    fontFamily: 'monospace' as any,
  },
  camSubFs: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
    fontFamily: 'monospace' as any,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderColor: 'rgba(255,59,48,0.3)',
  },
  toolBtnGreen: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderColor: 'rgba(0,255,136,0.25)',
  },
  toolLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingBottom: 32 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F2F2F7' },
  loadingText:      { fontSize: 14, color: '#AEAEB2' },
  emptyText:        { fontSize: 16, fontWeight: '600', color: '#AEAEB2', marginTop: 8 },
  retryBtn:         { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#007AFF', borderRadius: 20 },
  retryText:        { color: '#fff', fontWeight: '700', fontSize: 14 },

  noCamsBox:  { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center' },
  noCamsText: { color: '#AEAEB2', fontSize: 13 },

  filterList:    { marginTop: 14, marginBottom: 14 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  chipActive:      { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipText:        { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive:  { color: '#fff' },
  chipCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AEAEB2',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chipCountActive: {
    color: '#1C1C1E',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  streamCard:        { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0A0A0A', marginBottom: 4 },
  streamPlaceholder: { height: STREAM_H, overflow: 'hidden' },

  recTimerPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,59,48,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  recDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  recTimerText:   { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5, fontFamily: 'monospace' as any },
  recDotSmall:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF3B30', marginLeft: 4 },

  streamFooter:    { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#111' },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 4 },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  liveText:        { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  camName:         { fontSize: 14, fontWeight: '700', color: '#fff' },
  camSub:          { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  streamActions:   { flexDirection: 'row', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },

  zoneModeBar:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  zoneModeText: { fontSize: 11, color: '#fff', fontWeight: '600', flex: 1 },

  zoneDeleteBtn: {
    position: 'absolute', top: 0, right: 0, zIndex: 30,
    width: H, height: H, borderRadius: H / 2,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', elevation: 5,
  },
  cornerHandle: {
    position: 'absolute', width: H, height: H, borderRadius: 5,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', zIndex: 20, elevation: 5,
  },

  drawHintOverlay: { alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(0,0,0,0.2)' },
  drawHintText:    { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  draftLabel:      { position: 'absolute', top: 4, left: 4, backgroundColor: '#FF9500', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  draftLabelText:  { fontSize: 9, color: '#fff', fontWeight: '700', fontFamily: 'monospace' as any },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, marginTop: 20 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sectionHint:   { fontSize: 12, color: '#AEAEB2' },

  recCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF3B3015', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.25)' },
  recCountDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  recCountText:  { fontSize: 11, fontWeight: '700', color: '#FF3B30' },

  camScroll:      { paddingLeft: 16, marginBottom: 24 },
  camThumb:       { width: 130, marginRight: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  camThumbActive: { borderColor: '#007AFF' },
  camThumbImg:    { height: 80, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  camThumbFooter: { backgroundColor: '#111', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  camThumbName:   { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },
  statusDotSm:    { width: 5, height: 5, borderRadius: 3 },
  camRecBadge:    { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#1C1C1E' },

  sensorsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  sensorCard:     { width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  sensorIconBg:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sensorLabel:    { fontSize: 11, color: '#AEAEB2', fontWeight: '500', marginBottom: 2 },
  sensorValue:    { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  sensorUnit:     { fontSize: 12, fontWeight: '500', color: '#AEAEB2' },
  sensorStatus:   { fontSize: 10, fontWeight: '700', marginTop: 4 },
  sensorBarTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 8, overflow: 'hidden' },
  sensorBarFill:  { height: 3, borderRadius: 2 },

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
  infoValue:      { fontSize: 13, fontWeight: '600', color: '#1C1C1E', flex: 1, textAlign: 'right' },

  sheetTitle2:     { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  sheetSub2:       { fontSize: 12, color: '#AEAEB2', marginBottom: 16 },
  optionsCard:     { backgroundColor: '#F9F9F9', borderRadius: 16, overflow: 'hidden' },
  optionRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  optionRowBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  optionIconBg:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLabel:     { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  optionSub:       { fontSize: 11, color: '#AEAEB2', marginTop: 1 },

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
