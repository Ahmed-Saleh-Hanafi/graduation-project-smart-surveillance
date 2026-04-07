import React from 'react';
import { View, Text, Switch,Platform , StyleSheet } from 'react-native';

export default function SettingsScreen() {
  const [isAlarmOn, setIsAlarmOn] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Enable Siren Alarm</Text>
        <Switch value={isAlarmOn} onValueChange={setIsAlarmOn} thumbColor="#00bcd4" />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Cloud Backup</Text>
        <Switch value={false} disabled />
      </View>
      <Text style={styles.version}>App Version: 1.0.0 (Stable)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, 
      backgroundColor: '#0a0c10', 
      paddingLeft: Platform.OS === 'web' ? 270 : 20, // نزيح المحتوى لو ويب
      paddingRight: 20,
      paddingTop: 60 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161b22', padding: 20, borderRadius: 15, marginBottom: 15 },
  settingText: { color: '#fff', fontSize: 16 },
  version: { color: '#4b5563', textAlign: 'center', marginTop: 50, fontSize: 12 }
});