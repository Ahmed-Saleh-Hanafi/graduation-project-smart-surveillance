// ─── components/alerts/LiveBadge.tsx ─────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { liveBadgeStyles as S } from '../../styles/alerts/styles';

interface Props {
  connected: boolean;
}

export const LiveBadge = ({ connected }: Props) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!connected) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [connected]);

  return (
    <View style={S.wrap}>
      <Animated.View style={[S.dot, { opacity: pulse, backgroundColor: connected ? '#34C759' : '#FF3B30' }]} />
      <Text style={[S.txt, { color: connected ? '#34C759' : '#FF3B30' }]}>
        {connected ? 'Live' : 'Offline'}
      </Text>
    </View>
  );
};