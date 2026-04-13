import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Linking, TextInput, Modal, KeyboardAvoidingView,
  Platform, Dimensions, LogBox
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { BrandMark } from '../components/BrandMark';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
  ]);
}

// ─── THEME BUILDER ────────────────────────────────────────────────────

// ─── EDIT FIELD MODAL ─────────────────────────────────────────────────
function EditModal({ visible, title, value, onSave, onClose, keyboardType = 'default' }) {
  const [val, setVal] = useState(value?.toString() || '');
  useEffect(() => setVal(value?.toString() || ''), [value, visible]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={editStyles.overlay}>
          <View style={[editStyles.box, { backgroundColor: 'white', borderColor: '#F0EAE0' }]}>
            <Text style={[editStyles.title, { color: '#2C2C2C' }]}>{title}</Text>
            <TextInput
              style={[editStyles.input, { backgroundColor: '#F8F5F0', borderColor: '#E0D8CF', color: '#2C2C2C' }]}
              value={val} onChangeText={setVal} keyboardType={keyboardType}
              autoFocus placeholderTextColor={'#8A8A8A'} />
            <View style={editStyles.btns}>
              <TouchableOpacity style={[editStyles.cancelBtn, { borderColor: '#E0D8CF' }]} onPress={onClose}>
                <Text style={[editStyles.cancelText, { color: '#8A8A8A' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={editStyles.saveBtn} onPress={() => { onSave(val); onClose(); }}>
                <LinearGradient colors={['#7C9E87', '#5A8A6A']} style={editStyles.saveGrad}>
                  <Text style={editStyles.saveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const editStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 32 },
  box: { borderRadius: 24, padding: 24, borderWidth: 1.5 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 20 },
  btns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  saveGrad: { padding: 14, alignItems: 'center' },
  saveText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

// ─── SETTINGS SCREEN (modal sheet) ────────────────────────────────────
function SettingsSheet({ visible, onClose, notifGranted, locationGranted, requestNotif, requestLocation }) {
  const { settings, updateSettings } = useApp();

  const SettingRow = ({ icon, label, sub, type, value, onChange, options, color }) => {
    const [showOptions, setShowOptions] = useState(false);
    const C = color || '#7C9E87';
    return (
      <View>
        <View style={[ssStyles.row, { borderBottomColor: '#F0EAE0' }]}>
          <View style={[ssStyles.iconWrap, { backgroundColor: C + '22' }]}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ssStyles.label, { color: '#2C2C2C' }]}>{label}</Text>
            {sub && <Text style={[ssStyles.sub, { color: '#8A8A8A' }]}>{sub}</Text>}
          </View>
          {type === 'toggle' && (
            <Switch value={value} onValueChange={onChange}
              trackColor={{ false: '#F0EAE0', true: C + '80' }}
              thumbColor={value ? C : '#ccc'} />
          )}
          {type === 'select' && (
            <TouchableOpacity style={[ssStyles.selectBtn, { borderColor: C + '50', backgroundColor: C + '15' }]}
              onPress={() => setShowOptions(o => !o)}>
              <Text style={[ssStyles.selectText, { color: C }]}>{value}</Text>
              <Text style={[ssStyles.selectChev, { color: C }]}>{showOptions ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {type === 'select' && showOptions && (
          <View style={[ssStyles.optionsBox, { backgroundColor: '#F8F5F0', borderColor: '#E0D8CF' }]}>
            {options.map(opt => (
              <TouchableOpacity key={opt} style={[ssStyles.option, { borderBottomColor: '#F0EAE0' }]}
                onPress={() => { onChange(opt); setShowOptions(false); }}>
                <Text style={[ssStyles.optionText, { color: value === opt ? C : '#2C2C2C', fontWeight: value === opt ? '700' : '500' }]}>{opt}</Text>
                {value === opt && <Text style={{ color: C }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const SGroup = ({ title, children }) => (
    <View style={[ssStyles.group, { backgroundColor: 'white', borderColor: '#F0EAE0' }]}>
      <Text style={[ssStyles.groupTitle, { color: '#8A8A8A' }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={[ssStyles.sheet, { backgroundColor: '#FAF7F2' }]}>
          <View style={[ssStyles.handle, { backgroundColor: '#8A8A8A' }]} />
          <View style={[ssStyles.header, { borderBottomColor: '#F0EAE0' }]}>
            <Text style={[ssStyles.headerTitle, { color: '#2C2C2C' }]}>⚙️ Settings</Text>
            <TouchableOpacity onPress={onClose} style={[ssStyles.closeBtn, { backgroundColor: '#F8F5F0' }]}>
              <Text style={[{ color: '#8A8A8A', fontWeight: '700', fontSize: 16 }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>

            {/* Permissions */}
            <SGroup title="🔐  APP PERMISSIONS">
              <PermissionRow icon="🔔" label="Notifications" sub="Reminders, medication alerts, affirmations"
                granted={notifGranted} onToggle={requestNotif} color={'#5A7FA8'} />
              <PermissionRow icon="📍" label="Location" sub="Find nearby doctors and clinics"
                granted={locationGranted} onToggle={requestLocation} color={'#7C9E87'} />
            </SGroup>

            {/* Notifications */}
            <SGroup title="🔔  NOTIFICATIONS">
              <SettingRow icon="🔔" label="Push Notifications" sub="Reminders and alerts" type="toggle"
                value={settings.notifications} onChange={v => updateSettings({ notifications: v })} color={'#5A7FA8'} />
              <SettingRow icon="🔊" label="Sound" sub="Notification sounds" type="toggle"
                value={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} color={'#7C9E87'} />
              <SettingRow icon="📳" label="Vibration" sub="Haptic feedback" type="toggle"
                value={settings.vibrationEnabled} onChange={v => updateSettings({ vibrationEnabled: v })} color={'#D4884A'} />
            </SGroup>

            {/* Health & Data */}
            <SGroup title="📊  HEALTH & DATA">
              <SettingRow icon="☁️" label="Data Sync" sub="Sync health data across devices" type="toggle"
                value={settings.dataSync} onChange={v => updateSettings({ dataSync: v })} color={'#5A7FA8'} />
            </SGroup>

            {/* Privacy */}
            <SGroup title="🔐  PRIVACY & SECURITY">
              <SettingRow icon="🕵️" label="Privacy Mode" sub="Hide sensitive health data" type="toggle"
                value={settings.privacyMode} onChange={v => updateSettings({ privacyMode: v })} color={'#7A5FA8'} />
              <SettingRow icon="🗑️" label="Clear All Data" sub="Delete all stored health data" type="select"
                value="Select action" onChange={v => {
                  if (v === 'Clear all data') {
                    Alert.alert('⚠️ Clear Data', 'This will delete all your health logs, diary entries, and reminders. This cannot be undone.', [
                      { text: 'Cancel' },
                      { text: 'Clear', style: 'destructive', onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert('✅ Done', 'All data cleared.');
                      }}
                    ]);
                  }
                }}
                options={['Select action', 'Clear all data']} color={'#E05555'} />
            </SGroup>

            {/* Support */}
            <SGroup title="💬  SUPPORT">
              <TouchableOpacity style={[ssStyles.linkRow, { borderBottomColor: '#F0EAE0' }]}
                onPress={() => Linking.openURL('mailto:support@mentora.app')}>
                <Text style={{ fontSize: 18 }}>📧</Text>
                <Text style={[ssStyles.linkLabel, { color: '#2C2C2C' }]}>Contact Support</Text>
                <Text style={{ color: '#8A8A8A' }}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ssStyles.linkRow, { borderBottomColor: 'transparent' }]}
                onPress={() => Alert.alert('Rate Mentora', 'Thank you! Rating opens once the app is published.')}>
                <Text style={{ fontSize: 18 }}>⭐</Text>
                <Text style={[ssStyles.linkLabel, { color: '#2C2C2C' }]}>Rate the App</Text>
                <Text style={{ color: '#8A8A8A' }}>→</Text>
              </TouchableOpacity>
            </SGroup>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ssStyles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  group: { borderRadius: 20, marginBottom: 14, overflow: 'hidden', borderWidth: 1.5 },
  groupTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, padding: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
  sub: { fontSize: 11, marginTop: 2 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  selectText: { fontSize: 13, fontWeight: '700' },
  selectChev: { fontSize: 10, fontWeight: '700' },
  optionsBox: { marginHorizontal: 14, marginBottom: 8, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  optionText: { fontSize: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1 },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
});

// ─── EDITABLE PROFILE ROW ─────────────────────────────────────────────
function EditableRow({ icon, label, value, onEdit, color }) {
  return (
    <TouchableOpacity style={[eRowStyles.row, { borderBottomColor: '#F0EAE0' }]} onPress={onEdit} activeOpacity={0.7}>
      <View style={[eRowStyles.iconWrap, { backgroundColor: (color || '#7C9E87') + '20' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[eRowStyles.label, { color: '#8A8A8A' }]}>{label}</Text>
        <Text style={[eRowStyles.value, { color: '#2C2C2C' }]}>{value || '—'}</Text>
      </View>
      <View style={[eRowStyles.editBadge, { backgroundColor: (color || '#7C9E87') + '18', borderColor: (color || '#7C9E87') + '40' }]}>
        <Text style={[eRowStyles.editText, { color: color || '#7C9E87' }]}>✏️ Edit</Text>
      </View>
    </TouchableOpacity>
  );
}
const eRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 15, fontWeight: '700' },
  editBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5 },
  editText: { fontSize: 12, fontWeight: '700' },
});

// ─── STATIC INFO ROW ──────────────────────────────────────────────────
function InfoRow({ icon, label, value, color }) {
  return (
    <View style={[eRowStyles.row, { borderBottomColor: '#F0EAE0' }]}>
      <View style={[eRowStyles.iconWrap, { backgroundColor: (color || '#8A8A8A') + '18' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[eRowStyles.label, { color: '#8A8A8A' }]}>{label}</Text>
        <Text style={[eRowStyles.value, { color: color || '#2C2C2C' }]}>{value || '—'}</Text>
      </View>
    </View>
  );
}

// ─── PERMISSION ROW ───────────────────────────────────────────────────
function PermissionRow({ icon, label, sub, granted, onToggle, color }) {
  return (
    <View style={[eRowStyles.row, { borderBottomColor: '#F0EAE0' }]}>
      <View style={[eRowStyles.iconWrap, { backgroundColor: (granted ? color : '#8A8A8A') + '22' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[{ fontSize: 14, fontWeight: '700', color: '#2C2C2C' }]}>{label}</Text>
        <Text style={[{ fontSize: 11, color: '#8A8A8A', marginTop: 2 }]}>{sub}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Switch value={granted} onValueChange={onToggle}
          trackColor={{ false: '#F0EAE0', true: color + '80' }}
          thumbColor={granted ? color : '#ccc'} />
        <Text style={{ fontSize: 10, fontWeight: '700', color: granted ? color : '#8A8A8A' }}>
          {granted ? 'Granted' : 'Denied'}
        </Text>
      </View>
    </View>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────
function SCard({ title, children }) {
  return (
    <View style={[scStyles.card, { backgroundColor: 'white', borderColor: '#F0EAE0' }]}>
      <Text style={[scStyles.title, { color: '#8A8A8A' }]}>{title}</Text>
      {children}
    </View>
  );
}
const scStyles = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1.5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 6 },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { profile, settings, updateProfile, logout } = useApp();

  const [notifGranted, setNotifGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState({ visible: false, title: '', field: '', value: '', keyboardType: 'default' });

  const openEdit = (title, field, value, keyboardType = 'default') =>
    setEditModal({ visible: true, title, field, value, keyboardType });

  const saveEdit = (field, rawVal) => {
    const isNumeric = ['height', 'weight', 'stepsGoal', 'cycleLength', 'periodDuration'].includes(field);
    const val = isNumeric ? parseFloat(rawVal) || 0 : rawVal;
    updateProfile({ [field]: val });
  };

  useEffect(() => { checkPermissions(); }, []);

  const checkPermissions = async () => {
    const n = await Notifications.getPermissionsAsync();
    setNotifGranted(n.status === 'granted');
    const l = await Location.getForegroundPermissionsAsync();
    setLocationGranted(l.status === 'granted');
  };

  const requestNotif = async (val) => {
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifGranted(status === 'granted');
      if (status !== 'granted') Alert.alert('Permission Denied', 'Go to Settings to enable notifications.', [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]);
    } else {
      Alert.alert('Disable', 'To disable, go to phone Settings → Mentora → Notifications', [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'OK' }]);
    }
  };

  const requestLocation = async (val) => {
    if (val) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');
      if (status !== 'granted') Alert.alert('Permission Denied', 'Go to Settings to enable location.', [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]);
    } else {
      Alert.alert('Disable', 'To disable, go to phone Settings → Mentora → Location', [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'OK' }]);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Mentora?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => {
        logout();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }},
    ]);
  };

  const bmi = profile.height && profile.weight
    ? parseFloat((profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)) : null;
  const bmiCat = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: '#5A7FA8' }
    : bmi < 25   ? { label: 'Normal', color: '#7C9E87' }
    : bmi < 30   ? { label: 'Overweight', color: '#D4A842' }
    :               { label: 'Obese', color: '#E05555' }
    : null;

  const firstName = (profile.name || 'User').split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <LinearGradient colors={['#EAF2EC', '#FAF7F2']} style={styles.profileHeader}>
          <BrandMark size={76} />
          <Text style={[styles.appName, { color: '#7C9E87' }]}>mentora</Text>
          <Text style={[styles.appTagline, { color: '#8A8A8A' }]}>Your personal wellness companion</Text>

          {/* Name badge */}
          <View style={[styles.nameBadge, { backgroundColor: 'white', borderColor: '#F0EAE0' }]}>
            <View style={styles.nameAvatarRow}>
              <LinearGradient colors={['#7C9E87', '#D4748A']} style={styles.nameAvatar}>
                <Text style={styles.nameAvatarText}>{(profile.name || 'U')[0].toUpperCase()}</Text>
              </LinearGradient>
              <View>
                <Text style={[styles.nameText, { color: '#2C2C2C' }]}>{profile.name || 'Your Name'}</Text>
                {profile.email ? <Text style={[styles.emailText, { color: '#8A8A8A' }]}>{profile.email}</Text> : null}
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 16 }}>

          {/* ── EDIT: Personal Info ── */}
          <SCard title="👤  Personal Information">
            <EditableRow icon="🙍" label="Full Name" value={profile.name} color={'#7C9E87'}
              onEdit={() => openEdit('✏️ Edit Name', 'name', profile.name)} />
            <EditableRow icon="📧" label="Email Address" value={profile.email} color={'#5A7FA8'}
              onEdit={() => openEdit('✏️ Edit Email', 'email', profile.email, 'email-address')} />
            <InfoRow icon="⚧" label="Sex" value={profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '—'} color={'#7A5FA8'} />
          </SCard>

          {/* ── EDIT: Health Metrics ── */}
          <SCard title="📋  Health Metrics">
            <EditableRow icon="📏" label="Height" value={profile.height ? `${profile.height} cm` : null} color={'#7C9E87'}
              onEdit={() => openEdit('📏 Height (cm)', 'height', profile.height, 'numeric')} />
            <EditableRow icon="⚖️" label="Weight" value={profile.weight ? `${profile.weight} kg` : null} color={'#D4884A'}
              onEdit={() => openEdit('⚖️ Weight (kg)', 'weight', profile.weight, 'numeric')} />
            {bmi && bmiCat && (
              <InfoRow icon="🧮" label="BMI (calculated)" value={`${bmi} — ${bmiCat.label}`} color={bmiCat.color} />
            )}
            <EditableRow icon="🏃" label="Daily Step Goal" value={profile.stepsGoal ? `${profile.stepsGoal.toLocaleString()} steps` : null} color={'#7C9E87'}
              onEdit={() => openEdit('🏃 Step Goal', 'stepsGoal', profile.stepsGoal, 'numeric')} />
            {profile.sex === 'female' && (
              <EditableRow icon="🌸" label="Cycle Length" value={profile.cycleLength ? `${profile.cycleLength} days` : null} color={'#D4748A'}
                onEdit={() => openEdit('🌸 Cycle Length (days)', 'cycleLength', profile.cycleLength, 'numeric')} />
            )}
          </SCard>

          {/* ── Settings button — above Health Tips ── */}
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: 'white', borderColor: '#F0EAE0' }]}
            onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
            <Text style={[styles.settingsLabel, { color: '#2C2C2C' }]}>Settings</Text>
            <Text style={[styles.settingsChev, { color: '#8A8A8A' }]}>→</Text>
          </TouchableOpacity>

          {/* ── Health Tips ── */}
          <SCard title="💡  Daily Health Tips">
            {[
              ['💧', 'Drink at least 8 glasses of water every day.'],
              ['🚶', 'Aim for 7,000–10,000 steps for a healthy heart.'],
              ['😴', 'Quality sleep (7–9h) supports hormonal health.'],
              ['🧘', 'Even 10 minutes of mindfulness reduces stress.'],
              ['🥗', 'Eat the rainbow — diverse colour means diverse nutrition.'],
            ].map(([ic, tip], i, arr) => (
              <View key={i} style={[styles.tipRow, { borderBottomColor: '#F0EAE0', borderBottomWidth: i === arr.length - 1 ? 0 : 1 }]}>
                <Text style={{ fontSize: 18 }}>{ic}</Text>
                <Text style={[styles.tipText, { color: '#5A5A5A' }]}>{tip}</Text>
              </View>
            ))}
          </SCard>

          {/* ── About ── */}
          <SCard title="ℹ️  About Mentora">
            <InfoRow icon="📱" label="Version" value="1.0.0" />
          </SCard>

          {/* ── Log Out ── */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LinearGradient colors={['#E05555', '#C03030']} style={styles.logoutGrad}>
              <Text style={styles.logoutText}>🚪  Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.footer, { color: '#8A8A8A' }]}>Made with 💚 for wellness · Mentora v1.0</Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EditModal
        visible={editModal.visible}
        title={editModal.title}
        value={editModal.value}
        keyboardType={editModal.keyboardType}
        onSave={(v) => saveEdit(editModal.field, v)}
        onClose={() => setEditModal(e => ({ ...e, visible: false }))}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        notifGranted={notifGranted}
        locationGranted={locationGranted}
        requestNotif={requestNotif}
        requestLocation={requestLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: { paddingTop: 64, paddingBottom: 24, alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  appName: { fontSize: 28, fontWeight: '900', letterSpacing: 3, marginTop: 6 },
  appTagline: { fontSize: 12, letterSpacing: 0.5 },
  nameBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 14, width: '100%', marginTop: 10, borderWidth: 1.5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  nameAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nameAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  nameAvatarText: { color: 'white', fontWeight: '800', fontSize: 20 },
  nameText: { fontSize: 17, fontWeight: '800' },
  emailText: { fontSize: 12, marginTop: 2 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 16, width: '100%', marginTop: 10, borderWidth: 1.5, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  settingsIcon: { fontSize: 20 },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  settingsChev: { fontSize: 16, fontWeight: '700' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 11 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  logoutBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 16, elevation: 4, shadowColor: '#E05555', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  logoutGrad: { padding: 16, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  footer: { textAlign: 'center', fontSize: 11, marginBottom: 32 },
});
