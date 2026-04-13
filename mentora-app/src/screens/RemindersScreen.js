import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  LogBox,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const COLORS = {
  sage: '#7C9E87',
  cream: '#FAF7F2',
  charcoal: '#2C2C2C',
  muted: '#8A8A8A',
  softGreen: '#EAF2EC',
  rose: '#D4748A',
  blue: '#5A7FA8',
  lightBlue: '#EBF2F8',
  orange: '#D4884A',
  lightOrange: '#FDF3EB',
  purple: '#7A5FA8',
  lightPurple: '#F0EBF8',
  gold: '#D4A842',
  lightGold: '#FDF8EC',
  red: '#E05555',
  lightRed: '#FDF0F0',
  teal: '#4A9E9E',
  lightTeal: '#EBF6F6',
};

if (Platform.OS === 'android') {
  LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let notificationChannelReady = false;

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android' || notificationChannelReady) {
    return;
  }

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C9E87',
  });

  notificationChannelReady = true;
}

async function requestPermissions() {
  await ensureNotificationChannel();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    }));
  }
  return status === 'granted';
}

function buildNotificationContent(title, body, data) {
  return {
    title,
    body,
    sound: true,
    channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    priority: Notifications.AndroidNotificationPriority?.HIGH,
    data,
  };
}

function notificationMatches(notification, { group, itemId, titleIncludes = [] } = {}) {
  const data = notification?.content?.data || {};
  const title = notification?.content?.title || '';
  const body = notification?.content?.body || '';

  if (group && data.group === group && (!itemId || data.itemId === itemId)) {
    return true;
  }

  if (titleIncludes.length > 0) {
    return titleIncludes.some((part) => title.includes(part) || body.includes(part));
  }

  return false;
}

async function cancelNotifications({ ids = [], group, itemId, titleIncludes = [] } = {}) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  for (const scheduledId of uniqueIds) {
    await Notifications.cancelScheduledNotificationAsync(scheduledId).catch(() => {});
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  for (const notification of scheduled) {
    if (notificationMatches(notification, { group, itemId, titleIncludes })) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier).catch(() => {});
    }
  }
}

async function scheduleDailyNotification({ title, body, hour, minute, data }) {
  await ensureNotificationChannel();
  return Notifications.scheduleNotificationAsync({
    content: buildNotificationContent(title, body, data),
    trigger: { hour, minute, repeats: true },
  });
}

async function scheduleDateNotification({ title, body, date, data }) {
  await ensureNotificationChannel();
  if (date <= new Date()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: buildNotificationContent(title, body, data),
    trigger: date,
  });
}

async function scheduleRepeatingTimeIntervalNotification({ title, body, seconds, data }) {
  await ensureNotificationChannel();
  return Notifications.scheduleNotificationAsync({
    content: buildNotificationContent(title, body, data),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
}

async function scheduleIntervalNotification({
  title,
  body,
  intervalMinutes,
  startHour,
  startMinute,
  endHour,
  endMinute,
  data,
}) {
  await ensureNotificationChannel();

  const ids = [];
  const startTotal = (startHour * 60) + (startMinute || 0);
  const endTotal = (endHour * 60) + (endMinute || 0);

  for (let minutes = startTotal; minutes <= endTotal; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent(title, body, { ...data, hour, minute }),
      trigger: { hour, minute, repeats: true },
    });
    ids.push(notificationId);
  }

  return ids;
}

async function attemptNotificationSetup(task) {
  try {
    return await task();
  } catch (error) {
    return null;
  }
}

async function ensureNotificationsEnabled(settings) {
  if (!settings?.notifications) {
    Alert.alert('Notifications Off', 'Turn on notifications in Profile settings before enabling reminders.');
    return false;
  }

  const granted = await attemptNotificationSetup(requestPermissions);
  if (!granted) {
    Alert.alert('Permission Needed', 'Please allow notifications on your device so Mentora can send reminder alerts.');
    return false;
  }

  return true;
}

