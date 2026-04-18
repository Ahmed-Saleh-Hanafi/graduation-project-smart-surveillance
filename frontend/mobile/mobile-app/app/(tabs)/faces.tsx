import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Platform,
  KeyboardAvoidingView 
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function FacesScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Security Assets</Text>
          <Text style={styles.headerTitle}>Face Database</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)} 
        >
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add Face</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        <View style={styles.card}>
          <View style={[styles.indicator, { backgroundColor: '#34C759' }]} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=1' }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>Alice Smith</Text>
            <Text style={styles.role}>Staff / Manager</Text>
            <View style={styles.whitelistBadge}><Text style={styles.badgeText}>WHITELIST</Text></View>
          </View>
          <TouchableOpacity style={styles.deleteCircle}>
            <Feather name="trash-2" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* كارت تجريبي 2 */}
        <View style={styles.card}>
          <View style={[styles.indicator, { backgroundColor: '#FF3B30' }]} />
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=2' }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>Unknown Subject</Text>
            <Text style={styles.role}>Threat Detected</Text>
            <View style={styles.blacklistBadge}><Text style={styles.badgeText}>BLACKLIST</Text></View>
          </View>
          <TouchableOpacity style={styles.deleteCircle}>
            <Feather name="trash-2" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Face</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#CBD5E0" />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadSection}>
              <TouchableOpacity style={styles.uploadCircle}>
                <Ionicons name="camera" size={35} color="#007AFF" />
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#A0AEC0" />
            <TextInput style={styles.input} placeholder="Job Title / Role" placeholderTextColor="#A0AEC0" />
            
            <View style={[styles.input, styles.dropdown]}>
              <Text style={{color: '#2D3748'}}>Access Level: Whitelist</Text>
              <Ionicons name="chevron-down" size={20} color="#007AFF" />
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => setModalVisible(false)} 
            >
              <Text style={styles.saveButtonText}>Save Identity</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerSubtitle: { fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  addButton: { backgroundColor: '#007AFF', flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 5 },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, flexDirection: 'row', padding: 15, marginBottom: 15, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  avatar: { width: 65, height: 65, borderRadius: 15, backgroundColor: '#F0F0F0' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  role: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  whitelistBadge: { backgroundColor: '#E8F9EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  blacklistBadge: { backgroundColor: '#FFEBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#2D3748' },
  deleteCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  uploadSection: { alignItems: 'center', marginBottom: 20 },
  uploadCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F7FF' },
  uploadText: { fontSize: 12, color: '#007AFF', marginTop: 5, fontWeight: '700' },
  input: { backgroundColor: '#F7F8FA', borderRadius: 15, padding: 15, marginBottom: 15, color: '#1C1C1E', borderWidth: 1, borderColor: '#EDEFF2' },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});