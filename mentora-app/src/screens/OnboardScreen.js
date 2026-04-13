import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Dimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const COLORS = {
  sage: '#7C9E87', blush: '#E8B4B8', cream: '#FAF7F2',
  charcoal: '#2C2C2C', muted: '#8A8A8A', rose: '#D4748A',
  softGreen: '#EAF2EC', dusty: '#C4A882', blue: '#5A7FA8',
};

function BMIBadge({ height, weight }) {
  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  let cat = 'Normal ✓', color = COLORS.sage;
  if (bmi < 18.5) { cat = 'Underweight'; color = COLORS.blue; }
  else if (bmi >= 25 && bmi < 30) { cat = 'Overweight'; color = COLORS.dusty; }
  else if (bmi >= 30) { cat = 'Obese'; color = COLORS.rose; }
  return (
    <View style={styles.bmiBadge}>
      <View>
        <Text style={styles.bmiLabel}>Your BMI</Text>
        <Text style={[styles.bmiCat, { color }]}>{cat}</Text>
      </View>
      <Text style={[styles.bmiVal, { color }]}>{bmi}</Text>
    </View>
  );
}

function StepDots({ current, total }) {
  return (
    <View style={styles.stepDots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i < current ? styles.dotDone : i === current ? styles.dotActive : styles.dotEmpty]} />
      ))}
    </View>
  );
}

