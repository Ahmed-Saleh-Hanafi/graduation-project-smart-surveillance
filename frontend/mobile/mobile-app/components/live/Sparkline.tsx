import React from 'react';
import { View } from 'react-native';

type SparklineProps = {
  data: number[];
  color: string;
  width: number;
  height: number;
};

const Sparkline = ({ data, color, width: w, height: h }: SparklineProps) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: h, gap: 3, width: w }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(2, (v / max) * h),
            borderRadius: 2,
            backgroundColor: color,
            opacity: 0.3 + (i / data.length) * 0.7,
          }}
        />
      ))}
    </View>
  );
};

export default Sparkline;