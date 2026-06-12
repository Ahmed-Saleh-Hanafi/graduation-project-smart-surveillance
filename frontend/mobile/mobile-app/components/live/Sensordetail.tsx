import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  Animated, Easing, Dimensions, StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Sensor } from '../../constants/live/types';
import { styles } from '../../styles/live/styles';
import Sparkline from './Sparkline';

const { width } = Dimensions.get('window');

type SensorDetailProps = {
  sensor: Sensor;
  onClose: () => void;
};

const SensorDetail = ({ sensor, onClose }: SensorDetailProps) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () =>
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);

  const pct      = Math.min(100, Math.round((sensor.value / sensor.max) * 100));
  const barColor = sensor.value <= sensor.thresholds.safe
    ? '#34C759'
    : sensor.value <= sensor.thresholds.warn ? '#FF9500' : '#FF3B30';

  const readings = [
    { label: 'Current',       value: `${sensor.value} ${sensor.unit}` },
    { label: 'Min (session)', value: `${Math.min(...sensor.history)} ${sensor.unit}` },
    { label: 'Max (session)', value: `${Math.max(...sensor.history)} ${sensor.unit}` },
    { label: 'Avg (session)', value: `${Math.round(sensor.history.reduce((a, b) => a + b, 0) / sensor.history.length)} ${sensor.unit}` },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={[styles.detailIconBg, { backgroundColor: sensor.bg }]}>
            <MaterialCommunityIcons name={sensor.icon as any} size={24} color={sensor.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{sensor.label}</Text>
            <Text style={[styles.sheetSub, { color: sensor.statusColor }]}>{sensor.status}</Text>
          </View>
          {sensor.isActive !== undefined && (
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8,
              backgroundColor: sensor.isActive ? 'rgba(52,199,89,0.12)' : 'rgba(174,174,178,0.15)',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: sensor.isActive ? '#34C759' : '#AEAEB2' }}>
                {sensor.isActive ? '● Active' : '○ Inactive'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
            <Ionicons name="close" size={16} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Big value card */}
          <View style={styles.bigValueCard}>
            <Text style={styles.bigValue}>
              {sensor.value}<Text style={styles.bigUnit}> {sensor.unit}</Text>
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLbl}>0</Text>
              <Text style={styles.progressLbl}>{sensor.max} {sensor.unit}</Text>
            </View>
          </View>

          {/* History sparkline */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Last 6 readings</Text>
            <Sparkline data={sensor.history} color={sensor.color} width={width - 80} height={48} />
            <View style={styles.sparkLabels}>
              {sensor.history.map((v, i) => <Text key={i} style={styles.sparkLbl}>{v}</Text>)}
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {readings.map(r => (
              <View key={r.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{r.label}</Text>
                <Text style={styles.statValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.descCard}>
            <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
            <Text style={styles.descText}>{sensor.description}</Text>
          </View>

          {/* Thresholds */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Thresholds</Text>
            {[
              { label: 'Safe',    color: '#34C759', range: `0 – ${sensor.thresholds.safe.toFixed(1)} ${sensor.unit}` },
              { label: 'Warning', color: '#FF9500', range: `${sensor.thresholds.safe.toFixed(1)} – ${sensor.thresholds.warn.toFixed(1)} ${sensor.unit}` },
              { label: 'Danger',  color: '#FF3B30', range: `Above ${sensor.thresholds.warn.toFixed(1)} ${sensor.unit}` },
            ].map(t => (
              <View key={t.label} style={styles.threshRow}>
                <View style={[styles.threshDot, { backgroundColor: t.color }]} />
                <Text style={styles.threshLabel}>{t.label}</Text>
                <Text style={styles.threshVal}>{t.range}</Text>
              </View>
            ))}
            <View style={[styles.threshRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.07)' }]}>
              <Ionicons name="hardware-chip-outline" size={13} color="#AEAEB2" />
              <Text style={[styles.threshLabel, { color: '#AEAEB2', fontSize: 11 }]}> threshold value</Text>
              <Text style={[styles.threshVal, { color: '#007AFF', fontWeight: '700' }]}>{sensor.apiThreshold} {sensor.unit}</Text>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
};

export default SensorDetail;