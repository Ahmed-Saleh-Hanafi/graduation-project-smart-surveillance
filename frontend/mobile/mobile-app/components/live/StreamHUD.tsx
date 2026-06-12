import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { STREAM_W, STREAM_H, H } from '../../constants/live/config';
import type { Camera, Detection } from '../../constants/live/types';
import { streamStyles } from '../../styles/live/styles';

import WebRTCStream from './WebRTCStream';
import LiveClock from './LiveClock';
import RecordingTimer from './RecordingTimer';

type StreamHUDProps = {
  camera: Camera;
  detections: Detection[];
  isRecording: boolean;
  recordingStart: Date | null;
  onExpand: () => void;
  webRTCReady: boolean;
  muted: boolean;
  hudRef?: React.RefObject<View>;
  webViewRef?: React.RefObject<any>;
  onRecordingData?: (base64: string, mimeType: string) => void;
  onRecorderReady?: () => void;
};

const StreamHUD = ({
  camera, detections,
  isRecording, recordingStart,
  onExpand, webRTCReady, muted,
  hudRef, webViewRef,
  onRecordingData, onRecorderReady,
}: StreamHUDProps) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blinkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    if (isRecording) loop.start();
    else { loop.stop(); blinkAnim.setValue(1); }
    return () => loop.stop();
  }, [isRecording]);

  return (
    <View ref={hudRef} style={streamStyles.hudRoot} collapsable={false}>
      <WebRTCStream
        ref={webViewRef}
        camera={camera}
        muted={muted}
        style={StyleSheet.absoluteFillObject}
        onRecordingData={onRecordingData}
        onRecorderReady={onRecorderReady}
      />

      <View style={streamStyles.vignette} pointerEvents="none" />

      {/* Top Left */}
      <View style={streamStyles.topLeft} pointerEvents="none">
        <Text style={streamStyles.cameraNameText} numberOfLines={1}>{camera.name}</Text>
        {isRecording && recordingStart && (
          <Animated.View style={{ opacity: blinkAnim }}>
            <RecordingTimer startTime={recordingStart} />
          </Animated.View>
        )}
      </View>

      {/* Top Right */}
      <View style={streamStyles.topRight} pointerEvents="none">
        <LiveClock />
      </View>

      {/* Bottom Left */}
      <View style={streamStyles.bottomLeft} pointerEvents="none">
        {camera.location ? <Text style={streamStyles.locationText}>{camera.location}</Text> : null}
      </View>

      {/* Bottom Right */}
      <View style={streamStyles.bottomRight} pointerEvents="none">
        {detections.length > 0 && (
          <View style={[streamStyles.detCountBadge, { borderColor: detections.some(d => d.isBlocked) ? '#FF3B30' : '#34C759' }]}>
            <Ionicons name="person-outline" size={10} color={detections.some(d => d.isBlocked) ? '#FF3B30' : '#34C759'} />
            <Text style={[streamStyles.detCountText, { color: detections.some(d => d.isBlocked) ? '#FF3B30' : '#34C759' }]}>
              {detections.length} detected
            </Text>
          </View>
        )}
        
        <View style={streamStyles.webrtcBadge}>
          <View style={[streamStyles.webrtcDot, { backgroundColor: webRTCReady ? '#007AFF' : '#11ff00' }]} />
          <Text style={[streamStyles.webrtcBadgeText, { color: webRTCReady ? '#60AAFF' : '#00ff1e' }]}>
            {webRTCReady ? 'WebRTC' : 'Connecting'}
          </Text>
        </View>
      </View>

      {/* Detection boxes */}
      

      {/* Zone overlays */}
      

    </View>
  );
};

export default StreamHUD;