import React, { useEffect, useState } from 'react';
import { StyleSheet,Platform, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}
export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'User' });
  const IP = "192.168.1.229";
  const SITE_ID = 1;

  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://${IP}:8000/users/${SITE_ID}`);
      setUsers(await res.json());
    } catch (e) { console.log("Failed to load users"); }
  };

  const handleAddUser = async () => {
    try {
      const res = await fetch(`http://${IP}:8000/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, site_id: SITE_ID })
      });
      if (res.ok) {
        setModalVisible(false);
        fetchUsers();
        Alert.alert("Success", "User added to system");
      }
    } catch (e) { Alert.alert("Error", "Check your connection"); }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Users</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="person-add" size={20} color="#00bcd4" />
          <Text style={styles.addText}> Add User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {users.map((u) => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{u.username[0].toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.uName}>{u.username}</Text>
              <Text style={styles.uEmail}>{u.email}</Text>
              <View style={styles.roleBadge}><Text style={styles.roleText}>{u.role}</Text></View>
            </View>
            <TouchableOpacity onPress={() => {/* كود الحذف */}}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal إضافة مستخدم - مطابق لصورة 4.9 */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#4b5563" onChangeText={(t) => setNewUser({...newUser, username: t})} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#4b5563" onChangeText={(t) => setNewUser({...newUser, email: t})} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry={true} placeholderTextColor="#4b5563" onChangeText={(t) => setNewUser({...newUser, password: t})} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddUser}>
              <Text style={styles.saveBtnText}>Save User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, 
    backgroundColor: '#0a0c10', 
    paddingLeft: Platform.OS === 'web' ? 270 : 20, // نزيح المحتوى لو ويب
    paddingRight: 20,
    paddingTop: 60},
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center' },
  addText: { color: '#00bcd4', fontWeight: 'bold' },
  userCard: { backgroundColor: '#161b22', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#30363d' },
  avatar: { width: 45, height: 45, backgroundColor: '#00bcd4', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  info: { flex: 1, marginLeft: 15 },
  uName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  uEmail: { color: '#94a3b8', fontSize: 12 },
  roleBadge: { backgroundColor: '#0e1621', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginTop: 5 },
  roleText: { color: '#00bcd4', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#161b22', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#30363d' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#0a0c10', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#30363d' },
  saveBtn: { backgroundColor: '#00bcd4', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { marginTop: 15, alignItems: 'center' },
  closeBtnText: { color: '#94a3b8' }
});