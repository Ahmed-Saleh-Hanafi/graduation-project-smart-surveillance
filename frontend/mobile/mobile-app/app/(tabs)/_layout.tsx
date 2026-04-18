import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // إعدادات الهيدر (العنوان العلوي)
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff', // خلفية بيضاء نقية
          elevation: 0, // إلغاء الظل في أندرويد
          shadowOpacity: 0, // إلغاء الظل في iOS
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#1a1a1a',
          fontSize: 18,
        },
        
        // إعدادات شريط التاب السفلي
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          // تأثير ظل خفيف لإعطاء لمسة عصرية
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
        },
        
        tabBarActiveTintColor: '#007AFF', // لون أزرق "Apple Style" هادئ
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      {/* 1. صفحة تسجيل الدخول - مخفية من التاب بار */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Login",
          headerShown: false, // إخفاء الهيدر في صفحة اللوجن
          tabBarButton: () => null, // حذف الزر من التاب بار تماماً
          tabBarStyle: { display: "none" }, // التأكيد على إخفاء الشريط
        }}
      />

      {/* 2. شاشة البث المباشر (Home/Live) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Monitor',
          headerTitle: 'Live Stream',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "videocam" : "videocam-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 3. شاشة إدارة الوجوه */}
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

      {/* 4. شاشة التنبيهات */}
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

      {/* 5. شاشة الأحداث */}
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

      {/* شاشة الـ AI Scan مخفية تماماً */}
      <Tabs.Screen
        name="ai-scan"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}