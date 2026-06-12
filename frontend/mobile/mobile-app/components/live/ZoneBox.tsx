import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { H, MIN_SZ, clamp } from '../../constants/live/config';
import type { Zone } from '../../constants/live/types';
import { styles } from '../../styles/live/styles';

type ZoneBoxProps = {
  zone: Zone;
  cW: number;
  cH: number;
  editMode: boolean;
  onDelete: (id: string) => void;
  onUpdate: (z: Zone) => void;
};

const ZoneBox = ({ zone, cW, cH, editMode, onDelete, onUpdate }: ZoneBoxProps) => {
  const snap = useRef<Zone>(zone);

  const bodyPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => editMode,
    onMoveShouldSetPanResponder:  () => editMode,
    onPanResponderGrant: () => { snap.current = zone; },
    onPanResponderMove: (_, gs) => {
      const s = snap.current;
      onUpdate({ ...s, x: clamp(s.x + gs.dx, 0, cW - s.w), y: clamp(s.y + gs.dy, 0, cH - s.h) });
    },
  })).current;

  const makeCorner = (corner: 'tl' | 'tr' | 'bl' | 'br') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => editMode,
      onMoveShouldSetPanResponder:  () => editMode,
      onPanResponderGrant: () => { snap.current = zone; },
      onPanResponderMove: (_, gs) => {
        const { dx, dy } = gs;
        const s = snap.current;
        let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
        if (corner === 'tl') {
          nx = clamp(s.x + dx, 0, s.x + s.w - MIN_SZ);
          ny = clamp(s.y + dy, 0, s.y + s.h - MIN_SZ);
          nw = s.w - (nx - s.x);
          nh = s.h - (ny - s.y);
        } else if (corner === 'tr') {
          ny = clamp(s.y + dy, 0, s.y + s.h - MIN_SZ);
          nw = clamp(s.w + dx, MIN_SZ, cW - s.x);
          nh = s.h - (ny - s.y);
        } else if (corner === 'bl') {
          nx = clamp(s.x + dx, 0, s.x + s.w - MIN_SZ);
          nw = s.w - (nx - s.x);
          nh = clamp(s.h + dy, MIN_SZ, cH - s.y);
        } else {
          nw = clamp(s.w + dx, MIN_SZ, cW - s.x);
          nh = clamp(s.h + dy, MIN_SZ, cH - s.y);
        }
        onUpdate({ ...s, x: nx, y: ny, w: nw, h: nh });
      },
    });

  const tlPan = useRef(makeCorner('tl')).current;
  const trPan = useRef(makeCorner('tr')).current;
  const blPan = useRef(makeCorner('bl')).current;
  const brPan = useRef(makeCorner('br')).current;

  useEffect(() => { snap.current = zone; }, [zone]);

  return (
    <View style={{ position: 'absolute', left: zone.x, top: zone.y, width: zone.w, height: zone.h }}>
      <View
        {...bodyPan.panHandlers}
        style={{
          position: 'absolute', top: H / 2, left: H / 2, right: H / 2, bottom: H / 2,
          borderWidth: 1.5, borderColor: '#34C759', borderStyle: 'dashed',
          backgroundColor: 'rgba(52,199,89,0.07)', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {editMode && <Ionicons name="move-outline" size={11} color="rgba(52,199,89,0.5)" />}
      </View>

      {editMode && (
        <TouchableOpacity style={styles.zoneDeleteBtn} onPress={() => onDelete(zone.id)}>
          <Ionicons name="close" size={10} color="#fff" />
        </TouchableOpacity>
      )}

      {editMode && [
        { pan: tlPan, pos: { top: 0, left: 0 } },
        { pan: trPan, pos: { top: 0, right: 0 } },
        { pan: blPan, pos: { bottom: 0, left: 0 } },
        { pan: brPan, pos: { bottom: 0, right: 0 } },
      ].map(({ pan, pos }, i) => (
        <View key={i} {...pan.panHandlers} style={[styles.cornerHandle, pos]}>
          <Ionicons name="resize-outline" size={10} color="#fff" />
        </View>
      ))}
    </View>
  );
};

export default ZoneBox;