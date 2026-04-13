import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, Platform, Alert, AppState
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pedometer } from 'expo-sensors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const COLORS = {
  sage: '#7C9E87', cream: '#FAF7F2', charcoal: '#2C2C2C',
  muted: '#8A8A8A', softGreen: '#EAF2EC', rose: '#D4748A',
  blue: '#5A7FA8', lightBlue: '#EBF2F8', orange: '#D4884A',
  lightOrange: '#FDF3EB', gold: '#D4A842', lightGold: '#FDF8EC',
  purple: '#7A5FA8', lightPurple: '#F0EBF8', red: '#E05555',
};

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── CIRCULAR PROGRESS ───────────────────────────────────────────────
function CircularProgress({ steps, goal, size = 200 }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const pct = Math.min(steps / goal, 1);
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * pct;

  useEffect(() => {
    Animated.timing(animVal, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
  }, [pct]);

  const color = pct >= 1 ? COLORS.gold : pct >= 0.7 ? COLORS.sage : pct >= 0.4 ? COLORS.blue : COLORS.orange;
  const label = pct >= 1 ? '🏆 Goal Reached!' : pct >= 0.7 ? '💪 Almost there!' : pct >= 0.4 ? '🚶 Keep going!' : '👟 Get moving!';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {/* Background circle */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 12, borderColor: '#F0EAE0' }} />
      {/* SVG-like arc using border trick */}
      <View style={[styles.arcWrap, { width: size, height: size }]}>
        <View style={[styles.arcHalf, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 12, borderColor: color,
          transform: [{ rotate: `${pct * 360}deg` }],
          opacity: pct > 0 ? 1 : 0,
        }]} />
      </View>
      {/* Center content */}
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.circleSteps, { color }]}>{steps.toLocaleString()}</Text>
        <Text style={styles.circleLabel}>steps</Text>
        <Text style={styles.circleGoal}>/ {goal.toLocaleString()} goal</Text>
        <Text style={[styles.circleStatus, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────
function BarChart({ data, labels, goal, color, highlightLast = true }) {
  const maxVal = Math.max(...data, goal, 1);
  return (
    <View style={styles.barChart}>
      {data.map((val, i) => {
        const isHighlight = highlightLast && i === data.length - 1;
        const pct = val / maxVal;
        const barColor = val >= goal ? COLORS.gold : isHighlight ? color : color + '88';
        return (
          <View key={i} style={styles.barCol}>
            {val >= goal && <Text style={styles.barStar}>⭐</Text>}
            <View style={styles.barBg}>
              <View style={[styles.barFill, {
                height: `${Math.max(pct * 100, val > 0 ? 4 : 0)}%`,
                backgroundColor: barColor,
              }]} />
            </View>
            <Text style={[styles.barLbl, isHighlight && { color, fontWeight: '700' }]}>{labels[i]}</Text>
            {val > 0 && <Text style={styles.barVal}>{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}</Text>}
          </View>
        );
      })}
    </View>
  );
}

// ─── STAT TILE ────────────────────────────────────────────────────────
function StatTile({ icon, label, value, sub, color, light }) {
  return (
    <View style={[styles.statTile, { backgroundColor: light, borderColor: color + '40' }]}>
      <Text style={styles.statTileIcon}>{icon}</Text>
      <Text style={[styles.statTileVal, { color }]}>{value}</Text>
      <Text style={styles.statTileLbl}>{label}</Text>
      {sub && <Text style={styles.statTileSub}>{sub}</Text>}
    </View>
  );
}

// ─── BMI GAUGE ────────────────────────────────────────────────────────
function BMIGauge({ bmi }) {
  const segments = [
    { label: 'Under', range: '<18.5', color: COLORS.blue,   max: 18.5 },
    { label: 'Normal', range: '18.5–25', color: COLORS.sage, max: 25 },
    { label: 'Over',  range: '25–30', color: COLORS.gold,   max: 30 },
    { label: 'Obese', range: '>30',   color: COLORS.red,    max: 40 },
  ];

  const getSegment = () => {
    if (bmi < 18.5) return segments[0];
    if (bmi < 25)   return segments[1];
    if (bmi < 30)   return segments[2];
    return segments[3];
  };

  const seg = getSegment();
  const pct = Math.min((bmi - 10) / 30, 1); // 10–40 range mapped to 0–1

  const tips = {
    'Under': 'Consider consulting a nutritionist. Increase caloric intake with nutrient-rich foods.',
    'Normal': 'Great work! Maintain your healthy lifestyle with regular exercise and balanced diet.',
    'Over': 'Small lifestyle changes like daily walks and reduced sugar can make a big difference.',
    'Obese': 'Consult your doctor for a personalised plan. Every small step counts toward better health.',
  };

  return (
    <View style={styles.bmiCard}>
      <Text style={styles.bmiCardTitle}>⚖️ BMI Analysis</Text>

      {/* Big BMI number */}
      <View style={styles.bmiCenter}>
        <Text style={[styles.bmiNumber, { color: seg.color }]}>{bmi}</Text>
        <View style={[styles.bmiCatBadge, { backgroundColor: seg.color + '20' }]}>
          <Text style={[styles.bmiCatText, { color: seg.color }]}>{seg.label}weight</Text>
        </View>
      </View>

      {/* Gradient bar gauge */}
      <View style={styles.bmiGaugeWrap}>
        <View style={styles.bmiGaugeBar}>
          {segments.map((s, i) => (
            <View key={i} style={[styles.bmiSegment, { backgroundColor: s.color + (i === segments.indexOf(seg) ? 'FF' : '55') }]} />
          ))}
          {/* Pointer */}
          <View style={[styles.bmiPointer, { left: `${Math.max(2, Math.min(pct * 100, 96))}%`, borderBottomColor: seg.color }]} />
        </View>
        <View style={styles.bmiGaugeLabels}>
          {segments.map(s => (
            <Text key={s.label} style={styles.bmiGaugeLbl}>{s.range}</Text>
          ))}
        </View>
      </View>

      {/* Tip */}
      <View style={[styles.bmiTip, { backgroundColor: seg.color + '15', borderColor: seg.color + '40' }]}>
        <Text style={[styles.bmiTipText, { color: seg.color }]}>💡 {tips[seg.label]}</Text>
      </View>

      {/* BMI breakdown */}
      <View style={styles.bmiBreakdown}>
        {segments.map(s => (
          <View key={s.label} style={styles.bmiBreakdownItem}>
            <View style={[styles.bmiDot, { backgroundColor: s.color }]} />
            <Text style={styles.bmiBreakdownText}>{s.label} {s.range}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── CALORIE CARD ─────────────────────────────────────────────────────
function CalorieCard({ steps, weight }) {
  // MET method: ~0.04 kcal per step per kg / 70kg reference
  const cals = Math.round(steps * 0.04 * (weight / 70));
  const walkKm = (steps * 0.000762).toFixed(2);
  const walkMin = Math.round(steps / 100);

  return (
    <View style={styles.calCard}>
      <Text style={styles.calTitle}>🔥 Today's Activity</Text>
      <View style={styles.calRow}>
        <View style={styles.calItem}>
          <Text style={styles.calVal}>{cals}</Text>
          <Text style={styles.calLbl}>Calories</Text>
        </View>
        <View style={styles.calDivider} />
        <View style={styles.calItem}>
          <Text style={styles.calVal}>{walkKm}</Text>
          <Text style={styles.calLbl}>Kilometers</Text>
        </View>
        <View style={styles.calDivider} />
        <View style={styles.calItem}>
          <Text style={styles.calVal}>{walkMin}</Text>
          <Text style={styles.calLbl}>Minutes</Text>
        </View>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────
export default function StepsScreen({ navigation }) {
  const { profile, appState, saveAppSection } = useApp();
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [todaySteps, setTodaySteps] = useState(0);
  const [activeTab, setActiveTab] = useState('day'); // day | week | month
  const [weekData, setWeekData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [monthData, setMonthData] = useState([]);
  const subscriptionRef = useRef(null);
  const sensorBaseRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);

  const goal = profile.stepsGoal || 8000;
  const weight = profile.weight || 65;
  const height = profile.height || 165;
  const bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
  const stepsState = appState?.health?.steps || { today: 0, byDate: {} };

  // ── Today's date helpers ──
  const toLocalDateKey = (date = new Date()) => {
    const next = new Date(date);
    const offset = next.getTimezoneOffset() * 60000;
    return new Date(next.getTime() - offset).toISOString().split('T')[0];
  };
  const todayKey = () => toLocalDateKey(new Date());

  // ── Save steps to storage ──
  const saveSteps = async (steps) => {
    const dateKey = todayKey();
    await saveAppSection('health', prev => ({
      ...(prev || {}),
      steps: {
        ...(((prev || {}).steps) || {}),
        today: steps,
        lastSyncedAt: new Date().toISOString(),
        byDate: {
          ...((((prev || {}).steps) || {}).byDate || {}),
          [dateKey]: steps,
        },
      },
    }));
  };

  // ── Load week data from storage ──
  const loadWeekData = async () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      const val = stepsState.byDate?.[key];
      data.push(val ? parseInt(val) : 0);
    }
    setWeekData(data);
  };

  // ── Load month data ──
  const loadMonthData = async () => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth(), i);
      const key = toLocalDateKey(d);
      const val = stepsState.byDate?.[key];
      data.push(val ? parseInt(val) : 0);
    }
    setMonthData(data);
  };

  // ── Start pedometer ──
  useEffect(() => {
    syncStepsFromSensor();
    loadWeekData();
    loadMonthData();
    return () => { subscriptionRef.current?.remove(); };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInactive = appStateRef.current.match(/inactive|background/);
      if (wasInactive && nextAppState === 'active') {
        syncStepsFromSensor();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [appState?.health?.steps]);

  useEffect(() => {
    if (stepsState.today || stepsState.byDate) {
      setTodaySteps(stepsState.byDate?.[todayKey()] ?? stepsState.today ?? 0);
      loadWeekData();
      loadMonthData();
    }
  }, [appState?.health?.steps]);

  const syncStepsFromSensor = async () => {
    subscriptionRef.current?.remove();
    const avail = await Pedometer.isAvailableAsync();
    setPedometerAvailable(avail);

    if (!avail) {
      // Load saved steps if sensor unavailable
      setTodaySteps(stepsState.byDate?.[todayKey()] ?? stepsState.today ?? 0);
      return;
    }

    // Get steps since midnight today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    try {
      const result = await Pedometer.getStepCountAsync(start, end);
      sensorBaseRef.current = result.steps;
      setTodaySteps(result.steps);
      await saveSteps(result.steps);
      await loadWeekData();
      await loadMonthData();
    } catch (e) {}

    // Live step updates
    const sub = Pedometer.watchStepCount(result => {
      const newSteps = sensorBaseRef.current + result.steps;
      setTodaySteps(newSteps);
      saveSteps(newSteps);
    });
    subscriptionRef.current = sub;
  };

  // ── Computed stats ──
  const weekTotal = weekData.reduce((a, b) => a + b, 0);
  const weekAvg = Math.round(weekTotal / 7);
  const weekBest = Math.max(...weekData);
  const monthTotal = monthData.reduce((a, b) => a + b, 0);
  const monthAvg = Math.round(monthTotal / (new Date().getDate()));
  const daysHitGoal = weekData.filter(s => s >= goal).length;

  // ── Week labels (Mon–Sun, today highlighted) ──
  const weekLabels = (() => {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(i === 0 ? 'Today' : DAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1]);
    }
    return labels;
  })();

  // ── Month labels (every 5th day) ──
  const monthLabels = monthData.map((_, i) => (i + 1) % 5 === 0 || i === 0 ? `${i + 1}` : '');

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      {/* Header */}
      <LinearGradient colors={[COLORS.softGreen, COLORS.cream]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Steps & BMI</Text>
          <View style={styles.sensorBadge}>
            <View style={[styles.sensorDot, { backgroundColor: pedometerAvailable ? COLORS.sage : COLORS.orange }]} />
            <Text style={styles.sensorText}>{pedometerAvailable ? 'Live sensor active' : 'Sensor unavailable'}</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Circular progress ── */}
        <View style={styles.circleSection}>
          <CircularProgress steps={todaySteps} goal={goal} size={200} />
          <View style={styles.circleInfo}>
            <Text style={styles.circleInfoRemain}>
              {todaySteps >= goal
                ? `🎉 +${(todaySteps - goal).toLocaleString()} bonus steps!`
                : `${(goal - todaySteps).toLocaleString()} steps to go`}
            </Text>
            {!pedometerAvailable && (
              <View style={styles.sensorWarning}>
                <Text style={styles.sensorWarningText}>
                  ⚠️ Motion sensor not available on this device. Data loaded from storage.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Calorie card ── */}
          <CalorieCard steps={todaySteps} weight={weight} />

          {/* ── Quick stats ── */}
          <View style={styles.quickStats}>
            <StatTile icon="🏆" label="Best Day" value={weekBest.toLocaleString()} sub="this week" color={COLORS.gold} light={COLORS.lightGold} />
            <StatTile icon="📊" label="Week Avg" value={weekAvg.toLocaleString()} sub="steps/day" color={COLORS.blue} light={COLORS.lightBlue} />
            <StatTile icon="✅" label="Goal Days" value={`${daysHitGoal}/7`} sub="this week" color={COLORS.sage} light={COLORS.softGreen} />
          </View>

          {/* ── Tab selector ── */}
          <View style={styles.tabRow}>
            {['day', 'week', 'month'].map(t => (
              <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]}
                onPress={() => setActiveTab(t)}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t === 'day' ? '📅 Today' : t === 'week' ? '📆 Week' : '🗓️ Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── DAY VIEW ── */}
          {activeTab === 'day' && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Today's Progress</Text>
              <View style={styles.dayProgress}>
                <View style={styles.dayProgressBg}>
                  <View style={[styles.dayProgressFill, {
                    width: `${Math.min(todaySteps / goal * 100, 100)}%`,
                    backgroundColor: todaySteps >= goal ? COLORS.gold : COLORS.sage,
                  }]} />
                </View>
                <Text style={styles.dayProgressPct}>{Math.round(todaySteps / goal * 100)}%</Text>
              </View>
              <View style={styles.dayStats}>
                <View style={styles.dayStatItem}>
                  <Text style={styles.dayStatVal}>{todaySteps.toLocaleString()}</Text>
                  <Text style={styles.dayStatLbl}>Steps taken</Text>
                </View>
                <View style={styles.dayStatItem}>
                  <Text style={styles.dayStatVal}>{goal.toLocaleString()}</Text>
                  <Text style={styles.dayStatLbl}>Daily goal</Text>
                </View>
                <View style={styles.dayStatItem}>
                  <Text style={styles.dayStatVal}>{Math.round(todaySteps / goal * 100)}%</Text>
                  <Text style={styles.dayStatLbl}>Completed</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── WEEK VIEW ── */}
          {activeTab === 'week' && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>This Week</Text>
                <Text style={styles.chartSub}>Total: {weekTotal.toLocaleString()}</Text>
              </View>
              <BarChart data={weekData} labels={weekLabels} goal={goal} color={COLORS.sage} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{weekTotal.toLocaleString()}</Text>
                  <Text style={styles.summaryLbl}>Total Steps</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{weekAvg.toLocaleString()}</Text>
                  <Text style={styles.summaryLbl}>Daily Average</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: COLORS.gold }]}>{daysHitGoal}</Text>
                  <Text style={styles.summaryLbl}>Days Hit Goal</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── MONTH VIEW ── */}
          {activeTab === 'month' && (
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{MONTHS_SHORT[new Date().getMonth()]} {new Date().getFullYear()}</Text>
                <Text style={styles.chartSub}>Total: {monthTotal.toLocaleString()}</Text>
              </View>
              {monthData.length > 0
                ? <BarChart data={monthData} labels={monthLabels} goal={goal} color={COLORS.blue} highlightLast={false} />
                : <Text style={{ color: '#8A8A8A', textAlign: 'center', padding: 20 }}>Loading month data...</Text>
              }
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{monthTotal.toLocaleString()}</Text>
                  <Text style={styles.summaryLbl}>Total Steps</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{monthAvg.toLocaleString()}</Text>
                  <Text style={styles.summaryLbl}>Daily Average</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: COLORS.gold }]}>
                    {monthData.filter(s => s >= goal).length}
                  </Text>
                  <Text style={styles.summaryLbl}>Goal Days</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── BMI ── */}
          <BMIGauge bmi={bmi} />

          {/* ── Health metrics ── */}
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>📋 Health Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>📏</Text>
                <Text style={styles.metricVal}>{height} cm</Text>
                <Text style={styles.metricLbl}>Height</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>⚖️</Text>
                <Text style={styles.metricVal}>{weight} kg</Text>
                <Text style={styles.metricLbl}>Weight</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>🧮</Text>
                <Text style={styles.metricVal}>{bmi}</Text>
                <Text style={styles.metricLbl}>BMI</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>🔥</Text>
                <Text style={styles.metricVal}>{Math.round(weight * 24)}</Text>
                <Text style={styles.metricLbl}>BMR (kcal)</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>💪</Text>
                <Text style={styles.metricVal}>{(weight * 0.762).toFixed(1)} kg</Text>
                <Text style={styles.metricLbl}>Lean Mass~</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricIcon}>🏃</Text>
                <Text style={styles.metricVal}>{goal.toLocaleString()}</Text>
                <Text style={styles.metricLbl}>Step Goal</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C2C2C' },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#2C2C2C' },
  sensorBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  sensorDot: { width: 7, height: 7, borderRadius: 4 },
  sensorText: { fontSize: 11, color: '#8A8A8A' },

  // Circle
  circleSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#EAF2EC' + '60' },
  arcWrap: { position: 'absolute' },
  arcHalf: { position: 'absolute', borderWidth: 12, borderColor: 'transparent' },
  circleSteps: { fontSize: 40, fontWeight: '900' },
  circleLabel: { fontSize: 14, color: '#8A8A8A', marginTop: -4 },
  circleGoal: { fontSize: 12, color: '#8A8A8A' },
  circleStatus: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  circleInfo: { alignItems: 'center', marginTop: 10 },
  circleInfoRemain: { fontSize: 14, color: '#8A8A8A', fontWeight: '500' },
  sensorWarning: { backgroundColor: COLORS.lightOrange, borderRadius: 10, padding: 8, marginTop: 8, maxWidth: 280 },
  sensorWarningText: { fontSize: 11, color: COLORS.orange, textAlign: 'center' },

  content: { padding: 16 },

  // Calorie card
  calCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  calTitle: { fontSize: 16, fontWeight: '700', color: '#2C2C2C', marginBottom: 14 },
  calRow: { flexDirection: 'row', alignItems: 'center' },
  calItem: { flex: 1, alignItems: 'center' },
  calVal: { fontSize: 22, fontWeight: '800', color: COLORS.orange },
  calLbl: { fontSize: 11, color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  calDivider: { width: 1, height: 36, backgroundColor: '#E8E0D5' },

  // Quick stats
  quickStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statTile: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1.5 },
  statTileIcon: { fontSize: 20, marginBottom: 4 },
  statTileVal: { fontSize: 16, fontWeight: '800' },
  statTileLbl: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
  statTileSub: { fontSize: 10, color: '#8A8A8A', marginTop: 1 },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: '#EDE8E0', borderRadius: 16, padding: 4, gap: 4, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:4 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#8A8A8A' },
  tabTextActive: { color: '#2C2C2C' },

  // Chart card
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chartTitle: { fontSize: 17, fontWeight: '800', color: '#2C2C2C', marginBottom: 14 },
  chartSub: { fontSize: 12, color: '#8A8A8A' },

  // Day view
  dayProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dayProgressBg: { flex: 1, height: 14, backgroundColor: '#F0EAE0', borderRadius: 7, overflow: 'hidden' },
  dayProgressFill: { height: '100%', borderRadius: 7 },
  dayProgressPct: { fontSize: 14, fontWeight: '700', color: '#2C2C2C', minWidth: 40, textAlign: 'right' },
  dayStats: { flexDirection: 'row' },
  dayStatItem: { flex: 1, alignItems: 'center' },
  dayStatVal: { fontSize: 20, fontWeight: '800', color: COLORS.sage },
  dayStatLbl: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },

  // Bar chart
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 100, marginBottom: 8 },
  barCol: { flex: 1, alignItems: 'center', gap: 3 },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: '#F8F5F0', borderRadius: 6, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLbl: { fontSize: 9, color: '#8A8A8A', textAlign: 'center' },
  barVal: { fontSize: 8, color: '#8A8A8A', textAlign: 'center' },
  barStar: { fontSize: 9 },

  // Summary
  summaryRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EAE0' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: '800', color: '#2C2C2C' },
  summaryLbl: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },

  // BMI
  bmiCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  bmiCardTitle: { fontSize: 17, fontWeight: '800', color: '#2C2C2C', marginBottom: 14 },
  bmiCenter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  bmiNumber: { fontSize: 52, fontWeight: '900' },
  bmiCatBadge: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  bmiCatText: { fontSize: 16, fontWeight: '700' },
  bmiGaugeWrap: { marginBottom: 14 },
  bmiGaugeBar: { height: 16, flexDirection: 'row', borderRadius: 8, overflow: 'visible', marginBottom: 4, position: 'relative' },
  bmiSegment: { flex: 1 },
  bmiPointer: { position: 'absolute', top: -8, width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginLeft: -8 },
  bmiGaugeLabels: { flexDirection: 'row' },
  bmiGaugeLbl: { flex: 1, fontSize: 9, color: '#8A8A8A', textAlign: 'center' },
  bmiTip: { borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1 },
  bmiTipText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
  bmiBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bmiBreakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bmiDot: { width: 8, height: 8, borderRadius: 4 },
  bmiBreakdownText: { fontSize: 11, color: '#8A8A8A' },

  // Metrics
  metricsCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 40, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8 },
  metricsTitle: { fontSize: 17, fontWeight: '800', color: '#2C2C2C', marginBottom: 14 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricItem: { width: (width - 76) / 3, backgroundColor: '#EAF2EC', borderRadius: 14, padding: 12, alignItems: 'center' },
  metricIcon: { fontSize: 20, marginBottom: 4 },
  metricVal: { fontSize: 15, fontWeight: '800', color: '#2C2C2C' },
  metricLbl: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
});
