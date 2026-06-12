import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';

type SnapshotFlashProps = {
  visible: boolean;
};

const SnapshotFlash = ({ visible }: SnapshotFlashProps) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 80,  useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity, zIndex: 999 }]}
    />
  );
};

export default SnapshotFlash;