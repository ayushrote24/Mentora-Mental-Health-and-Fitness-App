import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Modal, TextInput, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const COLORS = {
  rose: '#D4748A', lightRose: '#FDF0F2', pink: '#E8B4B8',
  sage: '#7C9E87', softGreen: '#EAF2EC',
  cream: '#FAF7F2', charcoal: '#2C2C2C', muted: '#8A8A8A',
  purple: '#7A5FA8', lightPurple: '#F0EBF8',
  gold: '#D4A842', lightGold: '#FDF8EC',
  blue: '#5A7FA8', lightBlue: '#EBF2F8',
  orange: '#D4884A', lightOrange: '#FDF3EB',
  teal: '#4A9E9E', lightTeal: '#EBF6F6',
  lavender: '#9B8EC4', lightLavender: '#F2EFF9',
};

// ─── YOUTUBE URL HELPER ───────────────────────────────────────────────
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

// ─── PRIORITY MODES ───────────────────────────────────────────────────
const PRIORITIES = [
  { id: 'cycle',     label: 'Cycle Tracking',  emoji: '🌸', color: COLORS.rose,     light: COLORS.lightRose,    desc: 'Track your period & phases' },
  { id: 'pregnancy', label: 'Pregnancy',        emoji: '🤰', color: COLORS.purple,   light: COLORS.lightPurple,  desc: 'Week-by-week pregnancy guide' },
  { id: 'fertility', label: 'Fertility',        emoji: '🌿', color: COLORS.sage,     light: COLORS.softGreen,    desc: 'Fertile window & ovulation' },
  { id: 'pcos',      label: 'PCOS / Hormones',  emoji: '⚡', color: COLORS.orange,   light: COLORS.lightOrange,  desc: 'PCOS & hormone tracking' },
  { id: 'menopause', label: 'Perimenopause',    emoji: '🍂', color: COLORS.gold,     light: COLORS.lightGold,    desc: 'Perimenopause support' },
  { id: 'wellness',  label: 'General Wellness', emoji: '💆', color: COLORS.teal,     light: COLORS.lightTeal,    desc: 'Holistic female health' },
];

// ─── CYCLE PHASE DATA ─────────────────────────────────────────────────
const PHASE_DATA = {
  menstrual: {
    name: 'Menstrual Phase', days: '1–5', color: COLORS.rose, light: COLORS.lightRose, emoji: '🌺',
    desc: 'Your body sheds the uterine lining. Energy is lower — prioritise rest and warmth.',
    symptoms: ['Cramps', 'Fatigue', 'Bloating', 'Lower back pain', 'Mood changes'],
    exercises: [
      { name: 'Gentle Yoga', duration: '20 min', intensity: 'Low', emoji: '🧘', tip: 'Child\'s pose and supine twists ease cramps', ytUrl: yt('gentle yoga for period cramps relief'), ytLabel: 'Yoga for Cramps' },
      { name: 'Light Walking', duration: '15–20 min', intensity: 'Low', emoji: '🚶', tip: 'Boosts mood and reduces bloating', ytUrl: yt('light walking workout period fatigue'), ytLabel: 'Walking Workout' },
      { name: 'Stretching', duration: '10 min', intensity: 'Very Low', emoji: '🤸', tip: 'Focus on hip flexors and lower back', ytUrl: yt('period stretching routine hip lower back pain'), ytLabel: 'Stretching Routine' },
      { name: 'Yin Yoga', duration: '30 min', intensity: 'Very Low', emoji: '☮️', tip: 'Deep connective tissue stretches with long holds', ytUrl: yt('yin yoga menstruation 30 minutes'), ytLabel: 'Yin Yoga' },
    ],
    nutrition: ['Iron-rich foods (lentils, spinach)', 'Magnesium (dark chocolate, nuts)', 'Warm ginger or turmeric tea', 'Avoid alcohol & excess caffeine'],
    selfcare: ['Heat pad on abdomen', 'Warm bath with Epsom salt', 'Adequate sleep (8–9h)', 'Journal your feelings'],
    articles: [
      { title: 'Managing Period Cramps Naturally', url: 'https://www.healthline.com/health/menstrual-cramps', tag: '🌿 Natural' },
      { title: 'Best Foods to Eat During Your Period', url: 'https://www.medicalnewstoday.com/articles/foods-to-eat-during-period', tag: '🥗 Nutrition' },
      { title: 'Why Rest is Important During Menstruation', url: 'https://www.verywellhealth.com/period-fatigue', tag: '😴 Rest' },
    ],
  },
  follicular: {
    name: 'Follicular Phase', days: '6–13', color: COLORS.sage, light: COLORS.softGreen, emoji: '🌱',
    desc: 'Estrogen rises, energy increases. Great time for new challenges and social connection.',
    symptoms: ['Increased energy', 'Improved mood', 'Clear skin', 'Better focus'],
    exercises: [
      { name: 'HIIT Training', duration: '30 min', intensity: 'High', emoji: '🏋️', tip: 'Your body recovers faster now — push harder!', ytUrl: yt('HIIT workout women 30 minutes full body'), ytLabel: 'HIIT Workout' },
      { name: 'Running / Jogging', duration: '30–45 min', intensity: 'High', emoji: '🏃', tip: 'Great time to set a new personal best', ytUrl: yt('running motivation women beginner jogging workout'), ytLabel: 'Running Guide' },
      { name: 'Dance Cardio', duration: '30 min', intensity: 'Moderate', emoji: '💃', tip: 'Channel your rising energy into fun movement', ytUrl: yt('dance cardio workout women 30 minutes fun'), ytLabel: 'Dance Cardio' },
      { name: 'Strength Training', duration: '40 min', intensity: 'High', emoji: '💪', tip: 'Muscle building is most effective in this phase', ytUrl: yt('strength training women 40 minutes full body'), ytLabel: 'Strength Training' },
    ],
    nutrition: ['Fermented foods (probiotic boost)', 'Leafy greens & cruciferous veggies', 'Seeds (flax, pumpkin)', 'Light proteins (eggs, fish)'],
    selfcare: ['Try something new creatively', 'Social activities & connection', 'Plan your month ahead', 'Light exfoliation skincare'],
    articles: [
      { title: 'Seed Cycling for Hormonal Balance', url: 'https://www.healthline.com/nutrition/seed-cycling', tag: '🌱 Hormones' },
      { title: 'Best Workouts for Your Cycle Phase', url: 'https://www.womenshealthmag.com/fitness/cycle-workouts', tag: '💪 Fitness' },
    ],
  },
  ovulation: {
    name: 'Ovulation Phase', days: '14–17', color: COLORS.purple, light: COLORS.lightPurple, emoji: '✨',
    desc: 'Peak energy and confidence. Estrogen & testosterone surge — you feel your best!',
    symptoms: ['Peak energy', 'High libido', 'Slight pelvic twinge', 'Clear discharge', 'Glowing skin'],
    exercises: [
      { name: 'Intense Cardio', duration: '45 min', intensity: 'Very High', emoji: '🔥', tip: 'Your pain tolerance is highest — go for it!', ytUrl: yt('intense cardio workout women 45 minutes burn'), ytLabel: 'Intense Cardio' },
      { name: 'Spin / Cycling', duration: '40 min', intensity: 'High', emoji: '🚴', tip: 'Great endurance window for challenging sessions', ytUrl: yt('indoor cycling spin workout 40 minutes'), ytLabel: 'Spin Class' },
      { name: 'Group Fitness', duration: '45 min', intensity: 'High', emoji: '🏊', tip: 'Social energy is at its peak — try a class', ytUrl: yt('group fitness class women 45 minutes'), ytLabel: 'Group Fitness' },
      { name: 'Power Yoga', duration: '40 min', intensity: 'Moderate', emoji: '🧘', tip: 'Combine strength and mindfulness', ytUrl: yt('power yoga 40 minutes strength flexibility'), ytLabel: 'Power Yoga' },
    ],
    nutrition: ['Antioxidant-rich fruits & berries', 'Zinc-rich foods (pumpkin seeds, chickpeas)', 'Hydration is key', 'Light wholegrains'],
    selfcare: ['Important conversations & decisions', 'Creative projects peak time', 'Schedule key events', 'Celebrate your natural energy'],
    articles: [
      { title: 'Signs of Ovulation You Should Know', url: 'https://www.healthline.com/health/womens-health/signs-of-ovulation', tag: '🔍 Fertility' },
      { title: 'Maximise Your Energy During Ovulation', url: 'https://www.verywellhealth.com/ovulation-phase', tag: '⚡ Energy' },
    ],
  },
  luteal: {
    name: 'Luteal Phase', days: '18–28', color: COLORS.gold, light: COLORS.lightGold, emoji: '🌙',
    desc: 'Progesterone rises. Body prepares for next cycle. Slow down, turn inward.',
    symptoms: ['PMS symptoms', 'Bloating', 'Mood swings', 'Tender breasts', 'Sugar cravings', 'Fatigue'],
    exercises: [
      { name: 'Moderate Yoga', duration: '30 min', intensity: 'Moderate', emoji: '🧘', tip: 'Focus on grounding and calming sequences', ytUrl: yt('yoga for PMS mood swings grounding 30 minutes'), ytLabel: 'Calming Yoga' },
      { name: 'Pilates', duration: '30 min', intensity: 'Moderate', emoji: '🤸', tip: 'Core-focused movement that doesn\'t overload', ytUrl: yt('pilates 30 minutes women core PMS'), ytLabel: 'Pilates Core' },
      { name: 'Brisk Walking', duration: '30 min', intensity: 'Low–Moderate', emoji: '🚶', tip: 'Steady-state cardio helps with PMS mood', ytUrl: yt('brisk walking workout indoor 30 minutes women'), ytLabel: 'Walking Cardio' },
      { name: 'Swim / Float', duration: '20–30 min', intensity: 'Low', emoji: '🏊', tip: 'Water is soothing for hormonal discomfort', ytUrl: yt('swimming beginner workout women calm'), ytLabel: 'Swimming Guide' },
    ],
    nutrition: ['Complex carbs (oats, sweet potato)', 'Magnesium for PMS (avocado, dark choc)', 'Calcium-rich foods', 'Reduce salt & processed foods'],
    selfcare: ['Rest & early nights', 'Journalling emotions', 'Limit caffeine & alcohol', 'Warm bath, aromatherapy'],
    articles: [
      { title: 'How to Manage PMS Naturally', url: 'https://www.medicalnewstoday.com/articles/pms-remedies', tag: '🌿 PMS Relief' },
      { title: 'Progesterone and Mood: What You Need to Know', url: 'https://www.healthline.com/health/progesterone-mood', tag: '🧠 Mood' },
    ],
  },
};

