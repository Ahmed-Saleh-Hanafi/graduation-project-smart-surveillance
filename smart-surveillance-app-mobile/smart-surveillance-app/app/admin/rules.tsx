import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, Text, View, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Rule {
  id: number;
  rule_name: string;
  trigger_condition: string;
  action_task: string;
  is_active: number;
}

export default function RulesScreen() {
  // وضع مصفوفة فارغة لمنع خطأ .map is not a function
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  
  const IP = "192.168.1.229";
  const SITE_ID = 1;

  useEffect(() => {
    fetch(`http://${IP}:8000/rules/${SITE_ID}`)
      .then(res => res.json())
      .then(data => {
        // التأكد أن البيانات القادمة مصفوفة فعلاً
        setRules(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Rules fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Automation Engine</Text>
          <Text style={styles.subtitle}>Smart Response Protocols</Text>
        </View>
        <TouchableOpacity style={styles.newRuleBtn}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.btnText}> New Rule</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#00bcd4" style={{ marginTop: 50 }} />
      ) : rules?.length > 0 ? (
        rules.map((rule) => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View style={styles.nameRow}>
                <Ionicons name="flash" size={16} color="#00bcd4" style={{ marginRight: 8 }} />
                <Text style={styles.ruleName}>{rule.rule_name}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="trash-outline" size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.logicContainer}>
              <View style={styles.ifBadge}>
                <Text style={styles.badgeLabel}>IF</Text>
                <Text style={styles.logicText}>{rule.trigger_condition}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#30363d" style={{ alignSelf: 'center' }} />
              <View style={styles.thenBadge}>
                <Text style={styles.badgeLabel}>THEN</Text>
                <Text style={styles.logicText}>{rule.action_task}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: rule.is_active === 1 ? '#10b981' : '#4b5563' }]} />
                <Text style={styles.statusLabel}>{rule.is_active === 1 ? 'Active' : 'Disabled'}</Text>
              </View>
              <Switch 
                value={rule.is_active === 1} 
                trackColor={{ false: "#161b22", true: "#00bcd4" }} 
                thumbColor={rule.is_active === 1 ? "#fff" : "#94a3b8"}
              />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={50} color="#161b22" />
          <Text style={styles.emptyText}>No automation rules configured yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#05070a', 
    paddingLeft: Platform.OS === 'web' ? 260 : 20, 
    paddingRight: 20,
    paddingTop: Platform.OS === 'web' ? 90 : 60 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#00bcd4', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginTop: 4 },
  newRuleBtn: { 
    backgroundColor: '#00bcd4', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  ruleCard: { 
    backgroundColor: '#0d1117', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#30363d' 
  },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  ruleName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  logicContainer: { flexDirection: 'column', gap: 8, marginBottom: 20 },
  ifBadge: { 
    backgroundColor: '#161b22', 
    padding: 12, 
    borderRadius: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: '#94a3b8',
    flexDirection: 'row',
    alignItems: 'center'
  },
  thenBadge: { 
    backgroundColor: 'rgba(0, 188, 212, 0.05)', 
    padding: 12, 
    borderRadius: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: '#00bcd4',
    flexDirection: 'row',
    alignItems: 'center'
  },
  badgeLabel: { color: '#8b949e', fontWeight: '900', fontSize: 10, marginRight: 10, width: 40 },
  logicText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  statusRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#1b1f24' 
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#4b5563', marginTop: 15, fontSize: 14 }
});