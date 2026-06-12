// ─── components/alerts/DetectionCard.tsx ─────────────────────────────────────

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SEV } from '../../constants/alerts/alerts';
import { DetectionItem } from '../../constants/alerts/types';
import { SeverityPill } from './SeverityPill';
import { detectionCardStyles as S } from '../../styles/alerts/styles';

interface Props {
  item:    DetectionItem;
  onPress: (item: DetectionItem) => void;
}

export const DetectionCard = ({ item, onPress }: Props) => {
  const { color } = SEV[item.severity] ?? SEV.default;

  return (
    <View style={[S.wrap, item.resolved && S.resolved]}>
      <TouchableOpacity activeOpacity={0.74} onPress={() => onPress(item)}>
        <View style={S.inner}>

          <View style={[S.strip, { backgroundColor: color }]} />

          <View style={[S.imgBox, { backgroundColor: color + '10' }]}>
            {item.snapshotUrl ? (
              <Image source={{ uri: item.snapshotUrl }} style={S.img} resizeMode="cover" />
            ) : (
              <Ionicons name={SEV[item.severity]?.icon ?? 'camera'} size={24} color={color} />
            )}
          </View>

          <View style={S.content}>
            <View style={S.row}>
              <Text style={S.name} numberOfLines={1}>{item.name}</Text>
              <SeverityPill severity={item.severity} />
            </View>
            {!!item.description && (
              <Text style={S.desc} numberOfLines={1}>{item.description}</Text>
            )}
            <View style={S.meta}>
              <Ionicons name="videocam-outline" size={11} color="#AEAEB2" />
              <Text style={S.metaTxt}>{item.cameraName}</Text>
              <View style={S.sep} />
              <Ionicons name="calendar-outline" size={11} color="#AEAEB2" />
              <Text style={S.metaTxt}>{item.date}</Text>
              <View style={S.sep} />
              <Ionicons name="time-outline" size={11} color="#AEAEB2" />
              <Text style={S.metaTxt}>{item.time}</Text>
            </View>
          </View>

          <View style={S.right}>
            {item.resolved
              ? <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              : <Ionicons name="chevron-forward"  size={18} color="#C7C7CC" />
            }
          </View>

        </View>
      </TouchableOpacity>
    </View>
  );
};