// ─── PREGNANCY WEEK DATA ─────────────────────────────────────────────
const TRIMESTER_DATA = {
  1: {
    name: 'First Trimester', weeks: '1–12', color: COLORS.rose, emoji: '🌱',
    milestones: ['Heart begins beating (wk 6)', 'All major organs forming', 'Embryo becomes fetus (wk 8)', 'Fingernails, toes forming (wk 10)'],
    symptoms: ['Morning sickness', 'Fatigue', 'Breast tenderness', 'Frequent urination', 'Food aversions'],
    tips: ['Take prenatal vitamins with folic acid', 'Stay hydrated — small sips often', 'Rest when you need to', 'Avoid raw fish, alcohol, soft cheeses'],
    exercises: [
      { name: 'Gentle Walking', duration: '20–30 min', emoji: '🚶', tip: 'Low impact, great for circulation', ytUrl: yt('gentle walking workout first trimester pregnancy'), ytLabel: 'Pregnancy Walk' },
      { name: 'Prenatal Yoga', duration: '20 min', emoji: '🧘', tip: 'Gentle stretches safe for first trimester', ytUrl: yt('prenatal yoga first trimester 20 minutes safe'), ytLabel: 'Prenatal Yoga T1' },
      { name: 'Swimming', duration: '20 min', emoji: '🏊', tip: 'Zero impact, great for nausea relief', ytUrl: yt('swimming pregnancy first trimester safe exercises'), ytLabel: 'Pregnancy Swimming' },
    ],
  },
  2: {
    name: 'Second Trimester', weeks: '13–27', color: COLORS.sage, emoji: '🌿',
    milestones: ['Baby kicks felt (wk 16–20)', 'Sex can be identified (wk 18–20)', 'Hearing develops (wk 24)', 'Eyes begin to open (wk 26)'],
    symptoms: ['Back pain', 'Round ligament pain', 'Heartburn', 'Leg cramps', 'Visible baby bump'],
    tips: ['Sleep on your left side', 'Kegel exercises daily', 'Prenatal massage is safe now', 'Track baby movements'],
    exercises: [
      { name: 'Prenatal Pilates', duration: '30 min', emoji: '🤸', tip: 'Builds core strength for labour', ytUrl: yt('prenatal pilates second trimester 30 minutes'), ytLabel: 'Prenatal Pilates' },
      { name: 'Stationary Bike', duration: '20–30 min', emoji: '🚴', tip: 'No balance risk, good cardio', ytUrl: yt('stationary bike workout pregnancy second trimester'), ytLabel: 'Bike Cardio' },
      { name: 'Aqua Aerobics', duration: '30 min', emoji: '💧', tip: 'Supports your growing belly', ytUrl: yt('aqua aerobics pregnancy second trimester workout'), ytLabel: 'Aqua Aerobics' },
    ],
  },
  3: {
    name: 'Third Trimester', weeks: '28–40', color: COLORS.purple, emoji: '🌸',
    milestones: ['Brain rapidly developing (wk 28–32)', 'Lungs maturing (wk 34)', 'Baby drops (wk 36)', 'Full term at wk 39–40'],
    symptoms: ['Braxton Hicks', 'Shortness of breath', 'Swollen ankles', 'Pelvic pressure', 'Nesting instinct'],
    tips: ['Prepare birth plan', 'Pack hospital bag (from wk 36)', 'Perineal massage from wk 34', 'Rest as much as possible'],
    exercises: [
      { name: 'Birthing Ball', duration: '20 min', emoji: '🏐', tip: 'Encourages baby into position', ytUrl: yt('birthing ball exercises third trimester labour'), ytLabel: 'Birthing Ball' },
      { name: 'Gentle Walking', duration: '15–20 min', emoji: '🚶', tip: 'Helps with pelvic engagement', ytUrl: yt('gentle walking third trimester pregnancy 15 minutes'), ytLabel: 'Third Trim Walk' },
      { name: 'Breathing Exercises', duration: '10 min', emoji: '🌬️', tip: 'Practice for active labour', ytUrl: yt('breathing exercises labour preparation third trimester'), ytLabel: 'Labour Breathing' },
    ],
  },
};

