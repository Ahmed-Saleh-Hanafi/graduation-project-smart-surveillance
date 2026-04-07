import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. تعريف واجهة الكاميرا (Camera Interface) لحل مشكلة 'never'
interface Camera {
  name: string;
  location: string;
  ip?: string; // علامة الاستفهام تعني أن الحقل اختياري
}

export default function UserDashboard() {
  // 2. تحديد نوع الـ State كمصفوفة من الكاميرات <Camera[]>
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const IP = "192.168.1.229";

  useEffect(() => {
    fetch(`http://${IP}:8000/cameras`)
      .then(res => res.json())
      .then(data => {
        setCameras(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Monitoring</Text>
        <Ionicons name="notifications" size={24} color="#ff9800" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00bcd4" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cameras}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.streamContainer}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.liveBadge}>● LIVE</Text>
                <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.5)" />
              </View>
              <View style={styles.streamInfo}>
                {/* 3. الآن TypeScript تعرف أن item يمتلك name و location */}
                <Text style={styles.streamName}>{item.name}</Text>
                <Text style={styles.streamLoc}>{item.location}</Text>
              </View>
              
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c10', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  streamContainer: { backgroundColor: '#161b22', marginHorizontal: 20, borderRadius: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#30363d' },
  videoPlaceholder: { height: 200, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#ef4444', color: '#fff', paddingHorizontal: 8, borderRadius: 5, fontSize: 10, fontWeight: 'bold' },
  streamInfo: { padding: 15 },
  streamName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  streamLoc: { color: '#94a3b8', fontSize: 12 }
});