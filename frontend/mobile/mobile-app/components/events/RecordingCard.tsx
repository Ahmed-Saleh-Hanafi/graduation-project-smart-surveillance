import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

import { RecordingEvent } from '../../constants/events/types';
import { S } from '../../styles/events/eventsStyles';
import { fmtTime, fmtAgo, fmtDur } from '../../hooks/events/useRecordingData';

interface RecordingCardProps {
  event: RecordingEvent;
  onPress: () => void;
}

// دالة التحميل المباشر بنفس منطق الـ DownloadBtn الخاص بكِ تماماً
const downloadToGallery = async (
  url: string,
  filename: string,
  onProgress: (p: number) => void,
): Promise<'saved' | 'error'> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow media library access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return 'error';
    }

    const token    = await AsyncStorage.getItem('userToken');
    const headers  = token ? { Authorization: `Bearer ${token}` } : {};
    const localUri = `${FileSystem.cacheDirectory}${filename}`;

    const dl = FileSystem.createDownloadResumable(
      url,
      localUri,
      { headers },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0)
          onProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
      },
    );

    const result = await dl.downloadAsync();
    if (!result || result.status !== 200) return 'error';

    await MediaLibrary.saveToLibraryAsync(result.uri);

    try {
      const asset  = await MediaLibrary.createAssetAsync(result.uri);
      const albums = await MediaLibrary.getAlbumsAsync();
      const existing = albums.find(a => a.title === 'Camera Recordings');
      if (existing) await MediaLibrary.addAssetsToAlbumAsync([asset], existing, false);
      else          await MediaLibrary.createAlbumAsync('Camera Recordings', asset, false);
    } catch { /* saved to main library fallback */ }

    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    return 'saved';
  } catch (error) {
    console.error('Download error:', error);
    return 'error';
  }
};

export const RecordingCard = ({ event, onPress }: RecordingCardProps) => {
  const [pct, setPct]   = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const handleDownload = async (e: any) => {
    e.stopPropagation(); // منع فتح الفيديو عند بدء التحميل

    if (!event.videoUrl) {
      Alert.alert('Not available', 'No video URL attached.');
      return;
    }

    setPct(0);
    setDone(false);

    const fileExtension = event.videoUrl.split('.').pop()?.split('?')[0] || 'mp4';
    const filename = `rec_${event.id}.${fileExtension}`;

    const result = await downloadToGallery(event.videoUrl, filename, setPct);
    setPct(null);

    if (result === 'saved') {
      setDone(true);
      Alert.alert('✅ Saved', 'Video saved to gallery successfully.');
    } else {
      Alert.alert('Error', 'Download failed.');
    }
  };

  const busy = pct !== null;

  return (
    <TouchableOpacity style={S.card} activeOpacity={0.75} onPress={onPress}>
      <View style={S.cardThumb}>
        <MaterialCommunityIcons name="record-circle-outline" size={22} color="#FF3B30" />
      </View>
      
      <View style={S.cardBody}>
        <View style={S.cardTop}>
          <Text style={S.cardTitle} numberOfLines={1}>Recording</Text>
          <View style={S.cardPill}><Text style={S.cardPillTxt}>VIDEO</Text></View>
        </View>
        <View style={S.cardMeta}>
          <Ionicons name="time-outline" size={11} color="#AEAEB2" />
          <Text style={S.cardMetaTxt}>{fmtTime(event.timestamp)}</Text>
          <Text style={S.dot}>·</Text>
          <Text style={S.cardMetaTxt}>{fmtAgo(event.timestamp)}</Text>
          <Text style={S.dot}>·</Text>
          <Ionicons name="hourglass-outline" size={11} color="#AEAEB2" />
          <Text style={S.cardMetaTxt}>{fmtDur(event.duration)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {/* زر التنزيل الدائري المتفاعل مع الخلفية وخط الـ Progress */}
        <TouchableOpacity 
          style={[
            S.playBtn, 
            { backgroundColor: done ? '#E1F5FE' : '#F2F2F7', overflow: 'hidden', position: 'relative' },
            !event.videoUrl && { opacity: 0.5 }
          ]} 
          onPress={handleDownload}
          disabled={busy || !event.videoUrl}
        >
          {busy && (
            <View 
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                top: 0,
                backgroundColor: 'rgba(255, 59, 48, 0.15)',
                width: `${pct ?? 0}%`
              }} 
            />
          )}

          {busy ? (
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF3B30' }}>{pct}%</Text>
          ) : (
            <Ionicons 
              name={done ? 'checkmark-circle' : 'download'} 
              size={16} 
              color={done ? '#2E7D32' : '#1C1C1E'} 
            />
          )}
        </TouchableOpacity>

        {/* زر التشغيل الرئيسي */}
        <View style={S.playBtn}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};