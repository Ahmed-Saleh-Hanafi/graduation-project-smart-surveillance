import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import { BASE_URL, fetchWithTimeout, setEventsStore } from '../../constants/live/api';
import { buildStreamName } from '../../constants/live/config';
import { buildSensorFromApi, getSensorUI, deriveSensorStatus } from '../../constants/live/sensor';
import type { Camera, Sensor } from '../../constants/live/types';

// ─── Auth header ──────────────────────────────────────────────────────────────
export const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── useSensorSignalR ─────────────────────────────────────────────────────────
export const useSensorSignalR = (
  sensorIds: number[],
  onReading: (payload: {
    sensorId: number; sensorName: string; sensorType: string;
    sensorValue: number; threshold: number;
  }) => void,
  onAlert: (payload: any) => void,
) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (sensorIds.length === 0) return;
    let cancelled = false;

    const connect = async () => {
      const token = await AsyncStorage.getItem('userToken');

      const conn = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/hub/alerts`, {
          accessTokenFactory: () => token ?? '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets |
                     signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      conn.on('ReceiveSensorReading', (payload) => {
        if (!cancelled) onReading(payload);
      });

      conn.on('ReceiveSensorAlert', (payload) => {
        if (!cancelled) onAlert(payload);
      });

      conn.onreconnected(async () => {
        for (const id of sensorIds) {
          try { await conn.invoke('JoinSensorGroup', id); } catch (_) {}
        }
        try { await conn.invoke('JoinGroup', 'admin'); } catch (_) {}
      });

      try {
        await conn.start();
        console.log('[SignalR] Connected ✅');
        connectionRef.current = conn;
        for (const id of sensorIds) {
          try { await conn.invoke('JoinSensorGroup', id); } catch (_) {}
        }
        try { await conn.invoke('JoinGroup', 'admin'); } catch (_) {}
      } catch (err) {
        console.warn('[SignalR] Connection failed:', err);
      }
    };

    connect();

    return () => {
      cancelled = true;
      connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, [sensorIds.join(',')]);
};

// ─── useSignalRSensorUpdater ──────────────────────────────────────────────────
export const useSignalRSensorUpdater = (
  setSensors: React.Dispatch<React.SetStateAction<Sensor[]>>,
) => {
  const handleReading = useCallback((payload: {
    sensorId: number; sensorName: string; sensorType: string;
    sensorValue: number; threshold: number;
  }) => {
    setSensors(prev => prev.map(s => {
      if (s.apiId !== payload.sensorId) return s;

      const newVal     = typeof payload.sensorValue === 'number' ? payload.sensorValue : 0;
      const apiThresh  = typeof payload.threshold === 'number' && isFinite(payload.threshold)
        ? payload.threshold : s.apiThreshold;
      const thresholds = { safe: apiThresh * 0.6, warn: apiThresh };
      const history    = [...s.history.slice(1), newVal];
      const { status, statusColor } = deriveSensorStatus(s.sensorType, newVal, thresholds);
      const newMax     = Math.max(s.max, apiThresh * 1.5, newVal * 1.2);

      return {
        ...s,
        value:        newVal,
        history,
        status,
        statusColor,
        thresholds,
        apiThreshold: apiThresh,
        max:          newMax,
        description:  `${getSensorUI(s.sensorType, s.sensorName).description}\nAlert threshold: ${apiThresh} ${s.unit}`,
      };
    }));
  }, [setSensors]);

  const handleAlert = useCallback((payload: any) => {
    console.log('[SignalR] Alert received:', payload);
  }, []);

  return { handleReading, handleAlert };
};

// ─── useFetchCameras ──────────────────────────────────────────────────────────
export const useFetchCameras = (
  setLoading: (v: boolean) => void,
) => {
  const [cameras,      setCameras]      = useState<Camera[]>([]);
  const [locations,    setLocations]    = useState<string[]>(['All']);
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);

  const fetchCameras = async () => {
    try {
      const headers = await getAuthHeader();
      const res     = await axios.get(`${BASE_URL}/api/Camera`, { headers });
      const data: Camera[] = res.data.data ?? [];
      setCameras(data);
      const locs = Array.from(new Set(data.map(c => c.location).filter(Boolean) as string[])).sort();
      setLocations(['All', ...locs]);
      if (data.length > 0) setActiveCamera(prev => prev ?? data[0]);
    } catch (e) { console.error('Failed to fetch cameras:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 30000);
    return () => clearInterval(interval);
  }, []);

  return { cameras, setCameras, locations, activeCamera, setActiveCamera, fetchCameras };
};

// ─── useFetchSensors ──────────────────────────────────────────────────────────
export const useFetchSensors = (
  setLoading: (v: boolean) => void,
) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);

  const fetchSensorReadings = async () => {
    try {
      const headers    = await getAuthHeader();
      const res        = await axios.get(`${BASE_URL}/api/Sensor/GetAll`, { headers });
      const apiSensors: any[] = res.data?.data ?? [];
      setSensors(apiSensors.map(buildSensorFromApi));
    } catch (e) {
      console.error('fetchSensorReadings error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSensorReadings();
  }, []);

  return { sensors, setSensors, fetchSensorReadings };
};