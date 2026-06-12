import { useState, useEffect, useCallback } from 'react';
import { Camera, Face } from '../../constants/faces/types';
import { apiFetchFaces, authHeader, BASE_URL } from '../../constants/faces/api';

export function useFacesData() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loadingCams, setLoadingCams] = useState(true);
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);
  const [allFaces, setAllFaces] = useState<Record<number, Face[]>>({});
  const [loadingFaces, setLoadingFaces] = useState(false);

  const fetchCameras = useCallback(async () => {
    setLoadingCams(true);
    try {
      const headers = await authHeader();
      const response = await fetch(`${BASE_URL}/api/Camera`, {
        headers: { ...headers, Accept: 'application/json' },
      });
      const data = await response.json();
      const list: Camera[] = data?.data ?? [];
      setCameras(list);
      setSelectedCam(prev => prev ?? (list[0] ?? null));
    } catch (e) {
      console.error('Failed to fetch cameras:', e);
    }   finally {
      setLoadingCams(false);
    }
  }, []);

  const fetchFacesForCamera = useCallback(async (cam: Camera) => {
    setLoadingFaces(true);
    try {
      const faces = await apiFetchFaces(cam.id);
      setAllFaces(prev => ({ ...prev, [cam.id]: faces }));
    } catch (e) {
      console.error('Failed to fetch faces:', e);
    }   finally {
      setLoadingFaces(false);
    }
  }, []);

  useEffect(() => { fetchCameras(); }, [fetchCameras]);

  useEffect(() => {
    if (selectedCam) fetchFacesForCamera(selectedCam);
  }, [selectedCam, fetchFacesForCamera]);

  return {
    cameras,
    loadingCams,
    selectedCam,
    setSelectedCam,
    allFaces,
    setAllFaces,
    loadingFaces,
    fetchCameras,
    fetchFacesForCamera
  };
}