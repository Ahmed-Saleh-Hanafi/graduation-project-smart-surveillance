import axios from 'axios';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Modal, Pressable, Alert,
  ActivityIndicator, Platform, StatusBar, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const BASE_URL = 'http://192.168.1.229:5198';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) =>
  AsyncStorage.getItem('userToken').then((token) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }).catch(() => config)
);

// ─── Types ─────────────────────────────────────────────────────────────────

interface Camera {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
  location?: string;
}

interface EventRecordingDto {
  id: number;
  name: string;
  cameraId: number;
  cameraName?: string;
  recordingStart: string;
  recordingEnd: string;
  url?: string;
  videoUrl?: string;
  filePath?: string;
}

interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

interface RecordingEvent {
  id: string;
  type: 'recording';
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  duration: number;
  videoUrl: string;
}

// ─── API Helpers ───────────────────────────────────────────────────────────

const authHeader = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildAbsoluteUrl = (raw: string | undefined | null): string => {
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;
  return `${BASE_URL}/${raw.replace(/\\/g, '/').replace(/^\/+/, '')}`;
};

const fetchCamerasAPI = async (): Promise<Camera[]> => {
  const headers = await authHeader();
  const res = await api.get<ApiResponse<Camera[]>>('/api/Camera', { headers });
  return res.data?.data ?? [];
};

const fetchRecordingsByCameraAPI = async (cameraId: number): Promise<RecordingEvent[]> => {
  const headers = await authHeader();
  const res = await api.get<ApiResponse<EventRecordingDto[]>>(
    `/api/EventRecording/GetByCamera/${cameraId}`,
    { headers }
  );
  if (res.data.isSuccess === false) throw new Error(res.data.message ?? 'Failed to load recordings');

  return (res.data.data ?? [])
    .filter((dto: EventRecordingDto) => !!dto.recordingStart)
    .map((dto: EventRecordingDto) => {
      const start    = new Date(dto.recordingStart);
      const end      = dto.recordingEnd ? new Date(dto.recordingEnd) : new Date();
      const duration = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
      const rawUrl   = dto.url ?? dto.videoUrl ?? dto.filePath ?? '';
      return {
        id:         String(dto.id),
        type:       'recording' as const,
        cameraId:   String(dto.cameraId),
        cameraName: dto.cameraName ?? dto.name ?? 'Camera',
        timestamp:  start,
        duration,
        videoUrl:   buildAbsoluteUrl(rawUrl),
      };
    });
};

