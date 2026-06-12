import AsyncStorage from '@react-native-async-storage/async-storage';
import { Face } from './types';

export const BASE_URL = 'http://192.168.1.2:5198';

export const authHeader = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  } catch {
    return {};
  }
};

export const apiAddFace = async (cameraId: number, name: string, imageUri: string): Promise<void> => {
  const headers = await authHeader();
  const filename  = imageUri.split('/').pop() ?? 'photo.jpg';
  const extension = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType  = extension === 'png' ? 'image/png' : 'image/jpeg';

  const form = new FormData();
  form.append('CameraId', String(cameraId));
  form.append('Name', name);
  (form as any).append('file', {
    uri: imageUri,
    name: filename,
    type: mimeType,
  });

  const response = await fetch(`${BASE_URL}/api/Face/add-face`, {
    method: 'POST',
    headers: {
      ...headers,
      Accept: 'application/json',
    },
    body: form,
  });

  const text = await response.text();
  if (!response.ok) {
    console.error('apiAddFace server error:', response.status, text);
    throw new Error(text || `Server error ${response.status}`);
  }
};

export const apiFetchFaces = async (cameraId: number): Promise<Face[]> => {
  const headers = await authHeader();
  const response = await fetch(`${BASE_URL}/api/Face/get-faces/${cameraId}`, {
    headers: { ...headers, Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Fetch faces failed: ${response.status}`);

  const data = await response.json();
  const list: any[] = data?.data ?? data ?? [];

  return list.map(f => {
    const rawUrl = f.url ?? f.imageUrl ?? f.snapShotUrl ?? '';
    const fixedUrl =
      rawUrl && !rawUrl.startsWith('http')
        ? `${BASE_URL}/${rawUrl.replace(/\\/g, '/').replace(/^\/+/, '')}`
        : rawUrl;
    return {
      id: String(f.id ?? f.faceId ?? Date.now()),
      name: f.name ?? 'Unknown',
      imageUrl: fixedUrl,
      createdAt: f.createdAt ?? new Date().toISOString(),
      cameraId,
    };
  });
};

export const apiDeleteFace = async (faceId: string): Promise<void> => {
  const headers = await authHeader();
  const response = await fetch(`${BASE_URL}/api/Face/delete-face/${faceId}`, {
    method: 'DELETE',
    headers: { ...headers, Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Delete failed: ${response.status}`);
  }
};