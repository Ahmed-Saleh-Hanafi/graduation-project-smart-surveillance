import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CameraDetails() {
  // استلام البيانات من الشاشة السابقة (الداشبورد)
  const { name, ip, location, site_id } = useLocalSearchParams();
  const router = useRouter();

  // دالة لمشاركة لقطة من الكاميرا (Snapshot) - ميزة احترافية للمناقشة
  const handleSnapshot = async () => {
    try {
      await Share.share({
        message: `Alert: Static image from ${name} at ${location}. System Site ID: ${site_id}`,
      });
    } catch (error) {
      console.log("Share failed");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - اسم الكاميرا والموقع التقني */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-circle" size={40} color="#00bcd4" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.siteText}>Encrypted Stream • Site {site_id}</Text>
        </View>
      </View>

      {/* Video Feed Box - محاكي البث المباشر */}
      <View style={styles.videoBox}>
        {/* سيتم وضع WebView أو Video Player هنا لربط الـ RTSP لاحقاً */}
        <View style={styles.liveBadge}>
          <View style={styles.redDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Ionicons name="videocam" size={80} color="rgba(0, 188, 212, 0.2)" />
        <Text style={styles.loadingText}>Establishing Secure Connection to {ip}...</Text>
      </View>

      {/* Quick Controls - التحكم في الكاميرا */}
      <View style={styles.controls}>
        <ControlBtn icon="mic" label="Talk" />
        <ControlBtn icon="radio-button-on" label="Record" color="#ef4444" />
        <ControlBtn 
          icon="camera" 
          label="Snapshot" 
          onPress={handleSnapshot}
          color="#00bcd4" 
        />
        <ControlBtn icon="volume-high" label="Listen" />
      </View>

      {/* Technical Details - البيانات الفنية من الـ ERD */}
      <View style={styles.detailsBox}>
        <Text style={styles.sectionTitle}>Technical Specifications</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={18} color="#94a3b8" />
          <Text style={styles.detailLabel}>Physical Location: <Text style={styles.detailValue}>{location}</Text></Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#94a3b8" />
          <Text style={styles.detailLabel}>Security Status: <Text style={[styles.detailValue, {color: '#10b981'}]}>End-to-End Encrypted</Text></Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="hardware-chip-outline" size={18} color="#94a3b8" />
          <Text style={styles.detailLabel}>Protocol: <Text style={styles.detailValue}>RTSP / H.264</Text></Text>
        </View>
      </View>
    </View>
  );
}

// مكون الزرار المنفصل مع دعم الـ onPress
const ControlBtn = ({icon, label, color = "#161b22", onPress}: any) => (
  <TouchableOpacity 
    style={[styles.btn, {backgroundColor: color}]} 
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color="#fff" />
    <Text style={styles.btnLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 25, paddingTop: 60, backgroundColor: '#0a0c10' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  siteText: { color: '#00bcd4', fontSize: 10, letterSpacing: 1, fontWeight: 'bold' },
  videoBox: { 
    width: '100%', 
    height: Dimensions.get('window').width * 0.7, 
    backgroundColor: '#050505', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#161b22'
  },
  liveBadge: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 5, borderRadius: 5 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 5 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  loadingText: { color: '#4b5563', marginTop: 15, fontSize: 11, letterSpacing: 1 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', padding: 20, marginTop: 10 },
  btn: { width: '45%', padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#30363d' },
  btnLabel: { color: '#fff', fontSize: 12, marginTop: 8, fontWeight: 'bold', letterSpacing: 1 },
  detailsBox: { padding: 30, backgroundColor: '#0a0c10', flex: 1, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: 10 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailLabel: { color: '#94a3b8', fontSize: 13, marginLeft: 10 },
  detailValue: { color: '#fff', fontWeight: '700' }
});