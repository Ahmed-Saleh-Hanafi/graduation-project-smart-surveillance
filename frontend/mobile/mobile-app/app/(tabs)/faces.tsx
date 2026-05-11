import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Modal, TextInput, Platform,
  KeyboardAvoidingView, ActivityIndicator, Alert,
  Pressable, FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Camera {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  streamUrl: string;
}

interface Face {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  cameraId: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'http://192.168.1.229:5198';

// ─── API helpers ──────────────────────────────────────────────────────────────

const authHeader = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  } catch {
    return {};
  }
};

/** POST /api/Face/add-face  – multipart form (fetch-based, Android-safe) */
const apiAddFace = async (
  cameraId: number,
  name: string,
  imageUri: string,
): Promise<void> => {
  const headers = await authHeader();

  const filename  = imageUri.split('/').pop() ?? 'photo.jpg';
  const extension = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType  = extension === 'png' ? 'image/png' : 'image/jpeg';

  const form = new FormData();
  form.append('CameraId', String(cameraId));
  form.append('Name',     name);
  (form as any).append('file', {
    uri:  imageUri,
    name: filename,
    type: mimeType,
  });

  const response = await fetch(`${BASE_URL}/api/Face/add-face`, {
    method:  'POST',
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

/** GET /api/Face/get-faces/{cameraId} */
const apiFetchFaces = async (cameraId: number): Promise<Face[]> => {
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
      id:        String(f.id ?? f.faceId ?? Date.now()),
      name:      f.name      ?? 'Unknown',
      imageUrl:  fixedUrl,
      createdAt: f.createdAt ?? new Date().toISOString(),
      cameraId,
    };
  });
};

