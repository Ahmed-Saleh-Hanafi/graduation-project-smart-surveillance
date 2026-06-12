import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Face } from '../../constants/faces/types';
import { styles } from '../../styles/faces/facesStyles';

interface FaceCardProps {
  face: Face;
  onDelete: (face: Face) => void;
}

export const FaceCard = ({ face, onDelete }: FaceCardProps) => (
  <View style={styles.card}>
    <Image source={{ uri: face.imageUrl }} style={styles.avatar} resizeMode="cover" />
    <View style={styles.cardInfo}>
      <Text style={styles.cardName} numberOfLines={1}>{face.name}</Text>
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