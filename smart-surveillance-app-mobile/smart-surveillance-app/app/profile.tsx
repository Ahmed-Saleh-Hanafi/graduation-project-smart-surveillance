import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert,Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => router.replace('/') }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Ionicons name="person" size={50} color="#fff" /></View>
        <Text style={styles.userName}>System Administrator</Text>
        <Text style={styles.userEmail}>admin@sys.com</Text>
      </View>

      <View style={styles.menu}>
        <MenuBtn icon="shield-half" label="Security Settings" />
        <MenuBtn icon="notifications-outline" label="Notification Prefs" />
        <MenuBtn icon="help-circle-outline" label="Support" />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MenuBtn = ({icon, label}: any) => (
  <TouchableOpacity style={styles.menuItem}>
    <Ionicons name={icon} size={22} color="#94a3b8" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color="#30363d" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, 
    backgroundColor: '#0a0c10', 
    paddingLeft: Platform.OS === 'web' ? 270 : 20, // نزيح المحتوى لو ويب
    paddingRight: 20,
    paddingTop: 60 },
  profileHeader: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#161b22', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#00bcd4' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userEmail: { color: '#4b5563', fontSize: 14 },
  menu: { width: '100%' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', padding: 18, borderRadius: 15, marginBottom: 12 },
  menuLabel: { color: '#fff', flex: 1, marginLeft: 15, fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 15 },
  logoutText: { color: '#ef4444', marginLeft: 10, fontSize: 16, fontWeight: 'bold' }
});