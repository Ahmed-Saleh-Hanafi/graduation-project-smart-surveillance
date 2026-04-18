import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LOCATIONS = ["All", "Main Gate", "Lobby", "Parking Lot", "Kitchen", "Backyard"];
const CAMERAS = [
  { id: '1', name: 'Main Gate', uri: 'https://via.placeholder.com/600/400', status: 'LIVE' },
  { id: '2', name: 'Lobby', uri: 'https://via.placeholder.com/600/401', status: 'LIVE' },
  { id: '3', name: 'Parking Lot', uri: 'https://via.placeholder.com/600/402', status: 'IDLE' },
];

export default function LiveScreen() {
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [activeCamera, setActiveCamera] = useState(CAMERAS[0]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={styles.filterWrapper}>
          <FlatList
            horizontal
            data={LOCATIONS}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.filterBtn, selectedLocation === item && styles.filterBtnActive]}
                onPress={() => setSelectedLocation(item)}
              >
                <Text style={[styles.filterText, selectedLocation === item && styles.filterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        <View style={styles.mainStreamCard}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: activeCamera.uri }} style={styles.mainImage} />
            <View style={styles.liveBadge}>
              <View style={[styles.redDot, activeCamera.status !== 'LIVE' && {backgroundColor: '#ccc'}]} />
              <Text style={styles.liveText}>{activeCamera.status}</Text>
            </View>
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>{activeCamera.name}</Text>
            </View>
            
            <View style={styles.controlsOverlay}>
              <TouchableOpacity style={styles.controlBtn}><Ionicons name="chevron-up" size={20} color="#fff" /></TouchableOpacity>
              <View style={styles.rowControls}>
                <TouchableOpacity style={styles.controlBtn}><Ionicons name="chevron-back" size={20} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.centerBtn}><Ionicons name="scan-outline" size={20} color="#007AFF" /></TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn}><Ionicons name="chevron-forward" size={20} color="#fff" /></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.controlBtn}><Ionicons name="chevron-down" size={20} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Switch Camera</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cameraPicker}>
          {CAMERAS.map((cam) => (
            <TouchableOpacity 
              key={cam.id} 
              style={[styles.smallCard, activeCamera.id === cam.id && styles.activeSmallCard]}
              onPress={() => setActiveCamera(cam)}
            >
              <Image source={{ uri: cam.uri }} style={styles.smallImage} />
              <View style={styles.smallBadge}><Text style={styles.smallBadgeText}>{cam.name}</Text></View>
              {activeCamera.id === cam.id && (
                <View style={styles.activeCheck}><Ionicons name="checkmark-circle" size={18} color="#007AFF" /></View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Sensors Overview</Text>
          <TouchableOpacity><Text style={styles.seeAll}>View Details</Text></TouchableOpacity>
        </View>

        <View style={styles.sensorsGrid}>
          <TouchableOpacity style={styles.sensorCard}>
            <View style={[styles.sensorIconBg, {backgroundColor: '#E3F2FD'}]}>
              <MaterialCommunityIcons name="smoke-detector" size={22} color="#1976D2" />
            </View>
            <Text style={styles.sensorLabel}>Smoke</Text>
            <Text style={styles.sensorVal}>0 PPM</Text>
            <Text style={styles.statusOk}>Normal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sensorCard}>
            <View style={[styles.sensorIconBg, {backgroundColor: '#FFF3E0'}]}>
              <MaterialCommunityIcons name="thermometer" size={22} color="#F57C00" />
            </View>
            <Text style={styles.sensorLabel}>Temp</Text>
            <Text style={styles.sensorVal}>24°C</Text>
            <Text style={styles.statusOk}>Stable</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFDFF' },
  filterWrapper: { marginVertical: 15 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F2F5', marginRight: 10 },
  filterBtnActive: { backgroundColor: '#007AFF' },
  filterText: { color: '#65676B', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#FFF' },
  
  mainStreamCard: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  imageWrapper: { height: 230, width: '100%' },
  mainImage: { width: '100%', height: '100%' },
  liveBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 6 },
  liveText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  locationBadge: { position: 'absolute', bottom: 15, left: 15, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  locationText: { color: '#1A1A1A', fontSize: 12, fontWeight: '700' },

  controlsOverlay: { position: 'absolute', right: 15, bottom: 15, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 10, alignItems: 'center' },
  centerBtn: { backgroundColor: '#FFF', borderRadius: 10, padding: 4 },
  controlBtn: { padding: 5 },
  rowControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 16, marginTop: 25, marginBottom: 15 },
  cameraPicker: { paddingLeft: 16, marginBottom: 10 },
  smallCard: { width: 140, height: 90, borderRadius: 16, marginRight: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  activeSmallCard: { borderColor: '#007AFF' },
  smallImage: { width: '100%', height: '100%' },
  activeCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 10 },
  smallBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, borderRadius: 4 },
  smallBadgeText: { color: '#FFF', fontSize: 9 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
  seeAll: { color: '#007AFF', fontSize: 13, fontWeight: '600', marginTop: 20 },
  sensorsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 30 },
  sensorCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  sensorIconBg: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  sensorLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  sensorVal: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  statusOk: { fontSize: 10, color: '#34C759', fontWeight: '600', marginTop: 4 }
});