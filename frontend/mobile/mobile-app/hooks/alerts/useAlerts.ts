// ─── hooks/alerts/useAlerts.ts ────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { BASE_URL, HUB_URL, SEV, getSensorTypeDisplay } from '../../constants/alerts/alerts';
import { DetectionItem, SensorAlertItem } from '../../constants/alerts/types';
import { sendLocalNotification } from './useNotifications';

dayjs.extend(utc);
dayjs.extend(timezone);

// ─── Axios instance مع token تلقائي ──────────────────────────────────────────
export const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (ts: string) =>
  !ts ? '--' : dayjs.utc(ts).tz('Europe/London').format('DD MMM YYYY');

const fmtTime = (ts: string) =>
  !ts ? '--:--' : dayjs.utc(ts).format('HH:mm');

export const buildUrl = (raw?: string | null): string | null => {
  if (!raw || !raw.trim()) return null;
  if (raw.startsWith('http')) return raw;
  const clean   = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  const encoded = clean.split('/').map(encodeURIComponent).join('/');
  return `${BASE_URL}/${encoded}`;
};

const getSeverity = (type: string): 'intrusion' | 'motion' | 'default' => {
  const t = (type ?? '').toLowerCase();
  if (t === 'intrusion') return 'intrusion';
  if (t === 'motion')    return 'motion';
  return 'default';
};

export const mapItem = (
  item: any,
  cameraMap: Record<number, string>,
): DetectionItem => {
  const ts = item.detectedAt ?? item.timestamp ?? item.createdAt ?? '';
  return {
    id:          String(item.id ?? Math.random()),
    name:        item.name        ?? 'Detection',
    description: item.description ?? '',
    type:        item.type        ?? '',
    cameraId:    item.cameraId,
    cameraName:  cameraMap[item.cameraId] ?? `Camera ${item.cameraId ?? '?'}`,
    date:        fmtDate(ts),
    time:        fmtTime(ts),
    severity:    getSeverity(item.type),
    snapshotUrl: buildUrl(item.snapShotUrl ?? item.snapshotUrl),
    videoUrl:    buildUrl(item.videoUrl),
    resolved:    item.isResolved ?? item.resolved ?? false,
    _rawTs:      ts,
  };
};

// ─── Sensor Alert mapper ──────────────────────────────────────────────────────
export const mapSensorAlert = (item: any): SensorAlertItem => {
  let ts = item.triggeredAt ?? item.createdAt ?? '';
  if (ts && !ts.endsWith('Z')) ts = `${ts}Z`;
  return {
    id:             String(item.id ?? Math.random()),
    sensorId:       item.sensorId    ?? 0,
    sensorName:     item.sensorName  ?? 'Sensor',
    sensorType:     item.sensorType  ?? 0,
    triggeredValue: typeof item.triggeredValue === 'number' ? item.triggeredValue : 0,
    threshold:      typeof item.threshold      === 'number' ? item.threshold      : 0,
    message:        item.message     ?? '',
    isResolved:     item.isResolved  ?? false,
    triggeredAt:    ts,
    date:           fmtDate(ts),
    time:           fmtTime(ts),
  };
};

// ─── API Calls ────────────────────────────────────────────────────────────────
const fetchCameraMap = async (): Promise<Record<number, string>> => {
  try {
    const res  = await api.get('/api/Camera');
    const data: any[] = res.data?.data ?? res.data ?? [];
    return Object.fromEntries(data.map((c: any) => [c.id, c.name]));
  } catch { return {}; }
};

const fetchAllowedCameraIds = async (): Promise<Set<number>> => {
  try {
    const res  = await api.get('/api/Camera');
    const data: any[] = res.data?.data ?? res.data ?? [];
    return new Set(data.map((c: any) => c.id));
  } catch { return new Set(); }
};

const fetchAllDetections = async (
  cameraMap: Record<number, string>,
  allowedIds: Set<number>,
): Promise<DetectionItem[]> => {
  const res  = await api.get('/api/Detection');
  const raw: any[] = res.data?.data ?? res.data ?? [];
  return raw
    .filter(d => allowedIds.size === 0 || allowedIds.has(d.cameraId))
    .map(d => mapItem(d, cameraMap));
};

const fetchAllSensorAlerts = async (): Promise<SensorAlertItem[]> => {
  try {
    const res  = await api.get('/api/Sensor/Sensor/alerts');
    const raw: any[] = res.data?.data ?? res.data ?? [];
    return raw.map(mapSensorAlert);
  } catch (e) {
    console.error('fetchAllSensorAlerts error:', e);
    return [];
  }
};

export const resolveDetection = async (id: string) => {
  await api.post(`/api/Detection/${id}/resolve`);
};

export const resolveSensorAlert = async (id: string) => {
  await api.put(`/api/Sensor/alerts/${id}/resolve`);
};

