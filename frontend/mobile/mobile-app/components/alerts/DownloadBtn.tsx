// ─── components/alerts/DownloadBtn.tsx ───────────────────────────────────────

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { downloadBtnStyles as S } from '../../styles/alerts/styles';

interface Props {
  url:      string | null;
  filename: string;
  icon:     any;
  label:    string;
}

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
      const existing = albums.find(a => a.title === 'Security Detections');
      if (existing) await MediaLibrary.addAssetsToAlbumAsync([asset], existing, false);
      else          await MediaLibrary.createAlbumAsync('Security Detections', asset, false);
    } catch { /* already saved */ }

    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    return 'saved';
  } catch {
    return 'error';
  }
};

export const DownloadBtn = ({ url, filename, icon, label }: Props) => {
  const [pct,  setPct]  = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const press = async () => {
    if (!url) { Alert.alert('Not available', `No ${label} attached.`); return; }
    setPct(0); setDone(false);
    const result = await downloadToGallery(url, filename, setPct);
    setPct(null);
    if (result === 'saved') {
      setDone(true);
      Alert.alert('✅ Saved', `${label} saved to gallery.`);
    } else {
      Alert.alert('Error', 'Download failed.');
    }
  };

  const busy = pct !== null;

  return (
    <TouchableOpacity
      style={[S.btn, done && S.done, !url && S.dis]}
      onPress={press}
      disabled={busy || !url}
      activeOpacity={0.75}
    >
      {busy && <View style={[S.bar, { width: `${pct ?? 0}%` as any }]} />}
      <Ionicons
        name={done ? 'checkmark-circle' : busy ? 'cloud-download-outline' : icon}
        size={14}
        color={done ? '#166534' : !url ? '#C7C7CC' : '#1D4ED8'}
      />
      <Text style={[S.txt, done && S.doneTxt, !url && S.disTxt]}>
        {busy ? `${pct}%` : done ? 'Saved' : label}
      </Text>
    </TouchableOpacity>
  );
};