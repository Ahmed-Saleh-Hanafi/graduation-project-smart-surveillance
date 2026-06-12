import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7',paddingBottom:30 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#F2F2F7',
  },
  loadingText: { fontSize: 14, color: '#AEAEB2' },
  selectorCard: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  selectorLabel: {
    fontSize: 11, fontWeight: '700', color: '#AEAEB2',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, marginBottom: 5,
  },
  selectorContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: '#F2F2F7',
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    
  },
  chipActive:          { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipDot:             { width: 6, height: 6, borderRadius: 3 },
  chipText:            { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  chipTextActive:      { color: '#fff' },
  chipBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  chipActiveBadge:     { backgroundColor: 'rgba(255,255,255,0.2)' }, // Fixed name dynamically
  chipBadgeText:       { fontSize: 10, fontWeight: '700', color: '#AEAEB2' },
  chipBadgeTextActive: { color: '#fff' },
  listContent: { paddingBottom: 100 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
  },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  listSub:   { fontSize: 12, color: '#AEAEB2', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#007AFF',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    flexDirection: 'row', padding: 14, alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
        shadowColor: '#000', shadowOpacity: 0.003, shadowRadius: 4, elevation: 2,

  },
  avatar:   { width: 58, height: 58, borderRadius: 14, backgroundColor: '#F2F2F7' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#AEAEB2' },
  emptySub:   { fontSize: 13, color: '#C7C7CC' },
  retryBtn: {
    marginTop: 8, backgroundColor: '#007AFF',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sheetSub:   { fontSize: 12, color: '#AEAEB2', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center',
  },
  uploadCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F0F7FF', alignSelf: 'center',
    marginBottom: 6, overflow: 'hidden',
  },
  uploadCircleError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },
  uploadPreview:     { width: 90, height: 90, borderRadius: 45 },
  uploadEditBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: '#007AFF', borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  uploadLabel: { fontSize: 11, color: '#007AFF', fontWeight: '700', marginTop: 4 },
  fieldLabel: {
    fontSize: 11, color: '#AEAEB2', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6,
  },
  fieldError: {
    fontSize: 11, color: '#FF3B30', fontWeight: '500',
    marginTop: -10, marginBottom: 10, marginLeft: 2,
  },
  input: {
    backgroundColor: '#F2F2F7', borderRadius: 13, padding: 14,
    fontSize: 14, color: '#1C1C1E',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', marginBottom: 14,
  },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF5F5' },
  saveBtn: {
    backgroundColor: '#007AFF', padding: 16,
    borderRadius: 16, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});