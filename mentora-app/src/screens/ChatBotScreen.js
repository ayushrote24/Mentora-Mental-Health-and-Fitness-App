import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { apiClient } from '../config/api';
import { GEMINI_API_KEY } from '../config/apiKeys';
import { BrandMark } from '../components/BrandMark';

const { width } = Dimensions.get('window');

const COLORS = {
  sage: '#7C9E87', blush: '#E8B4B8', cream: '#FAF7F2',
  charcoal: '#2C2C2C', muted: '#8A8A8A', rose: '#D4748A',
  softGreen: '#EAF2EC', purple: '#7A5FA8', lightPurple: '#F0EBF8',
};

// Quick suggestion chips shown at start and contextually
const QUICK_CHIPS = [
  { label: '😊 Check my mood', msg: 'How am I doing emotionally today based on my health data?' },
  { label: '👟 Step advice', msg: 'Give me advice based on my step count today.' },
  { label: '💧 Water check', msg: 'How is my water intake today and what should I do?' },
  { label: '🌸 Period info', msg: 'Tell me about my current cycle phase and what to expect.' },
  { label: '💊 Medication tips', msg: 'Give me tips on managing my medication reminders.' },
  { label: '😴 I feel tired', msg: 'I am feeling tired and low energy today. What do you suggest?' },
  { label: '😰 I feel anxious', msg: 'I am feeling anxious and stressed. Can you help me?' },
  { label: '🏃 Motivate me', msg: 'I need motivation to exercise and stay healthy today.' },
];

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

function buildSystemPrompt(profile, healthData) {
  const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
  const cycleDay = profile.sex === 'female' && profile.lastPeriodDay
    ? (profile.lastPeriodDay % (profile.cycleLength || 28)) + 1 : null;
  const ovDay = (profile.cycleLength || 28) - 14;
  let phase = null;
  if (cycleDay) {
    if (cycleDay <= (profile.periodDuration || 5)) phase = 'Menstrual';
    else if (cycleDay < ovDay - 1) phase = 'Follicular';
    else if (cycleDay >= ovDay - 1 && cycleDay <= ovDay + 1) phase = 'Ovulation';
    else phase = 'Luteal';
  }

  return `You are Mentora's AI wellness companion — warm, empathetic, and helpful for wellness, mood support, and healthy routines.

USER HEALTH DATA (use this to personalise every response):
- Name: ${profile.name || 'the user'}
- Sex: ${profile.sex || 'not specified'}
- Height: ${profile.height}cm | Weight: ${profile.weight}kg | BMI: ${bmi}
- Daily Step Goal: ${(profile.stepsGoal || 8000).toLocaleString()} steps
- Steps Today: ${healthData.stepsToday.toLocaleString()} (${Math.round(healthData.stepsToday / (profile.stepsGoal || 8000) * 100)}% of goal)
- Water Glasses Today: ${healthData.waterGlasses} out of 8 recommended
- Current Mood: ${healthData.mood || 'not set'}
${profile.sex === 'female' && cycleDay ? `- Menstrual Cycle Day: ${cycleDay} of ${profile.cycleLength || 28}
- Current Phase: ${phase}
- Days Until Next Period: ${(profile.cycleLength || 28) - cycleDay}` : ''}

GUIDELINES:
1. Always reference the user's ACTUAL data when giving advice — never give generic responses
2. Be warm, supportive, and never clinical or cold
3. For mental health topics, always validate feelings first, then offer practical suggestions
4. Give full, complete answers when the user needs guidance, emotional support, a plan, or an explanation
5. Use emojis naturally but not excessively
6. If the user seems distressed, prioritise emotional support over health tips
7. Never claim to be a doctor, psychiatrist, therapist, or licensed clinician
8. Never diagnose medical conditions or prescribe medication — suggest seeing a doctor for serious concerns
9. If the user mentions self-harm, suicide, danger, abuse, severe breathing trouble, chest pain, or medication emergency, tell them to contact local emergency help or a licensed doctor immediately
10. Celebrate wins (hitting step goals, good water intake, etc.)
11. When helpful, answer in multiple short paragraphs or a clear flat list instead of one line
12. If the user asks for a weekly diet plan or gym plan, give a day-by-day plan personalized to BMI, weight, and general fitness context
13. For gym plans, include exercises, sets, reps, and rest time when relevant
14. For diet plans, include breakfast, lunch, dinner, snacks, and hydration guidance when relevant
15. Keep plans realistic and beginner-safe unless the user clearly asks for a more advanced routine
16. Keep answers compact enough to fit in one complete message
17. For most replies, use this structure with bold labels:
**Main point:** one short sentence
**Why it matters:** one short paragraph
**What to do:** 2 to 4 short bullet points
18. If the user asks for a plan, give only the most useful summary first and avoid over-explaining
19. Prefer clarity over length; do not produce unnecessarily long answers`;
}

