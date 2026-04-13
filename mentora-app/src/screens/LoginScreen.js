import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { apiClient, ensureApiBaseUrl, getApiBaseUrl } from '../config/api';
import { BrandMark } from '../components/BrandMark';

const COLORS = {
  sage: '#7C9E87', blush: '#E8B4B8', cream: '#FAF7F2',
  charcoal: '#2C2C2C', muted: '#8A8A8A', rose: '#D4748A',
  softGreen: '#EAF2EC', dusty: '#C4A882',
};

export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    try {
      setLoading(true);
      await ensureApiBaseUrl();
      const res = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      login(res.data.data);
      navigation.replace(res.data.data?.user?.onboardingCompleted ? 'Main' : 'Onboard');
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const detailMessage = err.response?.data?.details;
      const networkHint = !err.response
        ? `Unable to reach backend at ${getApiBaseUrl()}.\nCheck that your deployed backend URL is live and reachable over the internet.`
        : null;
      Alert.alert(
        'Login failed',
        [serverMessage, detailMessage, networkHint].filter(Boolean).join('\n') || 'Unable to sign in. Check your backend URL and credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || password.length < 6) {
      Alert.alert('Error', 'Fill all fields (password min 6 chars)'); return;
    }
    try {
      setLoading(true);
      await ensureApiBaseUrl();
      const res = await apiClient.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      login(res.data.data);
      navigation.replace('Onboard');
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const detailMessage = err.response?.data?.details;
      const networkHint = !err.response
        ? `Unable to reach backend at ${getApiBaseUrl()}.\nCheck that your deployed backend URL is live and reachable over the internet.`
        : null;
      Alert.alert(
        'Registration failed',
        [serverMessage, detailMessage, networkHint].filter(Boolean).join('\n') || 'Unable to create account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FAF7F2', '#EAF2EC', '#FAF7F2']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <BrandMark size={50} />
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, tab==='login' && styles.tabActive]} onPress={() => setTab('login')}>
                <Text style={[styles.tabText, tab==='login' && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, tab==='register' && styles.tabActive]} onPress={() => setTab('register')}>
                <Text style={[styles.tabText, tab==='register' && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {tab === 'register' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={COLORS.muted} />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={COLORS.muted} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry />
            </View>

            <TouchableOpacity onPress={tab === 'login' ? handleLogin : handleRegister} disabled={loading}>
              <LinearGradient colors={[COLORS.sage, '#5F8A6E']} style={styles.btnPrimary}>
                <Text style={styles.btnText}>
                  {loading ? 'Please wait...' : tab === 'login' ? 'Sign In →' : 'Continue →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  card: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 28, padding: 24, elevation: 8, shadowColor: COLORS.sage, shadowOffset: {width:0,height:8}, shadowOpacity: 0.15, shadowRadius: 24 },
  tabRow: { flexDirection: 'row', backgroundColor: '#EAF2EC', borderRadius: 14, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:4 },
  tabText: { fontSize: 14, color: '#8A8A8A', fontWeight: '500' },
  tabTextActive: { color: '#2C2C2C' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#8A8A8A', letterSpacing: 1.2, marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0D8CF', borderRadius: 14, padding: 14, fontSize: 15, color: '#2C2C2C' },
  btnPrimary: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8, elevation: 4, shadowColor: COLORS.sage, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:12 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
