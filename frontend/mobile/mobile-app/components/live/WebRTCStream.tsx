import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import { GO2RTC_HOST, GO2RTC_PORT, fetchWithTimeout } from '../../constants/live/api';
import { WEBVIEW_RECORDING_INIT_JS, buildStreamName } from '../../constants/live/config';
import type { Camera } from '../../constants/live/types';
type WebRTCStreamProps = {
  camera: Camera;
  style?: object;
  muted?: boolean;
  onRecordingData?: (base64: string, mimeType: string) => void;
  onRecorderReady?: () => void;
};

const WebRTCStream = React.forwardRef<any, WebRTCStreamProps>(
  ({ camera, style, muted = true, onRecordingData, onRecorderReady }, ref) => {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [error, setError]         = useState(false);
    const webViewRef = useRef<any>(null);
    const mutedRef   = useRef(muted);
    useEffect(() => { mutedRef.current = muted; }, [muted]);

    useEffect(() => {
      if (!ref) return;
      if (typeof ref === 'function') ref(webViewRef.current);
      else (ref as React.MutableRefObject<any>).current = webViewRef.current;
    });

    useEffect(() => {
      let cancelled = false;
      (async () => {
        const streamName = buildStreamName(camera);
        try {
          const res  = await fetchWithTimeout(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/api/streams`, {}, 3000);
          const data = await res.json();
          if (!cancelled) {
            if (streamName in data) setStreamUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${streamName}`);
            else if (`camera_${camera.id}` in data) setStreamUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=camera_${camera.id}`);
            else setStreamUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${streamName}`);
          }
        } catch {
          if (!cancelled) setStreamUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${streamName}`);
        }
      })();
      return () => { cancelled = true; };
    }, [camera.id, camera.name]);

    useEffect(() => {
      if (!webViewRef.current || !streamUrl) return;
      const muteVal = muted ? 'true' : 'false';
      const volVal  = muted ? '0' : '1';
      webViewRef.current.injectJavaScript(
        '(function(){function applyMute(){var vids=document.querySelectorAll("video");vids.forEach(function(v){v.muted='+muteVal+';v.volume='+volVal+';if(!'+muteVal+'&&v.paused){v.play().catch(function(){});}});return vids.length;}var found=applyMute();if(found===0){var tries=0;var iv=setInterval(function(){tries++;var n=applyMute();if(n>0||tries>20)clearInterval(iv);},300);}})();true;'
      );
    }, [muted, streamUrl]);

    const handleLoad = () => {
      if (!webViewRef.current) return;
      const muteVal = mutedRef.current ? 'true' : 'false';
      const volVal  = mutedRef.current ? '0' : '1';
      webViewRef.current.injectJavaScript(
        '(function(){function applyMute(){document.querySelectorAll("video").forEach(function(v){v.muted='+muteVal+';v.volume='+volVal+';if(!'+muteVal+'&&v.paused){v.play().catch(function(){});}});}applyMute();var tries=0;var iv=setInterval(function(){tries++;applyMute();if(tries>10)clearInterval(iv);},500);})();true;'
      );
      setTimeout(() => { webViewRef.current?.injectJavaScript(WEBVIEW_RECORDING_INIT_JS); }, 2000);
    };

    const handleMessage = (e: any) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if      (msg.type === 'rec_ready')   onRecorderReady?.();
        else if (msg.type === 'rec_started') console.log('[WebRTCStream] Recording started:', msg);
        else if (msg.type === 'rec_data')    onRecordingData?.(msg.data, msg.mimeType);
        else if (msg.type === 'rec_error')   { console.warn('[WebRTCStream] Recorder error:', msg.msg); onRecordingData?.('ERROR:' + msg.msg, ''); }
      } catch (_) {}
    };

    if (!streamUrl) return (
      <View style={[{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 8 }, style]}>
        <ActivityIndicator color="#34C759" size="large" />
        <Text style={{ color: 'rgba(52,199,89,0.5)', fontSize: 10, fontFamily: 'monospace' }}>Connecting…</Text>
      </View>
    );

    if (error) return (
      <View style={[{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', gap: 8 }, style]}>
        <Ionicons name="videocam-off-outline" size={32} color="rgba(255,255,255,0.1)" />
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Stream unavailable</Text>
        <TouchableOpacity onPress={() => { setError(false); setStreamUrl(null); }}
          style={{ marginTop: 4, backgroundColor: 'rgba(52,199,89,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
          <Text style={{ color: '#34C759', fontSize: 11, fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <WebView
        ref={webViewRef}
        source={{ uri: streamUrl }}
        androidLayerType="hardware"
        style={[{ flex: 1, backgroundColor: '#000' }, style]}
        allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled domStorageEnabled originWhitelist={['*']}
        mixedContentMode="always" allowsAirPlayForMediaPlayback
        mediaCapturePermissionGrantType="grant"
        scrollEnabled={false} showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false} overScrollMode="never"
        onLoad={handleLoad} onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={`
          const style = document.createElement('style');
          style.innerHTML = \`* { display: none !important; } body, html, video, #root, #app, .container { display: block !important; opacity: 1 !important; overflow: hidden !important; } video::-webkit-media-controls { display: none !important; } button, .controls, .control-bar { display: none !important; }\`;
          document.head.appendChild(style); true;
        `}
        injectedJavaScript={`
          (function() {
            var targetMuted = ${muted ? 'true' : 'false'};
            var hideAll = function() {
              document.querySelectorAll('video').forEach(function(video) {
                video.controls = false; video.removeAttribute('controls');
                video.muted = targetMuted; video.volume = targetMuted ? 0 : 1;
                if (!targetMuted && video.paused) video.play().catch(function(){});
              });
              document.querySelectorAll('button, .controls, .control-bar, [class*="control"], [class*="button"]').forEach(function(el) {
                el.style.display = 'none'; el.style.opacity = '0'; el.style.visibility = 'hidden';
              });
            };
            hideAll();
            var observer = new MutationObserver(hideAll);
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(function() { observer.disconnect(); }, 5000);
            var count = 0;
            var interval = setInterval(function() { hideAll(); count++; if (count > 60) clearInterval(interval); }, 500);
          })(); true;
        `}
        onError={(e) => { console.warn('WebRTC stream error:', e.nativeEvent.description); setError(true); }}
        onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) setError(true); }}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
            <ActivityIndicator color="#34C759" size="large" />
            <Text style={{ color: 'rgba(52,199,89,0.5)', fontSize: 10, fontFamily: 'monospace' }}>Loading stream…</Text>
          </View>
        )}
        startInLoadingState
      />
    );
  }
);

export default WebRTCStream;