// ─── PCOS CONTENT ─────────────────────────────────────────────────────
const PCOS_CONTENT = {
  symptoms: ['Irregular periods', 'Excess hair growth', 'Acne', 'Weight gain', 'Hair thinning', 'Mood changes'],
  exercises: [
    { name: 'Walking', duration: '30–45 min', intensity: 'Moderate', emoji: '🚶', tip: 'Improves insulin sensitivity significantly', ytUrl: yt('walking workout PCOS weight loss insulin resistance'), ytLabel: 'PCOS Walking' },
    { name: 'Resistance Training', duration: '30 min', intensity: 'Moderate', emoji: '💪', tip: 'Builds muscle, reduces insulin resistance', ytUrl: yt('resistance training women PCOS 30 minutes'), ytLabel: 'Resistance Training' },
    { name: 'Yoga (hormone-focused)', duration: '30 min', intensity: 'Low', emoji: '🧘', tip: 'Reduces cortisol and balances hormones', ytUrl: yt('yoga for PCOS hormonal balance 30 minutes'), ytLabel: 'PCOS Yoga' },
    { name: 'HIIT (2x/week max)', duration: '20 min', intensity: 'High', emoji: '🔥', tip: 'Effective but limit to avoid cortisol spike', ytUrl: yt('HIIT workout PCOS women 20 minutes beginner'), ytLabel: 'PCOS HIIT' },
  ],
  nutrition: ['Low glycaemic index foods', 'Anti-inflammatory diet', 'Inositol-rich foods (citrus, whole grains)', 'Avoid refined sugars & processed carbs', 'Omega-3 fatty acids (salmon, walnuts)'],
  articles: [
    { title: 'PCOS and Insulin Resistance: What to Know', url: 'https://www.healthline.com/health/pcos-and-insulin-resistance', tag: '⚡ PCOS' },
    { title: 'Best Diet for PCOS', url: 'https://www.medicalnewstoday.com/articles/pcos-diet', tag: '🥗 Diet' },
    { title: 'Exercise and PCOS: What Works Best', url: 'https://www.verywellhealth.com/exercise-pcos', tag: '💪 Fitness' },
  ],
};

// ─── HELPER: format date ──────────────────────────────────────────────
const fmt = (n) => n.toString().padStart(2, '0');
const dayLabel = (offset) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return { date: `${fmt(d.getDate())} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`, dow: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] };
};

// ─── SECTION CARD ────────────────────────────────────────────────────
function SectionCard({ title, emoji, color, light, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[secStyles.card, { borderLeftColor: color }]}>
      <TouchableOpacity style={secStyles.header} onPress={() => setOpen(!open)}>
        <View style={[secStyles.iconWrap, { backgroundColor: light }]}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <Text style={secStyles.title}>{title}</Text>
        <Text style={[secStyles.chevron, { color }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={secStyles.body}>{children}</View>}
    </View>
  );
}
const secStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, borderLeftWidth: 4, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8 },
  header: { flexDirection:'row', alignItems:'center', padding:16, gap:12 },
  iconWrap: { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  title: { flex:1, fontSize:15, fontWeight:'700', color: '#2C2C2C' },
  chevron: { fontSize:12, fontWeight:'700' },
  body: { paddingHorizontal:16, paddingBottom:16 },
});

