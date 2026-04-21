import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Platform, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventsScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>History & Logs</Text>
          <Text style={styles.headerTitle}>Recorded Events</Text>
        </View>
        <TouchableOpacity style={styles.calendarBtn}>
          <Ionicons name="calendar-clear-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          
          <TouchableOpacity style={styles.eventItem} onPress={() => setModalVisible(true)}>
            <View style={styles.iconBox}>
              <Ionicons name="videocam" size={20} color="#007AFF" />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>Motion Event</Text>
              <Text style={styles.eventMeta}>09:15 AM • Lobby Area • 12.4 MB</Text>
            </View>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={14} color="#007AFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.eventItem}>
            <View style={[styles.iconBox, {backgroundColor: '#FFF1F0'}]}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>Entrance Detection</Text>
              <Text style={styles.eventMeta}>08:45 AM • Main Gate • 22.1 MB</Text>
            </View>
            <TouchableOpacity style={styles.playBtn}>
              <Ionicons name="play" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.eventItem}>
            <View style={styles.iconBox}>
              <Ionicons name="image-outline" size={20} color="#007AFF" />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>Manual Snapshot</Text>
              <Text style={styles.eventMeta}>07:30 AM • Parking • 1.5 MB</Text>
            </View>
            <TouchableOpacity style={styles.playBtn}>
              <Ionicons name="eye-outline" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.eventItem}>
            <View style={styles.iconBox}>
              <Ionicons name="videocam" size={20} color="#007AFF" />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>Motion Event</Text>
              <Text style={styles.eventMeta}>05:10 AM • Backyard • 9.8 MB</Text>
            </View>
            <TouchableOpacity style={styles.playBtn}>
              <Ionicons name="play" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Playback Preview</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <View style={styles.videoPlayer}>
              <View style={styles.videoUI}>
                <Ionicons name="play-circle" size={64} color="white" />
              </View>
              <View style={styles.controlBar}>
                <Ionicons name="pause-sharp" size={18} color="white" />
                <View style={styles.progressTrack}>
                  <View style={styles.progressActive} />
                </View>
                <Text style={styles.timerText}>02:45 / 10:00</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#64748B" />
                <Text style={styles.metaText}>Lobby Area</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.metaText}>09:15 AM</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.downloadText}>Download Evidence</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 22,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
  },
  headerSubtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  calendarBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { padding: 20 },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginBottom: 22 },
  
  eventItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  iconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
  eventDetails: { flex: 1, marginLeft: 15 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  eventMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  playBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, paddingBottom: 45 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  
  videoPlayer: { width: '100%', height: 210, backgroundColor: '#0F172A', borderRadius: 24, overflow: 'hidden' },
  videoUI: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controlBar: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(0,0,0,0.4)', gap: 12 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressActive: { width: '45%', height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  timerText: { color: 'white', fontSize: 10, fontWeight: '600' },

  metaRow: { flexDirection: 'row', gap: 25, marginVertical: 25, paddingLeft: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: '#475569', fontWeight: '600' },

  downloadBtn: { backgroundColor: '#1E293B', flexDirection: 'row', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10 },
  downloadText: { color: 'white', fontWeight: '800', fontSize: 16 }
});