import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // مكتبة الأيقونات المتوافقة مع التصميم

export default function UserTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0c10' }, // لون الخلفية الداكن من التصميم
        headerTintColor: '#fff',
        tabBarStyle: { 
          backgroundColor: '#0a0c10', 
          borderTopColor: '#161b22',
          height: 65,
          paddingBottom: 10
        },
        tabBarActiveTintColor: '#00bcd4', // اللون التيل للأيقونة النشطة
        tabBarInactiveTintColor: '#4b5563', // اللون الرمادي للأيقونات غير النشطة
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      {/* 1. شاشة البث المباشر (Live) - صفحة 33 [cite: 2569] */}
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          headerTitle: 'Live Monitoring',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "videocam" : "videocam-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 2. شاشة إدارة الوجوه (Faces) - صفحة 41 [cite: 2672] */}
      <Tabs.Screen
        name="faces"
        options={{
          title: 'Faces',
          headerTitle: 'Identity Management',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* شاشة الـ AI Scan تم استبعادها بناءً على طلبك */}
      <Tabs.Screen
        name="ai-scan"
        options={{
          href: null, // هذا السطر يخفي التاب تماماً من الشريط السفلي
        }}
      />

      {/* 3. شاشة التنبيهات (Alerts) - صفحة 35 [cite: 2594] */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          headerTitle: 'Security Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 4. شاشة الأحداث المسجلة (Events) - صفحة 39 [cite: 2644] */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          headerTitle: 'Recorded Events',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}