// ─── EXERCISE CARD ────────────────────────────────────────────────────
function ExerciseCard({ ex, color, light }) {
  const { Linking } = require('react-native');
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[exStyles.card, { borderColor: color + '50', backgroundColor: light }, expanded && { borderColor: color, borderWidth: 2 }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}>

      {/* Top row */}
      <View style={exStyles.topRow}>
        <View style={[exStyles.emojiWrap, { backgroundColor: color + '25' }]}>
          <Text style={exStyles.emoji}>{ex.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={exStyles.name}>{ex.name}</Text>
          <View style={exStyles.metaRow}>
            <View style={[exStyles.durationBadge, { backgroundColor: color + '20' }]}>
              <Text style={[exStyles.durationText, { color }]}>⏱ {ex.duration}</Text>
            </View>
            {ex.intensity && (
              <View style={[exStyles.intensityBadge, {
                backgroundColor:
                  ex.intensity === 'Very High' ? '#FFE0E0' :
                  ex.intensity === 'High' ? '#FFF0E0' :
                  ex.intensity === 'Moderate' ? '#FFFDE0' : '#E8F5E9'
              }]}>
                <Text style={[exStyles.intensityText, {
                  color:
                    ex.intensity === 'Very High' ? '#C00' :
                    ex.intensity === 'High' ? '#C06000' :
                    ex.intensity === 'Moderate' ? '#807000' : '#2A7A2A'
                }]}>{ex.intensity}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[exStyles.chevron, { color }]}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={exStyles.expanded}>
          <View style={[exStyles.tipBox, { backgroundColor: color + '12', borderColor: color + '30' }]}>
            <Text style={exStyles.tipText}>💡 {ex.tip}</Text>
          </View>

          {ex.ytUrl && (
            <View style={exStyles.ytSection}>
              <Text style={exStyles.ytSectionLabel}>🎬 Watch on YouTube</Text>
              <TouchableOpacity
                style={[exStyles.ytBtn, { borderColor: color }]}
                onPress={() => Linking.openURL(ex.ytUrl)}
                activeOpacity={0.8}>
                <LinearGradient colors={['#FF0000', '#CC0000']} style={exStyles.ytBtnGrad}>
                  <Text style={exStyles.ytBtnIcon}>▶</Text>
                  <Text style={exStyles.ytBtnText}>{ex.ytLabel || 'Watch Video'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[exStyles.ytSearchBtn, { borderColor: color + '60', backgroundColor: color + '12' }]}
                onPress={() => Linking.openURL(ex.ytUrl.replace('results?search_query', 'results?search_query'))}>
                <Text style={[exStyles.ytSearchText, { color }]}>🔍 See more {ex.name} videos</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
const exStyles = StyleSheet.create({
  card: { borderRadius:16, borderWidth:1.5, marginBottom:10, overflow:'hidden' },
  topRow: { flexDirection:'row', alignItems:'center', padding:14, gap:12 },
  emojiWrap: { width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center' },
  emoji: { fontSize:24 },
  name: { fontSize:14, fontWeight:'700', color:'#2C2C2C', marginBottom:6 },
  metaRow: { flexDirection:'row', gap:6, flexWrap:'wrap' },
  durationBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  durationText: { fontSize:11, fontWeight:'600' },
  intensityBadge: { borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  intensityText: { fontSize:11, fontWeight:'600' },
  chevron: { fontSize:12, fontWeight:'700' },
  expanded: { paddingHorizontal:14, paddingBottom:14, gap:10 },
  tipBox: { borderRadius:12, padding:12, borderWidth:1 },
  tipText: { fontSize:13, color:'#3A3A3A', lineHeight:20 },
  ytSection: { gap:8 },
  ytSectionLabel: { fontSize:11, fontWeight:'700', color:'#8A8A8A', letterSpacing:0.8 },
  ytBtn: { borderRadius:14, overflow:'hidden' },
  ytBtnGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, padding:14 },
  ytBtnIcon: { color:'white', fontSize:14, fontWeight:'900' },
  ytBtnText: { color:'white', fontWeight:'700', fontSize:15 },
  ytSearchBtn: { borderRadius:12, borderWidth:1.5, padding:11, alignItems:'center' },
  ytSearchText: { fontSize:13, fontWeight:'600' },
});

// ─── ARTICLE CHIP ─────────────────────────────────────────────────────
function ArticleChip({ article, color }) {
  const { Linking } = require('react-native');
  return (
    <TouchableOpacity style={[artStyles.chip, { borderColor: color + '50' }]}
      onPress={() => Linking.openURL(article.url)}>
      <View style={[artStyles.tag, { backgroundColor: color + '20' }]}>
        <Text style={[artStyles.tagText, { color }]}>{article.tag}</Text>
      </View>
      <Text style={artStyles.title} numberOfLines={2}>{article.title}</Text>
      <Text style={[artStyles.read, { color }]}>Read →</Text>
    </TouchableOpacity>
  );
}
const artStyles = StyleSheet.create({
  chip: { backgroundColor:'white', borderRadius:16, padding:14, marginBottom:8, borderWidth:1.5, elevation:2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4 },
  tag: { alignSelf:'flex-start', borderRadius:8, paddingHorizontal:8, paddingVertical:3, marginBottom:6 },
  tagText: { fontSize:10, fontWeight:'700' },
  title: { fontSize:14, fontWeight:'600', color:'#2C2C2C', marginBottom:6, lineHeight:20 },
  read: { fontSize:12, fontWeight:'700' },
});

// ─── CYCLE STRIP ──────────────────────────────────────────────────────
function CycleStrip({ profile, onPhaseSelect, selectedPhase }) {
  const { periodDuration = 5, cycleLength = 28, lastPeriodDay = 7 } = profile;
  const cycleDay = (lastPeriodDay % cycleLength) + 1;
  const ovDay = cycleLength - 14;
  const fertileStart = ovDay - 4;

  const getPhase = (d) => {
    if (d <= periodDuration) return 'menstrual';
    if (d < ovDay - 1) return 'follicular';
    if (d >= ovDay - 1 && d <= ovDay + 1) return 'ovulation';
    return 'luteal';
  };

  const phaseColors = {
    menstrual: COLORS.rose, follicular: COLORS.sage,
    ovulation: COLORS.purple, luteal: COLORS.gold,
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection:'row', gap:4 }}>
          {Array.from({ length: cycleLength }).map((_, i) => {
            const d = i + 1;
            const phase = getPhase(d);
            const isToday = d === cycleDay;
            const col = phaseColors[phase];
            const isSelected = selectedPhase === phase;
            return (
              <TouchableOpacity key={d}
                style={[cStyles.day, { backgroundColor: col + (isSelected ? 'FF' : '55') },
                  isToday && cStyles.dayToday]}
                onPress={() => onPhaseSelect(phase)}>
                <Text style={[cStyles.dayNum, { color: isSelected || isToday ? 'white' : col }]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={cStyles.legend}>
        {[['menstrual','🌺','Menstrual'], ['follicular','🌱','Follicular'], ['ovulation','✨','Ovulation'], ['luteal','🌙','Luteal']].map(([p, e, l]) => (
          <TouchableOpacity key={p} style={cStyles.legendItem} onPress={() => onPhaseSelect(p)}>
            <View style={[cStyles.legendDot, { backgroundColor: phaseColors[p] }]} />
            <Text style={cStyles.legendText}>{e} {l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={cStyles.cycleInfo}>
        <Text style={cStyles.cycleInfoText}>📅 You are on <Text style={{ fontWeight:'800', color: phaseColors[getPhase(cycleDay)] }}>Day {cycleDay}</Text> of your cycle</Text>
        <Text style={cStyles.cycleInfoText}>🔮 Next period in <Text style={{ fontWeight:'800', color: COLORS.rose }}>{cycleLength - cycleDay} days</Text></Text>
      </View>
    </View>
  );
}
const cStyles = StyleSheet.create({
  day: { width:30, height:30, borderRadius:8, alignItems:'center', justifyContent:'center' },
  dayToday: { borderWidth:2.5, borderColor:'#2C2C2C' },
  dayNum: { fontSize:10, fontWeight:'700' },
  legend: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10 },
  legendItem: { flexDirection:'row', alignItems:'center', gap:4 },
  legendDot: { width:8, height:8, borderRadius:4 },
  legendText: { fontSize:11, color:'#5A5A5A', fontWeight:'500' },
  cycleInfo: { backgroundColor:'#FDF0F2', borderRadius:12, padding:12, gap:4 },
  cycleInfoText: { fontSize:13, color:'#5A5A5A', lineHeight:20 },
});

// ─── SYMPTOM LOG MODAL ────────────────────────────────────────────────
function SymptomLogModal({ visible, onClose, phase, onSaveLog, existingLog }) {
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(null);
  const MOODS = ['😊','😐','😔','😤','😰','😴'];
  const symptoms = PHASE_DATA[phase]?.symptoms || [];

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelected(existingLog?.symptoms || []);
    setNotes(existingLog?.notes || '');
    setMood(existingLog?.mood || null);
  }, [existingLog, visible]);

  const save = async () => {
    const entry = { date: new Date().toISOString(), phase, symptoms: selected, mood, notes };
    await onSaveLog(entry);
    Alert.alert('✅ Saved', 'Your symptoms have been logged!');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={logStyles.overlay}>
        <View style={logStyles.sheet}>
          <View style={logStyles.handle} />
          <Text style={logStyles.title}>📝 Log Today's Symptoms</Text>
          <Text style={logStyles.sub}>Phase: {PHASE_DATA[phase]?.name}</Text>

          <Text style={logStyles.label}>HOW ARE YOU FEELING?</Text>
          <View style={logStyles.moods}>
            {MOODS.map(m => (
              <TouchableOpacity key={m} style={[logStyles.moodBtn, mood === m && logStyles.moodActive]}
                onPress={() => setMood(m)}>
                <Text style={{ fontSize: 28 }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={logStyles.label}>SYMPTOMS</Text>
          <View style={logStyles.chips}>
            {symptoms.map(s => (
              <TouchableOpacity key={s}
                style={[logStyles.chip, selected.includes(s) && { backgroundColor: COLORS.rose, borderColor: COLORS.rose }]}
                onPress={() => setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}>
                <Text style={[logStyles.chipText, selected.includes(s) && { color: 'white' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={logStyles.label}>NOTES</Text>
          <TextInput style={logStyles.input} value={notes} onChangeText={setNotes}
            placeholder="Any additional notes..." placeholderTextColor={COLORS.muted}
            multiline numberOfLines={3} />

          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity style={logStyles.cancelBtn} onPress={onClose}>
              <Text style={{ color: '#8A8A8A', fontWeight:'600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex:1 }} onPress={save}>
              <LinearGradient colors={[COLORS.rose, '#C05070']} style={logStyles.saveBtn}>
                <Text style={{ color:'white', fontWeight:'700', fontSize:15 }}>Save Log</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const logStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { backgroundColor:'white', borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:40 },
  handle: { width:40, height:4, backgroundColor:'#E0D8CF', borderRadius:2, alignSelf:'center', marginBottom:16 },
  title: { fontSize:20, fontWeight:'800', color: '#2C2C2C', marginBottom:4 },
  sub: { fontSize:13, color: '#8A8A8A', marginBottom:20 },
  label: { fontSize:10, fontWeight:'700', color: '#8A8A8A', letterSpacing:1.2, marginBottom:8 },
  moods: { flexDirection:'row', gap:8, marginBottom:20 },
  moodBtn: { width:46, height:46, borderRadius:23, backgroundColor:'#F5F0EA', alignItems:'center', justifyContent:'center' },
  moodActive: { backgroundColor: COLORS.lightRose, borderWidth:2, borderColor: COLORS.rose },
  chips: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  chip: { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor:'#E0D8CF', backgroundColor:'white' },
  chipText: { fontSize:13, color: '#2C2C2C', fontWeight:'500' },
  input: { borderWidth:1.5, borderColor:'#E0D8CF', borderRadius:14, padding:12, fontSize:14, color: '#2C2C2C', minHeight:80, textAlignVertical:'top', marginBottom:16 },
  cancelBtn: { flex:1, borderWidth:1.5, borderColor:'#E0D8CF', borderRadius:14, padding:14, alignItems:'center' },
  saveBtn: { borderRadius:14, padding:14, alignItems:'center' },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────
export default function FemaleHealthScreen({ navigation }) {
  const { profile, appState, saveAppSection } = useApp();
  const femaleHealthState = appState?.health?.femaleHealth || {};
  const [priority, setPriority] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(femaleHealthState.selectedPhase || 'menstrual');
  const [showLogModal, setShowLogModal] = useState(false);
  const [pregnancyWeek, setPregnancyWeek] = useState(femaleHealthState.pregnancyWeek || 12);
  const [showPriorityPicker, setShowPriorityPicker] = useState(!femaleHealthState.priorityId);

  const phaseData = PHASE_DATA[selectedPhase];
  const trimester = pregnancyWeek <= 12 ? 1 : pregnancyWeek <= 27 ? 2 : 3;
  const trimData = TRIMESTER_DATA[trimester];

  useEffect(() => {
    const matchedPriority = PRIORITIES.find((item) => item.id === femaleHealthState.priorityId) || null;
    setPriority(matchedPriority);
    setSelectedPhase(femaleHealthState.selectedPhase || 'menstrual');
    setPregnancyWeek(femaleHealthState.pregnancyWeek || 12);
    setShowPriorityPicker(!femaleHealthState.priorityId);
  }, [femaleHealthState.priorityId, femaleHealthState.selectedPhase, femaleHealthState.pregnancyWeek]);

  const updateFemaleHealthState = async (patch) => {
    await saveAppSection('health', prev => ({
      ...(prev || {}),
      femaleHealth: {
        ...((prev && prev.femaleHealth) || {}),
        ...patch,
      },
    }));
  };

  const selectPriority = (p) => {
    setPriority(p);
    setShowPriorityPicker(false);
    updateFemaleHealthState({ priorityId: p.id });
  };

  const updatePhase = (phase) => {
    setSelectedPhase(phase);
    updateFemaleHealthState({ selectedPhase: phase });
  };

  const updatePregnancy = (nextWeek) => {
    setPregnancyWeek(nextWeek);
    updateFemaleHealthState({ pregnancyWeek: nextWeek });
  };

  const resetPriority = async () => {
    setPriority(null);
    setShowPriorityPicker(true);
    await updateFemaleHealthState({ priorityId: null });
  };

  const saveSymptomLog = async (entry) => {
    const logKey = new Date().toISOString().split('T')[0];
    await updateFemaleHealthState({
      symptomLogs: {
        ...(femaleHealthState.symptomLogs || {}),
        [logKey]: entry,
      },
    });
  };

  const currentLog = (femaleHealthState.symptomLogs || {})[new Date().toISOString().split('T')[0]] || null;

  return (
    <View style={{ flex:1, backgroundColor: '#FAF7F2' }}>
      {/* Header */}
      <LinearGradient colors={['#FDF0F2', COLORS.cream]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Female Health</Text>
          {priority && (
            <View style={styles.priorityRow}>
              <View style={styles.priorityBadge}>
                <Text style={{ fontSize:12 }}>{PRIORITIES.find(p=>p.id===priority.id)?.emoji} {priority.label}</Text>
                <Text style={{ fontSize:10, color: '#8A8A8A' }}> · selected</Text>
              </View>
              <TouchableOpacity onPress={resetPriority} style={styles.priorityResetBtn}>
                <Text style={styles.priorityResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ width:36 }} />
      </LinearGradient>

      {/* Priority picker */}
      {showPriorityPicker && (
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }}>
          <Text style={styles.pickTitle}>What's your focus?</Text>
          <Text style={styles.pickSub}>Select your primary health priority for a personalised experience</Text>
          {PRIORITIES.map(p => (
            <TouchableOpacity key={p.id} style={styles.priorityCard} onPress={() => selectPriority(p)}>
              <LinearGradient colors={[p.light, 'white']} style={styles.priorityGrad}>
                <View style={[styles.priorityIcon, { backgroundColor: p.color + '25' }]}>
                  <Text style={{ fontSize:28 }}>{p.emoji}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[styles.priorityLabel, { color: p.color }]}>{p.label}</Text>
                  <Text style={styles.priorityDesc}>{p.desc}</Text>
                </View>
                <Text style={[styles.priorityArrow, { color: p.color }]}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content based on priority */}
      {!showPriorityPicker && priority && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16, paddingBottom:40 }}>

          {/* ── CYCLE TRACKING ── */}
          {priority.id === 'cycle' && (
            <>
              <SectionCard title="Your Cycle" emoji="📅" color={COLORS.rose} light={COLORS.lightRose}>
                <CycleStrip profile={profile} onPhaseSelect={updatePhase} selectedPhase={selectedPhase} />
                <TouchableOpacity style={styles.logBtn} onPress={() => setShowLogModal(true)}>
                  <LinearGradient colors={[COLORS.rose,'#C05070']} style={styles.logBtnGrad}>
                    <Text style={styles.logBtnText}>📝 Log Today's Symptoms</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </SectionCard>

              {/* Current phase card */}
              <View style={[styles.phaseCard, { backgroundColor: phaseData.light, borderColor: phaseData.color + '50' }]}>
                <Text style={[styles.phaseEmoji]}>{phaseData.emoji}</Text>
                <View style={{ flex:1 }}>
                  <Text style={[styles.phaseName, { color: phaseData.color }]}>{phaseData.name}</Text>
                  <Text style={styles.phaseDesc}>{phaseData.desc}</Text>
                </View>
              </View>

              <SectionCard title="Recommended Exercises" emoji="🏃" color={phaseData.color} light={phaseData.light}>
                {phaseData.exercises.map((ex, i) => (
                  <ExerciseCard key={i} ex={ex} color={phaseData.color} light={phaseData.light} />
                ))}
              </SectionCard>

              <SectionCard title="Nutrition Tips" emoji="🥗" color={COLORS.sage} light={COLORS.softGreen}>
                {phaseData.nutrition.map((n, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.sage }]}>●</Text>
                    <Text style={styles.listText}>{n}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Self-Care" emoji="💆" color={COLORS.purple} light={COLORS.lightPurple}>
                {phaseData.selfcare.map((s, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.purple }]}>✦</Text>
                    <Text style={styles.listText}>{s}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Helpful Articles" emoji="📖" color={COLORS.blue} light={COLORS.lightBlue}>
                {phaseData.articles.map((a, i) => (
                  <ArticleChip key={i} article={a} color={COLORS.blue} />
                ))}
              </SectionCard>
            </>
          )}

          {/* ── PREGNANCY ── */}
          {priority.id === 'pregnancy' && (
            <>
              <View style={[styles.pregWeekCard, { backgroundColor: trimData.light }]}>
                <Text style={styles.pregWeekLabel}>Week</Text>
                <Text style={[styles.pregWeekNum, { color: trimData.color }]}>{pregnancyWeek}</Text>
                <Text style={[styles.pregTrimester, { color: trimData.color }]}>{trimData.emoji} {trimData.name}</Text>
              </View>

              {/* Week selector */}
              <View style={styles.weekSelector}>
                <TouchableOpacity onPress={() => updatePregnancy(Math.max(1, pregnancyWeek - 1))} style={styles.weekBtn}>
                  <Text style={styles.weekBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.weekDisplay}>Week {pregnancyWeek} of 40</Text>
                <TouchableOpacity onPress={() => updatePregnancy(Math.min(40, pregnancyWeek + 1))} style={styles.weekBtn}>
                  <Text style={styles.weekBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <SectionCard title="Baby Milestones" emoji="👶" color={trimData.color} light={trimData.light}>
                {trimData.milestones.map((m, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: trimData.color }]}>●</Text>
                    <Text style={styles.listText}>{m}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Common Symptoms" emoji="💭" color={COLORS.rose} light={COLORS.lightRose}>
                {trimData.symptoms.map((s, i) => (
                  <View key={i} style={[styles.symptomChip, { backgroundColor: COLORS.lightRose, borderColor: COLORS.rose+'40' }]}>
                    <Text style={styles.symptomText}>{s}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Safe Exercises" emoji="🤸" color={COLORS.sage} light={COLORS.softGreen}>
                {trimData.exercises.map((ex, i) => (
                  <ExerciseCard key={i} ex={ex} color={COLORS.sage} light={COLORS.softGreen} />
                ))}
              </SectionCard>

              <SectionCard title="Trimester Tips" emoji="💡" color={COLORS.purple} light={COLORS.lightPurple}>
                {trimData.tips.map((t, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.purple }]}>✦</Text>
                    <Text style={styles.listText}>{t}</Text>
                  </View>
                ))}
              </SectionCard>
            </>
          )}

          {/* ── FERTILITY ── */}
          {priority.id === 'fertility' && (
            <>
              <SectionCard title="Fertile Window Tracker" emoji="🌿" color={COLORS.sage} light={COLORS.softGreen}>
                <CycleStrip profile={profile} onPhaseSelect={updatePhase} selectedPhase={selectedPhase} />
              </SectionCard>

              <View style={[styles.fertileCard, { backgroundColor: '#EAF2EC' }]}>
                <Text style={{ fontSize:22, marginBottom:6 }}>🌿</Text>
                <Text style={styles.fertileTitle}>Ovulation Phase has your highest fertility window</Text>
                <Text style={styles.fertileDesc}>Days {(profile.cycleLength||28)-16} to {(profile.cycleLength||28)-12} of your cycle are typically your most fertile.</Text>
              </View>

              {/* Fertility-focused phase info */}
              <SectionCard title="Phase Exercises for Fertility" emoji="🏃" color={COLORS.sage} light={COLORS.softGreen}>
                {PHASE_DATA.ovulation.exercises.map((ex, i) => (
                  <ExerciseCard key={i} ex={ex} color={COLORS.sage} light={COLORS.softGreen} />
                ))}
              </SectionCard>

              <SectionCard title="Fertility Nutrition" emoji="🥗" color={COLORS.gold} light={COLORS.lightGold}>
                {['Folate-rich foods (leafy greens, beans)', 'Antioxidants (berries, citrus)', 'Iron-rich foods (spinach, lentils)', 'CoQ10 for egg quality', 'Avoid trans fats & excess sugar'].map((n, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.gold }]}>●</Text>
                    <Text style={styles.listText}>{n}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Helpful Articles" emoji="📖" color={COLORS.blue} light={COLORS.lightBlue}>
                {[
                  { title: 'Tracking Ovulation: Best Methods', url: 'https://www.healthline.com/health/how-to-track-ovulation', tag: '🔍 Fertility' },
                  { title: 'Foods That Boost Fertility Naturally', url: 'https://www.medicalnewstoday.com/articles/fertility-foods', tag: '🥗 Nutrition' },
                ].map((a, i) => <ArticleChip key={i} article={a} color={COLORS.blue} />)}
              </SectionCard>
            </>
          )}

          {/* ── PCOS ── */}
          {priority.id === 'pcos' && (
            <>
              <View style={[styles.pcosCard, { backgroundColor: COLORS.lightOrange }]}>
                <Text style={{ fontSize:22, marginBottom:8 }}>⚡</Text>
                <Text style={styles.pcosTitle}>Managing PCOS with Lifestyle</Text>
                <Text style={styles.pcosDesc}>Regular movement and anti-inflammatory nutrition can significantly reduce PCOS symptoms and balance hormones.</Text>
              </View>

              <SectionCard title="Common PCOS Symptoms" emoji="💭" color={COLORS.orange} light={COLORS.lightOrange}>
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                  {PCOS_CONTENT.symptoms.map((s, i) => (
                    <View key={i} style={[styles.symptomChip, { backgroundColor: COLORS.lightOrange, borderColor: COLORS.orange+'40' }]}>
                      <Text style={[styles.symptomText, { color: COLORS.orange }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>

              <SectionCard title="Best Exercises for PCOS" emoji="🏃" color={COLORS.orange} light={COLORS.lightOrange}>
                {PCOS_CONTENT.exercises.map((ex, i) => (
                  <ExerciseCard key={i} ex={ex} color={COLORS.orange} light={COLORS.lightOrange} />
                ))}
              </SectionCard>

              <SectionCard title="PCOS Nutrition" emoji="🥗" color={COLORS.sage} light={COLORS.softGreen}>
                {PCOS_CONTENT.nutrition.map((n, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.sage }]}>●</Text>
                    <Text style={styles.listText}>{n}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Articles & Resources" emoji="📖" color={COLORS.blue} light={COLORS.lightBlue}>
                {PCOS_CONTENT.articles.map((a, i) => (
                  <ArticleChip key={i} article={a} color={COLORS.blue} />
                ))}
              </SectionCard>
            </>
          )}

          {/* ── MENOPAUSE ── */}
          {priority.id === 'menopause' && (
            <>
              <View style={[styles.pcosCard, { backgroundColor: COLORS.lightGold }]}>
                <Text style={{ fontSize:22, marginBottom:8 }}>🍂</Text>
                <Text style={styles.pcosTitle}>Perimenopause Support</Text>
                <Text style={styles.pcosDesc}>Perimenopause is a natural transition. Gentle movement, nutrition and mindfulness can ease symptoms significantly.</Text>
              </View>

              <SectionCard title="Common Symptoms" emoji="💭" color={COLORS.gold} light={COLORS.lightGold}>
                {['Hot flushes','Night sweats','Mood changes','Sleep disruption','Brain fog','Irregular periods','Joint aches'].map((s, i) => (
                  <View key={i} style={[styles.symptomChip, { backgroundColor: COLORS.lightGold, borderColor: COLORS.gold+'40' }]}>
                    <Text style={[styles.symptomText, { color: COLORS.gold }]}>{s}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Helpful Exercises" emoji="🏃" color={COLORS.gold} light={COLORS.lightGold}>
                {[
                  { name:'Weight-bearing exercise', duration:'30 min', emoji:'💪', tip:'Prevents bone density loss during menopause', ytUrl: yt('weight bearing exercise menopause bone health 30 minutes'), ytLabel: 'Bone Health Exercise' },
                  { name:'Yoga (cooling)', duration:'30 min', emoji:'🧘', tip:'Moon salutations help reduce hot flushes', ytUrl: yt('cooling yoga menopause hot flashes moon salutation'), ytLabel: 'Cooling Yoga' },
                  { name:'Swimming', duration:'30 min', emoji:'🏊', tip:'Cooling effect helps with heat symptoms', ytUrl: yt('swimming workout menopause women gentle 30 minutes'), ytLabel: 'Swimming Workout' },
                  { name:'Walking', duration:'30–45 min', emoji:'🚶', tip:'Supports mood, sleep and bone health', ytUrl: yt('walking workout perimenopause mood sleep women'), ytLabel: 'Menopause Walk' },
                ].map((ex, i) => <ExerciseCard key={i} ex={ex} color={COLORS.gold} light={COLORS.lightGold} />)}
              </SectionCard>

              <SectionCard title="Nutrition Support" emoji="🥗" color={COLORS.sage} light={COLORS.softGreen}>
                {['Calcium & Vitamin D (bone health)','Phytoestrogens (flax, soy, legumes)','Magnesium for sleep & mood','Reduce alcohol & spicy foods (trigger flushes)','Stay well hydrated'].map((n, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.sage }]}>●</Text>
                    <Text style={styles.listText}>{n}</Text>
                  </View>
                ))}
              </SectionCard>
            </>
          )}

          {/* ── GENERAL WELLNESS ── */}
          {priority.id === 'wellness' && (
            <>
              <SectionCard title="Your Cycle" emoji="📅" color={COLORS.teal} light={COLORS.lightTeal}>
                <CycleStrip profile={profile} onPhaseSelect={updatePhase} selectedPhase={selectedPhase} />
              </SectionCard>

              <SectionCard title="Phase-Based Wellness" emoji="🌿" color={COLORS.teal} light={COLORS.lightTeal}>
                {PHASE_DATA[selectedPhase].exercises.slice(0,2).map((ex, i) => (
                  <ExerciseCard key={i} ex={ex} color={COLORS.teal} light={COLORS.lightTeal} />
                ))}
              </SectionCard>

              <SectionCard title="Holistic Self-Care" emoji="💆" color={COLORS.purple} light={COLORS.lightPurple}>
                {['Daily mindfulness or meditation (10 min)','Consistent sleep schedule (10pm–6am)','Journal your emotions and energy levels','Limit screen time 1h before bed','Connect with nature daily'].map((s, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: COLORS.purple }]}>✦</Text>
                    <Text style={styles.listText}>{s}</Text>
                  </View>
                ))}
              </SectionCard>

              <SectionCard title="Wellness Articles" emoji="📖" color={COLORS.blue} light={COLORS.lightBlue}>
                {[
                  { title:'Cycle Syncing: The Ultimate Guide', url:'https://www.healthline.com/health/cycle-syncing', tag:'🌸 Cycle' },
                  { title:'Hormonal Balance Through Nutrition', url:'https://www.medicalnewstoday.com/articles/hormones-and-diet', tag:'🥗 Nutrition' },
                  { title:'Mental Health and the Menstrual Cycle', url:'https://www.verywellmind.com/menstrual-cycle-mental-health', tag:'🧠 Mental' },
                ].map((a, i) => <ArticleChip key={i} article={a} color={COLORS.blue} />)}
              </SectionCard>
            </>
          )}

        </ScrollView>
      )}

      <SymptomLogModal
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        phase={selectedPhase}
        onSaveLog={saveSymptomLog}
        existingLog={currentLog && currentLog.phase === selectedPhase ? currentLog : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop:56, paddingBottom:16, paddingHorizontal:20, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  headerCenter: { alignItems:'center' },
  headerTitle: { fontSize:22, fontWeight:'800', color: '#2C2C2C' },
  priorityRow: { flexDirection:'row', alignItems:'center', gap:6, marginTop:3 },
  priorityBadge: { flexDirection:'row', alignItems:'center', marginTop:3, backgroundColor:'rgba(212,116,138,0.1)', borderRadius:10, paddingHorizontal:8, paddingVertical:3 },
  priorityResetBtn: { backgroundColor:'#FFFFFF', borderRadius:10, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:'rgba(0,0,0,0.08)' },
  priorityResetText: { fontSize:10, fontWeight:'700', color:'#7A5FA8' },
  backBtn: { width:36, height:36, justifyContent:'center' },
  backArrow: { fontSize:24, color: '#2C2C2C' },

  pickTitle: { fontSize:26, fontWeight:'900', color: '#2C2C2C', marginBottom:6 },
  pickSub: { fontSize:14, color: '#8A8A8A', marginBottom:24, lineHeight:21 },

  priorityCard: { borderRadius:20, marginBottom:12, overflow:'hidden', elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:8 },
  priorityGrad: { flexDirection:'row', alignItems:'center', padding:16, gap:14 },
  priorityIcon: { width:54, height:54, borderRadius:16, alignItems:'center', justifyContent:'center' },
  priorityLabel: { fontSize:16, fontWeight:'700' },
  priorityDesc: { fontSize:12, color: '#8A8A8A', marginTop:2 },
  priorityArrow: { fontSize:20, fontWeight:'700' },

  phaseCard: { flexDirection:'row', alignItems:'center', gap:14, borderRadius:18, padding:16, marginBottom:12, borderWidth:1.5 },
  phaseEmoji: { fontSize:32 },
  phaseName: { fontSize:16, fontWeight:'700', marginBottom:4 },
  phaseDesc: { fontSize:13, color: '#8A8A8A', lineHeight:19 },

  logBtn: { marginTop:10, borderRadius:14, overflow:'hidden' },
  logBtnGrad: { padding:14, alignItems:'center' },
  logBtnText: { color:'white', fontWeight:'700', fontSize:15 },

  listItem: { flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:8 },
  listDot: { fontSize:10, marginTop:4 },
  listText: { flex:1, fontSize:13, color: '#2C2C2C', lineHeight:20 },

  symptomChip: { paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1 },
  symptomText: { fontSize:12, fontWeight:'600', color: COLORS.rose },

  pregWeekCard: { borderRadius:22, padding:20, alignItems:'center', marginBottom:14 },
  pregWeekLabel: { fontSize:12, color: '#8A8A8A', letterSpacing:1, textTransform:'uppercase' },
  pregWeekNum: { fontSize:64, fontWeight:'900', lineHeight:70 },
  pregTrimester: { fontSize:16, fontWeight:'700', marginTop:4 },

  weekSelector: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:20, marginBottom:16 },
  weekBtn: { width:44, height:44, borderRadius:22, backgroundColor:'white', alignItems:'center', justifyContent:'center', elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:6 },
  weekBtnText: { fontSize:24, fontWeight:'700', color: COLORS.rose },
  weekDisplay: { fontSize:16, fontWeight:'700', color: '#2C2C2C' },

  fertileCard: { borderRadius:18, padding:18, marginBottom:12, alignItems:'center' },
  fertileTitle: { fontSize:15, fontWeight:'700', color: '#2C2C2C', textAlign:'center', marginBottom:6 },
  fertileDesc: { fontSize:13, color: '#8A8A8A', textAlign:'center', lineHeight:20 },

  pcosCard: { borderRadius:18, padding:18, marginBottom:12 },
  pcosTitle: { fontSize:16, fontWeight:'700', color: '#2C2C2C', marginBottom:6 },
  pcosDesc: { fontSize:13, color: '#8A8A8A', lineHeight:20 },
});
