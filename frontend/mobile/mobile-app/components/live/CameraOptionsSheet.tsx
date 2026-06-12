import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated, Easing, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import type { Camera } from '../../constants/live/types';
import { styles } from '../../styles/live/styles';
import RecordingTimer from './RecordingTimer';

type CameraOptionsSheetProps = {
  camera: Camera;
  onClose: () => void;
  onRecordToggle: () => void;
  isRecording: boolean;
  recordingStart: Date | null;
  isSaving: boolean;
};

const CameraOptionsSheet = ({
  camera, onClose, onRecordToggle, isRecording, recordingStart, isSaving,
}: CameraOptionsSheetProps) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () =>
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle2}>{camera.name}</Text>
        <Text style={styles.sheetSub2}>Choose an action</Text>
        <View style={styles.optionsCard}>
          <TouchableOpacity
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={() => { onRecordToggle(); dismiss(); }}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconBg, { backgroundColor: '#FF3B3018' }]}>
              {isSaving
                ? <ActivityIndicator size="small" color="#FF3B30" />
                : <MaterialCommunityIcons name={isRecording ? 'stop-circle-outline' : 'record-circle-outline'} size={18} color="#FF3B30" />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{isSaving ? 'Saving…' : isRecording ? 'Stop recording' : 'Start recording'}</Text>
              <Text style={styles.optionSub}>{isRecording ? 'Save clip to server events' : 'Save clip to server storage'}</Text>
            </View>
            {isRecording && recordingStart && !isSaving
              ? <RecordingTimer startTime={recordingStart} />
              : <Ionicons name="chevron-forward" size={14} color="#AEAEB2" />
            }
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </Animated.View>
    </Animated.View>
  );
};

export default CameraOptionsSheet;