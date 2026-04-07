import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Platform, View, Text, TouchableOpacity } from 'react-native';

export default function AdminLayout() {
  const isWeb = Platform.OS === 'web';
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <View style={{ flex: 1, flexDirection: isWeb ? 'row' : 'column', backgroundColor: '#05070a' }}>
      
      {/* 1. Web Header - يظهر في اللابتوب فقط بشكل بروفيشنال */}
      {isWeb && (
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={() => setIsCollapsed(!isCollapsed)} style={styles.menuBtn}>
            <Ionicons name={isCollapsed ? "menu" : "chevron-back"} size={24} color="#00bcd4" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>S³ SYSTEM <Text style={styles.adminBadge}>ADMIN PANEL</Text></Text>
          </View>
          <View style={styles.adminProfile}>
            <Text style={styles.adminName}>Radwa Almodather</Text>
            <View style={styles.avatar}><Text style={{color:'#fff', fontSize:10}}>RA</Text></View>
          </View>
        </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            isWeb 
              ? (isCollapsed ? styles.webSidebarCollapsed : styles.webSidebarOpen) 
              : styles.mobileTabs
          ],
          tabBarActiveTintColor: '#00bcd4',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarLabelPosition: isWeb ? 'beside-icon' : 'below-icon',
          tabBarShowLabel: isWeb ? !isCollapsed : true, 
          tabBarItemStyle: isWeb ? styles.webItem : styles.mobileItem,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        {/* شاشة الأجهزة (Devices) - إدارة الكاميرات والحساسات (صفحة 47) */}
        <Tabs.Screen
          name="devices"
          options={{
            title: 'Devices',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "hardware-chip" : "hardware-chip-outline"} size={22} color={color} />
            ),
          }}
        />

        {/* شاشة المستخدمين (Users) - إدارة الأدوار والوصول (صفحة 45) */}
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
            ),
          }}
        />

        {/* شاشة مهام الذكاء الاصطناعي (AI Tasks) - جدولة التحليل (صفحة 44) */}
        <Tabs.Screen
          name="ai-tasks"
          options={{
            title: 'AI Tasks',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="brain" size={24} color={color} />
            ),
          }}
        />

        {/* شاشة القواعد (Rules) - محرك الأتمتة IF-THEN (صفحة 42) */}
        <Tabs.Screen
          name="rules"
          options={{
            title: 'Rules',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "flash" : "flash-outline"} size={22} color={color} />
            ),
          }}
        />

        {/* شاشة الإعدادات (Config) - ضبط النظام العام (صفحة 43) */}
        <Tabs.Screen
          name="config"
          options={{
            title: 'Config',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "options" : "options-outline"} size={22} color={color} />
            ),
          }}
        />

        {/* إخفاء الصفحات الفرعية من الـ Sidebar لعدم التكرار */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="alerts-history" options={{ href: null }} />
        <Tabs.Screen name="camera-details" options={{ href: null }} />
        <Tabs.Screen name="user-dashboard" options={{ href: null }} />
        <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
        <Tabs.Screen name="admin-add-camera" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0c10',
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#1b1f24',
    elevation: 0,
  },
  // ويب - سايد بار مفتوح
  webSidebarOpen: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 240,
    flexDirection: 'column',
    paddingTop: 80, 
  },
  // ويب - سايد بار متقلص
  webSidebarCollapsed: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 70,
    flexDirection: 'column',
    paddingTop: 80,
  },
  mobileTabs: {
    height: 70,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#1b1f24',
  },
  webItem: {
    height: 50,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 10,
    marginVertical: 4,
    justifyContent: 'flex-start',
    paddingLeft: 10,
  },
  mobileItem: {
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: Platform.OS === 'web' ? 10 : 0,
  },
  // استايل الهيدر للابتوب
  webHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 65,
    backgroundColor: '#0a0c10',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1b1f24',
    zIndex: 1000,
  },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  adminBadge: { fontSize: 10, color: '#00bcd4', fontWeight: '400' },
  menuBtn: { marginRight: 20, padding: 5 },
  adminProfile: { flexDirection: 'row', alignItems: 'center' },
  adminName: { color: '#94a3b8', fontSize: 12, marginRight: 12, fontWeight: '600' },
  avatar: { 
    width: 30, height: 30, borderRadius: 15, 
    backgroundColor: '#00bcd4', justifyContent: 'center', alignItems: 'center' 
  },
});