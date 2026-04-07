import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator,Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// تعريف أنواع البيانات لتجنب أخطاء TypeScript
interface Device {
  id: number;
  name: string;
  type?: string;
  ip_address?: string;
  status_text: string;
  is_active: number;
}

export default function DevicesScreen() {
  const [cameras, setCameras] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const SITE_ID = 1; // الموقع الافتراضي
  const IP = "192.168.1.229";

  const fetchData = async () => {
    try {
      const [camRes, senRes] = await Promise.all([
        fetch(`http://${IP}:8000/cameras/${SITE_ID}`),
        fetch(`http://${IP}:8000/sensors/${SITE_ID}`)
      ]);
      setCameras(await camRes.json());
      setSensors(await senRes.json());
    } catch (e) {
      console.log("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (type: 'camera' | 'sensor', id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? false : true;
      await fetch(`http://${IP}:8000/devices/toggle/${type}/${id}?status=${newStatus}`, { method: 'PATCH' });
      fetchData(); // تحديث القائمة بعد التغيير
    } catch (e) {
      Alert.alert("Error", "Could not update device status");
    }
  };

  const deleteDevice = (type: 'camera' | 'sensor', id: number) => {
    Alert.alert("Confirm Delete", "Are you sure you want to remove this hardware?", [
      { text: "Cancel" },
      { text: "Delete", onPress: async () => {
          await fetch(`http://${IP}:8000/devices/delete/${type}/${id}`, { method: 'DELETE' });
          fetchData();
        }, style: 'destructive' 
      }
    ]);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <ActivityIndicator style={{flex:1, backgroundColor:'#0a0c10'}} color="#00bcd4" />;

  return (
    <ScrollView style={styles.container}>
      {/* قسم الكاميرات - مطابق لصورة 4.7 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CAMERAS</Text>
        <TouchableOpacity style={styles.addBtn}><Text style={styles.addText}>+ Add</Text></TouchableOpacity>
      </View>

      {cameras.map((cam) => (
        <View key={cam.id} style={styles.card}>
          <View style={styles.iconBox}><Ionicons name="videocam" size={24} color="#00bcd4" /></View>
          <View style={styles.info}>
            <Text style={styles.deviceName}>{cam.name}</Text>
            <Text style={styles.subText}>{cam.ip_address}</Text>
          </View>
          <Switch 
            value={cam.is_active === 1} 
            onValueChange={() => toggleDevice('camera', cam.id, cam.is_active)}
            trackColor={{ false: "#161b22", true: "#00bcd4" }}
          />
          <TouchableOpacity onPress={() => deleteDevice('camera', cam.id)}>
            <Ionicons name="trash-outline" size={20} color="#4b5563" style={{marginLeft: 15}} />
          </TouchableOpacity>
        </View>
      ))}

      {/* قسم الحساسات - مطابق لصورة 4.7 */}
      <View style={[styles.sectionHeader, {marginTop: 30}]}>
        <Text style={styles.sectionTitle}>SENSORS (RESULTS VISIBLE TO USER)</Text>
        <TouchableOpacity style={styles.addBtn}><Text style={styles.addText}>+ Add</Text></TouchableOpacity>
      </View>

      {sensors.map((sen) => (
        <View key={sen.id} style={styles.card}>
          <View style={[styles.iconBox, {backgroundColor: '#2d1b10'}]}><Ionicons name="wifi" size={24} color="#f97316" /></View>
          <View style={styles.info}>
            <Text style={styles.deviceName}>{sen.type}</Text>
            <Text style={styles.subText}>Hardware Active</Text>
          </View>
          <Text style={[styles.valueText, {color: sen.status_text === 'Clear' ? '#10b981' : '#ef4444'}]}>{sen.status_text}</Text>
          <Switch 
            value={sen.is_active === 1} 
            onValueChange={() => toggleDevice('sensor', sen.id, sen.is_active)}
            trackColor={{ false: "#161b22", true: "#00bcd4" }}
          />
          <TouchableOpacity onPress={() => deleteDevice('sensor', sen.id)}>
            <Ionicons name="trash-outline" size={20} color="#4b5563" style={{marginLeft: 15}} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, 
    backgroundColor: '#0a0c10', 
    paddingLeft: Platform.OS === 'web' ? 270 : 20, // نزيح المحتوى لو ويب
    paddingRight: 20,
    paddingTop: 60 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center' },
  addText: { color: '#00bcd4', fontWeight: 'bold' },
  card: { backgroundColor: '#161b22', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#30363d' },
  iconBox: { width: 45, height: 45, backgroundColor: '#0e1621', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  deviceName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subText: { color: '#4b5563', fontSize: 12, marginTop: 2 },
  valueText: { fontWeight: 'bold', marginRight: 15, fontSize: 12 },
});