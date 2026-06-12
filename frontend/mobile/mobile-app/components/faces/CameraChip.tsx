import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera } from '../../constants/faces/types';
import { styles } from '../../styles/faces/facesStyles';

interface CameraChipProps {
  camera: Camera;
  active: boolean;
  faceCount: number;
  onPress: () => void;
}

export const CameraChip = ({ camera, active, faceCount, onPress }: CameraChipProps) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.chipDot, { backgroundColor: active ? '#34C759' : '#AEAEB2' }]} />
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {camera.name}
    </Text>
    {faceCount > 0 && (
      <View style={[styles.chipBadge, active && styles.chipActiveBadge]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
          {faceCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);