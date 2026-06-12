// ─── components/alerts/styles.ts ─────────────────────────────────────────────
// كل الاستايلز بتاعة كومبوننتس الـ alerts في مكان واحد

import { StyleSheet, Platform } from 'react-native';

// ─── SeverityPill ─────────────────────────────────────────────────────────────
export const pillStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 0.5 },
  dot:  { width: 5, height: 5, borderRadius: 3 },
  txt:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── DownloadBtn ──────────────────────────────────────────────────────────────
export const downloadBtnStyles = StyleSheet.create({
  btn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 0.5, borderColor: '#BFDBFE', overflow: 'hidden', position: 'relative' },
  done:    { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  dis:     { backgroundColor: '#F5F5F5', borderColor: 'rgba(0,0,0,0.06)' },
  bar:     { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#BFDBFE60' },
  txt:     { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  doneTxt: { color: '#166534' },
  disTxt:  { color: '#C7C7CC' },
});

// ─── LiveBadge ────────────────────────────────────────────────────────────────
export const liveBadgeStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  txt:  { fontSize: 11, fontWeight: '700' },
});

// ─── DetectionCard ────────────────────────────────────────────────────────────
export const detectionCardStyles = StyleSheet.create({
  wrap:     { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  resolved: { opacity: 0.55 },
  inner:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strip:    { width: 4, alignSelf: 'stretch', borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  imgBox:   { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  img:      { width: 52, height: 52 },
  content:  { flex: 1, paddingVertical: 14 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 },
  name:     { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  desc:     { fontSize: 11, color: '#8E8E93', marginBottom: 5, fontStyle: 'italic' },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaTxt:  { fontSize: 11, color: '#AEAEB2' },
  sep:      { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D1D6', marginHorizontal: 2 },
  right:    { paddingRight: 14 },
});

// ─── DetailModal ──────────────────────────────────────────────────────────────
export const detailModalStyles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '92%' },
  handleWrap:  { alignItems: 'center', paddingVertical: 12, marginTop: -12 },
  handle:      { width: 36, height: 4, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 2 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sub:         { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  dateRow:     { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  dateChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5 },
  dateChipTxt: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
  media:       { width: '100%', height: 220, borderRadius: 16, marginBottom: 14, backgroundColor: '#0D0D0D' },
  mediaPh:     { width: '100%', height: 130, borderRadius: 16, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  mediaPhTxt:  { fontSize: 12, color: '#AEAEB2', fontWeight: '500' },
  desc:        { fontSize: 13, color: '#555', marginBottom: 16, fontStyle: 'italic' },
  sec:         { fontSize: 10, fontWeight: '700', color: '#AEAEB2', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  cell:        { flex: 1, minWidth: '45%', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12 },
  cellL:       { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cellV:       { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  dlRow:       { flexDirection: 'row', gap: 8, marginBottom: 20 },
  resolveBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#34C759', borderRadius: 14, paddingVertical: 14, marginBottom: 10 },
  resolveTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  closeBtn:    { backgroundColor: '#F2F2F7', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeTxt:    { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
});

// ─── AlertsScreen (tabs/alerts.tsx) ──────────────────────────────────────────
export const alertsScreenStyles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F2F2F7' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:    { fontSize: 14, color: '#AEAEB2' },
  selectorCard:   { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  topRow:         { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 14 },
  selectorLabel:  { fontSize: 11, fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statsHighlight: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
  statsDim:       { fontSize: 13, color: '#AEAEB2' },
  selectorRow:    { paddingHorizontal: 16, gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F2F2F7', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  chipActive:     { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipDot:        { width: 6, height: 6, borderRadius: 3 },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive: { color: '#fff' },
  list:           { padding: 16 },
  empty:          { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle:     { fontSize: 16, color: '#AEAEB2', fontWeight: '600' },
  emptySub:       { fontSize: 13, color: '#C7C7CC' },
  screenTabRow:      { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 3, marginBottom: 8 },
screenTab:         { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 8 },
screenTabActive:   { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
screenTabText:     { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
screenTabTextActive: { color: '#1C1C1E', fontWeight: '600' },
});