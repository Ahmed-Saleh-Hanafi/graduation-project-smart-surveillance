// ─── components/alerts/DetailModal.tsx ───────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SEV } from '../../constants/alerts/alerts';
import { DetectionItem } from '../../constants/alerts/types';
import { resolveDetection } from '../../hooks/alerts/useAlerts';
import { SeverityPill } from './SeverityPill';
import { DownloadBtn } from './DownloadBtn';
import { detailModalStyles as S } from '../../styles/alerts/styles';

interface Props {
  item:       DetectionItem | null;
  onClose:    () => void;
  onResolved: (id: string) => void;
}

export const DetailModal = ({ item, onClose, onResolved }: Props) => {
  const [resolving, setResolving] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const startY = useRef(0);

  const player = useVideoPlayer(item?.videoUrl ?? '');

  useEffect(() => { setImgError(false); }, [item?.id]);

  if (!item) return null;

  const { color } = SEV[item.severity] ?? SEV.default;

  const dlUrl      = item.videoUrl ?? item.snapshotUrl;
  const dlFilename = item.videoUrl ? `vid_${item.id}.mp4` : `snap_${item.id}.jpg`;
  const dlIcon     = item.videoUrl ? 'videocam-outline' : 'image-outline';
  const dlLabel    = item.videoUrl ? 'Download Video' : 'Download Snapshot';

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveDetection(item.id);
      onResolved(item.id);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not resolve.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}>

        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={S.sheet}>

          <View
            style={S.handleWrap}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={()  => true}
            onResponderGrant={e  => { startY.current = e.nativeEvent.pageY; }}
            onResponderRelease={e => { if (e.nativeEvent.pageY - startY.current > 80) onClose(); }}
          >
            <View style={S.handle} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={S.headerRow}>
              <View style={[S.headerIcon, { backgroundColor: color + '18' }]}>
                <Ionicons name={SEV[item.severity]?.icon ?? 'camera'} size={22} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.title}>{item.name}</Text>
                <Text style={S.sub}>{item.cameraName}</Text>
              </View>
              <SeverityPill severity={item.severity} />
            </View>

            {/* ── Date / Time / Status ─────────────────────────────────────── */}
            <View style={S.dateRow}>
              <View style={S.dateChip}>
                <Ionicons name="calendar-outline" size={13} color="#8E8E93" />
                <Text style={S.dateChipTxt}>{item.date}</Text>
              </View>
              <View style={S.dateChip}>
                <Ionicons name="time-outline" size={13} color="#8E8E93" />
                <Text style={S.dateChipTxt}>{item.time}</Text>
              </View>
              <View style={[
                S.statusChip,
                {
                  backgroundColor: item.resolved ? '#F0FDF4' : '#FFF5F5',
                  borderColor:     item.resolved ? '#BBF7D0' : '#FECACA',
                },
              ]}>
                <Ionicons
                  name={item.resolved ? 'checkmark-circle' : 'ellipse'}
                  size={12}
                  color={item.resolved ? '#34C759' : '#FF3B30'}
                />
                <Text style={[S.dateChipTxt, { color: item.resolved ? '#166534' : '#FF3B30' }]}>
                  {item.resolved ? 'Resolved' : 'Active'}
                </Text>
              </View>
            </View>

            {/* ── Media ────────────────────────────────────────────────────── */}
            {item.videoUrl ? (
              <VideoView
                player={player}
                style={S.media}
                fullscreenOptions={{ isFullscreenEnabled: true }}
                allowsPictureInPicture
              />
            ) : item.snapshotUrl && !imgError ? (
              <Image
                source={{ uri: item.snapshotUrl }}
                style={S.media}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={S.mediaPh}>
                <Ionicons name="image-outline" size={36} color="#AEAEB2" />
                <Text style={S.mediaPhTxt}>
                  {item.snapshotUrl ? 'Image unavailable' : 'No media'}
                </Text>
              </View>
            )}

            {!!item.description && <Text style={S.desc}>{item.description}</Text>}

            {/* ── Details Grid ─────────────────────────────────────────────── */}
            <Text style={S.sec}>DETAILS</Text>
            <View style={S.grid}>
              {([
                ['Camera', item.cameraName],
                ['Type',   SEV[item.severity]?.label ?? 'Detection'],
                ['Date',   item.date],
                ['Time',   item.time],
              ] as [string, string][]).map(([label, value]) => (
                <View key={label} style={S.cell}>
                  <Text style={S.cellL}>{label}</Text>
                  <Text style={S.cellV}>{value}</Text>
                </View>
              ))}
            </View>

            {/* ── Download ─────────────────────────────────────────────────── */}
            <Text style={S.sec}>EVIDENCE</Text>
            <View style={S.dlRow}>
              <DownloadBtn url={dlUrl} filename={dlFilename} icon={dlIcon} label={dlLabel} />
            </View>

            {/* ── Resolve ──────────────────────────────────────────────────── */}
            {!item.resolved && (
              <>
                <Text style={S.sec}>ACTION</Text>
                <TouchableOpacity
                  style={[S.resolveBtn, resolving && { opacity: 0.7 }]}
                  onPress={handleResolve}
                  disabled={resolving}
                >
                  {resolving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={S.resolveTxt}>Mark as Resolved</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};