import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions, Alert,
  ActivityIndicator, Share, Platform, StyleSheet,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
 
import {
  BASE_URL, GO2RTC_HOST, GO2RTC_PORT,
  fetchWithTimeout,
  getEvents, setEventsStore,
} from '../../constants/live/api';

import {
  SENSOR_UI,
  getSensorUI,
  deriveSensorStatus,
  buildSensorFromApi,
} from '../../constants/live/sensor';

import {
  STREAM_H, STREAM_W, H, MIN_SZ,
  clamp, buildStreamName,
  WEBVIEW_RECORDING_INIT_JS,
  START_RECORDING_JS,
  STOP_RECORDING_JS,
} from '../../constants/live/config';

import type {
  Camera, CameraStatus,
  Sensor, SensorKey,
  EventRecording,
  Detection,
  ActiveSheet,
} from '../../constants/live/types';
 
import { useWebRTCUrl } from '../../hooks/live/useWebRTCUrl';
import {
  getAuthHeader,
  useSensorSignalR, useSignalRSensorUpdater,
  useFetchCameras, useFetchSensors,
} from '../../hooks/live/useLiveScreen';
 
import { styles } from '../../styles/live/styles';
 
// ── Split Components ──────────────────────────────────────────────────────────
import SnapshotFlash      from '../../components/live/SnapshotFlash';
import StreamHUD          from '../../components/live/StreamHUD';
import CameraOptionsSheet from '../../components/live/CameraOptionsSheet';
import FullscreenView     from '../../components/live/Fullscreenview';
import SensorDetail       from '../../components/live/Sensordetail';
import Sparkline          from '../../components/live/Sparkline';
 
const { width } = Dimensions.get('window');
 
