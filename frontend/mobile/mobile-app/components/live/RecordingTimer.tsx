import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../styles/live/styles';

type RecordingTimerProps = {
  startTime: Date;
};

const RecordingTimer = ({ startTime }: RecordingTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <View style={styles.recTimerPill}>
      <View style={styles.recDot} />
      <Text style={styles.recTimerText}>
        {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
      </Text>
    </View>
  );
};

export default RecordingTimer;