import { useState, useEffect } from 'react';
import { GO2RTC_HOST, GO2RTC_PORT, fetchWithTimeout } from '../../constants/live/api';
import { buildStreamName } from '../../constants/live/config';
import type { Camera } from '../../constants/live/types';

// ─── Check go2rtc stream ──────────────────────────────────────────────────────
export const checkGo2RTCStream = async (streamName: string): Promise<boolean> => {
  try {
    const res  = await fetchWithTimeout(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/api/streams`, {}, 3000);
    const data = await res.json();
    return streamName in data;
  } catch { return false; }
};

// ─── useWebRTCUrl ─────────────────────────────────────────────────────────────
export const useWebRTCUrl = (camera: Camera | null) => {
  const [webRTCUrl,     setWebRTCUrl]     = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [streamExists,  setStreamExists]  = useState<boolean | null>(null);

  useEffect(() => {
    if (!camera) { setWebRTCUrl(null); return; }
    let cancelled = false;

    const init = async () => {
      setLoading(true); setError(null);
      try {
        const streamName = buildStreamName(camera);
        const exists     = await checkGo2RTCStream(streamName);
        if (!cancelled) setStreamExists(exists);

        if (exists) {
          if (!cancelled) setWebRTCUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${streamName}`);
        } else {
          const altName   = `camera_${camera.id}`;
          const altExists = await checkGo2RTCStream(altName);
          if (!cancelled) {
            if (altExists) {
              setWebRTCUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${altName}`);
            } else {
              try {
                const res     = await fetchWithTimeout(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/api/streams`, {}, 3000);
                const streams = await res.json();
                const keys    = Object.keys(streams);
                if (keys.length > 0) {
                  setWebRTCUrl(`http://${GO2RTC_HOST}:${GO2RTC_PORT}/webrtc.html?src=${keys[0]}`);
                } else {
                  setError('No streams found in go2rtc. Check your config.yaml');
                  setWebRTCUrl(null);
                }
              } catch { setWebRTCUrl(null); }
            }
          }
        }
      } catch {
        if (!cancelled) setWebRTCUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [camera?.id, camera?.name]);

  return { webRTCUrl, loading, error, streamExists };
};