// ─── Main LiveScreen ──────────────────────────────────────────────────────────
export default function LiveScreen() {
  const navigation = useNavigation<any>();
 
  const [loadingCams,      setLoadingCams]      = useState(true);
  const [loadingSensors,   setLoadingSensors]   = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [activeSensor,     setActiveSensor]     = useState<Sensor | null>(null);
  const [activeSheet,      setActiveSheet]      = useState<ActiveSheet>(null);
  const [detections,       setDetections]       = useState<Detection[]>([]);
  //const [alertVisible,     setAlertVisible]     = useState(false);
 // const [blockedFace,      setBlockedFace]      = useState<Detection | null>(null);
  const [recordings,       setRecordings]       = useState<Record<number, { start: Date; sessionId?: string }>>({});
  const [savingIds,        setSavingIds]        = useState<Set<number>>(new Set());
  const [isMutedInline,    setIsMutedInline]    = useState(true);
  const [snapshotFlash,    setSnapshotFlash]    = useState(false);
  const [isSnapshoting,    setIsSnapshoting]    = useState(false);
  const [recorderReady,    setRecorderReady]    = useState(false);
 
  const webViewRef       = useRef<any>(null);
  const hudViewRef       = useRef<View>(null);
  const savingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
 
  const { cameras, locations, activeCamera, setActiveCamera, fetchCameras } = useFetchCameras(setLoadingCams);
  const { sensors, setSensors, fetchSensorReadings } = useFetchSensors(setLoadingSensors) as any;
 
  const { webRTCUrl, error: webRTCError } = useWebRTCUrl(activeCamera);
  const [webRTCReady, setWebRTCReady]     = useState(false);
  useEffect(() => { setWebRTCReady(!!webRTCUrl); }, [webRTCUrl]);
  useEffect(() => { setRecorderReady(false); }, [activeCamera?.id]);
 
  const isRecording    = activeCamera ? !!recordings[activeCamera.id] : false;
  const isSaving       = activeCamera ? savingIds.has(activeCamera.id) : false;
  const recordingStart = activeCamera ? (recordings[activeCamera.id]?.start ?? null) : null;
  const sensorIds      = sensors.map((s: Sensor) => s.apiId).filter(Boolean) as number[];
 
  const { handleReading, handleAlert } = useSignalRSensorUpdater(setSensors);
  useSensorSignalR(sensorIds, handleReading, handleAlert);
 
  // ── handleSensorPress ──────────────────────────────────────────────────────
  const handleSensorPress = async (sensor: Sensor) => {
    setActiveSensor(sensor);
    if (!sensor.apiId) return;
    try {
      const headers = await getAuthHeader();
      const res     = await axios.get(`${BASE_URL}/api/Sensor/${sensor.apiId}/readings`, { headers });
      const raw     = res.data;
      const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      if (!arr.length) return;
      const values = arr
        .map((r: any) => typeof r === 'number' ? r : Number(r?.value ?? r?.reading ?? NaN))
        .filter((n: number) => isFinite(n));
      if (!values.length) return;
      const latest6 = values.slice(-6);
      while (latest6.length < 6) latest6.unshift(0);
      setActiveSensor(prev =>
        prev && prev.apiId === sensor.apiId ? { ...prev, history: latest6 } : prev
      );
    } catch (_) {}
  };
 
  // ── Poll detections ────────────────────────────────────────────────────────
  // useEffect(() => {
  //   if (!activeCamera) return;
  //   const poll = async () => {
  //     try {
  //       const headers = await getAuthHeader();
  //       const res = await axios.get(`${BASE_URL}/api/Detection/latest?cameraId=${activeCamera.id}`, { headers });
  //       const data: Detection[] = res.data.data ?? [];
  //       setDetections(data);
  //       const blocked = data.find(d => d.isBlocked);
  //       if (blocked) { setBlockedFace(blocked); setAlertVisible(true); }
  //     } catch (_) {}
  //   };
  //   poll();
  //   const id = setInterval(poll, 3000);
  //   return () => clearInterval(id);
  // }, [activeCamera?.id]);
 
   // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!activeCamera) return;
    try {
      const streamName = buildStreamName(activeCamera);
      await Share.share({
        message: `📡 Live Feed: ${activeCamera.name}\n🔗 http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${streamName}\n📍 ${activeCamera.location ?? '—'}\n🕐 ${new Date().toLocaleString()}`,
        title: `Live Feed — ${activeCamera.name}`,
      });
    } catch (_) {}
  };
 
  // ── Snapshot ───────────────────────────────────────────────────────────────
  const handleSnapshot = async () => {
    if (!activeCamera || isSnapshoting) return;
    setIsSnapshoting(true); setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 400);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow photo library access to save snapshots.');
        setIsSnapshoting(false); return;
      }
      const streamName = buildStreamName(activeCamera);
      const frameUrl   = `http://${GO2RTC_HOST}:${GO2RTC_PORT}/api/frame.jpeg?src=${streamName}`;
      const localPath  = `${FileSystem.cacheDirectory}snap_${activeCamera.id}_${Date.now()}.jpg`;
      let savedUri: string | null = null;
      try {
        const dlResult = await FileSystem.downloadAsync(frameUrl, localPath);
        if (dlResult.status === 200) savedUri = dlResult.uri;
      } catch (frameErr) { console.warn('[Snapshot] go2rtc frame API failed:', (frameErr as any).message); }
      if (!savedUri && hudViewRef.current) {
        try { savedUri = await captureRef(hudViewRef, { format: 'jpg', quality: 0.92, result: 'tmpfile' }); }
        catch (capErr) { console.warn('[Snapshot] captureRef failed:', (capErr as any).message); }
      }
      if (!savedUri) {
        Alert.alert('⚠️ Snapshot failed', 'Could not capture a frame.');
        setIsSnapshoting(false); return;
      }
      const asset = await MediaLibrary.createAssetAsync(savedUri);
      try {
        let album = await MediaLibrary.getAlbumAsync('Security Cam');
        if (!album) album = await MediaLibrary.createAlbumAsync('Security Cam', asset, false);
        else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } catch (_) {}
      Alert.alert('📸 Snapshot saved', `Frame from "${activeCamera.name}" saved to your photo library.`);
    } catch (e: any) { Alert.alert('⚠️ Snapshot failed', e.message ?? 'Unknown error'); }
    finally { setIsSnapshoting(false); }
  };
 
  const handleRecorderReady = () => {
    console.log('[Record] WebView recorder is ready');
    setRecorderReady(true);
  };
 
  // ── Recording data callback ────────────────────────────────────────────────
  const handleRecordingData = async (base64Data: string, mimeType: string) => {
    if (!activeCamera) return;
    const camId = activeCamera.id;
    if (savingTimeoutRef.current[camId]) { clearTimeout(savingTimeoutRef.current[camId]); delete savingTimeoutRef.current[camId]; }
    if (base64Data.startsWith('ERROR:')) {
      Alert.alert('⚠️ Recording failed', base64Data.replace('ERROR:', ''));
      setRecordings(prev => { const n = { ...prev }; delete n[camId]; return n; });
      setSavingIds(prev => { const s = new Set(prev); s.delete(camId); return s; });
      return;
    }
    const rec = recordings[camId];
    if (!rec) { setSavingIds(prev => { const s = new Set(prev); s.delete(camId); return s; }); return; }
    const end      = new Date();
    const duration = Math.floor((end.getTime() - rec.start.getTime()) / 1000);
    try {
      const ext         = 'mp4';
      const localPath   = `${FileSystem.cacheDirectory}rec_${camId}_${Date.now()}.${ext}`;
      const base64Clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      await FileSystem.writeAsStringAsync(localPath, base64Clean, { encoding: FileSystem.EncodingType.Base64 });
      const formData = new FormData();
      const fileUri  = Platform.OS === 'android' ? localPath : localPath.replace('file://', '');
      formData.append('VideoFile',      { uri: fileUri, name: `rec_${buildStreamName(activeCamera)}_${Date.now()}.${ext}`, type: 'video/mp4' } as any);
      formData.append('Name',           `REC · ${activeCamera.name} · ${duration}s`);
      formData.append('CameraId',       String(camId));
      formData.append('RecordingStart', rec.start.toISOString());
      formData.append('RecordingEnd',   end.toISOString());
      const token    = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/EventRecording/CreateEventRecorded`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!response.ok) { const errText = await response.text(); throw new Error(errText || `HTTP ${response.status}`); }
      try { await FileSystem.deleteAsync(localPath, { idempotent: true }); } catch (_) {}
      try {
        const authHeaders = await getAuthHeader();
        const evRes = await axios.get(`${BASE_URL}/api/EventRecording/GetAllEventRecorded`, { headers: authHeaders });
        setEventsStore(evRes.data?.data ?? []);
      } catch (_) {}
      Alert.alert(' Recording saved', `${duration}s clip from "${activeCamera.name}" saved to Events.`, [
        { text: 'View Events', onPress: () => navigation.navigate('events') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert('⚠️ Save failed', e?.message ?? 'Unknown error');
    } finally {
      setRecordings(prev => { const n = { ...prev }; delete n[camId]; return n; });
      setSavingIds(prev => { const s = new Set(prev); s.delete(camId); return s; });
    }
  };
 
  // ── Record Toggle ──────────────────────────────────────────────────────────
  const handleRecordToggle = async () => {
    if (!activeCamera) return;
    const camId = activeCamera.id;
    if (!recordings[camId]) {
      if (!recorderReady) { Alert.alert('⏳ Stream not ready', 'The stream recorder is still initializing. Please wait a moment and try again.'); return; }
      const wv = webViewRef.current;
      if (!wv) { Alert.alert('⚠️ Error', 'WebView not available. Try switching cameras and back.'); return; }
      setRecordings(prev => ({ ...prev, [camId]: { start: new Date(), sessionId: String(Date.now()) } }));
      wv.injectJavaScript(START_RECORDING_JS);
      return;
    }
    const wv = webViewRef.current;
    if (!wv) {
      setRecordings(prev => { const n = { ...prev }; delete n[camId]; return n; });
      setSavingIds(prev => { const s = new Set(prev); s.delete(camId); return s; });
      Alert.alert('⚠️ Recording lost', 'WebView was unavailable. The recording could not be saved.');
      return;
    }
    setSavingIds(prev => new Set(prev).add(camId));
    savingTimeoutRef.current[camId] = setTimeout(() => {
      setRecordings(prev => { const n = { ...prev }; delete n[camId]; return n; });
      setSavingIds(prev => { const s = new Set(prev); s.delete(camId); return s; });
      Alert.alert('⚠️ Recording timeout', 'The recording data took too long to process. Please try again.');
    }, 30000);
    wv.injectJavaScript(STOP_RECORDING_JS);
  };
 
  const filteredCameras = selectedLocation === 'All' ? cameras : cameras.filter(c => c.location === selectedLocation);
 
  // ── Loading / Empty states ─────────────────────────────────────────────────
  if (loadingCams) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading cameras...</Text>
    </View>
  );
 
  if (!activeCamera) return (
    <View style={styles.loadingContainer}>
      <Ionicons name="videocam-off-outline" size={48} color="#AEAEB2" />
      <Text style={styles.emptyText}>No cameras found</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchCameras}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
 
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SnapshotFlash visible={snapshotFlash} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {webRTCError && (
          <View style={styles.go2rtcWarning}>
            <Ionicons name="warning-outline" size={14} color="#FF9500" />
            <Text style={styles.go2rtcWarningText} numberOfLines={2}>{webRTCError}</Text>
          </View>
        )}
 
        {/* ── Stream Card ─────────────────────────────────────────────────── */}
        <View style={styles.streamCard}>
          <View style={styles.streamPlaceholder}>
            <StreamHUD
              camera={activeCamera}
              detections={detections}
              isRecording={isRecording}
              recordingStart={recordingStart}
              onExpand={() => setActiveSheet('fullscreen')}
              webRTCReady={webRTCReady}
              muted={isMutedInline}
              hudRef={hudViewRef}
              webViewRef={webViewRef}
              onRecordingData={handleRecordingData}
              onRecorderReady={handleRecorderReady}
            />
          </View>
          <View style={styles.streamFooter}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {activeCamera.location ? <Text style={styles.camSub}>{activeCamera.location}</Text> : null}
              {recorderReady && (
                <Text style={{ fontSize: 9, color: 'rgba(52,199,89,0.6)', fontFamily: 'monospace' }}>● recorder ready</Text>
              )}
            </View>
            <View style={styles.streamActions}>
              <TouchableOpacity
                style={[styles.actionBtn, !isMutedInline && styles.actionBtnActive]}
                onPress={() => setIsMutedInline(v => !v)}
                activeOpacity={0.7}
              >
                <Ionicons name={isMutedInline ? 'volume-mute-outline' : 'volume-high'} size={18} color={isMutedInline ? 'rgba(255,255,255,0.4)' : '#34C759'} />
              </TouchableOpacity>
              
            </View>
          </View>
          <View style={styles.videoToolsRow}>
            <TouchableOpacity style={[styles.videoToolBtn, isRecording && styles.videoToolBtnRec]} onPress={handleRecordToggle} disabled={isSaving} activeOpacity={0.7}>
              {isSaving
                ? <ActivityIndicator size="small" color="#FF3B30" />
                : <MaterialCommunityIcons name={isRecording ? 'stop-circle' : 'record-circle-outline'} size={18} color={isRecording ? '#FF3B30' : 'rgba(255,255,255,0.7)'} />
              }
              <Text style={[styles.videoToolLabel, isRecording && { color: '#FF3B30' }]}>{isSaving ? 'Saving…' : isRecording ? 'Stop' : 'Record'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.videoToolBtn, isSnapshoting && { opacity: 0.5 }]} onPress={handleSnapshot} disabled={isSnapshoting} activeOpacity={0.7}>
              {isSnapshoting
                ? <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                : <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.7)" />
              }
              <Text style={styles.videoToolLabel}>{isSnapshoting ? 'Saving…' : 'Snapshot'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoToolBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.videoToolLabel}>Share</Text>
            </TouchableOpacity>
          </View>
          
        </View>
 
        {/* ── Cameras Section ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cameras</Text>
          {Object.keys(recordings).length > 0 && (
            <View style={styles.recCountBadge}>
              <View style={styles.recCountDot} />
              <Text style={styles.recCountText}>{Object.keys(recordings).length} recording{Object.keys(recordings).length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        {filteredCameras.length === 0 ? (
          <View style={styles.noCamsBox}>
            <Text style={styles.noCamsText}>No cameras in "{selectedLocation}"</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.camScroll} contentContainerStyle={{ paddingRight: 16 }}>
            {filteredCameras.map(cam => (
              <TouchableOpacity key={cam.id} style={[styles.camThumb, activeCamera.id === cam.id && styles.camThumbActive]} onPress={() => setActiveCamera(cam)} activeOpacity={0.8}>
                <View style={styles.camThumbImg}>
                  <Ionicons name="videocam-outline" size={20} color="rgba(255,255,255,0.18)" />
                  {!!recordings[cam.id] && <View style={styles.camRecBadge} />}
                </View>
                <View style={styles.camThumbFooter}>
                  <Text style={styles.camThumbName} numberOfLines={1}>{cam.name}</Text>
                  <View style={[styles.statusDotSm, { backgroundColor: cam.status === 'IDLE' ? '#FF9500' : '#34C759' }]} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
 
        {/* ── Sensors Section ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sensors</Text>
          <Text style={styles.sectionHint}>Tap for details</Text>
        </View>
        {loadingSensors ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={{ marginTop: 8, fontSize: 12, color: '#AEAEB2' }}>Loading sensors…</Text>
          </View>
        ) : sensors.length === 0 ? (
          <View style={styles.noCamsBox}>
            <MaterialCommunityIcons name="chip" size={32} color="#AEAEB2" />
            <Text style={[styles.noCamsText, { marginTop: 8 }]}>No sensors found</Text>
            <TouchableOpacity style={[styles.retryBtn, { marginTop: 10 }]} onPress={fetchSensorReadings}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sensorsGrid}>
            {sensors.map((s: Sensor, index: number) => {
              const pct = Math.min(100, (s.value / s.max) * 100);
              return (
                <TouchableOpacity key={s.apiId ?? `${s.key}_${index}`} style={styles.sensorCard} onPress={() => handleSensorPress(s)} activeOpacity={0.75}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={[styles.sensorIconBg, { backgroundColor: s.bg, marginBottom: 0 }]}>
                      <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                    </View>
                    {s.isActive !== undefined && (
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.isActive ? '#34C759' : '#AEAEB2' }} />
                    )}
                  </View>
                  <Text style={styles.sensorLabel}>{s.label}</Text>
                  <Text style={styles.sensorValue}>{s.value}<Text style={styles.sensorUnit}> {s.unit}</Text></Text>
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
        )}
      </ScrollView>
 
      
      {/* ── Sheets & Modals ────────────────────────────────────────────────── */}
      {activeSheet === 'options' && (
        <CameraOptionsSheet
          camera={activeCamera}
          onClose={() => setActiveSheet(null)}
          onRecordToggle={handleRecordToggle}
          isRecording={isRecording}
          recordingStart={recordingStart}
          isSaving={isSaving}
        />
      )}
      {activeSheet === 'fullscreen' && (
        <FullscreenView
          camera={activeCamera}
          isRecording={isRecording}
          recordingStart={recordingStart}
          onClose={() => setActiveSheet(null)}
          onRecordToggle={handleRecordToggle}
          isSaving={isSaving}
          onSnapshot={handleSnapshot}
        />
      )}
      {activeSensor && (
        <SensorDetail sensor={activeSensor} onClose={() => setActiveSensor(null)} />
      )}
    </View>
  );
}