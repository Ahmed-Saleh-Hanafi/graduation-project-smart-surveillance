import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Real-time Monitoring</Text>
          <Text style={styles.headerTitle}>Security Alerts</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="filter-circle-outline" size={26} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <View style={[styles.indicator, { backgroundColor: '#FF3B30' }]} />
          
          <View style={styles.cardContent}>
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/300x200/e0e0e0/555' }} // استبدلها بصورة الكاميرا
                style={styles.alertImage} 
              />
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>10:42 AM</Text>
              </View>
            </View>

            <View style={styles.detailsWrapper}>
              <View style={styles.titleRow}>
                <Text style={styles.alertTitle}>Unrecognized Person</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
              
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#8E8E93" />
                <Text style={styles.locationText}>Main Gate • Camera 03</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.resolveBtn}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                  <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.indicator, { backgroundColor: '#FF9500' }]} />
          
          <View style={styles.cardContent}>
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/300x200/e0e0e0/555' }} // صورة الباب
                style={styles.alertImage} 
              />
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>09:15 AM</Text>
              </View>
            </View>

            <View style={styles.detailsWrapper}>
              <View style={styles.titleRow}>
                <Text style={styles.alertTitle}>Door Forced Open</Text>
                <View style={styles.resolvedBadge}>
                  <Text style={styles.resolvedText}>Resolved</Text>
                </View>
              </View>
              
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="door-open" size={12} color="#8E8E93" />
                <Text style={styles.locationText}>Back Exit • Sensor D1</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.viewBtn, { flex: 1, marginLeft: 0 }]}>
                  <Ionicons name="eye-outline" size={14} color="#007AFF" />
                  <Text style={[styles.viewBtnText, {marginLeft: 5}]}>Review Event Logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB', 
  },
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
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  iconButton: {
    padding: 5,
  },
  listContainer: {
    padding: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, 
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6, 
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
    paddingLeft: 20, 
    alignItems: 'center',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  alertImage: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  detailsWrapper: {
    flex: 1,
    marginLeft: 15,
    height: 100,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -5,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  pendingBadge: {
    backgroundColor: '#FFF1F0', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CF1322', 
  },
  resolvedBadge: {
    backgroundColor: '#FFFBE6', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resolvedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D46B08', 
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },
  resolveBtn: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
    flex: 1.2,
  },
  resolveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewBtn: {
    backgroundColor: '#F0F7FF', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row'
  },
  viewBtnText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
});