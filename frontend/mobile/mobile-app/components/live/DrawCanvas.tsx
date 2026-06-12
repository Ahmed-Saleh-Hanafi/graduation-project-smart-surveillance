import React, { useRef, useState, useEffect } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MIN_SZ, clamp, makeZoneId } from '../../constants/live/config';
import type { Zone } from '../../constants/live/types';
import { styles } from '../../styles/live/styles';

type DrawCanvasProps = {
  zones: Zone[];
  cW: number;
  cH: number;
  onAdd: (z: Zone) => void;
};

const DrawCanvas = ({ zones, cW, cH, onAdd }: DrawCanvasProps) => {
  const start    = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e) => {
      const { locationX: lx, locationY: ly } = e.nativeEvent;
      start.current = { x: clamp(lx, 0, cW), y: clamp(ly, 0, cH) };
      setDraft({ x: start.current.x, y: start.current.y, w: 0, h: 0 });
    },
    onPanResponderMove: (_, gs) => {
      if (!start.current) return;
      const sx = start.current.x, sy = start.current.y;
      const ex = clamp(sx + gs.dx, 0, cW), ey = clamp(sy + gs.dy, 0, cH);
      setDraft({ x: Math.min(sx, ex), y: Math.min(sy, ey), w: Math.abs(ex - sx), h: Math.abs(ey - sy) });
    },
    onPanResponderRelease: () => {
      const d = draftRef.current;
      if (d && d.w >= MIN_SZ && d.h >= MIN_SZ) onAdd({ id: makeZoneId(), ...d });
      start.current = null;
      setDraft(null);
    },
  })).current;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 15 }]} {...pan.panHandlers}>
      {zones.map(z => (
        <View
          key={`ghost_${z.id}`}
          pointerEvents="none"
          style={{ position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h }}
        >
          <View style={{
            flex: 1, margin: 4, borderWidth: 1.5, borderColor: '#34C759',
            borderStyle: 'dashed', backgroundColor: 'rgba(52,199,89,0.07)',
          }} />
        </View>
      ))}

      {draft && draft.w > 4 && draft.h > 4 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: draft.x, top: draft.y, width: draft.w, height: draft.h,
            borderWidth: 1.5, borderColor: '#FF9500', borderStyle: 'dashed',
            backgroundColor: 'rgba(255,149,0,0.08)',
          }}
        >
          {draft.w >= MIN_SZ && draft.h >= MIN_SZ && (
            <View style={styles.draftLabel}>
              <Text style={styles.draftLabelText}>{Math.round(draft.w)} × {Math.round(draft.h)}</Text>
            </View>
          )}
        </View>
      )}

      {!draft && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.drawHintOverlay]}>
          <Ionicons name="crop-outline" size={22} color="rgba(255,149,0,0.7)" />
          <Text style={styles.drawHintText}>Drag to draw a restricted zone</Text>
        </View>
      )}
    </View>
  );
};

export default DrawCanvas;