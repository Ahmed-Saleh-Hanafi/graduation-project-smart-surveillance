import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.1.2:5198';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) =>
  AsyncStorage.getItem('userToken').then((token) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }).catch(() => config)
);

export const authHeader = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const buildAbsoluteUrl = (raw?: string | null) => {
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;
  return `${BASE_URL}/${raw.replace(/\\/g, '/').replace(/^\/+/, '')}`;
};