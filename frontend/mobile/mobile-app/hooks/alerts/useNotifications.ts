// ─── hooks/useNotifications.ts ────────────────────────────────────────────────
// كل اللي بيخص الـ Notifications في مكان واحد

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// ── إعداد الـ handler عند وصول notification ──────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── طلب الإذن وإنشاء channel على Android ─────────────────────────────────────
export const registerForNotifications = async () => {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }

  if (final !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('security', {
      name:             'Security Alerts',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#FF3B30',
      sound:            'default',
    });
  }
};

// ── بعث notification فوري (trigger: null = فوراً) ────────────────────────────
export const sendLocalNotification = async (
  title: string,
  body:  string,
  data?: object,
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound:    'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
};