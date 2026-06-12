import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StatusBar, useWindowDimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecordingEvent } from '../../constants/events/types';
import { P } from '../../styles/events/eventsStyles';

interface VideoPlayerModalProps {
  event: RecordingEvent;
  onClose: () => void;
}

export const VideoPlayerModal = ({ event, onClose }: VideoPlayerModalProps) => {
  const insets = useSafeAreaInsets();
  const { width: windowW, height: windowH } = useWindowDimensions();

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const player = useVideoPlayer(event.videoUrl, p => {
    p.play();
    p.loop = false;
  });

  const isLandscape = windowW > windowH;
  const videoWidth = windowW;
  const videoHeight = isLandscape ? windowH : (windowW * 9) / 16;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar hidden={isLandscape} barStyle="light-content" backgroundColor="#000" />
      
      <View style={P.nativeContainer}>
        {!isLandscape && (
          <View style={[P.nativeHeader, { paddingTop: Math.max(12, insets.top) }]}>
            <View style={{ flex: 1 }}>
              <Text style={P.nativeTitle}>{event.cameraName}</Text>
              <Text style={P.nativeSub}>{event.timestamp.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={P.nativeCloseBtn} onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ width: videoWidth, height: videoHeight, justifyContent: 'center', backgroundColor: '#000' }}>
          <VideoView 
            player={player} 
            style={StyleSheet.absoluteFill} 
            nativeControls={true} 
            allowsPictureInPicture={true}
            contentFit="contain"
          />
        </View>
      </View>
    </Modal>
  );
};