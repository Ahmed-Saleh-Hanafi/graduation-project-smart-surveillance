import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// الاستيرادات من المجلدات الجديدة
import { useRecordingData } from '../../hooks/events/useRecordingData';
import { CameraChip } from '../../components/events/CameraChip';
import { RecordingCard } from '../../components/events/RecordingCard';
import { VideoPlayerModal } from '../../components/events/VideoPlayerModal';
import { RecordingEvent } from '../../constants/events/types';
import { S } from '../../styles/events/eventsStyles';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState<RecordingEvent | null>(null);

  // استخدام الـ custom hook للحصول على البيانات والـ states
  const {
    cameras,
    loadingCams,
    selectedCam,
    setSelectedCam,
    recordings,
    loadingRec,
    refreshing,
    setRefreshing,
    error,
    loadRecordings
  } = useRecordingData();

  if (loadingCams) return (
    <View style={S.centered}>
      <ActivityIndicator size="large" color="#FF3B30" />
      <Text style={S.loadTxt}>Loading cameras…</Text>
    </View>
  );

  if (!cameras.length) return (
    <View style={S.centered}>
      <Ionicons name="videocam-off-outline" size={48} color="#AEAEB2" />
      <Text style={S.emptyTitle}>No cameras found</Text>
    </View>
  );

  return (
    <View style={S.container}>
      <View style={S.selector}>
        <Text style={S.selectorLbl}>Events</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.selectorRow}>
          {cameras.map(c => (
            <CameraChip
              key={c.id}
              camera={c}
              active={selectedCam?.id === c.id}
              count={selectedCam?.id === c.id ? recordings.length : 0}
              onPress={() => setSelectedCam(c)}
            />
          ))}
        </ScrollView>
      </View>

      {loadingRec ? (
        <View style={S.centered}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={S.loadTxt}>Loading recordings…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[S.list, { paddingBottom: insets.bottom + 32 }, recordings.length === 0 && S.listEmpty]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { if (selectedCam) { setRefreshing(true); loadRecordings(selectedCam, true); } }} 
              tintColor="#FF3B30" 
            />
          }
        >
          {error && (
            <View style={S.errBanner}>
              <Ionicons name="warning-outline" size={16} color="#FF3B30" />
              <Text style={S.errTxt}>{error}</Text>
            </View>
          )}
          {!recordings.length && !error ? (
            <View style={S.emptyState}>
              <View style={S.emptyIcon}><Ionicons name="film-outline" size={40} color="#AEAEB2" /></View>
              <Text style={S.emptyTitle}>No recordings yet</Text>
              <Text style={S.emptySub}>Start recording from the Live screen.</Text>
            </View>
          ) : (
            recordings.map(ev => (
              <RecordingCard key={ev.id} event={ev} onPress={() => setPlaying(ev)} />
            ))
          )}
        </ScrollView>
      )}

      {playing && <VideoPlayerModal event={playing} onClose={() => setPlaying(null)} />}
    </View>
  );
}