export default function OnboardScreen({ navigation }) {
  const { profile, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [height, setHeight] = useState(profile.height || 165);
  const [weight, setWeight] = useState(profile.weight || 65);
  const [stepsGoal, setStepsGoal] = useState(profile.stepsGoal || 8000);
  const [sex, setSex] = useState(profile.sex || '');
  const [lastPeriodDay, setLastPeriodDay] = useState(Number(profile.lastPeriodDay) || 7);
  const [periodDuration, setPeriodDuration] = useState(profile.periodDuration || 5);
  const [cycleLength, setCycleLength] = useState(profile.cycleLength || 28);

  const next = () => {
    if (step === 1 && !sex) { return; }
    if (step < 2) setStep(step + 1);
    else finish();
  };
  const back = () => setStep(step - 1);

  const finish = () => {
    updateProfile({ height, weight, stepsGoal, sex, lastPeriodDay, periodDuration, cycleLength, onboardingCompleted: true });
    navigation.replace('Main');
  };

  const renderCyclePreview = () => {
    const ovDay = cycleLength - 14;
    const fertileStart = ovDay - 4;
    return Array.from({ length: cycleLength }).map((_, i) => {
      const d = i + 1;
      let bg = '#F0E8E8', textColor = COLORS.muted;
      if (d <= periodDuration) { bg = COLORS.rose; textColor = 'white'; }
      else if (d === ovDay) { bg = COLORS.sage; textColor = 'white'; }
      else if (d >= fertileStart && d <= ovDay + 1) { bg = '#C8DFC6'; textColor = '#3A6B4A'; }
      return (
        <View key={d} style={[styles.cycleDay, { backgroundColor: bg }]}>
          <Text style={[styles.cycleDayText, { color: textColor }]}>{d}</Text>
        </View>
      );
    });
  };

  return (
    <LinearGradient colors={['#FAF7F2', '#EAF2EC', '#FAF7F2']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepDots current={step} total={3} />

        {/* ─── STEP 0: Height & Weight ─── */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Your Body{'\n'}<Text style={styles.italic}>Measurements</Text></Text>
            <Text style={styles.stepSub}>Helps us personalise your experience</Text>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>HEIGHT</Text>
              <View style={styles.sliderRow}>
                <View>
                  <Text style={styles.sliderVal}>{height}</Text>
                  <Text style={styles.sliderUnit}>cm</Text>
                </View>
                <Slider style={{ flex: 1, marginLeft: 12 }} minimumValue={120} maximumValue={220} step={1}
                  value={height} onValueChange={setHeight}
                  minimumTrackTintColor={COLORS.sage} maximumTrackTintColor="#E0D8CF"
                  thumbTintColor={COLORS.sage} />
              </View>

              <Text style={[styles.cardLabel, { marginTop: 20 }]}>WEIGHT</Text>
              <View style={styles.sliderRow}>
                <View>
                  <Text style={styles.sliderVal}>{weight}</Text>
                  <Text style={styles.sliderUnit}>kg</Text>
                </View>
                <Slider style={{ flex: 1, marginLeft: 12 }} minimumValue={30} maximumValue={180} step={1}
                  value={weight} onValueChange={setWeight}
                  minimumTrackTintColor={COLORS.sage} maximumTrackTintColor="#E0D8CF"
                  thumbTintColor={COLORS.sage} />
              </View>

              <BMIBadge height={height} weight={weight} />
            </View>
          </View>
        )}

        {/* ─── STEP 1: Sex & Steps Goal ─── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Tell us{'\n'}<Text style={styles.italic}>About Yourself</Text></Text>
            <Text style={styles.stepSub}>We'll tailor features just for you</Text>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>BIOLOGICAL SEX</Text>
              <View style={styles.sexGrid}>
                <TouchableOpacity style={[styles.sexCard, sex === 'male' && styles.sexCardActive]} onPress={() => setSex('male')}>
                  <Text style={styles.sexIcon}>♂️</Text>
                  <Text style={[styles.sexLabel, sex === 'male' && { color: COLORS.sage }]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sexCard, styles.sexCardFemale, sex === 'female' && styles.sexCardFemaleActive]} onPress={() => setSex('female')}>
                  <Text style={styles.sexIcon}>♀️</Text>
                  <Text style={[styles.sexLabel, sex === 'female' && { color: COLORS.rose }]}>Female</Text>
                </TouchableOpacity>
              </View>
              {!sex && <Text style={{ color: COLORS.rose, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Please select to continue</Text>}

              <Text style={[styles.cardLabel, { marginTop: 20 }]}>DAILY STEP GOAL</Text>
              <View style={styles.sliderRow}>
                <View>
                  <Text style={styles.sliderVal}>{stepsGoal.toLocaleString()}</Text>
                  <Text style={styles.sliderUnit}>steps</Text>
                </View>
                <Slider style={{ flex: 1, marginLeft: 12 }} minimumValue={2000} maximumValue={20000} step={500}
                  value={stepsGoal} onValueChange={setStepsGoal}
                  minimumTrackTintColor={COLORS.sage} maximumTrackTintColor="#E0D8CF"
                  thumbTintColor={COLORS.sage} />
              </View>
            </View>
          </View>
        )}

        {/* ─── STEP 2: Menstrual / Finish ─── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>
              {sex === 'female' ? <>Cycle{'\n'}<Text style={styles.italic}>Details</Text></> : <>Almost{'\n'}<Text style={styles.italic}>There!</Text></>}
            </Text>
            <Text style={styles.stepSub}>{sex === 'female' ? 'Set up your menstrual tracker' : 'Your profile is ready'}</Text>

            <View style={styles.card}>
              {sex === 'female' ? (
                <>
                  <Text style={styles.cardLabel}>DAYS SINCE LAST PERIOD</Text>
                  <View style={styles.sliderRow}>
                    <View>
                      <Text style={styles.sliderVal}>{lastPeriodDay}</Text>
                      <Text style={styles.sliderUnit}>days ago</Text>
                    </View>
                    <Slider style={{ flex: 1, marginLeft: 12 }} minimumValue={1} maximumValue={35} step={1}
                      value={lastPeriodDay} onValueChange={setLastPeriodDay}
                      minimumTrackTintColor={COLORS.rose} maximumTrackTintColor="#E0D8CF"
                      thumbTintColor={COLORS.rose} />
                  </View>

                  <Text style={[styles.cardLabel, { marginTop: 16 }]}>PERIOD DURATION</Text>
                  <View style={styles.sliderRow}>
                    <View>
                      <Text style={[styles.sliderVal, { color: COLORS.rose }]}>{periodDuration}</Text>
                      <Text style={styles.sliderUnit}>days</Text>
                    </View>
                    <Slider style={{ flex: 1, marginLeft: 12 }} minimumValue={2} maximumValue={9} step={1}
                      value={periodDuration} onValueChange={setPeriodDuration}
                      minimumTrackTintColor={COLORS.rose} maximumTrackTintColor="#E0D8CF"
                      thumbTintColor={COLORS.rose} />
                  </View>

                  <Text style={[styles.cardLabel, { marginTop: 16 }]}>CYCLE LENGTH</Text>
                  <View style={styles.sliderRow}>
                    <View>
                      <Text style={[styles.sliderVal, { color: COLORS.rose }]}>{cycleLength}</Text>
                      <Text style={styles.sliderUnit}>days</Text>
                    </View>
                    <Slider style={{ flex: 1, marginLeft: 12 }} minimumValue={21} maximumValue={40} step={1}
                      value={cycleLength} onValueChange={setCycleLength}
                      minimumTrackTintColor={COLORS.rose} maximumTrackTintColor="#E0D8CF"
                      thumbTintColor={COLORS.rose} />
                  </View>

                  <Text style={[styles.cardLabel, { marginTop: 16 }]}>CYCLE PREVIEW</Text>
                  <View style={styles.cycleWrap}>{renderCyclePreview()}</View>
                  <View style={styles.cycleLegend}>
                    <Text style={styles.legendText}>🔴 Period  </Text>
                    <Text style={styles.legendText}>🟢 Fertile  </Text>
                    <Text style={styles.legendText}>🟡 Ovulation</Text>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 56, marginBottom: 16 }}>✅</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#2C2C2C', marginBottom: 8 }}>You're all set!</Text>
                  <Text style={{ color: '#8A8A8A', textAlign: 'center', lineHeight: 22 }}>
                    Your personalised dashboard is ready with Steps, Reminders, ChatBot and more.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Nav buttons */}
        <View style={styles.navRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.btnBack} onPress={back}>
              <Text style={styles.btnBackText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ flex: 1 }} onPress={next}>
            <LinearGradient
              colors={step === 2 ? [COLORS.rose, '#C0607A'] : [COLORS.sage, '#5F8A6E']}
              style={styles.btnNext}>
              <Text style={styles.btnNextText}>{step === 2 ? "Let's Go 🌿" : 'Next →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 60 },
  stepDots: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotDone: { backgroundColor: COLORS.sage },
  dotActive: { backgroundColor: COLORS.blush },
  dotEmpty: { backgroundColor: '#E0D8CF' },
  stepTitle: { fontSize: 34, fontWeight: '800', color: '#2C2C2C', lineHeight: 40, marginBottom: 6 },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  stepSub: { fontSize: 14, color: '#8A8A8A', marginBottom: 24 },
  card: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 20, elevation: 6, shadowColor: COLORS.sage, shadowOffset:{width:0,height:6}, shadowOpacity:0.12, shadowRadius:20 },
  cardLabel: { fontSize: 11, fontWeight: '600', color: '#8A8A8A', letterSpacing: 1.2, marginBottom: 12 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sliderVal: { fontSize: 28, fontWeight: '700', color: COLORS.sage, textAlign: 'right', minWidth: 60 },
  sliderUnit: { fontSize: 11, color: '#8A8A8A', textAlign: 'right' },
  bmiBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EAF2EC', borderRadius: 14, padding: 16, marginTop: 16 },
  bmiLabel: { fontSize: 12, color: '#8A8A8A' },
  bmiCat: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  bmiVal: { fontSize: 32, fontWeight: '800' },
  sexGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  sexCard: { flex: 1, borderWidth: 2, borderColor: '#E0D8CF', borderRadius: 18, padding: 20, alignItems: 'center', backgroundColor: '#FFFFFF' },
  sexCardActive: { borderColor: COLORS.sage, backgroundColor: '#EAF2EC' },
  sexCardFemale: { borderColor: '#E0D8CF' },
  sexCardFemaleActive: { borderColor: COLORS.rose, backgroundColor: '#FDF0F2' },
  sexIcon: { fontSize: 32, marginBottom: 8 },
  sexLabel: { fontSize: 15, fontWeight: '600', color: '#2C2C2C' },
  cycleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  cycleDay: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cycleDayText: { fontSize: 11, fontWeight: '600' },
  cycleLegend: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  legendText: { fontSize: 11, color: '#8A8A8A' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 40 },
  btnBack: { borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, justifyContent: 'center' },
  btnBackText: { color: '#8A8A8A', fontSize: 15 },
  btnNext: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 4, shadowColor: COLORS.sage, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:12 },
  btnNextText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
