import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../../styles/faces/facesStyles';

interface AddFaceModalProps {
  visible: boolean;
  cameraName: string;
  onClose: () => void;
  onSave: (name: string, imageUri: string) => Promise<void>;
  isSaving: boolean;
  bottomInset: number;
}

export const AddFaceModal: React.FC<AddFaceModalProps> = ({
  visible, cameraName, onClose, onSave, isSaving, bottomInset,
}) => {
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({});

  const reset = () => { setName(''); setImageUri(null); setErrors({}); };
  const handleClose = () => { reset(); onClose(); };

  const validate = () => {
    const e: typeof errors = {};
    if (!imageUri) e.image = 'A face photo is required.';
    if (!name.trim()) e.name = 'Full name is required.';
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
            mediaTypes: ['images'],
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
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Register New Face</Text>
                <Text style={styles.sheetSub}>{cameraName}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={16} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

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

            <Text style={styles.fieldLabel}> Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholderTextColor="#AEAEB2"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

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