// ─── Main Hook ────────────────────────────────────────────────────────────────
export const useAlerts = () => {
  const [items,               setItems]               = useState<DetectionItem[]>([]);
  const [loading,             setLoading]             = useState(true);
  const [refreshing,          setRefreshing]          = useState(false);
  const [sensorAlerts,        setSensorAlerts]        = useState<SensorAlertItem[]>([]);
  const [loadingSensorAlerts, setLoadingSensorAlerts] = useState(true);
  const [connected,           setConnected]           = useState(false);

  const hubRef              = useRef<signalR.HubConnection | null>(null);
  const cameraMapRef        = useRef<Record<number, string>>({});
  const allowedCamIdsRef    = useRef<Set<number>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const manualStopRef       = useRef(false);
  const appStateRef         = useRef(AppState.currentState);

  // نحفظ الـ IDs اللي شفناهم عشان نعرف الجديد ونبعت notification
  const knownSensorAlertIds = useRef<Set<string>>(new Set());
  const initialSensorLoad   = useRef(true);

  // ─── Load detections ───────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const cameraMap  = await fetchCameraMap();
      const allowedIds = await fetchAllowedCameraIds();
      cameraMapRef.current     = cameraMap;
      allowedCamIdsRef.current = allowedIds;
      const data = await fetchAllDetections(cameraMap, allowedIds);
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not load detections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ─── Load sensor alerts مع notification للجديد ────────────────────────────
  const loadSensorAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoadingSensorAlerts(true);
    try {
      const data = await fetchAllSensorAlerts();

      if (initialSensorLoad.current) {
        // أول load — نحفظ الـ IDs الموجودة بدون notification
        data.forEach(a => knownSensorAlertIds.current.add(a.id));
        initialSensorLoad.current = false;
      } else {
        // كل poll بعده — نشوف إيه الجديد
        const newAlerts = data.filter(a => !knownSensorAlertIds.current.has(a.id));
        newAlerts.forEach(a => {
          knownSensorAlertIds.current.add(a.id);
          // notification للـ alert الجديد
          const display = getSensorTypeDisplay(a.sensorType);
          sendLocalNotification(
            `⚠️ ${display.label} Alert`,
            `${a.sensorName}: ${a.triggeredValue} exceeded threshold ${a.threshold}`,
            { sensorAlertId: a.id, channelId: 'security' },
          );
        });
      }

      setSensorAlerts(data);
    } catch (e: any) {
      console.error('loadSensorAlerts:', e);
    } finally {
      setLoadingSensorAlerts(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadSensorAlerts();
  }, []);

  // ─── Polling كل 5 ثواني للـ Sensor Alerts ────────────────────────────────
  // الـ backend مش بيبعت SignalR للـ sensor alerts
  // فالـ polling هو الطريقة الوحيدة للـ real-time
  useEffect(() => {
    const pollSensor = async () => {
      if (appStateRef.current !== 'active') return;
      try {
        const data = await fetchAllSensorAlerts();
        const newAlerts = data.filter(a => !knownSensorAlertIds.current.has(a.id));
        if (newAlerts.length > 0) {
          newAlerts.forEach(a => {
            knownSensorAlertIds.current.add(a.id);
            const display = getSensorTypeDisplay(a.sensorType);
            sendLocalNotification(
              `⚠️ ${display.label} Alert`,
              `${a.sensorName}: ${a.triggeredValue} exceeded threshold ${a.threshold}`,
              { sensorAlertId: a.id, channelId: 'security' },
            );
          });
          setSensorAlerts(data);
        }
      } catch (_) {}
    };

    const id = setInterval(pollSensor, 500);
    return () => clearInterval(id);
  }, []);

  // ─── SignalR ───────────────────────────────────────────────────────────────
  const stopHub = useCallback(async () => {
    manualStopRef.current = true;
    if (hubRef.current) {
      try { await hubRef.current.stop(); } catch (e) { console.warn('Error stopping hub:', e); }
      hubRef.current = null;
    }
    setConnected(false);
  }, []);

  const startHub = useCallback(async () => {
    if (manualStopRef.current) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { console.warn('No token for SignalR'); return; }

      if (hubRef.current) {
        try { await hubRef.current.stop(); } catch {}
        hubRef.current = null;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: async () => {
            const freshToken = await AsyncStorage.getItem('userToken');
            return freshToken ?? '';
          },
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: Platform.OS === 'web' ? false : true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) => {
            const delays = [0, 2000, 5000, 10000, 15000, 20000, 30000];
            return delays[ctx.previousRetryCount] ?? 30000;
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // ── handler مشترك لكل أنواع الـ alerts ───────────────────────────────
      const handleAnyAlert = (payload: any, source: string) => {
        console.log(`[SignalR] ${source}:`, JSON.stringify(payload));

        const isSensor =
          payload?.sensorId       !== undefined ||
          payload?.sensorType     !== undefined ||
          payload?.triggeredValue !== undefined;

        if (isSensor) {
          const newAlert: SensorAlertItem = { ...mapSensorAlert(payload), isNew: true };
          // لو مش موجود في الـ known IDs، نضيفه مع notification
          if (!knownSensorAlertIds.current.has(newAlert.id)) {
            knownSensorAlertIds.current.add(newAlert.id);
            setSensorAlerts(prev => {
              if (prev.some(a => a.id === newAlert.id)) return prev;
              return [newAlert, ...prev];
            });
            const display = getSensorTypeDisplay(payload.sensorType);
            sendLocalNotification(
              `⚠️ ${display.label} Alert`,
              `${payload.sensorName}: ${payload.triggeredValue} exceeded threshold ${payload.threshold}`,
              { sensorAlertId: newAlert.id, channelId: 'security' },
            );
            setTimeout(() => {
              setSensorAlerts(prev =>
                prev.map(a => a.id === newAlert.id ? { ...a, isNew: false } : a),
              );
            }, 2500);
          }
        } else {
          const allowed = allowedCamIdsRef.current;
          if (allowed.size > 0 && !allowed.has(payload.cameraId)) return;
          const newItem: DetectionItem = { ...mapItem(payload, cameraMapRef.current), isNew: true };
          setItems(prev => {
            if (prev.some(i => i.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });
          const { label } = SEV[newItem.severity] ?? SEV.default;
          sendLocalNotification(
            `🚨 ${label} Alert`,
            `${newItem.name} detected on ${newItem.cameraName}`,
            { detectionId: newItem.id },
          );
          setTimeout(() => {
            setItems(prev => prev.map(i => i.id === newItem.id ? { ...i, isNew: false } : i));
          }, 2500);
        }
      };

      // ── كل أسماء الـ event المحتملة ───────────────────────────────────────
      connection.on('receivealert',          (p) => handleAnyAlert(p, 'receivealert'));
      connection.on('ReceiveAlert',          (p) => handleAnyAlert(p, 'ReceiveAlert'));
      connection.on('ReceiveDetectionAlert', (p) => handleAnyAlert(p, 'ReceiveDetectionAlert'));
      connection.on('ReceiveSensorAlert',    (p) => handleAnyAlert(p, 'ReceiveSensorAlert'));

      connection.onreconnecting(() => setConnected(false));
      connection.onreconnected(() => {
        setConnected(true);
        reconnectAttemptRef.current = 0;
        load(true);
        loadSensorAlerts(true);
      });
      connection.onclose(() => {
        setConnected(false);
        if (!manualStopRef.current && appStateRef.current === 'active') {
          setTimeout(() => {
            if (!manualStopRef.current && appStateRef.current === 'active') startHub();
          }, 2000);
        }
      });

      await connection.start();
      setConnected(true);
      reconnectAttemptRef.current = 0;
      hubRef.current = connection;

      try { await connection.invoke('Ping'); } catch {}

    } catch (error: any) {
      console.error('SignalR start error:', error?.message);
      setConnected(false);
      if (!manualStopRef.current && appStateRef.current === 'active') {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
        reconnectAttemptRef.current++;
        setTimeout(() => {
          if (!manualStopRef.current && appStateRef.current === 'active') startHub();
        }, delay);
      }
    }
  }, []);

  useEffect(() => {
    manualStopRef.current = false;
    startHub();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
      if (nextState === 'active') {
        load(true);
        loadSensorAlerts(true);
        if (!hubRef.current || hubRef.current.state !== signalR.HubConnectionState.Connected) {
          manualStopRef.current = false;
          startHub();
        }
      }
    });

    return () => {
      subscription.remove();
      manualStopRef.current = true;
      hubRef.current?.stop().catch(console.warn);
      hubRef.current = null;
    };
  }, [startHub]);

  // ── Ping health check ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!connected || !hubRef.current) return;
    let pingCount = 0;
    const id = setInterval(async () => {
      if (hubRef.current?.state === signalR.HubConnectionState.Connected) {
        try {
          await hubRef.current.invoke('Ping');
          pingCount = 0;
        } catch {
          pingCount++;
          if (pingCount >= 3) { setConnected(false); if (!manualStopRef.current) startHub(); }
        }
      }
    }, 15000);
    return () => clearInterval(id);
  }, [connected, startHub]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleResolved = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i));

  const handleSensorResolved = (id: string) =>
    setSensorAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a));

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
    loadSensorAlerts(true);
  };

  const manualReconnect = useCallback(async () => {
    manualStopRef.current = false;
    await stopHub();
    setTimeout(() => startHub(), 500);
  }, [stopHub, startHub]);

  return {
    items,
    loading,
    refreshing,
    onRefresh,
    handleResolved,
    sensorAlerts,
    loadingSensorAlerts,
    handleSensorResolved,
    loadSensorAlerts,
    connected,
    manualReconnect,
    connectionState: hubRef.current?.state,
  };
};