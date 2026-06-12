import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera } from '../../constants/events/types';
import { S } from '../../styles/events/eventsStyles';

interface CameraChipProps {
  camera: Camera;
  active: boolean;
  count: number;
  onPress: () => void;
}

export const CameraChip = ({ camera, active, count, onPress }: CameraChipProps) => (
  <TouchableOpacity style={[S.chip, active && S.chipOn]} onPress={onPress} activeOpacity={0.75}>
    <View style={[S.chipDot, { backgroundColor: active ? '#FF3B30' : '#AEAEB2' }]} />
    <Text style={[S.chipTxt, active && S.chipTxtOn]} numberOfLines={1}>{camera.name}</Text>
    {count > 0 && (
      <View style={[S.chipBadge, active && S.chipBadgeOn]}>
        <Text style={[S.chipBadgeTxt, active && S.chipBadgeTxtOn]}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);