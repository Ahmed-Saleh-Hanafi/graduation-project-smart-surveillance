import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated, Easing, Modal, Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type CameraStatus = 'LIVE' | 'IDLE';
type Camera = { id: string; name: string; location: string; status: CameraStatus; res: string };

type SensorKey = 'smoke' | 'temperature' | 'humidity' | 'motion';
type Sensor = {
  key: SensorKey;
  icon: string;
  label: string;
  value: number;
  unit: string;
  status: string;
  statusColor: string;
  bg: string;
  color: string;
  max: number;
  history: number[];
  description: string;
  thresholds: { safe: number; warn: number };
};

// ─── Static data ──────────────────────────────────────────────────────────────

const LOCATIONS = ['All', 'Main Gate', 'Lobby', 'Parking', 'Kitchen', 'Backyard'];

const CAMERAS: Camera[] = [
  { id: '1', name: 'Main Gate',   location: 'Front entrance', status: 'LIVE', res: '1080p' },
  { id: '2', name: 'Lobby',       location: 'Building lobby', status: 'LIVE', res: '1080p' },
  { id: '3', name: 'Parking Lot', location: 'North parking',  status: 'IDLE', res: '720p'  },
];

const makeSensors = (): Sensor[] => [
  {
    key: 'smoke', icon: 'smoke-detector', label: 'Smoke', value: 0, unit: 'PPM',
    status: 'Normal', statusColor: '#34C759', bg: '#E8F5E9', color: '#34C759', max: 500,
    history: [0, 0, 0, 0, 0, 0],
    description: 'Smoke & CO concentration in the air. Readings above 100 PPM trigger an alert.',
    thresholds: { safe: 50, warn: 150 },
  },
  {
    key: 'temperature', icon: 'thermometer', label: 'Temperature', value: 24, unit: '°C',
    status: 'Stable', statusColor: '#FF9500', bg: '#FFF3E0', color: '#FF9500', max: 50,
    history: [22, 23, 23, 24, 24, 24],
    description: 'Ambient room temperature. Optimal range is 18–26 °C for comfort and equipment safety.',
    thresholds: { safe: 26, warn: 35 },
  },
  {
    key: 'humidity', icon: 'water-percent', label: 'Humidity', value: 58, unit: '%',
    status: 'Good', statusColor: '#007AFF', bg: '#E3F2FD', color: '#007AFF', max: 100,
    history: [60, 59, 61, 58, 57, 58],
    description: 'Relative humidity level. High humidity may cause condensation; ideal range is 40–60%.',
    thresholds: { safe: 60, warn: 80 },
  },
  {
    key: 'motion', icon: 'motion-sensor', label: 'Motion', value: 2, unit: 'events',
    status: 'Active', statusColor: '#FF2D55', bg: '#FCE4EC', color: '#FF2D55', max: 20,
    history: [0, 1, 0, 3, 1, 2],
    description: 'Motion events detected in the last minute. Sudden spikes may indicate intrusion.',
    thresholds: { safe: 5, warn: 10 },
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

// ─── Camera Options Sheet ─────────────────────────────────────────────────────

const CameraOptionsSheet = ({ camera, onClose }: { camera: Camera; onClose: () => void }) => {
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

  const options: { iconLib: 'MCI' | 'ION'; icon: string; label: string; sub: string; color: string }[] = [
    { iconLib: 'MCI', icon: 'record-circle-outline', label: 'Start recording',    sub: 'Save clip to storage',   color: '#FF3B30' },
    { iconLib: 'MCI', icon: 'camera-flip-outline',   label: 'Flip / PTZ control', sub: 'Pan, tilt, zoom',        color: '#007AFF' },
    { iconLib: 'ION', icon: 'download-outline',       label: 'Download snapshot',  sub: 'Save current frame',     color: '#34C759' },
    { iconLib: 'ION', icon: 'share-outline',          label: 'Share stream link',  sub: 'Copy RTSP / HLS URL',    color: '#FF9500' },
    { iconLib: 'ION', icon: 'settings-outline',       label: 'Camera settings',    sub: 'Resolution, alerts…',    color: '#8E8E93' },
    {
      iconLib: 'ION',
      icon: 'power-outline',
      label: camera.status === 'LIVE' ? 'Pause camera' : 'Enable camera',
      sub:   camera.status === 'LIVE' ? 'Stop the stream' : 'Resume stream',
      color: '#FF3B30',
    },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle2}>{camera.name}</Text>
        <Text style={styles.sheetSub2}>Choose an action</Text>

        <View style={styles.optionsCard}>
          {options.map((o, i) => (
            <TouchableOpacity
              key={o.label}
              style={[styles.optionRow, i < options.length - 1 && styles.optionRowBorder]}
              onPress={dismiss}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconBg, { backgroundColor: o.color + '18' }]}>
                {o.iconLib === 'MCI'
                  ? <MaterialCommunityIcons name={o.icon as any} size={18} color={o.color} />
                  : <Ionicons name={o.icon as any} size={18} color={o.color} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{o.label}</Text>
                <Text style={styles.optionSub}>{o.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#AEAEB2" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Fullscreen Modal ─────────────────────────────────────────────────────────

const FullscreenView = ({ camera, onClose }: { camera: Camera; onClose: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = () => {
    if (controlTimer.current) clearTimeout(controlTimer.current);
    controlTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    scheduleHide();
    return () => { if (controlTimer.current) clearTimeout(controlTimer.current); };
  }, []);

  const handleTap = () => {
    setControlsVisible(v => !v);
    scheduleHide();
  };

  const dismiss = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose);
  };

  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    if (camera.status === 'LIVE') loop.start();
    return () => loop.stop();
  }, [camera.status]);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.fsContainer, { opacity: fadeAnim }]}>
        <Pressable style={styles.fsVideo} onPress={handleTap}>
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-around', opacity: 0.03 }]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ height: 1, backgroundColor: '#00ff44' }} />
            ))}
          </View>
          {camera.status === 'LIVE' && (
            <Animated.View style={[styles.fsScanLine, {
              transform: [{
                translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-(height * 0.35), height * 0.35] }),
              }],
            }]} />
          )}
          <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.06)" />
        </Pressable>

        {controlsVisible && (
          <View style={styles.fsTopBar}>
            <TouchableOpacity style={styles.fsBtn} onPress={dismiss}>
              <Ionicons name="chevron-down" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.fsLivePill}>
              <View style={[styles.fsDot, { backgroundColor: camera.status === 'LIVE' ? '#34C759' : '#AEAEB2' }]} />
              <Text style={styles.fsLiveText}>{camera.status}</Text>
            </View>
          </View>
        )}

        {controlsVisible && (
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

export default function LiveScreen() {
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [activeCamera, setActiveCamera]         = useState<Camera>(CAMERAS[0]);
  const [sensors, setSensors]                   = useState<Sensor[]>(makeSensors());
  const [activeSensor, setActiveSensor]         = useState<Sensor | null>(null);
  const [activeSheet, setActiveSheet]           = useState<ActiveSheet>(null);

  // Live sensor updates
  useEffect(() => {
    const id = setInterval(() => {
      setSensors(prev => prev.map(s => {
        if (s.key === 'temperature') {
          const v = Math.round(Math.max(18, Math.min(40, s.value + (Math.random() - 0.5) * 1.5)));
          return {
            ...s, value: v, history: [...s.history.slice(1), v],
            status: v <= s.thresholds.safe ? 'Stable' : v <= s.thresholds.warn ? 'High' : 'Critical',
            statusColor: v > s.thresholds.warn ? '#FF3B30' : '#FF9500',
          };
        }
        if (s.key === 'humidity') {
          const v = Math.round(Math.max(30, Math.min(90, s.value + (Math.random() - 0.5) * 3)));
          return {
            ...s, value: v, history: [...s.history.slice(1), v],
            status: v <= 60 ? 'Good' : v <= 80 ? 'High' : 'Very High',
            statusColor: v <= 60 ? '#007AFF' : v <= 80 ? '#FF9500' : '#FF3B30',
          };
        }
        if (s.key === 'motion') {
          const v = Math.max(0, Math.round(Math.random() * 4));
          return { ...s, value: v, history: [...s.history.slice(1), v] };
        }
        return s;
      }));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const filteredCameras = selectedLocation === 'All'
    ? CAMERAS
    : CAMERAS.filter(c => c.name.includes(selectedLocation));

  // Scan line animation — restarts when active camera changes
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    scanAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    );
    if (activeCamera.status === 'LIVE') loop.start();
    return () => loop.stop();
  }, [activeCamera.id, activeCamera.status]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Location filter ── */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterList} contentContainerStyle={styles.filterContent}
        >
          {LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.chip, selectedLocation === loc && styles.chipActive]}
              onPress={() => setSelectedLocation(loc)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedLocation === loc && styles.chipTextActive]}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Main stream ── */}
        <View style={styles.streamCard}>
          {/* Video area — tap to fullscreen */}
          <Pressable style={styles.streamPlaceholder} onPress={() => setActiveSheet('fullscreen')}>
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-around', opacity: 0.04 }]} pointerEvents="none">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ height: 1, backgroundColor: '#00ff44' }} />
              ))}
            </View>
            {activeCamera.status === 'LIVE' && (
              <Animated.View
                style={[styles.scanLine, {
                  transform: [{
                    translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }),
                  }],
                }]}
                pointerEvents="none"
              />
            )}
            <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.1)" />
            {/* Tap hint */}
            <View style={styles.expandHint} pointerEvents="none">
              <Ionicons name="expand-outline" size={11} color="rgba(255,255,255,0.35)" />
              <Text style={styles.expandHintText}>Tap to expand</Text>
            </View>
          </Pressable>

          {/* Footer — name always matches selected camera */}
          <View style={styles.streamFooter}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={styles.livePill}>
                <View style={[styles.statusDot, {
                  backgroundColor: activeCamera.status === 'LIVE' ? '#34C759' : '#AEAEB2',
                }]} />
                <Text style={styles.liveText}>{activeCamera.status}</Text>
              </View>
              {/* ✅ Synced camera name */}
              <Text style={styles.camName} numberOfLines={1}>{activeCamera.name}</Text>
              <Text style={styles.camSub}>{activeCamera.location} · {activeCamera.res}</Text>
            </View>

            <View style={styles.streamActions}>
              {/* ① Info button → slides up camera info sheet */}
              <TouchableOpacity
                style={[styles.actionBtn, activeSheet === 'info' && styles.actionBtnActive]}
                onPress={() => setActiveSheet(prev => prev === 'info' ? null : 'info')}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle-outline" size={18} color="white" />
              </TouchableOpacity>

              {/* ② Expand button → fullscreen modal */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setActiveSheet('fullscreen')}
                activeOpacity={0.7}
              >
                <Ionicons name="expand-outline" size={18} color="white" />
              </TouchableOpacity>

              {/* ③ Three dots → options sheet */}
              <TouchableOpacity
                style={[styles.actionBtn, activeSheet === 'options' && styles.actionBtnActive]}
                onPress={() => setActiveSheet(prev => prev === 'options' ? null : 'options')}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Camera picker ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cameras</Text>
        </View>

        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.camScroll} contentContainerStyle={{ paddingRight: 16 }}
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
              </View>
              <View style={styles.camThumbFooter}>
                <Text style={styles.camThumbName} numberOfLines={1}>{cam.name}</Text>
                <View style={[styles.statusDotSm, {
                  backgroundColor: cam.status === 'LIVE' ? '#34C759' : '#AEAEB2',
                }]} />
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

      {/* ── Sheets & Modals ── */}
      {activeSheet === 'info'       && <CameraInfoSheet    camera={activeCamera} onClose={() => setActiveSheet(null)} />}
      {activeSheet === 'options'    && <CameraOptionsSheet camera={activeCamera} onClose={() => setActiveSheet(null)} />}
      {activeSheet === 'fullscreen' && <FullscreenView     camera={activeCamera} onClose={() => setActiveSheet(null)} />}
      {activeSensor && <SensorDetail sensor={activeSensor} onClose={() => setActiveSensor(null)} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingBottom: 32 },

  filterList:     { marginTop: 14, marginBottom: 14 },
  filterContent:  { paddingHorizontal: 16, gap: 8 },
  chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  chipActive:     { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive: { color: '#fff' },

  streamCard:        { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111', marginBottom: 20 },
  streamPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanLine:          { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,255,68,0.25)' },
  expandHint:        { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandHintText:    { fontSize: 10, color: 'rgba(255,255,255,0.35)' },

  streamFooter:   { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E' },
  livePill:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 4 },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  liveText:       { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  camName:        { fontSize: 15, fontWeight: '700', color: '#fff' },
  camSub:         { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  streamActions:  { flexDirection: 'row', gap: 8 },
  actionBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  actionBtnActive:{ backgroundColor: 'rgba(255,255,255,0.25)' },

  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sectionHint:    { fontSize: 12, color: '#AEAEB2' },

  camScroll:      { paddingLeft: 16, marginBottom: 24 },
  camThumb:       { width: 130, marginRight: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  camThumbActive: { borderColor: '#007AFF' },
  camThumbImg:    { height: 80, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  camThumbFooter: { backgroundColor: '#1C1C1E', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  camThumbName:   { fontSize: 11, fontWeight: '600', color: '#fff', flex: 1 },
  statusDotSm:    { width: 5, height: 5, borderRadius: 3 },

  sensorsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  sensorCard:     { width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  sensorIconBg:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sensorLabel:    { fontSize: 11, color: '#AEAEB2', fontWeight: '500', marginBottom: 2 },
  sensorValue:    { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  sensorUnit:     { fontSize: 12, fontWeight: '500', color: '#AEAEB2' },
  sensorStatus:   { fontSize: 10, fontWeight: '700', marginTop: 4 },
  sensorBarTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 8, overflow: 'hidden' },
  sensorBarFill:  { height: 3, borderRadius: 2 },

  // Shared overlay/sheet
  overlay:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%' },
  sheetHandle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', alignSelf: 'center', marginBottom: 16 },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  sheetTitle:     { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sheetSub:       { fontSize: 12, color: '#AEAEB2', marginTop: 1 },

  // Info sheet
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetCamThumb:  { width: 44, height: 36, borderRadius: 8, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  infoCard:       { backgroundColor: '#F9F9F9', borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  infoRowBorder:  { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  infoLabel:      { fontSize: 13, color: '#AEAEB2' },
  infoValue:      { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },

  // Options sheet
  sheetTitle2:    { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  sheetSub2:      { fontSize: 12, color: '#AEAEB2', marginBottom: 16 },
  optionsCard:    { backgroundColor: '#F9F9F9', borderRadius: 16, overflow: 'hidden' },
  optionRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  optionRowBorder:{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  optionIconBg:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLabel:    { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  optionSub:      { fontSize: 11, color: '#AEAEB2', marginTop: 1 },

  // Fullscreen
  fsContainer:    { flex: 1, backgroundColor: '#000' },
  fsVideo:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fsScanLine:     { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(0,255,68,0.2)' },
  fsTopBar:       { position: 'absolute', top: 52, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  fsBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  fsLivePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  fsDot:          { width: 6, height: 6, borderRadius: 3 },
  fsLiveText:     { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  fsBottomBar:    { position: 'absolute', bottom: 48, left: 20, right: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  fsCamName:      { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 3 },
  fsCamSub:       { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  fsActionBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  // Sensor detail
  detailHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  detailIconBg:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bigValueCard:   { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 20, marginBottom: 12, alignItems: 'center' },
  bigValue:       { fontSize: 48, fontWeight: '700', color: '#1C1C1E' },
  bigUnit:        { fontSize: 20, fontWeight: '500', color: '#AEAEB2' },
  progressTrack:  { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.07)', width: '100%', marginTop: 16, overflow: 'hidden' },
  progressFill:   { height: 6, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 },
  progressLbl:    { fontSize: 10, color: '#AEAEB2' },
  detailCard:     { backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, marginBottom: 12 },
  detailCardTitle:{ fontSize: 12, fontWeight: '600', color: '#AEAEB2', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sparkLabels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sparkLbl:       { fontSize: 10, color: '#AEAEB2', flex: 1, textAlign: 'center' },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard:       { flex: 1, minWidth: '45%', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12 },
  statLabel:      { fontSize: 11, color: '#AEAEB2', marginBottom: 4 },
  statValue:      { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  descCard:       { flexDirection: 'row', gap: 10, backgroundColor: '#EAF4FF', borderRadius: 14, padding: 14, marginBottom: 12, alignItems: 'flex-start' },
  descText:       { flex: 1, fontSize: 13, color: '#004A8F', lineHeight: 19 },
  threshRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  threshDot:      { width: 8, height: 8, borderRadius: 4 },
  threshLabel:    { fontSize: 13, color: '#1C1C1E', flex: 1 },
  threshVal:      { fontSize: 12, color: '#AEAEB2' },
});
