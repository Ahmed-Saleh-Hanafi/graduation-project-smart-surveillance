import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Modal, TextInput, Platform,
  KeyboardAvoidingView, ActivityIndicator, Alert,
  Pressable, FlatList,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AccessLevel = 'Whitelist' | 'Blacklist';

export interface Face {
  id: string;
  name: string;
  role: string;
  type: AccessLevel;
  imageUrl: string;
  createdAt: string;
}

// ─── API Layer (swap base URL + add auth headers as needed) ─────────────────

const API_BASE = 'https://your-api.com/api'; // ← change this

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${yourToken}`,
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

const facesApi = {
  getAll: () => apiFetch<Face[]>('/faces'),

  create: (data: Omit<Face, 'id' | 'createdAt'>) =>
    apiFetch<Face>('/faces', { method: 'POST', body: JSON.stringify(data) }),

  updateType: (id: string, type: AccessLevel) =>
    apiFetch<Face>(`/faces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type }),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/faces/${id}`, { method: 'DELETE' }),
};

// ─── Mock data (used as fallback / during dev) ───────────────────────────────

const MOCK_FACES: Face[] = [
  {
    id: '1',
    name: 'Alice Smith',
    role: 'Staff / Manager',
    type: 'Whitelist',
    imageUrl: 'https://i.pravatar.cc/150?u=1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Unknown Subject',
    role: 'Threat Detected',
    type: 'Blacklist',
    imageUrl: 'https://i.pravatar.cc/150?u=2',
    createdAt: new Date().toISOString(),
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatPillProps {
  count: number;
  label: string;
  color: string;
}

const StatPill: React.FC<StatPillProps> = ({ count, label, color }) => (
  <View style={styles.statPill}>
    <Text style={styles.statNum}>{count}</Text>
    <View style={styles.statLabelRow}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

interface FaceCardProps {
  face: Face;
  onDelete: (face: Face) => void;
  onToggleType: (face: Face) => void;
}

const FaceCard: React.FC<FaceCardProps> = ({ face, onDelete, onToggleType }) => {
  const isWhite = face.type === 'Whitelist';

  return (
    <View style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: isWhite ? COLORS.green : COLORS.red }]} />
      <Image
        source={{ uri: face.imageUrl }}
        style={styles.avatar}
        defaultSource={{ uri: 'https://i.pravatar.cc/150?u=default' }}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{face.name}</Text>
        <Text style={styles.roleText} numberOfLines={1}>{face.role}</Text>
        <View style={[styles.badge, isWhite ? styles.whitelistBadge : styles.blacklistBadge]}>
          <Text style={[styles.badgeText, { color: isWhite ? COLORS.greenDark : COLORS.redDark }]}>
            {face.type.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onToggleType(face)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Toggle ${face.name} access level`}
        >
          <Feather name="refresh-cw" size={16} color={'#007AFF'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, styles.deleteBtn]}
          onPress={() => onDelete(face)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Delete ${face.name}`}
        >
          <Feather name="trash-2" size={16} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Add Face Modal ──────────────────────────────────────────────────────────

interface FormErrors {
  image?: string;
  name?: string;
  role?: string;
}

interface AddFaceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Face, 'id' | 'createdAt'>) => Promise<void>;
  isSaving: boolean;
}

const AddFaceModal: React.FC<AddFaceModalProps> = ({ visible, onClose, onSave, isSaving }) => {
  const [name, setName]           = useState('');
  const [role, setRole]           = useState('');
  const [type, setType]           = useState<AccessLevel>('Whitelist');
  const [imageUri, setImageUri]   = useState<string | null>(null);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Re-validate on every change after first submit attempt
  useEffect(() => {
    if (submitted) validate();
  }, [name, role, imageUri, submitted]);

  const reset = () => {
    setName(''); setRole(''); setType('Whitelist');
    setImageUri(null); setErrors({}); setSubmitted(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!imageUri)      e.image = 'A face photo is required.';
    if (!name.trim())   e.name  = 'Full name is required.';
    if (!role.trim())   e.role  = 'Job title / role is required.';
    setErrors(e);
    return e;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePhotoPress = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera',        onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    setSubmitted(true);
    const e = validate();
    if (Object.keys(e).length > 0) return;

    await onSave({
      name:     name.trim(),
      role:     role.trim(),
      type,
      imageUrl: imageUri!,
    });
    reset();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Face</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* ── Photo picker ── */}
            <TouchableOpacity
              style={[styles.uploadCircle, errors.image ? styles.uploadCircleError : null]}
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
                  <Ionicons name="camera" size={28} color={errors.image ? COLORS.red: '#007AFF'} />
                  <Text style={[styles.uploadLabel, errors.image ? { color: COLORS.red } : null]}>
                    Add Photo *
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.fieldError}>{errors.image}</Text>}

            {/* ── Name ── */}
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="e.g. Ahmed Hassan"
              placeholderTextColor={COLORS.placeholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

            {/* ── Role ── */}
            <Text style={styles.fieldLabel}>Job Title / Role *</Text>
            <TextInput
              style={[styles.input, errors.role ? styles.inputError : null]}
              placeholder="e.g. Security Manager"
              placeholderTextColor={COLORS.placeholder}
              value={role}
              onChangeText={setRole}
              returnKeyType="done"
            />
            {errors.role && <Text style={styles.fieldError}>{errors.role}</Text>}

            {/* ── Access level ── */}
            <Text style={styles.fieldLabel}>Access Level *</Text>
            <View style={styles.segControl}>
              {(['Whitelist', 'Blacklist'] as AccessLevel[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.segBtn, type === t && styles.segBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.segText,
                      type === t && {
                        color: t === 'Whitelist' ? COLORS.green : COLORS.red,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Identity</Text>
              }
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

type FilterType = 'all' | AccessLevel;
const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Whitelist', value: 'Whitelist' },
  { label: 'Blacklist', value: 'Blacklist' },
];

export default function FacesScreen() {
  const [faces, setFaces] = useState<Face[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch ──
  const fetchFaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facesApi.getAll();
      setFaces(data);
    } catch {
      // fallback to mock during development
      setFaces(MOCK_FACES);
      setError(null); // comment this out to surface errors in prod
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaces(); }, [fetchFaces]);

  // ── Add ──
  const handleSave = async (data: Omit<Face, 'id' | 'createdAt'>) => {
    setIsSaving(true);
    try {
      const created = await facesApi.create(data);
      setFaces(prev => [created, ...prev]);
      setModalOpen(false);
    } catch {
      // Optimistic fallback during dev
      const newFace: Face = {
        ...data,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
      };
      setFaces(prev => [newFace, ...prev]);
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Type ──
  const handleToggleType = useCallback(async (face: Face) => {
    const newType: AccessLevel = face.type === 'Whitelist' ? 'Blacklist' : 'Whitelist';
    setFaces(prev => prev.map(f => f.id === face.id ? { ...f, type: newType } : f));
    try {
      await facesApi.updateType(face.id, newType);
    } catch {
      setFaces(prev => prev.map(f => f.id === face.id ? { ...f, type: face.type } : f));
      Alert.alert('Error', 'Could not update access level.');
    }
  }, []);

  // ── Delete ──
  const handleDelete = useCallback((face: Face) => {
    Alert.alert(
      'Remove Identity',
      `Remove "${face.name}" from the face database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setFaces(prev => prev.filter(f => f.id !== face.id));
            try {
              await facesApi.delete(face.id);
            } catch {
              setFaces(prev => [face, ...prev]);
              Alert.alert('Error', 'Could not delete face.');
            }
          },
        },
      ]
    );
  }, []);

  const filtered = filter === 'all' ? faces : faces.filter(f => f.type === filter);
  const whiteCount = faces.filter(f => f.type === 'Whitelist').length;
  const blackCount = faces.filter(f => f.type === 'Blacklist').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity style={styles.addButton} onPress={() => setModalOpen(true)}>
          <Ionicons name="person-add" size={17} color="#fff" />
          <Text style={styles.addButtonText}>Add Face</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.blue} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchFaces} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <>
              {/* Stats */}
              <View style={styles.statsRow}>
                <StatPill count={whiteCount} label="Whitelist" color={COLORS.green} />
                <StatPill count={blackCount} label="Blacklist" color={COLORS.red} />
              </View>

              {/* Filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {FILTERS.map(f => (
                  <TouchableOpacity
                    key={f.value}
                    style={[styles.chip, filter === f.value && styles.chipActive]}
                    onPress={() => setFilter(f.value)}
                  >
                    <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>No faces found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <FaceCard
              face={item}
              onDelete={handleDelete}
              onToggleType={handleToggleType}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Add Modal */}
      <AddFaceModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </View>
  );
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  placeholder: '#C7C7CC',
  border: 'rgba(60,60,67,0.12)',
  blue: '#272a2d',
  green: '#34C759',
  greenDark: '#1A7A35',
  greenBg: '#E8F9EE',
  red: '#FF3B30',
  redDark: '#C0392B',
  redBg: '#FFEBEB',
  inputBg: '#F2F2F7',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#ffffff00',
    
    
    elevation: 4,
  },
  headerSub: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  addButton: { backgroundColor: '#007AFF', flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignItems: 'center', gap: 6 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  statPill: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: COLORS.border },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  filterRow: { paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 0.5, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },

  listContainer: { paddingBottom: 30 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 14,
    paddingLeft: 18,
    alignItems: 'center',
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  avatar: { width: 58, height: 58, borderRadius: 14, backgroundColor: COLORS.inputBg },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  roleText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, alignSelf: 'flex-start', marginTop: 7 },
  whitelistBadge: { backgroundColor: COLORS.greenBg },
  blacklistBadge: { backgroundColor: COLORS.redBg },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardActions: { gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { backgroundColor: '#FFF5F5' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  errorBox: { alignItems: 'center', padding: 40 },
  errorText: { color: COLORS.red, marginBottom: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: Platform.OS === 'ios' ? 5 : 0.1 },
  dragHandle: { width: 36, height: 4, backgroundColor: COLORS.placeholder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center' },
  uploadCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF', alignSelf: 'center', marginBottom: 6, overflow: 'hidden', position: 'relative' },
  uploadCircleError: { borderColor: COLORS.red, backgroundColor: COLORS.redBg },
  uploadPreview: { width: 90, height: 90, borderRadius: 45 },
  uploadEditBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#007AFF', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  uploadLabel: { fontSize: 11, color: '#007AFF', fontWeight: '700', marginTop: 4 },
  fieldLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  fieldError: { fontSize: 11, color: COLORS.red, fontWeight: '500', marginTop: -10, marginBottom: 10, marginLeft: 2 },
  input: { backgroundColor: COLORS.inputBg, borderRadius: 13, padding: 14, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  inputError: { borderColor: COLORS.red, backgroundColor: COLORS.redBg },
  segControl: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 13, padding: 3, gap: 3, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: 'transparent' },
  segBtnActive: { backgroundColor: COLORS.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
