// ─── components/alerts/SeverityPill.tsx ──────────────────────────────────────

import React from 'react';
import { View, Text } from 'react-native';
import { SEV } from '../../constants/alerts/alerts';
import { pillStyles as S } from '../../styles/alerts/styles';

interface Props {
  severity: string;
}

export const SeverityPill = ({ severity }: Props) => {
  const { color, label } = SEV[severity] ?? SEV.default;
  return (
    <View style={[S.wrap, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <View style={[S.dot, { backgroundColor: color }]} />
      <Text style={[S.txt, { color }]}>{label}</Text>
    </View>
  );
};