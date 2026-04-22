import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Modal, Pressable, Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEvents, CameraEvent } from './live';

const { width, height } = Dimensions.get('window');

const BASE_URL = 'http://192.168.1.229:5198';

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
  const m     = Math.floor(total / 60);
  const s     = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

type FilterType = 'all' | 'recording' | 'snapshot';

// ─── Video Player Modal ───────────────────────────────────────────────────────

const VideoPlayer = ({ event, onClose }: { event: CameraEvent; onClose: () => void }) => {
  const videoRef                              = useRef<Video>(null);
  const [status, setStatus]                  = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls]      = useState(true);
  const [speedIdx, setSpeedIdx]              = useState(1); // default 1x
  const [downloading, setDownloading]        = useState(false);
  const hideTimer                            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoUrl = `${BASE_URL}/api/Camera/${event.cameraId}/recording/${event.id}`;

  const isPlaying  = status?.isLoaded ? status.isPlaying : false;
  const position   = status?.isLoaded ? status.positionMillis   : 0;
  const duration   = status?.isLoaded ? (status.durationMillis ?? 0) : 0;
  const progress   = duration > 0 ? position / duration : 0;

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const toggleControls = () => {
    setShowControls(v => !v);
    if (!showControls) scheduleHide();
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      if (status?.isLoaded && status.didJustFinish) {
        await videoRef.current.replayAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
    scheduleHide();
  };

  const seek = async (ratio: number) => {
    if (!videoRef.current || !status?.isLoaded) return;
    await videoRef.current.setPositionAsync(ratio * (status.durationMillis ?? 0));
  };

  const cycleSpeed = async () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    await videoRef.current?.setRateAsync(SPEEDS[next], true);
    scheduleHide();
  };

  const skipBy = async (secs: number) => {
    if (!videoRef.current || !status?.isLoaded) return;
    const target = Math.max(0, Math.min(position + secs * 1000, duration));
    await videoRef.current.setPositionAsync(target);
    scheduleHide();
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const token    = await AsyncStorage.getItem('userToken');
      const localUri = FileSystem.cacheDirectory + `recording_${event.id}.mp4`;

      const result = await FileSystem.downloadAsync(videoUrl, localUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (result.status !== 200) {
        Alert.alert('Failed', 'Could not download video.');
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(result.uri, { mimeType: 'video/mp4', dialogTitle: 'Save Recording' });
      } else {
        Alert.alert('Downloaded', 'Video saved to device cache.');
      }
    } catch {
      Alert.alert('Error', 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent transparent>
      <View style={pStyles.backdrop}>

        {/* ── Top bar ── */}
        <View style={pStyles.topBar}>
          <TouchableOpacity style={pStyles.iconBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={pStyles.topTitle} numberOfLines={1}>{event.cameraName}</Text>
            <Text style={pStyles.topSub}>{formatTimestamp(event.timestamp)}</Text>
          </View>
          <TouchableOpacity style={pStyles.iconBtn} onPress={handleDownload} disabled={downloading}>
            {downloading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="download-outline" size={22} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* ── Video ── */}
        <Pressable style={pStyles.videoWrap} onPress={toggleControls}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={setStatus}
            useNativeControls={false}
          />

          {/* Loading spinner */}
          {(!status?.isLoaded) && (
            <View style={pStyles.loadingOverlay}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}

          {/* Controls overlay */}
          {showControls && status?.isLoaded && (
            <View style={pStyles.controlsOverlay}>
              {/* Skip −10 / Play / Skip +10 */}
              <View style={pStyles.centerRow}>
                <TouchableOpacity style={pStyles.skipBtn} onPress={() => skipBy(-10)}>
                  <Ionicons name="play-back-outline" size={28} color="#fff" />
                  <Text style={pStyles.skipLabel}>10</Text>
                </TouchableOpacity>

                <TouchableOpacity style={pStyles.playBtn} onPress={togglePlay}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32} color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity style={pStyles.skipBtn} onPress={() => skipBy(10)}>
                  <Ionicons name="play-forward-outline" size={28} color="#fff" />
                  <Text style={pStyles.skipLabel}>10</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>

        {/* ── Bottom controls ── */}
        <View style={pStyles.bottomBar}>
          {/* Progress bar */}
          <Pressable
            style={pStyles.progressTrack}
            onPress={(e) => {
              const ratio = e.nativeEvent.locationX / (width - 32);
              seek(Math.max(0, Math.min(1, ratio)));
            }}
          >
            <View style={[pStyles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[pStyles.progressThumb, { left: `${progress * 100}%` as any }]} />
          </Pressable>

          {/* Time + speed */}
          <View style={pStyles.timeRow}>
            <Text style={pStyles.timeText}>
              {formatSeconds(position)} / {formatSeconds(duration)}
            </Text>

            <TouchableOpacity style={pStyles.speedBtn} onPress={cycleSpeed}>
              <Text style={pStyles.speedText}>{SPEEDS[speedIdx]}×</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Modal>
  );
};

// ─── Events Screen ────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const [events, setEvents]         = useState<CameraEvent[]>([]);
  const [filter, setFilter]         = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [playing, setPlaying]       = useState<CameraEvent | null>(null);

  useFocusEffect(
    useCallback(() => { setEvents(getEvents()); }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setEvents(getEvents());
    setTimeout(() => setRefreshing(false), 500);
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  const counts = {
    all:       events.length,
    recording: events.filter(e => e.type === 'recording').length,
    snapshot:  events.filter(e => e.type === 'snapshot').length,
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerSub}>{counts.all} total</Text>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.filterRow}>
        {(['all', 'recording', 'snapshot'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'recording' ? 'Recordings' : 'Snapshots'}
            </Text>
            <View style={[styles.filterBadge, filter === f && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, filter === f && styles.filterBadgeTextActive]}>
                {counts[f]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="film-outline" size={40} color="#AEAEB2" />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? 'Start recording or take a snapshot from the Live screen to see events here.'
                : filter === 'recording'
                ? 'No recordings yet. Open Live → ⋯ → Start recording.'
                : 'No snapshots yet. Open Live → ⋯ → Download snapshot.'}
            </Text>
          </View>
        ) : (
          filtered.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              isLast={index === filtered.length - 1}
              onPress={() => event.type === 'recording' ? setPlaying(event) : null}
            />
          ))
        )}
      </ScrollView>

      {/* ── Video Player ── */}
      {playing && (
        <VideoPlayer event={playing} onClose={() => setPlaying(null)} />
      )}
    </View>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = ({
  event, isLast, onPress,
}: { event: CameraEvent; isLast: boolean; onPress: () => void }) => {
  const isRec   = event.type === 'recording';
  const color   = isRec ? '#FF3B30' : '#34C759';
  const bgColor = isRec ? '#FF3B3012' : '#34C75912';

  return (
    <TouchableOpacity
      style={[styles.card, isLast && { marginBottom: 0 }]}
      activeOpacity={isRec ? 0.75 : 1}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={[styles.cardIcon, { backgroundColor: bgColor }]}>
        {isRec
          ? <MaterialCommunityIcons name="record-circle-outline" size={22} color={color} />
          : <Ionicons name="camera-outline" size={22} color={color} />}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {isRec ? 'Recording' : 'Snapshot'}
          </Text>
          <View style={[styles.typePill, { backgroundColor: bgColor }]}>
            <Text style={[styles.typePillText, { color }]}>
              {isRec ? 'VIDEO' : 'PHOTO'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardCam}>{event.cameraName}</Text>

        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={11} color="#AEAEB2" />
          <Text style={styles.cardMetaText}>{formatTimestamp(event.timestamp)}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaText}>{formatTime(event.timestamp)}</Text>
          {isRec && event.duration !== undefined && (
            <>
              <Text style={styles.cardMetaDot}>·</Text>
              <Ionicons name="hourglass-outline" size={11} color="#AEAEB2" />
              <Text style={styles.cardMetaText}>{formatDuration(event.duration)}</Text>
            </>
          )}
        </View>
      </View>

      {/* Arrow — only for recordings */}
      {isRec
        ? <Ionicons name="play-circle-outline" size={28} color={color} />
        : <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />}
    </TouchableOpacity>
  );
};

// ─── Player Styles ────────────────────────────────────────────────────────────

const pStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  topSub:   { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  videoWrap: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 40,
  },
  skipBtn: { alignItems: 'center' },
  skipLabel:{ fontSize: 10, color: '#fff', marginTop: 2, fontWeight: '700' },
  playBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  bottomBar: {
    paddingHorizontal: 16, paddingBottom: 48, paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  progressTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 12, position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: 4, borderRadius: 2,
    backgroundColor: '#fff', position: 'absolute', left: 0,
  },
  progressThumb: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#fff', position: 'absolute',
    marginLeft: -7, top: -5,
  },
  timeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  timeText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontVariant: ['tabular-nums'] },
  speedBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  speedText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  headerSub:   { fontSize: 13, color: '#AEAEB2', marginTop: 2 },

  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  filterTabActive:      { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  filterTabText:        { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  filterTabTextActive:  { color: '#fff' },
  filterBadge:          { backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeActive:    { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterBadgeText:      { fontSize: 11, fontWeight: '700', color: '#AEAEB2' },
  filterBadgeTextActive:{ color: '#fff' },

  list:      { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  listEmpty: { flex: 1, justifyContent: 'center' },

  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: '#AEAEB2', textAlign: 'center', lineHeight: 19 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  cardIcon:     { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardBody:     { flex: 1 },
  cardTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  typePill:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typePillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardCam:      { fontSize: 12, color: '#636366', marginBottom: 5, fontWeight: '500' },
  cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  cardMetaText: { fontSize: 11, color: '#AEAEB2' },
  cardMetaDot:  { fontSize: 11, color: '#C7C7CC' },
});
