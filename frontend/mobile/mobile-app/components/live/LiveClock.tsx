import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { streamStyles } from '../../styles/live/styles';

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <Text style={streamStyles.clockText}>
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </Text>
  );
};

export default LiveClock;