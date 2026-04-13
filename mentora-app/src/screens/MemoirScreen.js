import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const COLORS = {
  cream: '#FAF7F2',
  muted: '#8A8A8A',
  warmBrown: '#A07850',
  lightBrown: '#FBF5EE',
  gold: '#D4A842',
  lightGold: '#FDF8EC',
};

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🔥', label: 'Excited' },
  { emoji: '😴', label: 'Tired' },
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (date) => {
  const next = new Date(date);
  const offset = next.getTimezoneOffset() * 60000;
  return new Date(next.getTime() - offset).toISOString().split('T')[0];
};

const formatLongDate = (dateLike) =>
  new Date(dateLike).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatShortDate = (dateLike) =>
  new Date(dateLike).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function DiaryTab() {
  const { appState, saveAppSection } = useApp();
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [writing, setWriting] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentMood, setCurrentMood] = useState('');
  const [viewEntry, setViewEntry] = useState(null);

  useEffect(() => {
    const nextEntries = (appState?.journal?.diaryEntries || [])
      .map((entry) => ({
        ...entry,
        dateKey: entry.dateKey || toDateKey(entry.date),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(nextEntries);
  }, [appState?.journal?.diaryEntries]);

  const entriesByDate = useMemo(
    () => entries.reduce((acc, entry) => {
      acc[entry.dateKey] = entry;
      return acc;
    }, {}),
    [entries]
  );

  const selectedEntry = entriesByDate[selectedDate] || null;

  useEffect(() => {
    if (!writing) {
      return;
    }
    const entry = entriesByDate[selectedDate];
    setCurrentText(entry?.text || '');
    setCurrentMood(entry?.mood || '');
  }, [writing, selectedDate, entriesByDate]);

  const monthTitle = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const cells = [];

    for (let i = 0; i < leadingBlanks; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cellDate = new Date(year, month, day);
      cells.push({
        day,
        dateKey: toDateKey(cellDate),
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [visibleMonth]);

  const persistEntries = async (updatedEntries) => {
    const sorted = [...updatedEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(sorted);
    await saveAppSection('journal', (prev) => ({
      ...(prev || {}),
      diaryEntries: sorted,
    }));
  };

  const openWriter = () => {
    setCurrentText(selectedEntry?.text || '');
    setCurrentMood(selectedEntry?.mood || '');
    setWriting(true);
  };

  const saveEntry = async () => {
    if (!currentText.trim()) {
      Alert.alert('', 'Please write something first.');
      return;
    }

    const baseDate = new Date(selectedDate);
    baseDate.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);

    const nextEntry = {
      id: selectedEntry?.id || `${selectedDate}_${Date.now()}`,
      text: currentText.trim(),
      mood: currentMood,
      date: selectedEntry?.date || baseDate.toISOString(),
      dateKey: selectedDate,
      updatedAt: new Date().toISOString(),
    };

    const remaining = entries.filter((entry) => entry.dateKey !== selectedDate);
    await persistEntries([nextEntry, ...remaining]);
    setWriting(false);
    setViewEntry(nextEntry);
  };

  const deleteEntry = async (entry) => {
    Alert.alert('Delete Entry', 'This memoir entry will be removed until you add it again.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await persistEntries(entries.filter((item) => item.id !== entry.id));
          setViewEntry(null);
          setWriting(false);
          setCurrentText('');
          setCurrentMood('');
        },
      },
    ]);
  };

  if (viewEntry) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setViewEntry(null)} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Memoir Entry</Text>
          <TouchableOpacity onPress={() => deleteEntry(viewEntry)}>
            <Text style={styles.iconButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={styles.entryViewDate}>{formatLongDate(viewEntry.date)}</Text>
          {viewEntry.mood ? (
            <View style={styles.moodTag}>
              <Text style={styles.moodTagText}>
                {MOODS.find((mood) => mood.label === viewEntry.mood)?.emoji} {viewEntry.mood}
              </Text>
            </View>
          ) : null}
          <Text style={styles.entryViewText}>{viewEntry.text}</Text>
          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => {
            setSelectedDate(viewEntry.dateKey);
            setViewEntry(null);
            openWriter();
          }}>
            <LinearGradient colors={[COLORS.warmBrown, '#C4A882']} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Edit Entry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (writing) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.cream }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setWriting(false)} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>{formatShortDate(selectedDate)}</Text>
          <TouchableOpacity onPress={saveEntry}>
            <LinearGradient colors={[COLORS.warmBrown, '#C4A882']} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.writeLabel}>HOW ARE YOU FEELING?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[styles.moodChip, currentMood === mood.label && styles.moodChipActive]}
                onPress={() => setCurrentMood(mood.label)}
              >
                <Text style={styles.moodChipEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodChipLabel, currentMood === mood.label && { color: COLORS.warmBrown }]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.writeLabel, { marginTop: 20 }]}>WRITE YOUR MEMOIR</Text>
          <View style={styles.diaryInputWrap}>
            <TextInput
              style={styles.diaryInput}
              multiline
              placeholder="Write about your day, your thoughts, or your feelings..."
              placeholderTextColor={COLORS.muted}
              value={currentText}
              onChangeText={setCurrentText}
              autoFocus
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{currentText.length} characters</Text>
          </View>

          {selectedEntry ? (
            <TouchableOpacity onPress={() => deleteEntry(selectedEntry)} style={styles.deleteEntryBtn}>
              <Text style={styles.deleteEntryText}>Delete This Entry</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
              <Text style={styles.calendarArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{monthTitle}</Text>
            <TouchableOpacity onPress={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
              <Text style={styles.calendarArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.weekHeaderText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <View key={`blank_${index}`} style={styles.calendarCell} />;
              }

              const isSelected = cell.dateKey === selectedDate;
              const hasEntry = Boolean(entriesByDate[cell.dateKey]);
              const isToday = cell.dateKey === toDateKey(new Date());

              return (
                <TouchableOpacity
                  key={cell.dateKey}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.calendarCellSelected,
                    isToday && !isSelected && styles.calendarCellToday,
                  ]}
                  onPress={() => setSelectedDate(cell.dateKey)}
                >
                  <Text style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}>
                    {cell.day}
                  </Text>
                  {hasEntry ? <View style={styles.calendarDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.selectedCard}>
          <Text style={styles.selectedLabel}>{formatLongDate(selectedDate)}</Text>
          {selectedEntry ? (
            <>
              {selectedEntry.mood ? (
                <Text style={styles.entryMoodBadge}>
                  {MOODS.find((mood) => mood.label === selectedEntry.mood)?.emoji} {selectedEntry.mood}
                </Text>
              ) : null}
              <Text style={styles.entryCardPreview}>{selectedEntry.text}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setViewEntry(selectedEntry)}>
                  <LinearGradient colors={[COLORS.lightGold, '#F7E3B3']} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>View</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={openWriter}>
                  <LinearGradient colors={[COLORS.warmBrown, '#C4A882']} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Edit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>No memoir saved for this day yet. Add one and it will stay here until you erase it.</Text>
              <TouchableOpacity onPress={openWriter} style={{ marginTop: 14 }}>
                <LinearGradient colors={[COLORS.warmBrown, '#C4A882']} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Add Memoir</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>Your memoir is empty</Text>
            <Text style={styles.emptyText}>Start writing daily entries and they’ll appear on the calendar.</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => {
                setSelectedDate(entry.dateKey);
                setViewEntry(entry);
              }}
            >
              <View style={styles.entryCardLeft}>
                <Text style={styles.entryCardDate}>{formatShortDate(entry.date)}</Text>
                <Text style={styles.entryCardDay}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
              </View>
              <View style={styles.entryCardRight}>
                {entry.mood ? (
                  <Text style={styles.entryMoodBadge}>
                    {MOODS.find((mood) => mood.label === entry.mood)?.emoji} {entry.mood}
                  </Text>
                ) : null}
                <Text style={styles.entryCardPreview} numberOfLines={2}>{entry.text}</Text>
              </View>
              <Text style={styles.entryArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openWriter}>
        <LinearGradient colors={[COLORS.warmBrown, '#C4A882']} style={styles.fabGrad}>
          <Text style={styles.fabIcon}>✏️</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function GratitudeTab() {
  const { appState, saveAppSection } = useApp();
  const today = new Date().toDateString();
  const [lines, setLines] = useState(['', '', '', '', '']);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(false);

  useEffect(() => {
    const gratitudeEntries = appState?.journal?.gratitudeEntries || {};
    const todayEntry = gratitudeEntries[today];
    if (todayEntry) {
      setLines(todayEntry);
      setSaved(true);
    } else {
      setLines(['', '', '', '', '']);
      setSaved(false);
    }

    const entries = Object.entries(gratitudeEntries)
      .filter(([date]) => date !== today)
      .map(([date, entryLines]) => ({ date, lines: entryLines }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistory(entries);
  }, [appState?.journal?.gratitudeEntries, today]);

  const saveTodayGratitude = async () => {
    const filled = lines.filter((line) => line.trim());
    if (filled.length === 0) {
      Alert.alert('', 'Write at least one thing you are grateful for.');
      return;
    }
    await saveAppSection('journal', (prev) => ({
      ...(prev || {}),
      gratitudeEntries: {
        ...((prev && prev.gratitudeEntries) || {}),
        [today]: lines,
      },
    }));
    setSaved(true);
    Alert.alert('Saved', 'Your gratitude for today has been saved.');
  };

  const prompts = [
    'Something that made me smile today...',
    'A person I am grateful for...',
    'Something about my health I appreciate...',
    'A small moment of joy today...',
    'Something I am proud of today...',
  ];

  if (viewingHistory) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setViewingHistory(false)} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Past Gratitude</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No past entries yet</Text>
              <Text style={styles.emptyText}>Keep filling in your daily gratitude and they’ll appear here.</Text>
            </View>
          ) : history.map((entry, index) => (
            <View key={index} style={styles.historyCard}>
              <Text style={styles.historyDate}>{formatLongDate(entry.date)}</Text>
              {entry.lines.map((line, lineIndex) => line.trim() ? (
                <View key={lineIndex} style={styles.historyLine}>
                  <Text style={styles.historyNum}>{lineIndex + 1}</Text>
                  <Text style={styles.historyText}>{line}</Text>
                </View>
              ) : null)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.cream }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#FDF8EC', '#FBF5EE']} style={styles.gratHeader}>
          <Text style={styles.gratIcon}>🌟</Text>
          <Text style={styles.gratTitle}>Daily Gratitude</Text>
          <Text style={styles.gratDate}>{formatLongDate(new Date())}</Text>
          <Text style={styles.gratSubtitle}>{saved ? 'Saved for today.' : 'Write 5 things you are grateful for today.'}</Text>
        </LinearGradient>

        {lines.map((line, index) => (
          <View key={index} style={styles.gratLineWrap}>
            <View style={styles.gratLineNum}>
              <Text style={styles.gratLineNumText}>{index + 1}</Text>
            </View>
            <View style={styles.gratInputWrap}>
              <TextInput
                style={[styles.gratInput, saved && styles.gratInputSaved]}
                placeholder={prompts[index]}
                placeholderTextColor={COLORS.muted}
                value={line}
                onChangeText={(value) => {
                  const updated = [...lines];
                  updated[index] = value;
                  setLines(updated);
                  setSaved(false);
                }}
                multiline
              />
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={saveTodayGratitude} style={{ marginTop: 8 }}>
          <LinearGradient colors={[COLORS.gold, '#C49A30']} style={styles.gratSaveBtn}>
            <Text style={styles.gratSaveBtnText}>{saved ? 'Saved' : 'Save Gratitude'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setViewingHistory(true)} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>View past gratitude entries</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function MemoirScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('diary');

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <LinearGradient colors={['#FBF5EE', COLORS.cream]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Memoir</Text>
          <Text style={styles.headerSub}>Your personal journal</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'diary' && styles.tabActiveDiary]} onPress={() => setActiveTab('diary')}>
          <Text style={styles.tabEmoji}>📔</Text>
          <Text style={[styles.tabText, activeTab === 'diary' && styles.tabTextActiveDiary]}>Diary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'gratitude' && styles.tabActiveGratitude]} onPress={() => setActiveTab('gratitude')}>
          <Text style={styles.tabEmoji}>🌟</Text>
          <Text style={[styles.tabText, activeTab === 'gratitude' && styles.tabTextActiveGratitude]}>Gratitude Book</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'diary' ? <DiaryTab /> : <GratitudeTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C2C2C' },
  headerSub: { fontSize: 12, color: '#8A8A8A', marginTop: 2 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#2C2C2C' },
  subHeader: { paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cream, borderBottomWidth: 1, borderBottomColor: '#EDE8E0' },
  subHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#2C2C2C' },
  iconButton: { fontSize: 20 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#EDE8E0', borderRadius: 16, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 13 },
  tabActiveDiary: { backgroundColor: COLORS.lightBrown },
  tabActiveGratitude: { backgroundColor: COLORS.lightGold },
  tabEmoji: { fontSize: 16 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8A8A8A' },
  tabTextActiveDiary: { color: COLORS.warmBrown },
  tabTextActiveGratitude: { color: COLORS.gold },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8A8A8A', letterSpacing: 1, marginTop: 18, marginBottom: 10, textTransform: 'uppercase' },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 14 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calendarTitle: { fontSize: 17, fontWeight: '800', color: '#2C2C2C' },
  calendarArrow: { fontSize: 22, color: COLORS.warmBrown, paddingHorizontal: 6 },
  weekHeader: { flexDirection: 'row', marginBottom: 8 },
  weekHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, color: COLORS.muted, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  calendarCellSelected: { backgroundColor: COLORS.warmBrown },
  calendarCellToday: { borderWidth: 1.5, borderColor: COLORS.warmBrown },
  calendarDay: { fontSize: 14, color: '#2C2C2C', fontWeight: '600' },
  calendarDaySelected: { color: '#FFFFFF' },
  calendarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold, marginTop: 4 },
  selectedCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 },
  selectedLabel: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
  entryCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10, alignItems: 'center' },
  entryCardLeft: { alignItems: 'center', marginRight: 14, minWidth: 50 },
  entryCardDate: { fontSize: 18, fontWeight: '800', color: COLORS.warmBrown },
  entryCardDay: { fontSize: 11, color: '#8A8A8A', textTransform: 'uppercase' },
  entryCardRight: { flex: 1 },
  entryMoodBadge: { fontSize: 12, color: '#8A8A8A', marginBottom: 4 },
  entryCardPreview: { fontSize: 14, color: '#2C2C2C', lineHeight: 20 },
  entryArrow: { fontSize: 22, color: '#8A8A8A', marginLeft: 8 },
  writeLabel: { fontSize: 11, fontWeight: '700', color: '#8A8A8A', letterSpacing: 1.2, marginBottom: 12 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EDE8E0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  moodChipActive: { borderColor: COLORS.warmBrown, backgroundColor: COLORS.lightBrown },
  moodChipEmoji: { fontSize: 16 },
  moodChipLabel: { fontSize: 13, color: '#8A8A8A', fontWeight: '500' },
  diaryInputWrap: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, minHeight: 280 },
  diaryInput: { fontSize: 16, color: '#2C2C2C', lineHeight: 26, minHeight: 240 },
  charCount: { fontSize: 11, color: '#8A8A8A', textAlign: 'right', marginTop: 8 },
  deleteEntryBtn: { marginTop: 18, alignItems: 'center' },
  deleteEntryText: { color: '#B45151', fontWeight: '600' },
  entryViewDate: { fontSize: 14, color: '#8A8A8A', marginBottom: 12 },
  moodTag: { backgroundColor: COLORS.lightBrown, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  moodTagText: { fontSize: 14, color: COLORS.warmBrown, fontWeight: '600' },
  entryViewText: { fontSize: 16, color: '#2C2C2C', lineHeight: 28 },
  saveBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  fab: { position: 'absolute', bottom: 28, right: 24 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#2C2C2C', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8A8A8A', textAlign: 'center', lineHeight: 22 },
  gratHeader: { borderRadius: 22, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#EDE0C0' },
  gratIcon: { fontSize: 40, marginBottom: 8 },
  gratTitle: { fontSize: 22, fontWeight: '800', color: '#2C2C2C' },
  gratDate: { fontSize: 13, color: '#8A8A8A', marginTop: 4, textAlign: 'center' },
  gratSubtitle: { fontSize: 13, color: COLORS.warmBrown, marginTop: 8, fontWeight: '500', textAlign: 'center' },
  gratLineWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  gratLineNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.lightGold, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  gratLineNumText: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  gratInputWrap: { flex: 1 },
  gratInput: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, fontSize: 14.5, color: '#2C2C2C', borderWidth: 1.5, borderColor: '#EDE8E0', lineHeight: 22 },
  gratInputSaved: { borderColor: COLORS.gold, backgroundColor: COLORS.lightGold },
  gratSaveBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  gratSaveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  historyBtn: { alignItems: 'center', padding: 16, marginBottom: 40 },
  historyBtnText: { fontSize: 14, color: '#8A8A8A', fontWeight: '500' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 12 },
  historyDate: { fontSize: 14, fontWeight: '700', color: COLORS.gold, marginBottom: 12 },
  historyLine: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  historyNum: { fontSize: 12, fontWeight: '800', color: COLORS.gold, width: 16 },
  historyText: { flex: 1, fontSize: 14, color: '#2C2C2C', lineHeight: 20 },
});