async function requestGeminiReply({ message, profile, healthData, history }) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key is not configured.');
  }

  const safeHistory = history
    .slice(-8)
    .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.text}`)
    .join('\n');

  const prompt = [
    buildSystemPrompt(profile, healthData),
    safeHistory ? `Recent conversation:\n${safeHistory}` : '',
    `User: ${message}`,
  ].filter(Boolean).join('\n\n');

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900,
          },
        }),
      }
    );

    const payload = await response.json();
    if (response.ok) {
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        return text;
      }
    } else {
      lastError = new Error(payload?.error?.message || `Assistant request failed for ${model}.`);
    }
  }
  throw lastError || new Error('Assistant request failed.');
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
    animate(dot1, 0); animate(dot2, 150); animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.botAvatarWrap}>
        <BrandMark size={32} />
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

function Message({ msg }) {
  const isBot = msg.role === 'bot';

  const renderFormattedText = (text, textStyle, boldStyle) => {
    const normalized = String(text || '').replace(/\r/g, '');
    const lines = normalized.split('\n');

    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
      const isBullet = /^\s*[-•]\s+/.test(line);

      return (
        <Text key={`line-${lineIndex}`} style={textStyle}>
          {isBullet ? <Text style={boldStyle}>• </Text> : null}
          {parts.map((part, partIndex) => {
            const isBold = /^\*\*[^*]+\*\*$/.test(part);
            const cleanPart = isBold ? part.slice(2, -2) : part;
            return (
              <Text
                key={`part-${lineIndex}-${partIndex}`}
                style={isBold ? [textStyle, boldStyle] : textStyle}
              >
                {isBullet && partIndex === 0 ? cleanPart.replace(/^\s*[-•]\s+/, '') : cleanPart}
              </Text>
            );
          })}
          {lineIndex < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
      {isBot && (
        <View style={styles.botAvatarWrap}>
          <BrandMark size={32} />
        </View>
      )}
      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        {renderFormattedText(
          msg.text,
          [styles.bubbleText, isBot ? styles.bubbleTextBot : styles.bubbleTextUser],
          isBot ? styles.bubbleTextBotStrong : styles.bubbleTextUserStrong
        )}
        <Text style={styles.timeText}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatBotScreen({ navigation }) {
  const { profile, appState, saveAppSection } = useApp();
  const initialMessage = {
    role: 'bot',
    text: `Hi ${profile.name ? profile.name.split(' ')[0] : 'there'}! 👋 I'm your Mentora wellness companion. I can see your health data and give you personalised advice.\n\nHow are you feeling today? You can ask me anything about your steps, water intake, mood, or cycle! 🌿`,
    ts: Date.now(),
  };
  const [messages, setMessages] = useState(appState?.chat?.messages?.length ? appState.chat.messages : [initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState(appState?.health?.moodToday || '');
  const [showMoodPicker, setShowMoodPicker] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    if (appState?.chat?.messages?.length) {
      setMessages(appState.chat.messages);
    }
  }, [appState?.chat?.messages]);

  const todayKey = new Date().toISOString().split('T')[0];
  const healthData = {
    stepsToday: appState?.health?.steps?.byDate?.[todayKey] ?? appState?.health?.steps?.today ?? 0,
    waterGlasses: appState?.health?.waterGlassesToday ?? 0,
    mood: mood,
  };

  const MOODS = [
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Low' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🔥', label: 'Great' },
  ];

  const selectMood = (m) => {
    setMood(m.label);
    setShowMoodPicker(false);
    saveAppSection('health', prev => ({
      ...(prev || {}),
      moodToday: m.label,
    }));
    sendMessage(`My mood today is ${m.emoji} ${m.label}.`);
  };

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: msgText, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);
    saveAppSection('chat', prev => ({
      ...(prev || {}),
      messages: nextHistory,
    }));

    try {
      const response = await apiClient.post('/integrations/assistant/chat', {
        message: msgText,
        profile,
        healthData,
        history: nextHistory.slice(-8),
      });
      let botText = response.data?.data?.text;
      if (!botText) {
        botText = await requestGeminiReply({
          message: msgText,
          profile,
          healthData,
          history: nextHistory,
        });
      }
      const updatedMessages = [...nextHistory, { role: 'bot', text: botText, ts: Date.now() }];
      setMessages(updatedMessages);
      saveAppSection('chat', prev => ({
        ...(prev || {}),
        messages: updatedMessages,
      }));
    } catch (err) {
      try {
        const fallbackText = await requestGeminiReply({
          message: msgText,
          profile,
          healthData,
          history: nextHistory,
        });
        const updatedMessages = [...nextHistory, {
          role: 'bot',
          text: fallbackText || "I'm having trouble responding right now. Please try again in a moment.",
          ts: Date.now(),
        }];
        setMessages(updatedMessages);
        saveAppSection('chat', prev => ({
          ...(prev || {}),
          messages: updatedMessages,
        }));
      } catch (fallbackError) {
        const errorMessage = err.response?.data?.message || fallbackError.message || err.message;
        const updatedMessages = [...nextHistory, {
          role: 'bot',
          text: `I’m having trouble connecting right now. ${errorMessage}`,
          ts: Date.now(),
        }];
        setMessages(updatedMessages);
        saveAppSection('chat', prev => ({
          ...(prev || {}),
          messages: updatedMessages,
        }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      {/* Header */}
      <LinearGradient colors={[COLORS.lightPurple, COLORS.cream]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <BrandMark size={44} />
          <View>
            <Text style={styles.headerName}>Mentora AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Your wellness companion</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}>

          {/* Mood Picker */}
          {showMoodPicker && (
            <View style={styles.moodCard}>
              <Text style={styles.moodTitle}>How are you feeling today?</Text>
              <Text style={styles.moodSub}>This helps me give better advice 💙</Text>
              <View style={styles.moodGrid}>
                {MOODS.map((m) => (
                  <TouchableOpacity key={m.label} style={styles.moodBtn} onPress={() => selectMood(m)}>
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={styles.moodLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Health snapshot */}
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotTitle}>📊 Today's snapshot</Text>
            <View style={styles.snapshotRow}>
              <View style={styles.snapItem}>
                <Text style={styles.snapVal}>{healthData.stepsToday.toLocaleString()}</Text>
                <Text style={styles.snapLbl}>Steps</Text>
              </View>
              <View style={styles.snapDivider} />
              <View style={styles.snapItem}>
                <Text style={styles.snapVal}>{healthData.waterGlasses}/8</Text>
                <Text style={styles.snapLbl}>Water</Text>
              </View>
              <View style={styles.snapDivider} />
              <View style={styles.snapItem}>
                <Text style={styles.snapVal}>{mood || '—'}</Text>
                <Text style={styles.snapLbl}>Mood</Text>
              </View>
              {profile.sex === 'female' && (
                <>
                  <View style={styles.snapDivider} />
                  <View style={styles.snapItem}>
                    <Text style={styles.snapVal}>Day {(profile.lastPeriodDay % (profile.cycleLength || 28)) + 1}</Text>
                    <Text style={styles.snapLbl}>Cycle</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {loading && <TypingIndicator />}
        </ScrollView>

        {/* Quick chips */}
        {messages.length < 3 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {QUICK_CHIPS.map((c, i) => (
              <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(c.msg)}>
                <Text style={styles.chipText}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about your health..."
            placeholderTextColor={COLORS.muted}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}>
            <LinearGradient
              colors={input.trim() && !loading ? [COLORS.purple, '#9A7FC8'] : ['#E0D8CF', '#E0D8CF']}
              style={styles.sendGrad}>
              {loading
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.sendIcon}>↑</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 24, color: '#2C2C2C' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { fontSize: 17, fontWeight: '700', color: '#2C2C2C' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.sage },
  onlineText: { fontSize: 11, color: '#8A8A8A' },

  messageList: { flex: 1 },

  moodCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8, borderWidth:1.5, borderColor: COLORS.lightPurple },
  moodTitle: { fontSize: 16, fontWeight: '700', color: '#2C2C2C', marginBottom: 4 },
  moodSub: { fontSize: 13, color: '#8A8A8A', marginBottom: 14 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodBtn: { width: (width - 80) / 3, backgroundColor: COLORS.lightPurple, borderRadius: 14, padding: 12, alignItems: 'center' },
  moodEmoji: { fontSize: 26, marginBottom: 4 },
  moodLabel: { fontSize: 12, fontWeight: '600', color: COLORS.purple },

  snapshotCard: { backgroundColor: COLORS.lightPurple, borderRadius: 18, padding: 14, marginBottom: 16 },
  snapshotTitle: { fontSize: 12, fontWeight: '600', color: COLORS.purple, marginBottom: 10, letterSpacing: 0.5 },
  snapshotRow: { flexDirection: 'row', alignItems: 'center' },
  snapItem: { flex: 1, alignItems: 'center' },
  snapVal: { fontSize: 15, fontWeight: '800', color: '#2C2C2C' },
  snapLbl: { fontSize: 10, color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  snapDivider: { width: 1, height: 32, backgroundColor: 'rgba(122,95,168,0.2)' },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatarWrap: { marginRight: 8, marginBottom: 2 },
  bubble: { maxWidth: width * 0.72, borderRadius: 18, padding: 12 },
  bubbleBot: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4 },
  bubbleUser: { backgroundColor: COLORS.purple, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14.5, lineHeight: 22 },
  bubbleTextBot: { color: '#2C2C2C' },
  bubbleTextUser: { color: 'white' },
  bubbleTextBotStrong: { fontWeight: '800', color: COLORS.purple },
  bubbleTextUserStrong: { fontWeight: '800', color: 'white' },
  timeText: { fontSize: 10, color: '#8A8A8A', marginTop: 4, textAlign: 'right' },

  typingWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  typingBubble: { backgroundColor: '#FFFFFF', borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, flexDirection: 'row', gap: 4, elevation: 2, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.muted },

  chipsScroll: { maxHeight: 48, marginBottom: 6 },
  chip: { backgroundColor: COLORS.lightPurple, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(122,95,168,0.2)' },
  chipText: { fontSize: 13, color: COLORS.purple, fontWeight: '500' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', gap: 10 },
  input: { flex: 1, backgroundColor: COLORS.lightPurple, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14.5, color: '#2C2C2C', maxHeight: 100 },
  sendBtn: { marginBottom: 2 },
  sendBtnDisabled: { opacity: 0.5 },
  sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: COLORS.purple, shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:8 },
  sendIcon: { fontSize: 20, color: 'white', fontWeight: '700' },
});