// ─── Formatters ────────────────────────────────────────────────────────────

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatTime = (date: Date) => {
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatSeconds = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const DEFAULT_SPEED_IDX = 3; // 1x

// ─── Camera Chip ───────────────────────────────────────────────────────────

const CameraChip = ({
  camera, active, recordingCount, onPress,
}: {
  camera: Camera;
  active: boolean;
  recordingCount: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.chipDot, { backgroundColor: active ? '#FF3B30' : '#AEAEB2' }]} />
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {camera.name}
    </Text>
    {recordingCount > 0 && (
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
          {recordingCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── Speed Picker Modal ────────────────────────────────────────────────────

const SpeedPicker = ({
  visible,
  currentIdx,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentIdx: number;
  onSelect: (idx: number) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <Pressable style={spStyles.overlay} onPress={onClose}>
      <View style={spStyles.sheet}>
        <Text style={spStyles.title}>Playback Speed</Text>
        {SPEEDS.map((speed, idx) => (
          <TouchableOpacity
            key={speed}
            style={[spStyles.row, idx === currentIdx && spStyles.rowActive]}
            onPress={() => { onSelect(idx); onClose(); }}
          >
            <Text style={[spStyles.rowText, idx === currentIdx && spStyles.rowTextActive]}>
              {speed}×
            </Text>
            {idx === currentIdx && (
              <Ionicons name="checkmark" size={18} color="#FF3B30" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  </Modal>
);

const spStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowActive: {},
  rowText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  rowTextActive: {
    color: '#FF3B30',
    fontWeight: '700',
  },
});

// ─── Video Player Modal ────────────────────────────────────────────────────

const VideoPlayer = ({
  event,
  onClose,
}: {
  event: RecordingEvent;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const videoRef          = useRef<Video>(null);
  const fadeAnim          = useRef(new Animated.Value(1)).current;
  const hideTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status,          setStatus]          = useState<AVPlaybackStatus | null>(null);
  const [showControls,    setShowControls]     = useState(true);
  const [speedIdx,        setSpeedIdx]         = useState(DEFAULT_SPEED_IDX);
  const [isMuted,         setIsMuted]          = useState(false);
  const [downloading,     setDownloading]      = useState(false);
  const [downloadPct,     setDownloadPct]      = useState(0);
  const [isFullscreen,    setIsFullscreen]     = useState(false);
  const [showSpeedPicker, setShowSpeedPicker]  = useState(false);
  const [isSeeking,       setIsSeeking]        = useState(false);

  // ── derived ────────────────────────────────────────────────────────────
  const isLoaded   = status?.isLoaded ?? false;
  const isPlaying  = isLoaded ? (status as any).isPlaying : false;
  const position   = isLoaded ? (status as any).positionMillis  : 0;
  const durMs      = isLoaded ? ((status as any).durationMillis ?? 0) : 0;
  const progress   = durMs > 0 ? position / durMs : 0;
  const isFinished = isLoaded && (status as any).didJustFinish;
  const buffering  = isLoaded ? ((status as any).isBuffering ?? false) : false;

  const videoH = isFullscreen ? Dimensions.get('window').width : (width * 9) / 16;
  const videoW = isFullscreen ? Dimensions.get('window').height : width;

  // ── controls fade ─────────────────────────────────────────────────────
  const showAndScheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        () => setShowControls(false)
      );
    }, 3500);
  }, [fadeAnim]);

  useEffect(() => { showAndScheduleHide(); }, []);

  const touchVideo = () => {
    if (showControls) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setShowControls(false)
      );
    } else {
      showAndScheduleHide();
    }
  };

  // ── playback ──────────────────────────────────────────────────────────
  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isFinished) {
      await videoRef.current.replayAsync();
    } else if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    showAndScheduleHide();
  };

  const seek = async (ratio: number) => {
    if (!videoRef.current || !isLoaded) return;
    await videoRef.current.setPositionAsync(ratio * durMs);
    showAndScheduleHide();
  };

  const skipBy = async (secs: number) => {
    if (!videoRef.current || !isLoaded) return;
    const target = Math.max(0, Math.min(position + secs * 1000, durMs));
    await videoRef.current.setPositionAsync(target);
    showAndScheduleHide();
  };

  const applySpeed = async (idx: number) => {
    setSpeedIdx(idx);
    await videoRef.current?.setRateAsync(SPEEDS[idx], true);
    showAndScheduleHide();
  };

  const toggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    await videoRef.current?.setIsMutedAsync(next);
    showAndScheduleHide();
  };

  // ── fullscreen ────────────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
    setIsFullscreen(v => !v);
    showAndScheduleHide();
  };

  // unlock on unmount
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // ── download ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadPct(0);
      const token    = await AsyncStorage.getItem('userToken');
      const localUri = `${FileSystem.cacheDirectory}recording_${event.id}.mp4`;
      const headers  = token ? { Authorization: `Bearer ${token}` } : {};

      const downloadResumable = FileSystem.createDownloadResumable(
        event.videoUrl,
        localUri,
        { headers },
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setDownloadPct(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || result.status !== 200) {
        Alert.alert('Download Failed', 'Could not download the video.');
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType:    'video/mp4',
          dialogTitle: 'Save Recording',
        });
      } else {
        Alert.alert('Downloaded', 'Video saved to cache.');
      }
    } catch (e) {
      console.error('Download error:', e);
      Alert.alert('Error', 'Download failed.');
    } finally {
      setDownloading(false);
      setDownloadPct(0);
    }
  };

  const handleClose = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    onClose();
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <Modal visible animationType="slide" statusBarTranslucent transparent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={pStyles.backdrop}>

        {/* ── Top bar ── */}
        <View style={[pStyles.topBar, { paddingTop: isFullscreen ? 12 : insets.top + 12 }]}>
          <TouchableOpacity style={pStyles.iconBtn} onPress={handleClose}>
            <Ionicons name="chevron-down" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={pStyles.topMeta}>
            <Text style={pStyles.topTitle} numberOfLines={1}>{event.cameraName}</Text>
            <Text style={pStyles.topSub}>{formatTimestamp(event.timestamp)}</Text>
          </View>
          <TouchableOpacity style={pStyles.iconBtn} onPress={handleDownload} disabled={downloading}>
            {downloading ? (
              <View style={pStyles.downloadingBox}>
                <Text style={pStyles.downloadPctText}>{downloadPct}%</Text>
              </View>
            ) : (
              <Ionicons name="download-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Download progress bar */}
        {downloading && (
          <View style={pStyles.downloadBar}>
            <View style={[pStyles.downloadFill, { width: `${downloadPct}%` }]} />
          </View>
        )}

        {/* ── Video ── */}
        <Pressable
          style={[pStyles.videoContainer, { width: videoW, height: videoH }]}
          onPress={touchVideo}
        >
          <Video
            ref={videoRef}
            source={{ uri: event.videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={setStatus}
            useNativeControls={false}
            isMuted={isMuted}
          />

          {/* Loading / buffering */}
          {(!isLoaded || buffering) && (
            <View style={pStyles.centerOverlay}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}

          {/* Controls */}
          {showControls && isLoaded && (
            <Animated.View style={[pStyles.controlsOverlay, { opacity: fadeAnim }]}>
              <View style={pStyles.controlsDim} />

              {/* Center row */}
              <View style={pStyles.centerRow}>
                <TouchableOpacity style={pStyles.skipBtn} onPress={() => skipBy(-10)}>
                  <Ionicons name="play-back" size={24} color="#fff" />
                  <Text style={pStyles.skipLabel}>10s</Text>
                </TouchableOpacity>

                <TouchableOpacity style={pStyles.playBtn} onPress={togglePlay}>
                  <Ionicons
                    name={isPlaying ? 'pause' : isFinished ? 'refresh' : 'play'}
                    size={36}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={pStyles.skipBtn} onPress={() => skipBy(10)}>
                  <Ionicons name="play-forward" size={24} color="#fff" />
                  <Text style={pStyles.skipLabel}>10s</Text>
                </TouchableOpacity>
              </View>

              {/* Top-right inline controls (mute + fullscreen) */}
              <View style={pStyles.overlayTopRight}>
                <TouchableOpacity style={pStyles.overlayIconBtn} onPress={toggleMute}>
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={pStyles.overlayIconBtn} onPress={toggleFullscreen}>
                  <Ionicons
                    name={isFullscreen ? 'contract' : 'expand'}
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Pressable>

        {/* ── Bottom bar ── */}
        <View style={[pStyles.bottomBar, { paddingBottom: isFullscreen ? 12 : insets.bottom + 16 }]}>

          {/* Scrubber */}
          <Pressable
            style={pStyles.progressTrack}
            onPress={(e) => {
              const trackWidth = isFullscreen
                ? Dimensions.get('window').height - 32
                : width - 32;
              const ratio = e.nativeEvent.locationX / trackWidth;
              seek(Math.max(0, Math.min(1, ratio)));
            }}
          >
            {/* Buffer indicator (subtle) */}
            <View style={[pStyles.progressBuffer, { width: `${Math.min(progress * 100 + 10, 100)}%` }]} />
            <View style={[pStyles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[pStyles.thumb, { left: `${progress * 100}%` as any }]} />
          </Pressable>

          {/* Time + controls row */}
          <View style={pStyles.controlsRow}>
            <Text style={pStyles.timeText}>
              {formatSeconds(position)}
              <Text style={pStyles.timeDivider}> / </Text>
              {formatSeconds(durMs)}
            </Text>

            <View style={pStyles.rightControls}>
              {/* Mute button */}
              <TouchableOpacity style={pStyles.controlPill} onPress={toggleMute}>
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={14}
                  color={isMuted ? '#FF3B30' : '#fff'}
                />
              </TouchableOpacity>

              {/* Speed picker */}
              <TouchableOpacity
                style={pStyles.speedPill}
                onPress={() => setShowSpeedPicker(true)}
              >
                <Ionicons name="speedometer-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={pStyles.speedText}>{SPEEDS[speedIdx]}×</Text>
              </TouchableOpacity>

              {/* Fullscreen */}
              <TouchableOpacity style={pStyles.controlPill} onPress={toggleFullscreen}>
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={14}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Meta chips */}
          <View style={pStyles.metaRow}>
            <View style={pStyles.metaChip}>
              <Ionicons name="videocam-outline" size={11} color="#AEAEB2" />
              <Text style={pStyles.metaChipText}>{event.cameraName}</Text>
            </View>
            <View style={pStyles.metaChip}>
              <Ionicons name="hourglass-outline" size={11} color="#AEAEB2" />
              <Text style={pStyles.metaChipText}>{formatDuration(event.duration)}</Text>
            </View>
            <View style={pStyles.metaChip}>
              <Ionicons name="calendar-outline" size={11} color="#AEAEB2" />
              <Text style={pStyles.metaChipText}>{formatTime(event.timestamp)}</Text>
            </View>
          </View>
        </View>

        {/* Speed Picker */}
        <SpeedPicker
          visible={showSpeedPicker}
          currentIdx={speedIdx}
          onSelect={applySpeed}
          onClose={() => setShowSpeedPicker(false)}
        />
      </View>
    </Modal>
  );
};

// ─── Recording Card ────────────────────────────────────────────────────────

const RecordingCard = ({
  event, onPress,
}: { event: RecordingEvent; onPress: () => void }) => (
  <TouchableOpacity style={styles.recordingCard} activeOpacity={0.75} onPress={onPress}>
    <View style={styles.recordingThumb}>
      <MaterialCommunityIcons name="record-circle-outline" size={22} color="#FF3B30" />
    </View>

    <View style={styles.recordingBody}>
      <View style={styles.recordingTopRow}>
        <Text style={styles.recordingTitle} numberOfLines={1}>Recording</Text>
        <View style={styles.recordingTypePill}>
          <Text style={styles.recordingTypeText}>VIDEO</Text>
        </View>
      </View>
      <View style={styles.recordingMeta}>
        <Ionicons name="time-outline" size={11} color="#AEAEB2" />
        <Text style={styles.recordingMetaText}>{formatTimestamp(event.timestamp)}</Text>
        <Text style={styles.recordingMetaDot}>·</Text>
        <Text style={styles.recordingMetaText}>{formatTime(event.timestamp)}</Text>
        <Text style={styles.recordingMetaDot}>·</Text>
        <Ionicons name="hourglass-outline" size={11} color="#AEAEB2" />
        <Text style={styles.recordingMetaText}>{formatDuration(event.duration)}</Text>
      </View>
    </View>

    <View style={styles.playBtnCard}>
      <Ionicons name="play" size={16} color="#fff" />
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets();

  const [cameras,           setCameras]           = useState<Camera[]>([]);
  const [loadingCams,       setLoadingCams]       = useState(true);
  const [selectedCam,       setSelectedCam]       = useState<Camera | null>(null);
  const [recordings,        setRecordings]        = useState<RecordingEvent[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [refreshing,        setRefreshing]        = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [playing,           setPlaying]           = useState<RecordingEvent | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchCamerasAPI();
        if (!alive) return;
        setCameras(data);
        if (data.length > 0) setSelectedCam(data[0]);
      } catch {
        if (alive) setError('Failed to load cameras');
      } finally {
        if (alive) setLoadingCams(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadRecordings = useCallback(async (cam: Camera, silent = false) => {
    if (!silent) setLoadingRecordings(true);
    setError(null);
    try {
      const data = await fetchRecordingsByCameraAPI(cam.id);
      data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecordings(data);
    } catch {
      setError('Failed to load recordings');
      setRecordings([]);
    } finally {
      setLoadingRecordings(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCam) loadRecordings(selectedCam);
  }, [selectedCam]);

  useFocusEffect(
    useCallback(() => {
      if (selectedCam) loadRecordings(selectedCam, true);
    }, [selectedCam])
  );

  const onRefresh = () => {
    if (!selectedCam) return;
    setRefreshing(true);
    loadRecordings(selectedCam, true);
  };

  if (loadingCams) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Loading cameras…</Text>
      </View>
    );
  }

  if (cameras.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="videocam-off-outline" size={48} color="#AEAEB2" />
        <Text style={styles.emptyTitle}>No cameras found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera selector */}
      <View style={styles.selectorCard}>
        <Text style={styles.selectorLabel}>Events</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorContent}
        >
          {cameras.map(cam => (
            <CameraChip
              key={cam.id}
              camera={cam}
              active={selectedCam?.id === cam.id}
              recordingCount={selectedCam?.id === cam.id ? recordings.length : 0}
              onPress={() => setSelectedCam(cam)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Recordings list */}
      {loadingRecordings ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Loading recordings…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 32 },
            recordings.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3B30" />
          }
        >
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {recordings.length === 0 && !error ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="film-outline" size={40} color="#AEAEB2" />
              </View>
              <Text style={styles.emptyTitle}>No recordings yet</Text>
              <Text style={styles.emptySub}>
                Start recording from the Live screen to see recordings here.
              </Text>
            </View>
          ) : (
            recordings.map(event => (
              <RecordingCard
                key={event.id}
                event={event}
                onPress={() => setPlaying(event)}
              />
            ))
          )}
        </ScrollView>
      )}

      {playing && (
        <VideoPlayer event={playing} onClose={() => setPlaying(null)} />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const VIDEO_HEIGHT = (width * 9) / 16;

const pStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#090909',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#090909',
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  topMeta:  { flex: 1, marginHorizontal: 12 },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  topSub:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  downloadingBox: { alignItems: 'center', justifyContent: 'center' },
  downloadPctText: { fontSize: 11, fontWeight: '700', color: '#FF3B30' },

  downloadBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 0,
  },
  downloadFill: {
    height: 2,
    backgroundColor: '#FF3B30',
  },

  // Video
  videoContainer: {
    backgroundColor: '#000',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Controls
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  controlsDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayTopRight: {
    position: 'absolute',
    top: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  overlayIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
  },

  centerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 44,
  },
  skipBtn:  { alignItems: 'center', gap: 3 },
  skipLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  playBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,59,48,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,59,48,0.5)',
  },

  // Bottom bar
  bottomBar: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    backgroundColor: '#090909',
  },

  // Scrubber
  progressTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
    position: 'relative', justifyContent: 'center',
  },
  progressBuffer: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'absolute', left: 0,
  },
  progressFill: {
    height: 4, borderRadius: 2,
    backgroundColor: '#FF3B30',
    position: 'absolute', left: 0,
  },
  thumb: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#fff',
    position: 'absolute', marginLeft: -7, top: -5,
    shadowColor: '#FF3B30', shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },

  // Controls row
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  timeDivider: { color: 'rgba(255,255,255,0.3)', fontWeight: '400' },
  rightControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  controlPill: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  speedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 17,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  speedText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  metaChipText: { fontSize: 12, color: '#8E8E93' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#F2F2F7',
  },
  loadingText: { fontSize: 14, color: '#AEAEB2' },

  selectorCard: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  selectorLabel: {
    fontSize: 11, fontWeight: '700', color: '#AEAEB2',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, marginBottom: 10,
  },
  selectorContent: { paddingHorizontal: 16, gap: 8 },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: '#F2F2F7',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  chipActive:          { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipDot:             { width: 6, height: 6, borderRadius: 3 },
  chipText:            { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive:      { color: '#fff' },
  chipBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  chipBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.2)' },
  chipBadgeText:       { fontSize: 10, fontWeight: '700', color: '#AEAEB2' },
  chipBadgeTextActive: { color: '#fff' },

  list:      { paddingHorizontal: 16, paddingTop: 16 },
  listEmpty: { flex: 1, justifyContent: 'center' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0EE', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
    borderWidth: 0.5, borderColor: '#FF3B3030',
  },
  errorText: { fontSize: 13, color: '#FF3B30', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#AEAEB2', marginTop: 8 },
  emptySub:   { fontSize: 13, color: '#C7C7CC', textAlign: 'center', marginTop: 4 },

  recordingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  recordingThumb: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#FF3B3010',
    alignItems: 'center', justifyContent: 'center',
  },
  recordingBody: { flex: 1 },
  recordingTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  recordingTitle:    { fontSize: 15, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  recordingTypePill: {
    backgroundColor: '#FF3B3012',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  recordingTypeText: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: '#FF3B30',
  },
  recordingMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap',
  },
  recordingMetaText: { fontSize: 11, color: '#AEAEB2' },
  recordingMetaDot:  { fontSize: 11, color: '#C7C7CC' },

  playBtnCard: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3B30', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
});