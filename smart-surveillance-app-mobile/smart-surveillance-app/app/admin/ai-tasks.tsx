import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator,Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


// Interface لضمان استقرار البيانات في الويب والموبايل
interface AITask {
  id: number;
  task_type: string;
  camera_name: string;
  status: string;
  scheduled_time: string;
}

export default function AITasksScreen() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const IP = "192.168.1.229"; 
  const SITE_ID = 1;

  useEffect(() => {
    fetch(`http://${IP}:8000/ai-tasks/${SITE_ID}`)
      .then(res => res.json())
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Processing Queue</Text>
        <TouchableOpacity style={styles.scheduleBtn}>
          <Ionicons name="time" size={18} color="#fff" />
          <Text style={styles.btnText}> Schedule Task</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#00bcd4" /> : 
        tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.task_type}</Text>
              <Text style={styles.taskSub}>{task.camera_name} • {task.scheduled_time || 'Continuous'}</Text>
            </View>
            <View style={[styles.statusBadge, {backgroundColor: task.status === 'Running' ? '#064e3b' : '#1e1b4b'}]}>
              <Text style={[styles.statusText, {color: task.status === 'Running' ? '#10b981' : '#94a3b8'}]}>{task.status}</Text>
            </View>
            <Ionicons name="trash-outline" size={20} color="#4b5563" />
          </View>
        ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    
  container: {  flex: 1, 
    backgroundColor: '#0a0c10', 
    paddingLeft: Platform.OS === 'web' ? 270 : 20, // نزيح المحتوى لو ويب
    paddingRight: 20,
    paddingTop: 60  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scheduleBtn: { backgroundColor: '#7c3aed', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  taskCard: { backgroundColor: '#161b22', padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#30363d' },
  taskInfo: { flex: 1 },
  taskTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  taskSub: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 15 },
  statusText: { fontSize: 10, fontWeight: 'bold' }
});