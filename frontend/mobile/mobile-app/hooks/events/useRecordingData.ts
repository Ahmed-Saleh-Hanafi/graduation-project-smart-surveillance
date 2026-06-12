import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api, authHeader, buildAbsoluteUrl } from '../../constants/events/api';
import { Camera, ApiResponse, EventRecordingDto, RecordingEvent } from '../../constants/events/types';

// ─── Updated English Formatting Helpers ───────────────────────────────────────

// 1. Format video duration (e.g., 1m 24s or 45s)
export const fmtDur = (s: number) => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;

// 2. Format relative time and fallback to full Date & Time after 24 hours
export const fmtAgo = (d: Date) => {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  
  // When older than 24 hours: returns full date and time (e.g., 5/22/2026 at 08:30 PM)
  const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  return `${dateStr} at ${timeStr}`;
};

// 3. Format direct time (e.g., 08:30 PM)
export const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// 4. Full detailed Date & Time helper for the video player Modal header
export const fmtFullDateTime = (d: Date) => {
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// ─── Main Custom Hook ────────────────────────────────────────────────────────

export function useRecordingData() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loadingCams, setLoadingCams] = useState(true);
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);
  const [recordings, setRecordings] = useState<RecordingEvent[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCamerasAPI = async (): Promise<Camera[]> => {
    const h = await authHeader();
    const r = await api.get<ApiResponse<Camera[]>>('/api/Camera', { headers: h });
    return r.data?.data ?? [];
  };

  const fetchRecordingsByCameraAPI = async (cameraId: number): Promise<RecordingEvent[]> => {
    const h = await authHeader();
    const r = await api.get<ApiResponse<EventRecordingDto[]>>(
      `/api/EventRecording/GetByCamera/${cameraId}`, { headers: h }
    );
    if (!r.data.isSuccess) throw new Error(r.data.message ?? 'Failed');
    return (r.data.data ?? [])
      .filter(d => !!d.recordingStart)
      .map(d => {
        const start = new Date(d.recordingStart);
        const end   = d.recordingEnd ? new Date(d.recordingEnd) : new Date();
        return {
          id: String(d.id), type: 'recording' as const,
          cameraId: String(d.cameraId),
          cameraName: d.cameraName ?? d.name ?? 'Camera',
          timestamp: start,
          duration: Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000)),
          videoUrl: buildAbsoluteUrl(d.url ?? d.videoUrl ?? d.filePath),
        };
      });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchCamerasAPI();
        if (!alive) return;
        setCameras(data);
        if (data.length) setSelectedCam(data[0]);
      } catch (err) { 
        console.error('[Events API ❌]', err);
        if (alive) setError('Failed to load cameras'); 
      } finally { 
        if (alive) setLoadingCams(false); 
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadRecordings = useCallback(async (cam: Camera, silent = false) => {
    if (!silent) setLoadingRec(true);
    setError(null);
    try {
      const data = await fetchRecordingsByCameraAPI(cam.id);
      data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecordings(data);
    } catch {
      setError('Failed to load recordings');
      setRecordings([]);
    } finally {
      setLoadingRec(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (selectedCam) loadRecordings(selectedCam); }, [selectedCam, loadRecordings]);
  useFocusEffect(useCallback(() => { if (selectedCam) loadRecordings(selectedCam, true); }, [selectedCam, loadRecordings]));

  return {
    cameras,
    loadingCams,
    selectedCam,
    setSelectedCam,
    recordings,
    loadingRec,
    refreshing,
    setRefreshing,
    error,
    loadRecordings
  };
}