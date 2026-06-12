import { Dimensions } from 'react-native';

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
export const STREAM_H = 220;
export const STREAM_W = width - 32;
export const H        = 20;
export const MIN_SZ   = 50;

// ─── Pure Utilities ───────────────────────────────────────────────────────────
export const makeZoneId = () => `z_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const buildStreamName = (camera: { name: string }): string =>
  camera.name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');

// ─── WebView JS Strings ───────────────────────────────────────────────────────
export const WEBVIEW_RECORDING_INIT_JS = `
(function() {
  if (window.__recorderReady) return;
  window.__recorderReady = true;
  window.__recChunks = [];
  window.__mediaRecorder = null;

  window.__startRecording = function() {
    try {
      var video = document.querySelector('video');
      if (!video) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: 'No video element found' })); return; }
      video.muted = false; video.volume = 1;
      var videoStream = null;
      if (video.srcObject && video.srcObject.getTracks) videoStream = video.srcObject;
      if (!videoStream && video.captureStream) videoStream = video.captureStream();
      else if (!videoStream && video.mozCaptureStream) videoStream = video.mozCaptureStream();
      if (!videoStream) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: 'No media stream available' })); return; }
      var audioTracks = videoStream.getAudioTracks();
      var videoTracks = videoStream.getVideoTracks();
      var finalStream = videoStream;
      if (audioTracks.length === 0) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(function(micStream) { window.__startMediaRecorder(new MediaStream([...videoTracks, ...micStream.getAudioTracks()])); })
          .catch(function() { window.__startMediaRecorder(finalStream); });
      } else {
        audioTracks.forEach(function(t) { t.enabled = true; });
        window.__startMediaRecorder(finalStream);
      }
    } catch(err) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: err.message })); }
  };

  window.__startMediaRecorder = function(stream) {
    try {
      var mimeType = '';
      var candidates = ['video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
      for (var i = 0; i < candidates.length; i++) { if (MediaRecorder.isTypeSupported(candidates[i])) { mimeType = candidates[i]; break; } }
      window.__recChunks = [];
      var opts = mimeType ? { mimeType: mimeType, videoBitsPerSecond: 1200000, audioBitsPerSecond: 64000 } : { videoBitsPerSecond: 1200000, audioBitsPerSecond: 64000 };
      window.__mediaRecorder = new MediaRecorder(stream, opts);
      window.__mediaRecorder.ondataavailable = function(e) { if (e.data && e.data.size > 0) window.__recChunks.push(e.data); };
      window.__mediaRecorder.onstop = function() {
        var blob = new Blob(window.__recChunks, { type: mimeType || 'video/webm' });
        var reader = new FileReader();
        reader.onloadend = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_data', mimeType: mimeType || 'video/webm', data: reader.result })); };
        reader.onerror = function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: 'FileReader failed' })); };
        reader.readAsDataURL(blob);
      };
      window.__mediaRecorder.onerror = function(e) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: 'MediaRecorder error: ' + e.error })); };
      window.__mediaRecorder.start(100);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_started', mimeType: mimeType, audioTracks: stream.getAudioTracks().length, videoTracks: stream.getVideoTracks().length }));
    } catch(err) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: err.message })); }
  };

  window.__stopRecording = function() {
    try {
      if (window.__mediaRecorder && window.__mediaRecorder.state !== 'inactive') window.__mediaRecorder.stop();
      else window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: 'No active recording' }));
    } catch(err) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_error', msg: err.message })); }
  };

  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'rec_ready' }));
})(); true;
`;

export const START_RECORDING_JS = `window.__startRecording && window.__startRecording(); true;`;
export const STOP_RECORDING_JS  = `window.__stopRecording  && window.__stopRecording();  true;`;