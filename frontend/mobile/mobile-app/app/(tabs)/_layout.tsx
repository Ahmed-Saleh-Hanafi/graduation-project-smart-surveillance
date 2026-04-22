import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const WHITE    = '#FFFFFF';
const BLACK    = '#1C1C1E';
const ACTIVE   = '#007AFF';
const INACTIVE = '#AEAEB2';

function CamGuardHeader() {
  return (
    <Image
      source={require('../../assets/images/logo.png')}
      style={{ width: 120, height: 70 }}
      resizeMode="contain"
    />
  );
}

function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.logoutBtn}>
      <Ionicons name="exit-outline" size={17} color={INACTIVE} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: WHITE },
        headerTitle: () => <CamGuardHeader />,
        headerRight: () => <LogoutButton onPress={handleLogout} />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0,0,0,0.07)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 10,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          headerTitle: () => <CamGuardHeader />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'videocam' : 'videocam-outline'} size={27} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="faces"
        options={{
          title: 'Faces',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={27} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={27} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={27} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="ai-scan" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
  },
  nameDark: {
    fontSize: 18,
    fontWeight: '800',
    color: BLACK,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  nameBlue: {
    fontSize: 18,
    fontWeight: '800',
    color: ACTIVE,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  tagline: {
    fontSize: 8,
    fontWeight: '600',
    color: INACTIVE,
    letterSpacing: 1.8,
    marginTop: 1,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});