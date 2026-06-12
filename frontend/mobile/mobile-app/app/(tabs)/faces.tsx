import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// الاستيرادات المهيكلة الجديدة
import { useFacesData } from '../../hooks/faces/useFacesData';
import { CameraChip } from '../../components/faces/CameraChip';
import { FaceCard } from '../../components/faces/FaceCard';
import { AddFaceModal } from '../../components/faces/AddFaceModal';
import { apiAddFace, apiDeleteFace } from '../../constants/faces/api';
import { Face } from '../../constants/faces/types';
import { styles } from '../../styles/faces/facesStyles';

export default function FacesScreen() {
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    cameras,
    loadingCams,
    selectedCam,
    setSelectedCam,
    allFaces,
    setAllFaces,
    loadingFaces,
    fetchCameras,
    fetchFacesForCamera
  } = useFacesData();

  const currentFaces: Face[] = selectedCam ? (allFaces[selectedCam.id] ?? []) : [];

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

  const handleDelete = useCallback((face: Face) => {
    Alert.alert(
      'Remove Face',
      `Remove "${face.name}" from this camera?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
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
  }, [selectedCam, setAllFaces]);

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

  return (
    <View style={styles.container}>
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