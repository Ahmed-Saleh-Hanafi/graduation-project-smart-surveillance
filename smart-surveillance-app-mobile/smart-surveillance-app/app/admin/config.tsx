import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, TouchableOpacity, Alert ,Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ConfigScreen() {
  const [notifications, setNotifications] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [highAccuracy, setHighAccuracy] = useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Stay" },
      { text: "Logout", style: 'destructive', onPress: () => console.log("Logout Pressed") }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>System Configuration</Text>

      {/* قسم التنبيهات */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#00bcd4' }} />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Email Alerts</Text>
          <Switch value={true} trackColor={{ true: '#00bcd4' }} />
        </View>
      </View>

      {/* قسم التخزين والربط (Cloud) */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>STORAGE & CLOUD</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Cloud Sync</Text>
          <Switch value={cloudSync} onValueChange={setCloudSync} trackColor={{ true: '#00bcd4' }} />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Storage Retention (Days)</Text>
          <Text style={styles.valueText}>7 Days</Text>
        </View>
      </View>

      {/* قسم إعدادات الـ AI الفنية */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>AI PRECISION</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>High Accuracy Mode</Text>
          <Switch value={highAccuracy} onValueChange={setHighAccuracy} trackColor={{ true: '#00bcd4' }} />
        </View>
      </View>

      {/* أزرار الإجراءات */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out from Site</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>App Version 1.0.0 • Admin Mode</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, 
    backgroundColor: '#0a0c10', 
    paddingLeft: Platform.OS === 'web' ? 270 : 20, // نزيح المحتوى لو ويب
    paddingRight: 20,
    paddingTop: 60 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { marginBottom: 35 },
  sectionHeader: { color: '#4b5563', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  settingItem: { 
    backgroundColor: '#161b22', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  settingText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  valueText: { color: '#00bcd4', fontWeight: 'bold' },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#1c0d0d', 
    padding: 15, 
    borderRadius: 12, 
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#450a0a'
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 10 },
  footer: { color: '#4b5563', textAlign: 'center', marginTop: 40, fontSize: 12, marginBottom: 40 }
});