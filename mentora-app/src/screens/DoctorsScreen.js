import React, { useState, useEffect, useCallback } from 'react';
import { GOOGLE_PLACES_API_KEY } from '../config/apiKeys';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, Alert, Dimensions,
  FlatList, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { apiClient } from '../config/api';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const COLORS = {
  sage: '#7C9E87', cream: '#FAF7F2', charcoal: '#2C2C2C',
  muted: '#8A8A8A', softGreen: '#EAF2EC', rose: '#D4748A',
  blue: '#5A7FA8', lightBlue: '#EBF2F8', orange: '#D4884A',
  lightOrange: '#FDF3EB', purple: '#7A5FA8', lightPurple: '#F0EBF8',
  gold: '#D4A842', lightGold: '#FDF8EC', red: '#E05555',
  teal: '#4A9E9E', lightTeal: '#EBF6F6', pink: '#D4748A', lightPink: '#FDF0F2',
};

const SPECIALIZATIONS = [
  { id: 'psychiatrist',    label: 'Psychiatrist',     emoji: '🧠', color: COLORS.purple,  light: COLORS.lightPurple,  query: 'psychiatrist' },
  { id: 'gynecologist',    label: 'Gynecologist',     emoji: '🌸', color: COLORS.pink,    light: COLORS.lightPink,    query: 'gynecologist obstetrician' },
  { id: 'cardiologist',    label: 'Cardiologist',     emoji: '❤️', color: COLORS.red,     light: '#FDF0F0',           query: 'cardiologist heart doctor' },
  { id: 'general',         label: 'General Physician',emoji: '🩺', color: COLORS.sage,    light: COLORS.softGreen,    query: 'general physician doctor clinic' },
  { id: 'dermatologist',   label: 'Dermatologist',    emoji: '✨', color: COLORS.orange,  light: COLORS.lightOrange,  query: 'dermatologist skin doctor' },
  { id: 'orthopedic',      label: 'Orthopedic',       emoji: '🦴', color: COLORS.blue,    light: COLORS.lightBlue,    query: 'orthopedic bone doctor' },
  { id: 'neurologist',     label: 'Neurologist',      emoji: '⚡', color: COLORS.gold,    light: COLORS.lightGold,    query: 'neurologist brain doctor' },
  { id: 'dentist',         label: 'Dentist',          emoji: '🦷', color: COLORS.teal,    light: COLORS.lightTeal,    query: 'dentist dental clinic' },
  { id: 'ophthalmologist', label: 'Eye Specialist',   emoji: '👁️', color: COLORS.blue,    light: COLORS.lightBlue,    query: 'ophthalmologist eye doctor' },
  { id: 'pediatrician',    label: 'Pediatrician',     emoji: '👶', color: COLORS.sage,    light: COLORS.softGreen,    query: 'pediatrician child doctor' },
  { id: 'physiotherapist', label: 'Physiotherapist',  emoji: '💪', color: COLORS.orange,  light: COLORS.lightOrange,  query: 'physiotherapist physical therapy' },
  { id: 'nutritionist',    label: 'Nutritionist',     emoji: '🥗', color: COLORS.sage,    light: COLORS.softGreen,    query: 'nutritionist dietitian' },
];

