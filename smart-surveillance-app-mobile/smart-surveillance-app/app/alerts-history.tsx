import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. تعريف واجهة التنبيه (Alert Interface) لحل مشكلة 'never'
interface AlertLog {
  cam_name: string;
  type: string;
  time: string;
}

export default function AlertsHistory() {
  // 2. تحديد النوع كمصفوفة من الـ AlertLog
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const IP = "192.168.1.229";

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`http://${IP}:8000/alerts`);
      const data = await response.json();
      setAlerts(data);
    } catch (e) { 
      console.log("Fetch Alerts Error:", e); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts History</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#00bcd4" />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />
          }
          renderItem={({ item }) => (
            <View style={styles.alertCard}>
              {/* 3. الخصائص الآن متعرفة و TypeScript مش هيعترض */}
              <View style={[styles.iconCircle, {backgroundColor: item.type === 'Fire' ? '#ef4444' : '#f59e0b'}]}>
                <Ionicons name={item.type === 'Fire' ? 'flame' : 'warning'} size={20} color="#fff" />
              </View>
              <View style={styles.info}>
                <Text style={styles.alertType}>{item.type} Detected</Text>
                <Text style={styles.camName}>Location: {item.cam_name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c10', padding: 25, paddingTop: 60 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  alertCard: { flexDirection: 'row', backgroundColor: '#161b22', padding: 15, borderRadius: 15, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#30363d' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  info: { marginLeft: 15, flex: 1 },
  alertType: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  camName: { color: '#94a3b8', fontSize: 12 },
  time: { color: '#4b5563', fontSize: 10, marginTop: 5 }
});