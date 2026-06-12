import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, Animated, Modal,
  StatusBar, ActivityIndicator, useWindowDimensions, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

import { STREAM_W, STREAM_H } from '../../constants/live/config';
import type { Camera } from '../../constants/live/types';
import { fsStyles } from '../../styles/live/styles';

import WebRTCStream from './WebRTCStream';
import LiveClock from './LiveClock';
import RecordingTimer from './RecordingTimer';

type FullscreenViewProps = {
  camera: Camera;
  isRecording: boolean;
  recordingStart: Date | null;
  onClose: () => void;
  onRecordToggle: () => void;
  isSaving: boolean;
  onSnapshot: () => void;
};

const FullscreenView = ({
  camera, isRecording, recordingStart,
  onClose, onRecordToggle, isSaving, onSnapshot,
}: FullscreenViewProps) => {
  const fadeAnim                      = useRef(new Animated.Value(0)).current;
  const [ctrlVisible, setCtrlVisible] = useState(true);
  const [isMuted, setIsMuted]         = useState(true);
  const blinkAnim                     = useRef(new Animated.Value(1)).current;
  const timer                         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { width: windowW, height: windowH } = useWindowDimensions();
  const isLandscape = windowW > windowH;
  const videoWidth  = windowW;
  const videoHeight = isLandscape ? windowH : (windowW * 9) / 16;
  const scaleX      = videoWidth  / STREAM_W;
  const scaleY      = videoHeight / STREAM_H;

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); };
  }, []);

  const scheduleHide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCtrlVisible(false), 4000);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    scheduleHide();
    const blink = Animated.loop(Animated.sequence([
      Animated.timing(blinkAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    blink.start();
    return () => { if (timer.current) clearTimeout(timer.current); blink.stop(); };
  }, []);

  const dismiss = () =>
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <StatusBar hidden={isLandscape} barStyle="light-content" backgroundColor="#000" />
      <Animated.View style={[fsStyles.container, { opacity: fadeAnim }]}>

        {/* Top bar */}
        {(!isLandscape || ctrlVisible) && (
          <View style={[fsStyles.topBar, isLandscape
            ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: 16 }
            : { paddingTop: 52 }
          ]}>
            <TouchableOpacity style={fsStyles.iconBtn} onPress={dismiss}>
              <Ionicons name="contract-outline" size={20} color="white" />
            </TouchableOpacity>
            <View style={fsStyles.topCenter}>
              <Text style={fsStyles.fullscreenCameraName}>{camera.name}</Text>
              {camera.location ? <Text style={fsStyles.locationLabel}>{camera.location}</Text> : null}
            </View>
            <View style={fsStyles.topRight}><LiveClock /></View>
          </View>
        )}

        {/* Video + zone overlays */}
        <Pressable
          style={isLandscape
            ? StyleSheet.absoluteFillObject
            : { width: videoWidth, height: videoHeight, alignSelf: 'center' }
          }
          onPress={() => { setCtrlVisible(v => !v); scheduleHide(); }}
        >
          <WebRTCStream ref={null} camera={camera} muted={isMuted} style={StyleSheet.absoluteFillObject} />
          <View style={fsStyles.vignette} pointerEvents="none" />
         
        </Pressable>

        {/* Bottom controls */}
        {ctrlVisible && (
          <View style={[fsStyles.bottomBar, isLandscape && { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 }]}>
            <View style={fsStyles.toolRow}>
              <TouchableOpacity style={[fsStyles.toolBtn, !isMuted && fsStyles.toolBtnGreen]} onPress={() => setIsMuted(v => !v)} activeOpacity={0.7}>
                <Ionicons name={isMuted ? 'volume-mute-outline' : 'volume-high'} size={18} color={isMuted ? 'rgba(255,255,255,0.4)' : '#34C759'} />
                <Text style={[fsStyles.toolLabel, !isMuted && { color: '#34C759' }]}>{isMuted ? 'Muted' : 'Audio On'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[fsStyles.toolBtn, isRecording && fsStyles.toolBtnRec]} onPress={onRecordToggle} disabled={isSaving} activeOpacity={0.7}>
                {isSaving
                  ? <ActivityIndicator size="small" color="#FF3B30" />
                  : <MaterialCommunityIcons name={isRecording ? 'stop-circle' : 'record-circle-outline'} size={18} color={isRecording ? '#FF3B30' : 'white'} />
                }
                <Text style={[fsStyles.toolLabel, isRecording && { color: '#FF3B30' }]}>
                  {isSaving ? 'Saving…' : isRecording ? 'Stop' : 'Record'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={fsStyles.toolBtn} onPress={onSnapshot} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={18} color="white" />
                <Text style={fsStyles.toolLabel}>Snapshot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fsStyles.toolBtn} onPress={dismiss} activeOpacity={0.7}>
                <Ionicons name="contract-outline" size={14} color="white" />
                <Text style={fsStyles.toolLabel}>Exit</Text>
              </TouchableOpacity>
            </View>
            {isRecording && recordingStart && (
              <View style={fsStyles.recBar}>
                <View style={fsStyles.recBarDot} />
                <Text style={fsStyles.recBarText}>Recording — </Text>
                <RecordingTimer startTime={recordingStart} />
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

export default FullscreenView;