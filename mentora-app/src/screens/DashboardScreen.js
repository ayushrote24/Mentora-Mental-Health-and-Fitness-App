import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { BrandMark } from '../components/BrandMark';

const { width } = Dimensions.get('window');
const COLORS = {
  sage: '#7C9E87', blush: '#E8B4B8', cream: '#FAF7F2',
  charcoal: '#2C2C2C', muted: '#8A8A8A', rose: '#D4748A',
  softGreen: '#EAF2EC', gold: '#D4A842',
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const AFFIRMATIONS = [
  { text: "You are stronger than you think.", emoji: "💪" },
  { text: "Today is full of possibilities.", emoji: "🌟" },
  { text: "Your mental health matters.", emoji: "🌿" },
  { text: "Every step forward counts.", emoji: "👟" },
  { text: "You deserve to feel well and happy.", emoji: "🌸" },
  { text: "Progress, not perfection.", emoji: "🎯" },
  { text: "Breathe. You've got this.", emoji: "🌬️" },
  { text: "Small steps lead to big changes.", emoji: "🚶" },
  { text: "You are worthy of rest and recovery.", emoji: "😴" },
  { text: "Kindness to yourself is not weakness.", emoji: "💛" },
  { text: "Your feelings are valid.", emoji: "❤️" },
  { text: "You are not alone on this journey.", emoji: "🤝" },
  { text: "Healing is not linear — keep going.", emoji: "🌈" },
  { text: "Drink water, move your body, breathe.", emoji: "💧" },
  { text: "You have survived every hard day so far.", emoji: "🏆" },
  { text: "Today I choose peace over perfection.", emoji: "☮️" },
  { text: "My body deserves care and nourishment.", emoji: "🥗" },
  { text: "I am allowed to take up space.", emoji: "✨" },
  { text: "Rest is productive too.", emoji: "🛌" },
  { text: "I release what I cannot control.", emoji: "🍃" },
  { text: "Gratitude opens the door to joy.", emoji: "🙏" },
  { text: "My mind and body are healing.", emoji: "💚" },
  { text: "I am enough, exactly as I am.", emoji: "💎" },
  { text: "Every sunrise is a new beginning.", emoji: "🌅" },
  { text: "I choose to move my body with love.", emoji: "🧘" },
  { text: "Water is life — stay hydrated!", emoji: "💦" },
  { text: "Joy is a habit. Practice it daily.", emoji: "😊" },
  { text: "I trust the process of my healing.", emoji: "🌱" },
  { text: "You are braver than you believe.", emoji: "🦁" },
  { text: "Your story is not over yet.", emoji: "📖" },
  { text: "One day at a time is enough.", emoji: "🗓️" },
];

function getDailyAffirmation() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

// ─── AFFIRMATION CARD ─────────────────────────────────────────────────
function AffirmationCard() {
  const affirmation = getDailyAffirmation();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return (
    <LinearGradient colors={['#FDF8EC', '#FBF5EE']} style={styles.affirmCard}>
      <View style={styles.affirmTop}>
        <View style={styles.affirmBadge}>
          <Text style={styles.affirmBadgeText}>🌟 DAILY AFFIRMATION</Text>
        </View>
        <Text style={styles.affirmDate}>{today}</Text>
      </View>
      <Text style={styles.affirmEmoji}>{affirmation.emoji}</Text>
      <Text style={styles.affirmText}>"{affirmation.text}"</Text>
    </LinearGradient>
  );
}

// ─── FEATURES — Memoir & ChatBot removed ─────────────────────────────
const FEATURES = [
  { icon: '🏃', title: 'Steps & BMI',   sub: 'Daily target',   color: ['#5F8A6E', '#7C9E87'], forFemale: false, route: 'Steps' },
  { icon: '🌸', title: 'Female Health', sub: 'Cycle & Yoga',   color: ['#C4607A', '#D4748A'], forFemale: true,  route: 'FemaleHealth' },
  { icon: '⏰', title: 'Reminders',     sub: 'Meds & Water',   color: ['#5A7FA8', '#7AA0C8'], forFemale: false, route: 'Reminders' },
  { icon: '📰', title: 'Articles',      sub: "People's Tales", color: ['#A05870', '#C07890'], forFemale: false, route: 'Articles' },
  { icon: '🩺', title: 'Doctors',       sub: 'Find nearby',    color: ['#508A6E', '#7AAA8E'], forFemale: false, route: 'Doctors' },
];

export default function DashboardScreen({ navigation }) {
  const { profile, appState, saveAppSection } = useApp();
  const stepsByDate = appState?.health?.steps?.byDate || {};
  const waterGlasses = appState?.health?.waterGlassesToday ?? 0;
  const toLocalDateKey = (date = new Date()) => {
    const next = new Date(date);
    const offset = next.getTimezoneOffset() * 60000;
    return new Date(next.getTime() - offset).toISOString().split('T')[0];
  };
  const todayKey = toLocalDateKey(new Date());
  const weekSteps = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      data.push(Number(stepsByDate[key] || 0));
    }
    return data;
  }, [appState?.health?.steps]);
  const todaySteps = weekSteps[6] || appState?.health?.steps?.today || 0;
  const maxSteps = Math.max(...weekSteps, profile.stepsGoal || 8000, 1);
  const firstName = (profile.name || 'Friend').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const visibleFeatures = FEATURES.filter(f => !f.forFemale || profile.sex === 'female');
  const calories = Math.round(todaySteps * 0.04 * ((profile.weight || 65) / 70));

  const updateWaterGlasses = async (value) => {
    await saveAppSection('health', (prev) => ({
      ...(prev || {}),
      waterGlassesToday: value,
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header — logo replaces initials avatar */}
        <LinearGradient colors={['#EAF2EC', '#FAF7F2']} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{firstName} ✨</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <BrandMark size={50} />
        </LinearGradient>

        <View style={styles.content}>
          <AffirmationCard />

          {/* Stats strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👟</Text>
              <Text style={styles.statVal}>{todaySteps.toLocaleString()}</Text>
              <Text style={styles.statLbl}>Steps</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statVal}>{calories}</Text>
              <Text style={styles.statLbl}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statVal}>{waterGlasses}</Text>
              <Text style={styles.statLbl}>Glasses</Text>
            </View>
          </View>

          {/* Weekly chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <Text style={styles.goalLabel}>Goal: {(profile.stepsGoal || 8000).toLocaleString()}</Text>
            </View>
            <View style={styles.barsWrap}>
              {weekSteps.map((s, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { height: `${(s / maxSteps) * 100}%`, backgroundColor: i === 6 ? COLORS.sage : COLORS.softGreen }]} />
                  </View>
                  <Text style={styles.barLabel}>{DAYS[i]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.waterLabel}>WATER INTAKE</Text>
            <View style={styles.waterTrack}>
              {Array.from({ length: 8 }).map((_, i) => (
                <TouchableOpacity key={i} style={[styles.glass, i < waterGlasses && styles.glassFilled]}
                  onPress={() => updateWaterGlasses(i + 1)}>
                  <Text style={{ fontSize: 16 }}>💧</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Feature grid */}
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featGrid}>
            {visibleFeatures.map((f, i) => (
              <TouchableOpacity key={i} style={styles.featCard} activeOpacity={0.85}
                onPress={() => f.route && navigation.navigate(f.route)}>
                <LinearGradient colors={f.color} style={styles.featGrad}>
                  <Text style={styles.featIcon}>{f.icon}</Text>
                  <Text style={styles.featTitle}>{f.title}</Text>
                  <Text style={styles.featSub}>{f.sub}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 }}>Tap to open →</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: '#8A8A8A', letterSpacing: 1, textTransform: 'uppercase' },
  userName: { fontSize: 30, fontWeight: '800', color: '#2C2C2C', marginTop: 2 },
  dateText: { fontSize: 12, color: '#8A8A8A', marginTop: 4 },
  content: { padding: 16 },
  affirmCard: { borderRadius: 22, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#EDE0C0', elevation: 3, shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10 },
  affirmTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  affirmBadge: { backgroundColor: 'rgba(212,168,66,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  affirmBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.gold, letterSpacing: 0.8 },
  affirmDate: { fontSize: 11, color: '#8A8A8A' },
  affirmEmoji: { fontSize: 36, marginBottom: 10 },
  affirmText: { fontSize: 17, fontWeight: '600', color: '#2C2C2C', lineHeight: 26, fontStyle: 'italic' },
  statsStrip: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#2C2C2C' },
  statLbl: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#2C2C2C', marginBottom: 12 },
  goalLabel: { fontSize: 12, color: '#8A8A8A' },
  barsWrap: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden', backgroundColor: '#F8F5F0' },
  barFill: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#8A8A8A' },
  waterLabel: { fontSize: 11, fontWeight: '700', color: '#8A8A8A', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  waterTrack: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  glass: { width: 38, height: 38, borderRadius: 10, borderWidth: 2, borderColor: '#C8DFC6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  glassFilled: { backgroundColor: '#C8DFC6', borderColor: COLORS.sage },
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 40 },
  featCard: { width: (width - 42) / 2, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  featGrad: { padding: 18 },
  featIcon: { fontSize: 28, marginBottom: 8 },
  featTitle: { color: 'white', fontWeight: '700', fontSize: 15 },
  featSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