/** DELETE /api/Face/delete-face/{faceId} */
const apiDeleteFace = async (faceId: string): Promise<void> => {
  const headers = await authHeader();

  const response = await fetch(`${BASE_URL}/api/Face/delete-face/${faceId}`, {
    method:  'DELETE',
    headers: { ...headers, Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Delete failed: ${response.status}`);
  }
};

// ─── CameraChip ───────────────────────────────────────────────────────────────

const CameraChip = ({
  camera, active, faceCount, onPress,
}: {
  camera: Camera;
  active: boolean;
  faceCount: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.chipDot, { backgroundColor: active ? '#34C759' : '#AEAEB2' }]} />
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {camera.name}
    </Text>
    {faceCount > 0 && (
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
          {faceCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── FaceCard ─────────────────────────────────────────────────────────────────

const FaceCard = ({
  face, onDelete,
}: {
  face: Face;
  onDelete: (face: Face) => void;
}) => (
  <View style={styles.card}>
    <Image source={{ uri: face.imageUrl }} style={styles.avatar} resizeMode="cover" />
    <View style={styles.cardInfo}>
      <Text style={styles.cardName} numberOfLines={1}>{face.name}</Text>
      <Text style={styles.cardDate}>
        Added{' '}
        {new Date(face.createdAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </Text>
    </View>
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(face)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="trash-outline" size={17} color="#FF3B30" />
    </TouchableOpacity>
  </View>
);

// ─── Add Face Modal ───────────────────────────────────────────────────────────

interface AddFaceModalProps {
  visible: boolean;
  cameraName: string;
  onClose: () => void;
  onSave: (name: string, imageUri: string) => Promise<void>;
  isSaving: boolean;
  bottomInset: number;
}

const AddFaceModal: React.FC<AddFaceModalProps> = ({
  visible, cameraName, onClose, onSave, isSaving, bottomInset,
}) => {
  const [name,     setName]     = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors,   setErrors]   = useState<{ name?: string; image?: string }>({});

  const reset       = () => { setName(''); setImageUri(null); setErrors({}); };
  const handleClose = () => { reset(); onClose(); };

  const validate = () => {
    const e: typeof errors = {};
    if (!imageUri)    e.image = 'A face photo is required.';
    if (!name.trim()) e.name  = 'Full name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoPress = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow camera access.');
            return;
          }
          const r = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!r.canceled) setImageUri(r.assets[0].uri);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow photo library access.');
            return;
          }
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
          });
          if (!r.canceled) setImageUri(r.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave(name.trim(), imageUri!);
    reset();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={[styles.sheet, { paddingBottom: bottomInset + 20 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Register New Face</Text>
                <Text style={styles.sheetSub}>{cameraName}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={16} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Photo picker */}
            <TouchableOpacity
              style={[styles.uploadCircle, errors.image && styles.uploadCircleError]}
              onPress={handlePhotoPress}
              activeOpacity={0.75}
            >
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.uploadPreview} />
                  <View style={styles.uploadEditBadge}>
                    <Ionicons name="pencil" size={11} color="#fff" />
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="camera" size={28} color={errors.image ? '#FF3B30' : '#007AFF'} />
                  <Text style={[styles.uploadLabel, errors.image && { color: '#FF3B30' }]}>
                    Add Photo *
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.fieldError}>{errors.image}</Text>}

            {/* Name */}
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g. Ahmed Hassan"
              placeholderTextColor="#AEAEB2"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Identity</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FacesScreen() {
  const insets = useSafeAreaInsets();
  const [cameras,      setCameras]      = useState<Camera[]>([]);
  const [loadingCams,  setLoadingCams]  = useState(true);
  const [selectedCam,  setSelectedCam]  = useState<Camera | null>(null);
  const [allFaces,     setAllFaces]     = useState<Record<number, Face[]>>({});
  const [loadingFaces, setLoadingFaces] = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);

  // ── Fetch cameras ────────────────────────────────────────────────────────
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
    } finally {
      setLoadingCams(false);
    }
  }, []);

  useEffect(() => { fetchCameras(); }, []);

  // ── Fetch faces for selected camera ──────────────────────────────────────
  const fetchFacesForCamera = useCallback(async (cam: Camera) => {
    setLoadingFaces(true);
    try {
      const faces = await apiFetchFaces(cam.id);
      setAllFaces(prev => ({ ...prev, [cam.id]: faces }));
    } catch (e) {
      console.error('Failed to fetch faces:', e);
    } finally {
      setLoadingFaces(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCam) fetchFacesForCamera(selectedCam);
  }, [selectedCam]);

  const currentFaces: Face[] = selectedCam ? (allFaces[selectedCam.id] ?? []) : [];

  // ── Save face ─────────────────────────────────────────────────────────────
  const handleSave = async (name: string, imageUri: string) => {
    if (!selectedCam) return;
    setIsSaving(true);
    try {
      await apiAddFace(selectedCam.id, name, imageUri);
      setModalOpen(false);
      await fetchFacesForCamera(selectedCam);
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.message ?? 'Could not register face. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete face ───────────────────────────────────────────────────────────
  const handleDelete = useCallback((face: Face) => {
    Alert.alert(
      'Remove Face',
      `Remove "${face.name}" from this camera?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:  'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeleteFace(face.id);
              if (!selectedCam) return;
              setAllFaces(prev => ({
                ...prev,
                [selectedCam.id]: (prev[selectedCam.id] ?? []).filter(f => f.id !== face.id),
              }));
            } catch (e: any) {
              Alert.alert('Delete Failed', e?.message ?? 'Could not delete face. Please try again.');
            }
          },
        },
      ],
    );
  }, [selectedCam]);

  // ── Loading cameras ───────────────────────────────────────────────────────
  if (loadingCams) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading cameras...</Text>
      </View>
    );
  }

  if (cameras.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="videocam-off-outline" size={48} color="#AEAEB2" />
        <Text style={styles.emptyTitle}>No cameras found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCameras}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Camera selector ── */}
      <View style={styles.selectorCard}>
        <Text style={styles.selectorLabel}>Cameras</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorContent}
        >
          {cameras.map(cam => (
            <CameraChip
              key={cam.id}
              camera={cam}
              active={selectedCam?.id === cam.id}
              faceCount={(allFaces[cam.id] ?? []).length}
              onPress={() => setSelectedCam(cam)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Faces list ── */}
      {loadingFaces ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading faces...</Text>
        </View>
      ) : (
        <FlatList
          data={currentFaces}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
          ListHeaderComponent={
            selectedCam ? (
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>{selectedCam.name}</Text>
                  <Text style={styles.listSub}>
                    {currentFaces.length}{' '}
                    {currentFaces.length === 1 ? 'face' : 'faces'} registered
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add Face</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="face-recognition" size={48} color="#AEAEB2" />
              <Text style={styles.emptyTitle}>No faces registered</Text>
              <Text style={styles.emptySub}>Tap "Add Face" to register the first identity</Text>
            </View>
          }
          renderItem={({ item }) => (
            <FaceCard face={item} onDelete={handleDelete} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* ── Modal ── */}
      {selectedCam && (
        <AddFaceModal
          visible={modalOpen}
          cameraName={selectedCam.name}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          isSaving={isSaving}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#F2F2F7',
  },
  loadingText: { fontSize: 14, color: '#AEAEB2' },

  selectorCard: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  selectorLabel: {
    fontSize: 11, fontWeight: '700', color: '#AEAEB2',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, marginBottom: 10,
  },
  selectorContent: { paddingHorizontal: 16, gap: 8 },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: '#F2F2F7',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
  },
  chipActive:          { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipDot:             { width: 6, height: 6, borderRadius: 3 },
  chipText:            { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive:      { color: '#fff' },
  chipBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  chipBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.2)' },
  chipBadgeText:       { fontSize: 10, fontWeight: '700', color: '#AEAEB2' },
  chipBadgeTextActive: { color: '#fff' },

  listContent: { paddingBottom: 32 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
  },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  listSub:   { fontSize: 12, color: '#AEAEB2', marginTop: 2 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#007AFF',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: {
    backgroundColor: '#fff', borderRadius: 18,
    flexDirection: 'row', padding: 14, alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  avatar:   { width: 58, height: 58, borderRadius: 14, backgroundColor: '#F2F2F7' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  cardDate: { fontSize: 11, color: '#C7C7CC', marginTop: 4 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
  },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#AEAEB2' },
  emptySub:   { fontSize: 13, color: '#C7C7CC' },

  retryBtn: {
    marginTop: 8, backgroundColor: '#007AFF',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sheetSub:   { fontSize: 12, color: '#AEAEB2', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center',
  },

  uploadCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F0F7FF', alignSelf: 'center',
    marginBottom: 6, overflow: 'hidden',
  },
  uploadCircleError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },
  uploadPreview:     { width: 90, height: 90, borderRadius: 45 },
  uploadEditBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: '#007AFF', borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  uploadLabel: { fontSize: 11, color: '#007AFF', fontWeight: '700', marginTop: 4 },

  fieldLabel: {
    fontSize: 11, color: '#AEAEB2', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6,
  },
  fieldError: {
    fontSize: 11, color: '#FF3B30', fontWeight: '500',
    marginTop: -10, marginBottom: 10, marginLeft: 2,
  },
  input: {
    backgroundColor: '#F2F2F7', borderRadius: 13, padding: 14,
    fontSize: 14, color: '#1C1C1E',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', marginBottom: 14,
  },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },

  saveBtn: {
    backgroundColor: '#007AFF', padding: 16,
    borderRadius: 16, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