function TimePickerModal({ visible, value, onChange, onClose, title }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const [selHour, setSelHour] = useState(value?.hour ?? 8);
  const [selMin, setSelMin] = useState(value?.minute ?? 0);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSelHour(value?.hour ?? 8);
    setSelMin(value?.minute ?? 0);
  }, [visible, value?.hour, value?.minute]);

  const fmt = (n) => n.toString().padStart(2, '0');
  const ampm = selHour < 12 ? 'AM' : 'PM';
  const h12 = selHour % 12 === 0 ? 12 : selHour % 12;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tpStyles.overlay}>
        <View style={tpStyles.sheet}>
          <Text style={tpStyles.title}>{title || 'Select Time'}</Text>
          <Text style={tpStyles.preview}>{fmt(h12)}:{fmt(selMin)} {ampm}</Text>
          <View style={tpStyles.cols}>
            <View style={tpStyles.col}>
              <Text style={tpStyles.colLabel}>Hour</Text>
              <ScrollView style={tpStyles.scroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity key={h} style={[tpStyles.item, selHour === h && tpStyles.itemActive]} onPress={() => setSelHour(h)}>
                    <Text style={[tpStyles.itemText, selHour === h && tpStyles.itemTextActive]}>
                      {fmt(h % 12 === 0 ? 12 : h % 12)} {h < 12 ? 'AM' : 'PM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={tpStyles.col}>
              <Text style={tpStyles.colLabel}>Minute</Text>
              <ScrollView style={tpStyles.scroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <TouchableOpacity key={m} style={[tpStyles.item, selMin === m && tpStyles.itemActive]} onPress={() => setSelMin(m)}>
                    <Text style={[tpStyles.itemText, selMin === m && tpStyles.itemTextActive]}>{fmt(m)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={tpStyles.btns}>
            <TouchableOpacity style={tpStyles.cancelBtn} onPress={onClose}>
              <Text style={tpStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tpStyles.confirmBtn}
              onPress={() => {
                onChange({ hour: selHour, minute: selMin });
                onClose();
              }}
            >
              <LinearGradient colors={[COLORS.sage, '#5F8A6E']} style={tpStyles.confirmGrad}>
                <Text style={tpStyles.confirmText}>Set Time</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const tpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.charcoal, textAlign: 'center', marginBottom: 8 },
  preview: { fontSize: 36, fontWeight: '800', color: COLORS.sage, textAlign: 'center', marginBottom: 16 },
  cols: { flexDirection: 'row', gap: 16, height: 180 },
  col: { flex: 1 },
  colLabel: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  scroll: { backgroundColor: COLORS.softGreen, borderRadius: 14 },
  item: { padding: 12, alignItems: 'center', borderRadius: 10, margin: 2 },
  itemActive: { backgroundColor: COLORS.sage },
  itemText: { fontSize: 15, color: COLORS.charcoal, fontWeight: '500' },
  itemTextActive: { color: 'white', fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 16, padding: 14, alignItems: 'center' },
  cancelText: { color: COLORS.muted, fontWeight: '600' },
  confirmBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  confirmGrad: { padding: 14, alignItems: 'center' },
  confirmText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

function IntervalSelector({ value, onChange }) {
  const options = [15, 20, 30, 45, 60, 90, 120];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => (
        <TouchableOpacity key={o} style={[styles.intervalChip, value === o && styles.intervalChipActive]} onPress={() => onChange(o)}>
          <Text style={[styles.intervalChipText, value === o && styles.intervalChipTextActive]}>
            {o >= 60 ? `${o / 60}h` : `${o}m`}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function SectionCard({ icon, title, subtitle, color, lightColor, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[styles.sectionCard, { borderLeftColor: color }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={[styles.sectionIconWrap, { backgroundColor: lightColor }]}>
          <Text style={styles.sectionIcon}>{icon}</Text>
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <Text style={[styles.chevron, { color }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function MedicationSection() {
  const { appState, saveAppSection, settings } = useApp();
  const [meds, setMeds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState({ hour: 8, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    setMeds(appState?.reminders?.meds || []);
  }, [appState?.reminders?.meds]);

  const save = async (updated) => {
    setMeds(updated);
    await saveAppSection('reminders', (prev) => ({
      ...(prev || {}),
      meds: updated,
    }));
  };

  const fmt = (n) => n.toString().padStart(2, '0');
  const fmtTime = (t) => {
    const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
    const ap = t.hour < 12 ? 'AM' : 'PM';
    return `${fmt(h)}:${fmt(t.minute)} ${ap}`;
  };

  const scheduleMedicationNotifications = async (med) => {
    const daily = await scheduleDailyNotification({
      title: `Time to take ${med.name}`,
      body: `Take ${med.dosage} now.`,
      hour: med.time.hour,
      minute: med.time.minute,
      data: { group: 'medication', itemId: med.id, type: 'daily' },
    });

    return { daily };
  };

  const cancelMedicationNotifications = async (med) => {
    await cancelNotifications({
      ids: [med?.notificationIds?.daily],
      group: 'medication',
      itemId: med?.id,
      titleIncludes: med?.name ? [med.name] : [],
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName('');
    setDosage('');
    setTime({ hour: 8, minute: 0 });
  };

  const startEdit = (med) => {
    setEditId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setTime(med.time);
    setShowForm(true);
  };

  const addMed = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('', 'Please enter medication name and dosage');
      return;
    }

    const existingMed = editId ? meds.find((m) => m.id === editId) : null;

    let nextMed = {
      id: editId || `med_${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim(),
      time,
      enabled: existingMed?.enabled ?? true,
      createdAt: existingMed?.createdAt || new Date().toISOString(),
      notificationIds: existingMed?.notificationIds || {},
    };

    const existing = editId ? meds.filter((m) => m.id !== editId) : meds;
    const savedMed = { ...nextMed, notificationIds: nextMed.notificationIds || {} };
    await save([...existing, savedMed].sort((a, b) => a.name.localeCompare(b.name)));

    if (existingMed) {
      await attemptNotificationSetup(() => cancelMedicationNotifications(existingMed));
    }

    if (savedMed.enabled) {
      const notificationsEnabled = await ensureNotificationsEnabled(settings);
      if (notificationsEnabled) {
        const notificationIds = await attemptNotificationSetup(() => scheduleMedicationNotifications(savedMed));
        if (notificationIds) {
          await save(
            [...existing, { ...savedMed, notificationIds }].sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } else {
        nextMed = { ...savedMed, enabled: false, notificationIds: {} };
        await save(
          [...existing, nextMed].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }

    resetForm();
  };

  const toggleMed = async (id, val) => {
    const med = meds.find((m) => m.id === id);
    if (!med) {
      return;
    }

    let nextMed = { ...med, enabled: val };
    if (!val) {
      await attemptNotificationSetup(() => cancelMedicationNotifications(med));
      nextMed.notificationIds = {};
    } else {
      const notificationsEnabled = await ensureNotificationsEnabled(settings);
      if (notificationsEnabled) {
        const notificationIds = await attemptNotificationSetup(() => scheduleMedicationNotifications(nextMed));
        if (notificationIds) {
          nextMed = {
            ...nextMed,
            notificationIds,
          };
        }
      } else {
        nextMed = { ...med, enabled: false, notificationIds: {} };
      }
    }

    await save(meds.map((m) => (m.id === id ? nextMed : m)));
  };

  const deleteMed = async (id) => {
    Alert.alert('Delete', 'Remove this medication reminder?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const med = meds.find((item) => item.id === id);
          await attemptNotificationSetup(() => cancelMedicationNotifications(med));
          await save(meds.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  return (
    <View>
      <TimePickerModal visible={showTimePicker} value={time} onChange={setTime} onClose={() => setShowTimePicker(false)} title="Medication Time" />

      {meds.map((med) => (
        <View key={med.id} style={styles.medCard}>
          <View style={styles.medLeft}>
            <Text style={styles.medIcon}>💊</Text>
            <View>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDetail}>{med.dosage} · Every day at {fmtTime(med.time)}</Text>
            </View>
          </View>
          <View style={styles.medRight}>
            <Switch value={med.enabled} onValueChange={(v) => toggleMed(med.id, v)} trackColor={{ false: '#E0D8CF', true: `${COLORS.blue}80` }} thumbColor={med.enabled ? COLORS.blue : '#ccc'} />
            <TouchableOpacity onPress={() => startEdit(med)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteMed(med.id)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {showForm ? (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>{editId ? 'Edit Medication' : 'Add Medication'}</Text>

          <Text style={styles.fieldLabel}>MEDICATION NAME</Text>
          <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="e.g. Vitamin D, Aspirin..." placeholderTextColor={COLORS.muted} />

          <Text style={styles.fieldLabel}>DOSAGE</Text>
          <TextInput style={styles.fieldInput} value={dosage} onChangeText={setDosage} placeholder="e.g. 1 tablet, 500mg..." placeholderTextColor={COLORS.muted} />

          <Text style={styles.fieldLabel}>REMINDER TIME</Text>
          <TouchableOpacity style={styles.timePicker} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timePickerText}>🕐 {fmtTime(time)}</Text>
            <Text style={styles.timePickerEdit}>Change</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.cancelFormBtn} onPress={resetForm}>
              <Text style={styles.cancelFormText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={addMed}>
              <LinearGradient colors={[COLORS.blue, '#4A6FA8']} style={styles.saveFormBtn}>
                <Text style={styles.saveFormText}>{editId ? 'Update' : 'Add Reminder'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.addBtn, { borderColor: COLORS.blue }]} onPress={() => setShowForm(true)}>
          <Text style={[styles.addBtnText, { color: COLORS.blue }]}>+ Add Medication</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function IntervalSection({ storageKey, notifPrefix, notifTitle, notifBody, color }) {
  const { appState, saveAppSection, settings } = useApp();
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval] = useState(60);
  const [startTime, setStartTime] = useState({ hour: 8, minute: 0 });
  const [endTime, setEndTime] = useState({ hour: 22, minute: 0 });
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [notificationIds, setNotificationIds] = useState([]);

  useEffect(() => {
    const saved = appState?.reminders?.[storageKey];
    if (saved) {
      setEnabled(!!saved.enabled);
      setInterval(saved.interval || 60);
      setStartTime(saved.startTime || { hour: 8, minute: 0 });
      setEndTime(saved.endTime || { hour: 22, minute: 0 });
      setNotificationIds(saved.notificationIds || []);
    }
  }, [appState?.reminders, storageKey]);

  const persist = async (data) => {
    await saveAppSection('reminders', (prev) => ({
      ...(prev || {}),
      [storageKey]: data,
    }));
  };

  const fmt = (n) => n.toString().padStart(2, '0');
  const fmtTime = (t) => {
    const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
    return `${fmt(h)}:${fmt(t.minute)} ${t.hour < 12 ? 'AM' : 'PM'}`;
  };

  const reschedule = async (nextEnabled, nextInterval, nextStartTime, nextEndTime) => {
    const startTotal = (nextStartTime.hour * 60) + nextStartTime.minute;
    const endTotal = (nextEndTime.hour * 60) + nextEndTime.minute;
    if (nextEnabled && endTotal < startTotal) {
      Alert.alert('Invalid Time Range', 'End time needs to be later than start time for interval reminders.');
      setEnabled(false);
      return [];
    }

    let nextNotificationIds = [];
    let resolvedEnabled = nextEnabled;
    await persist({
      enabled: resolvedEnabled,
      interval: nextInterval,
      startTime: nextStartTime,
      endTime: nextEndTime,
      notificationIds: nextNotificationIds,
    });

    await attemptNotificationSetup(() => cancelNotifications({ ids: notificationIds, group: storageKey, itemId: notifPrefix }));

    if (resolvedEnabled) {
      const notificationsEnabled = await ensureNotificationsEnabled(settings);
      if (notificationsEnabled) {
        const scheduledIds = await attemptNotificationSetup(() => scheduleIntervalNotification({
          title: notifTitle,
          body: notifBody,
          intervalMinutes: nextInterval,
          startHour: nextStartTime.hour,
          startMinute: nextStartTime.minute,
          endHour: nextEndTime.hour,
          endMinute: nextEndTime.minute,
          data: { group: storageKey, itemId: notifPrefix },
        }));
        nextNotificationIds = scheduledIds || [];
      } else {
        resolvedEnabled = false;
      }
    }

    setEnabled(resolvedEnabled);
    setNotificationIds(nextNotificationIds);
    await persist({
      enabled: resolvedEnabled,
      interval: nextInterval,
      startTime: nextStartTime,
      endTime: nextEndTime,
      notificationIds: nextNotificationIds,
    });

    return nextNotificationIds;
  };

  const toggle = async (val) => {
    setEnabled(val);
    const nextNotificationIds = await reschedule(val, interval, startTime, endTime);
    if (val && nextNotificationIds.length > 0) {
      Alert.alert('✅ Reminder On', `You'll be reminded every ${interval >= 60 ? `${interval / 60}h` : `${interval}m`} from ${fmtTime(startTime)} to ${fmtTime(endTime)}`);
    }
  };

  const apply = async () => {
    await reschedule(enabled, interval, startTime, endTime);
    Alert.alert('✅ Saved', 'Your reminder settings have been updated!');
  };

  return (
    <View>
      <TimePickerModal visible={showStart} value={startTime} onChange={setStartTime} onClose={() => setShowStart(false)} title="Start Time" />
      <TimePickerModal visible={showEnd} value={endTime} onChange={setEndTime} onClose={() => setShowEnd(false)} title="End Time" />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Enable Reminders</Text>
          <Text style={styles.toggleSub}>{enabled ? '🟢 Active' : '⚫ Off'}</Text>
        </View>
        <Switch value={enabled} onValueChange={toggle} trackColor={{ false: '#E0D8CF', true: `${color}80` }} thumbColor={enabled ? color : '#ccc'} />
      </View>

      <Text style={styles.fieldLabel}>INTERVAL</Text>
      <IntervalSelector value={interval} onChange={setInterval} />

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>START TIME</Text>
          <TouchableOpacity style={[styles.timePicker, { borderColor: `${color}60` }]} onPress={() => setShowStart(true)}>
            <Text style={[styles.timePickerText, { color }]}>🕐 {fmtTime(startTime)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.timeField}>
          <Text style={styles.fieldLabel}>END TIME</Text>
          <TouchableOpacity style={[styles.timePicker, { borderColor: `${color}60` }]} onPress={() => setShowEnd(true)}>
            <Text style={[styles.timePickerText, { color }]}>🕕 {fmtTime(endTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={apply}>
        <LinearGradient colors={[color, `${color}CC`]} style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>💾 Save Settings</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function BedtimeSection() {
  const { appState, saveAppSection, settings } = useApp();
  const [bedtime, setBedtime] = useState({ hour: 22, minute: 30 });
  const [wakeup, setWakeup] = useState({ hour: 6, minute: 30 });
  const [enabled, setEnabled] = useState(false);
  const [showBed, setShowBed] = useState(false);
  const [showWake, setShowWake] = useState(false);
  const [notificationIds, setNotificationIds] = useState({});

  useEffect(() => {
    const saved = appState?.reminders?.bedtime_reminder;
    if (saved) {
      setEnabled(!!saved.enabled);
      setBedtime(saved.bedtime || { hour: 22, minute: 30 });
      setWakeup(saved.wakeup || { hour: 6, minute: 30 });
      setNotificationIds(saved.notificationIds || {});
    }
  }, [appState?.reminders?.bedtime_reminder]);

  const fmt = (n) => n.toString().padStart(2, '0');
  const fmtTime = (t) => {
    const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
    return `${fmt(h)}:${fmt(t.minute)} ${t.hour < 12 ? 'AM' : 'PM'}`;
  };

  const getHours = () => {
    const bedMinutes = (bedtime.hour * 60) + bedtime.minute;
    const wakeMinutes = (wakeup.hour * 60) + wakeup.minute;
    let diff = wakeMinutes - bedMinutes;
    if (diff < 0) {
      diff += 24 * 60;
    }
    return Math.max(0, Math.round((diff / 60) * 10) / 10);
  };

  const persistAndReschedule = async (nextEnabled, nextBedtime, nextWakeup) => {
    let nextNotificationIds = {};
    let resolvedEnabled = nextEnabled;
    await saveAppSection('reminders', (prev) => ({
      ...(prev || {}),
      bedtime_reminder: {
        enabled: resolvedEnabled,
        bedtime: nextBedtime,
        wakeup: nextWakeup,
        notificationIds: nextNotificationIds,
      },
    }));

    await attemptNotificationSetup(() => cancelNotifications({ ids: Object.values(notificationIds), group: 'bedtime_reminder' }));

    if (resolvedEnabled) {
      const notificationsEnabled = await ensureNotificationsEnabled(settings);
      if (notificationsEnabled) {
        const bedtimeId = await attemptNotificationSetup(() => scheduleDailyNotification({
          title: '🌙 Bedtime Reminder',
          body: 'Time to wind down and prepare for sleep. Good night! 😴',
          hour: nextBedtime.hour,
          minute: nextBedtime.minute,
          data: { group: 'bedtime_reminder', itemId: 'bedtime' },
        }));
        const wakeupId = await attemptNotificationSetup(() => scheduleDailyNotification({
          title: '☀️ Good Morning!',
          body: 'Rise and shine! Start your day with a glass of water 💧',
          hour: nextWakeup.hour,
          minute: nextWakeup.minute,
          data: { group: 'bedtime_reminder', itemId: 'wakeup' },
        }));
        nextNotificationIds = {
          bedtime: bedtimeId || null,
          wakeup: wakeupId || null,
        };
      } else {
        resolvedEnabled = false;
      }
    }

    setEnabled(resolvedEnabled);
    setNotificationIds(nextNotificationIds);
    await saveAppSection('reminders', (prev) => ({
      ...(prev || {}),
      bedtime_reminder: {
        enabled: resolvedEnabled,
        bedtime: nextBedtime,
        wakeup: nextWakeup,
        notificationIds: nextNotificationIds,
      },
    }));
  };

  const toggle = async (val) => {
    setEnabled(val);
    await persistAndReschedule(val, bedtime, wakeup);
  };

  const save = async () => {
    await persistAndReschedule(enabled, bedtime, wakeup);
    Alert.alert('✅ Saved', 'Bedtime reminders updated!');
  };

  return (
    <View>
      <TimePickerModal visible={showBed} value={bedtime} onChange={setBedtime} onClose={() => setShowBed(false)} title="Bedtime" />
      <TimePickerModal visible={showWake} value={wakeup} onChange={setWakeup} onClose={() => setShowWake(false)} title="Wake Up Time" />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Enable Reminders</Text>
          <Text style={styles.toggleSub}>{enabled ? '🟢 Active' : '⚫ Off'}</Text>
        </View>
        <Switch value={enabled} onValueChange={toggle} trackColor={{ false: '#E0D8CF', true: `${COLORS.purple}80` }} thumbColor={enabled ? COLORS.purple : '#ccc'} />
      </View>

      <View style={[styles.sleepBadge, { backgroundColor: COLORS.lightPurple }]}>
        <Text style={styles.sleepBadgeText}>😴 Sleep Goal</Text>
        <Text style={[styles.sleepHours, { color: COLORS.purple }]}>{getHours()}h</Text>
      </View>

      <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>BEDTIME</Text>
          <TouchableOpacity style={[styles.timePicker, { borderColor: `${COLORS.purple}60` }]} onPress={() => setShowBed(true)}>
            <Text style={[styles.timePickerText, { color: COLORS.purple }]}>🌙 {fmtTime(bedtime)}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>WAKE UP</Text>
          <TouchableOpacity style={[styles.timePicker, { borderColor: `${COLORS.purple}60` }]} onPress={() => setShowWake(true)}>
            <Text style={[styles.timePickerText, { color: COLORS.purple }]}>☀️ {fmtTime(wakeup)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={save}>
        <LinearGradient colors={[COLORS.purple, '#9A7FC8']} style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>💾 Save Settings</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function AffirmationSection() {
  const { appState, saveAppSection, settings } = useApp();
  const [time, setTime] = useState({ hour: 7, minute: 0 });
  const [enabled, setEnabled] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [notificationId, setNotificationId] = useState(null);

  const AFFIRMATIONS = [
    'You are stronger than you think 💪',
    'Today is full of possibilities 🌟',
    'Your mental health matters 🌿',
    'Every step counts, keep walking 👟',
    'You deserve to feel well and happy 🌸',
    'Progress, not perfection 🎯',
    "Breathe. You've got this 🌬️",
  ];

  const fmt = (n) => n.toString().padStart(2, '0');
  const fmtTime = (t) => {
    const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
    return `${fmt(h)}:${fmt(t.minute)} ${t.hour < 12 ? 'AM' : 'PM'}`;
  };

  useEffect(() => {
    const saved = appState?.reminders?.affirmation_reminder;
    if (saved) {
      setEnabled(!!saved.enabled);
      setTime(saved.time || { hour: 7, minute: 0 });
      setNotificationId(saved.notificationId || null);
    }
  }, [appState?.reminders?.affirmation_reminder]);

  const getMessage = () => AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];

  const persistAndReschedule = async (nextEnabled, nextTime) => {
    let nextNotificationId = null;
    let resolvedEnabled = nextEnabled;
    await saveAppSection('reminders', (prev) => ({
      ...(prev || {}),
      affirmation_reminder: {
        enabled: resolvedEnabled,
        time: nextTime,
        notificationId: nextNotificationId,
      },
    }));

    await attemptNotificationSetup(() => cancelNotifications({ ids: [notificationId], group: 'affirmation_reminder', itemId: 'affirmation' }));

    if (resolvedEnabled) {
      const notificationsEnabled = await ensureNotificationsEnabled(settings);
      if (notificationsEnabled) {
        nextNotificationId = await attemptNotificationSetup(() => scheduleDailyNotification({
          title: "Today's affirmation",
          body: getMessage(),
          hour: nextTime.hour,
          minute: nextTime.minute,
          data: { group: 'affirmation_reminder', itemId: 'affirmation' },
        }));
      } else {
        resolvedEnabled = false;
      }
    }

    setEnabled(resolvedEnabled);
    setNotificationId(nextNotificationId);
    await saveAppSection('reminders', (prev) => ({
      ...(prev || {}),
      affirmation_reminder: {
        enabled: resolvedEnabled,
        time: nextTime,
        notificationId: nextNotificationId,
      },
    }));
  };

  const toggle = async (val) => {
    setEnabled(val);
    await persistAndReschedule(val, time);
  };

  const save = async () => {
    await persistAndReschedule(enabled, time);
    Alert.alert('✅ Saved', 'Affirmation reminder updated!');
  };

  return (
    <View>
      <TimePickerModal visible={showPicker} value={time} onChange={setTime} onClose={() => setShowPicker(false)} title="Affirmation Time" />
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Daily Affirmation</Text>
          <Text style={styles.toggleSub}>{enabled ? '🟢 Active' : '⚫ Off'}</Text>
        </View>
        <Switch value={enabled} onValueChange={toggle} trackColor={{ false: '#E0D8CF', true: `${COLORS.gold}80` }} thumbColor={enabled ? COLORS.gold : '#ccc'} />
      </View>
      <Text style={styles.fieldLabel}>DELIVERY TIME</Text>
      <TouchableOpacity style={styles.timePicker} onPress={() => setShowPicker(true)}>
        <Text style={styles.timePickerText}>☀️ {fmtTime(time)}</Text>
        <Text style={styles.timePickerEdit}>Change</Text>
      </TouchableOpacity>
      <View style={[styles.previewBox, { backgroundColor: COLORS.lightGold }]}>
        <Text style={styles.previewLabel}>Preview</Text>
        <Text style={styles.previewText}>"{getMessage()}"</Text>
      </View>
      <TouchableOpacity onPress={save}>
        <LinearGradient colors={[COLORS.gold, '#E0B954']} style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>💾 Save Settings</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export default function RemindersScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <LinearGradient colors={['#EBF2F8', COLORS.cream]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Reminders</Text>
          <Text style={styles.headerSub}>Stay on track every day</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <SectionCard icon="💊" title="Medication" subtitle="Daily pill reminders at your chosen time" color={COLORS.blue} lightColor={COLORS.lightBlue}>
          <MedicationSection />
        </SectionCard>

        <SectionCard icon="🧘" title="Hourly Rest" subtitle="Get a notification when it is time to rest" color={COLORS.sage} lightColor={COLORS.softGreen}>
          <IntervalSection storageKey="rest_reminder" notifPrefix="rest" notifTitle="Time to rest" notifBody="It is time for a short rest break." color={COLORS.sage} />
        </SectionCard>

        <SectionCard icon="💧" title="Water Intake" subtitle="Get a reminder when it is time to drink water" color={COLORS.teal} lightColor={COLORS.lightTeal}>
          <IntervalSection storageKey="water_reminder" notifPrefix="water" notifTitle="Drink water reminder" notifBody="It is time to drink water." color={COLORS.teal} />
        </SectionCard>

        <SectionCard icon="🌞" title="Daily Affirmations" subtitle="Get today's affirmation at your chosen time" color={COLORS.gold} lightColor={COLORS.lightGold}>
          <AffirmationSection />
        </SectionCard>

        <SectionCard icon="🏃" title="Step Goal Reminder" subtitle="Get a reminder when it is time to move" color={COLORS.orange} lightColor={COLORS.lightOrange}>
          <IntervalSection storageKey="steps_reminder" notifPrefix="steps" notifTitle="Step goal reminder" notifBody="It is time to walk and work on your step goal." color={COLORS.orange} />
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C2C2C' },
  headerSub: { fontSize: 12, color: '#8A8A8A', marginTop: 2, textAlign: 'center' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 24, color: '#2C2C2C' },

  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderLeftWidth: 4, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  sectionHeaderText: { flex: 1, minWidth: 0 },
  sectionIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C2C2C' },
  sectionSubtitle: { fontSize: 12, color: '#8A8A8A', marginTop: 2, lineHeight: 17 },
  chevron: { fontSize: 12, fontWeight: '700' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },

  medCard: { backgroundColor: '#F8F5F0', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  medLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  medIcon: { fontSize: 28 },
  medName: { fontSize: 15, fontWeight: '700', color: '#2C2C2C' },
  medDetail: { fontSize: 12, color: '#8A8A8A', marginTop: 2, lineHeight: 17, flexShrink: 1 },
  medRefill: { fontSize: 11, color: COLORS.blue, marginTop: 2 },
  medRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 },

  addForm: { backgroundColor: '#F8F5F0', borderRadius: 16, padding: 16, marginTop: 8 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#2C2C2C', marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#8A8A8A', letterSpacing: 1.2, marginBottom: 8 },
  fieldInput: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 12, padding: 12, fontSize: 14, color: '#2C2C2C', marginBottom: 14 },
  timePicker: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  timePickerText: { fontSize: 15, fontWeight: '600', color: '#2C2C2C' },
  timePickerEdit: { fontSize: 13, color: COLORS.sage, fontWeight: '600' },
  refillChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0D8CF', backgroundColor: '#FFFFFF' },
  refillChipActive: { borderColor: COLORS.blue, backgroundColor: COLORS.lightBlue },
  refillChipText: { fontSize: 13, color: '#8A8A8A', fontWeight: '500' },
  cancelFormBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 14, padding: 13, alignItems: 'center' },
  cancelFormText: { color: '#8A8A8A', fontWeight: '600' },
  saveFormBtn: { borderRadius: 14, padding: 13, alignItems: 'center' },
  saveFormText: { color: 'white', fontWeight: '700', fontSize: 15 },
  addBtn: { borderWidth: 1.5, borderRadius: 14, padding: 13, alignItems: 'center', borderStyle: 'dashed', marginTop: 4 },
  addBtnText: { fontWeight: '600', fontSize: 14 },

  intervalChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0D8CF', backgroundColor: '#FFFFFF' },
  intervalChipActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage },
  intervalChipText: { fontSize: 13, color: '#2C2C2C', fontWeight: '600' },
  intervalChipTextActive: { color: 'white' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F5F0', borderRadius: 14, padding: 14, marginBottom: 16, gap: 12 },
  toggleTextWrap: { flex: 1, minWidth: 0 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#2C2C2C' },
  toggleSub: { fontSize: 12, color: '#8A8A8A', marginTop: 2, lineHeight: 16 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  timeField: { flexGrow: 1, flexShrink: 1, minWidth: width < 390 ? '100%' : 140 },
  applyBtn: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  applyBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  sleepBadge: { borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sleepBadgeText: { fontSize: 14, color: '#2C2C2C', fontWeight: '600' },
  sleepHours: { fontSize: 28, fontWeight: '800' },

  previewBox: { borderRadius: 14, padding: 14, marginTop: 4 },
  previewLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gold, letterSpacing: 1, marginBottom: 6 },
  previewText: { fontSize: 14, color: '#2C2C2C', fontStyle: 'italic', lineHeight: 22 },
});