// ─── DOCTOR CARD ──────────────────────────────────────────────────────
function DoctorCard({ doctor, spec, onSave, isSaved, onPress }) {
  const ratingColor = doctor.rating >= 4.5 ? COLORS.sage : doctor.rating >= 4 ? COLORS.gold : COLORS.orange;

  return (
    <TouchableOpacity style={styles.docCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.docCardTop}>
        {/* Avatar */}
        <LinearGradient colors={[spec.color, spec.color + 'BB']} style={styles.docAvatar}>
          <Text style={styles.docAvatarText}>{spec.emoji}</Text>
        </LinearGradient>

        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>{doctor.name}</Text>
          <View style={[styles.specBadge, { backgroundColor: spec.light }]}>
            <Text style={[styles.specBadgeText, { color: spec.color }]}>{spec.emoji} {spec.label}</Text>
          </View>
          {doctor.vicinity && (
            <Text style={styles.docAddress} numberOfLines={2}>📍 {doctor.vicinity}</Text>
          )}
        </View>

        {/* Save button */}
        <TouchableOpacity onPress={() => onSave(doctor)} style={styles.saveIconBtn}>
          <Text style={{ fontSize: 22 }}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.docCardBottom}>
        {/* Rating */}
        {doctor.rating && (
          <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '20' }]}>
            <Text style={[styles.ratingText, { color: ratingColor }]}>
              ⭐ {doctor.rating} {doctor.user_ratings_total ? `(${doctor.user_ratings_total})` : ''}
            </Text>
          </View>
        )}

        {/* Open now */}
        {doctor.opening_hours && (
          <View style={[styles.openBadge, { backgroundColor: doctor.opening_hours.open_now ? '#E8F5E9' : '#FEECEC' }]}>
            <Text style={[styles.openText, { color: doctor.opening_hours.open_now ? COLORS.sage : COLORS.red }]}>
              {doctor.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
            </Text>
          </View>
        )}

        {/* Distance */}
        {doctor.distance && (
          <View style={styles.distBadge}>
            <Text style={styles.distText}>🚶 {doctor.distance}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.docActions}>
          {doctor.phone && (
            <TouchableOpacity style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${doctor.phone}`)}>
              <LinearGradient colors={[COLORS.sage, '#5F8A6E']} style={styles.actionGrad}>
                <Text style={styles.actionText}>📞 Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn}
            onPress={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.name + ' ' + (doctor.vicinity || ''))}&query_place_id=${doctor.place_id}`;
              Linking.openURL(url);
            }}>
            <LinearGradient colors={[COLORS.blue, '#4A6FA8']} style={styles.actionGrad}>
              <Text style={styles.actionText}>🗺️ Maps</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}
            onPress={() => {
              const query = encodeURIComponent(doctor.name + ' doctor appointment');
              Linking.openURL(`https://www.google.com/search?q=${query}`);
            }}>
            <LinearGradient colors={[COLORS.purple, '#9A7FC8']} style={styles.actionGrad}>
              <Text style={styles.actionText}>📅 Book</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────
function DoctorDetailModal({ doctor, spec, visible, onClose, onSave, isSaved }) {
  if (!doctor) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient colors={[spec.light, 'white']} style={modalStyles.header}>
              <LinearGradient colors={[spec.color, spec.color + 'BB']} style={modalStyles.avatar}>
                <Text style={{ fontSize: 32 }}>{spec.emoji}</Text>
              </LinearGradient>
              <Text style={modalStyles.name}>{doctor.name}</Text>
              <Text style={[modalStyles.spec, { color: spec.color }]}>{spec.label}</Text>
              {doctor.rating && (
                <Text style={modalStyles.rating}>⭐ {doctor.rating} · {doctor.user_ratings_total || 0} reviews</Text>
              )}
            </LinearGradient>

            <View style={modalStyles.body}>
              {doctor.vicinity && (
                <View style={modalStyles.infoRow}>
                  <Text style={modalStyles.infoIcon}>📍</Text>
                  <Text style={modalStyles.infoText}>{doctor.vicinity}</Text>
                </View>
              )}
              {doctor.opening_hours && (
                <View style={modalStyles.infoRow}>
                  <Text style={modalStyles.infoIcon}>{doctor.opening_hours.open_now ? '🟢' : '🔴'}</Text>
                  <Text style={modalStyles.infoText}>{doctor.opening_hours.open_now ? 'Open Now' : 'Currently Closed'}</Text>
                </View>
              )}
              {doctor.distance && (
                <View style={modalStyles.infoRow}>
                  <Text style={modalStyles.infoIcon}>🚶</Text>
                  <Text style={modalStyles.infoText}>{doctor.distance} away</Text>
                </View>
              )}

              <View style={modalStyles.btnRow}>
                <TouchableOpacity style={{ flex: 1 }}
                  onPress={() => { const url = `https://www.google.com/maps/search/?api=1&query_place_id=${doctor.place_id}`; Linking.openURL(url); }}>
                  <LinearGradient colors={[COLORS.blue, '#4A6FA8']} style={modalStyles.bigBtn}>
                    <Text style={modalStyles.bigBtnText}>🗺️ Open in Maps</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }}
                  onPress={() => { const q = encodeURIComponent(doctor.name + ' appointment'); Linking.openURL(`https://www.google.com/search?q=${q}`); }}>
                  <LinearGradient colors={[COLORS.purple, '#9A7FC8']} style={modalStyles.bigBtn}>
                    <Text style={modalStyles.bigBtnText}>📅 Book Appointment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => onSave(doctor)} style={[modalStyles.saveBtn, { backgroundColor: isSaved ? COLORS.lightPink : COLORS.softGreen }]}>
                <Text style={[modalStyles.saveBtnText, { color: isSaved ? COLORS.rose : COLORS.sage }]}>
                  {isSaved ? '❤️ Saved to favourites' : '🤍 Save to favourites'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Text style={modalStyles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: '#E0D8CF', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { padding: 24, alignItems: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 6, shadowColor: '#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:10 },
  name: { fontSize: 20, fontWeight: '800', color: '#2C2C2C', textAlign: 'center' },
  spec: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  rating: { fontSize: 13, color: '#8A8A8A', marginTop: 6 },
  body: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoText: { flex: 1, fontSize: 14, color: '#2C2C2C', lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 12 },
  bigBtn: { borderRadius: 14, padding: 14, alignItems: 'center' },
  bigBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  saveBtn: { borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { fontWeight: '700', fontSize: 15 },
  closeBtn: { margin: 16, marginTop: 0, borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 14, padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#8A8A8A', fontWeight: '600', fontSize: 15 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────
export default function DoctorsScreen({ navigation }) {
  const { appState, saveAppSection } = useApp();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // search | saved
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);

  const PLACES_API_KEY = GOOGLE_PLACES_API_KEY;
  const savedDoctorsState = appState?.doctors?.saved || [];

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    setSavedDoctors(savedDoctorsState);
  }, [savedDoctorsState]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc.coords);
      setLocationError(false);
      return loc.coords;
    } catch (error) {
      setLocationError(true);
      return null;
    }
  };

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  };

  const searchDoctors = async (spec) => {
    setSelectedSpec(spec);
    const coords = location || await getLocation();
    if (!coords) return;
    setLoading(true);
    setDoctors([]);
    setUsingMockData(false);

    try {
      const { latitude, longitude } = coords;
      let results = [];

      try {
        const response = await apiClient.get('/integrations/doctors/nearby', {
          params: {
            latitude,
            longitude,
            keyword: spec.query,
            radius: 5000,
          },
        });
        results = response.data.data || [];
      } catch (backendError) {
        if (PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_KEY_HERE') {
          throw backendError;
        }
        const query = encodeURIComponent(spec.query);
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&keyword=${query}&type=doctor&key=${PLACES_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        results = data.results || [];
      }

      if (results.length > 0) {
        const deduped = results.reduce((acc, doctor) => {
          const key = doctor.place_id || `${doctor.name}_${doctor.vicinity}`;
          if (!acc.some(item => (item.place_id || `${item.name}_${item.vicinity}`) === key)) {
            acc.push({
              ...doctor,
              distance: doctor.geometry?.location
                ? calcDistance(latitude, longitude, doctor.geometry.location.lat, doctor.geometry.location.lng)
                : null,
            });
          }
          return acc;
        }, []);
        setDoctors(deduped.slice(0, 15));
      } else {
        setUsingMockData(true);
        setDoctors(getMockDoctors(spec, coords));
      }
    } catch (e) {
      setUsingMockData(true);
      setDoctors(getMockDoctors(spec, coords));
    }
    setLoading(false);
  };

  const getMockDoctors = (spec, coords) => [
    { place_id: `mock_1_${spec.id}`, name: `Nearby ${spec.label} Specialist`, vicinity: `Near ${coords?.latitude?.toFixed?.(2) || 'your'} / ${coords?.longitude?.toFixed?.(2) || 'location'}`, rating: 4.8, user_ratings_total: 312, opening_hours: { open_now: true }, distance: '0.8km' },
    { place_id: `mock_2_${spec.id}`, name: `${spec.label} Care Clinic`, vicinity: 'Close to your current area', rating: 4.5, user_ratings_total: 189, opening_hours: { open_now: false }, distance: '1.2km' },
    { place_id: `mock_3_${spec.id}`, name: `City ${spec.label} Centre`, vicinity: 'Nearby multi-specialty center', rating: 4.3, user_ratings_total: 97, opening_hours: { open_now: true }, distance: '2.1km' },
    { place_id: `mock_4_${spec.id}`, name: `${spec.label} Department`, vicinity: 'Hospital in your vicinity', rating: 4.7, user_ratings_total: 541, opening_hours: { open_now: true }, distance: '3.4km' },
    { place_id: `mock_5_${spec.id}`, name: `${spec.label} Wellness Clinic`, vicinity: 'Short drive from your location', rating: 4.6, user_ratings_total: 228, opening_hours: { open_now: true }, distance: '4.2km' },
  ];

  const toggleSave = async (doctor) => {
    const already = savedDoctors.find(d => d.place_id === doctor.place_id);
    let updated;
    if (already) {
      updated = savedDoctors.filter(d => d.place_id !== doctor.place_id);
    } else {
      updated = [...savedDoctors, { ...doctor, specId: selectedSpec?.id || 'general' }];
      Alert.alert('❤️ Saved!', `${doctor.name} added to your favourites.`);
    }
    setSavedDoctors(updated);
    await saveAppSection('doctors', prev => ({
      ...(prev || {}),
      saved: updated,
    }));
  };

  const isSaved = (doctor) => savedDoctors.some(d => d.place_id === doctor.place_id);

  const getSpecForDoctor = (doctor) => {
    const specId = doctor.specId || selectedSpec?.id || 'general';
    return SPECIALIZATIONS.find(s => s.id === specId) || SPECIALIZATIONS[3];
  };

  const filteredDoctors = searchText
    ? doctors.filter(d => d.name.toLowerCase().includes(searchText.toLowerCase()) || d.vicinity?.toLowerCase().includes(searchText.toLowerCase()))
    : doctors;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      {/* Header */}
      <LinearGradient colors={['#EBF2F8', COLORS.cream]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nearby Doctors</Text>
          <Text style={styles.headerSub}>
            {location ? `📍 Location found` : locationError ? '⚠️ Location unavailable' : '📍 Getting location...'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Tab row */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}>
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>🔍 Find Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}>
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            ❤️ Saved {savedDoctors.length > 0 ? `(${savedDoctors.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'saved' ? (
        // ── SAVED TAB ──
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {savedDoctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🤍</Text>
              <Text style={styles.emptyTitle}>No saved doctors yet</Text>
              <Text style={styles.emptyText}>Search for doctors and tap 🤍 to save them here for quick access.</Text>
            </View>
          ) : savedDoctors.map((doc) => {
            const spec = getSpecForDoctor(doc);
            return (
              <DoctorCard key={doc.place_id} doctor={doc} spec={spec}
                onSave={toggleSave} isSaved={isSaved(doc)}
                onPress={() => setSelectedDoctor(doc)} />
            );
          })}
        </ScrollView>
      ) : (
        // ── SEARCH TAB ──
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Specialization grid */}
          <View style={styles.specSection}>
            <Text style={styles.specTitle}>Choose Specialization</Text>
            <View style={styles.specGrid}>
              {SPECIALIZATIONS.map(spec => (
                <TouchableOpacity key={spec.id}
                  style={[styles.specCard, selectedSpec?.id === spec.id && { borderColor: spec.color, borderWidth: 2.5, backgroundColor: spec.light }]}
                  onPress={() => searchDoctors(spec)}>
                  <Text style={styles.specEmoji}>{spec.emoji}</Text>
                  <Text style={[styles.specLabel, selectedSpec?.id === spec.id && { color: spec.color, fontWeight: '700' }]}
                    numberOfLines={2}>{spec.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Results */}
          {selectedSpec && (
            <View style={styles.resultsSection}>
              {/* Search bar */}
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput style={styles.searchInput} value={searchText} onChangeText={setSearchText}
                  placeholder={`Search ${selectedSpec.label}s...`} placeholderTextColor={COLORS.muted} />
                {searchText ? (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Text style={{ fontSize: 18, color: '#8A8A8A' }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {selectedSpec.emoji} Nearby {selectedSpec.label}s
                </Text>
                <TouchableOpacity onPress={() => searchDoctors(selectedSpec)}>
                  <Text style={[styles.refreshText, { color: selectedSpec.color }]}>↺ Refresh</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={selectedSpec.color} />
                  <Text style={styles.loadingText}>Finding {selectedSpec.label}s near you...</Text>
                </View>
              ) : filteredDoctors.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptyText}>Try refreshing or check your location settings.</Text>
                </View>
              ) : (
                <View style={{ padding: 16, paddingTop: 8 }}>
                  {/* API notice */}
                  {usingMockData && (
                    <View style={styles.apiNotice}>
                      <Text style={styles.apiNoticeText}>
                        📌 Showing backup sample data because live nearby doctor results were unavailable
                      </Text>
                    </View>
                  )}
                  {filteredDoctors.map(doc => (
                    <DoctorCard key={doc.place_id} doctor={doc} spec={selectedSpec}
                      onSave={toggleSave} isSaved={isSaved(doc)}
                      onPress={() => setSelectedDoctor(doc)} />
                  ))}
                </View>
              )}
            </View>
          )}

          {!selectedSpec && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🩺</Text>
              <Text style={styles.emptyTitle}>Select a specialization</Text>
              <Text style={styles.emptyText}>Tap any category above to find doctors near your current location.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Doctor detail modal */}
      <DoctorDetailModal
        visible={!!selectedDoctor}
        doctor={selectedDoctor}
        spec={selectedDoctor ? getSpecForDoctor(selectedDoctor) : SPECIALIZATIONS[3]}
        onClose={() => setSelectedDoctor(null)}
        onSave={toggleSave}
        isSaved={selectedDoctor ? isSaved(selectedDoctor) : false} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C2C2C' },
  headerSub: { fontSize: 11, color: '#8A8A8A', marginTop: 2 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#2C2C2C' },

  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, backgroundColor: '#EDE8E0', borderRadius: 16, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 13, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:4 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8A8A8A' },
  tabTextActive: { color: '#2C2C2C' },

  specSection: { padding: 16, paddingBottom: 8 },
  specTitle: { fontSize: 13, fontWeight: '700', color: '#8A8A8A', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCard: { width: (width - 52) / 3, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0D8CF', elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6 },
  specEmoji: { fontSize: 28, marginBottom: 6 },
  specLabel: { fontSize: 11, color: '#2C2C2C', textAlign: 'center', fontWeight: '500', lineHeight: 15 },

  resultsSection: {},
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
  resultsTitle: { fontSize: 17, fontWeight: '800', color: '#2C2C2C' },
  refreshText: { fontSize: 14, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: '#E0D8CF', elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#2C2C2C' },

  apiNotice: { backgroundColor: COLORS.lightGold, borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#EDE0C0' },
  apiNoticeText: { fontSize: 12, color: COLORS.gold, textAlign: 'center', fontWeight: '500' },

  loadingWrap: { alignItems: 'center', padding: 40, gap: 12 },
  loadingText: { color: '#8A8A8A', fontSize: 14 },

  emptyState: { alignItems: 'center', padding: 40, paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#2C2C2C', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8A8A8A', textAlign: 'center', lineHeight: 22 },

  // Doctor card
  docCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, padding: 16, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:10 },
  docCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  docAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.15, shadowRadius:6 },
  docAvatarText: { fontSize: 24 },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', marginBottom: 5 },
  specBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 5 },
  specBadgeText: { fontSize: 11, fontWeight: '600' },
  docAddress: { fontSize: 12, color: '#8A8A8A', lineHeight: 17 },
  saveIconBtn: { padding: 4 },
  docCardBottom: { borderTopWidth: 1, borderTopColor: '#F0EAE0', paddingTop: 12, gap: 8 },
  ratingBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  ratingText: { fontSize: 12, fontWeight: '700' },
  openBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  openText: { fontSize: 12, fontWeight: '600' },
  distBadge: { alignSelf: 'flex-start' },
  distText: { fontSize: 12, color: '#8A8A8A' },
  docActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  actionGrad: { paddingVertical: 10, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
