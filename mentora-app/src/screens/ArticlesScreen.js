import React, { useState, useEffect, useCallback } from 'react';
import { GNEWS_API_KEY } from '../config/apiKeys';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, RefreshControl, Dimensions, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const COLORS = {
  sage: '#7C9E87', cream: '#FAF7F2', charcoal: '#2C2C2C',
  muted: '#8A8A8A', softGreen: '#EAF2EC', rose: '#D4748A',
  blue: '#5A7FA8', lightBlue: '#EBF2F8', orange: '#D4884A',
  lightOrange: '#FDF3EB', purple: '#7A5FA8', lightPurple: '#F0EBF8',
  gold: '#D4A842', lightGold: '#FDF8EC',
};

// Category config
const CATEGORIES = [
  { id: 'all',      label: 'All',          emoji: '✨', color: COLORS.sage,   light: COLORS.softGreen },
  { id: 'mental',   label: 'Mental Health', emoji: '🧠', color: COLORS.purple, light: COLORS.lightPurple },
  { id: 'walking',  label: 'Walking',       emoji: '🚶', color: COLORS.blue,   light: COLORS.lightBlue },
  { id: 'water',    label: 'Hydration',     emoji: '💧', color: COLORS.sage,   light: COLORS.softGreen },
  { id: 'stories',  label: "People's Tales",emoji: '💬', color: COLORS.orange, light: COLORS.lightOrange },
  { id: 'wellness', label: 'Wellness',      emoji: '🌿', color: COLORS.gold,   light: COLORS.lightGold },
];

// GNews API — free tier, 100 requests/day

// Search queries per category — rotated daily
const QUERY_POOLS = {
  mental:  ['mental health tips 2024', 'anxiety relief techniques', 'depression awareness stories', 'mindfulness meditation benefits', 'stress management strategies', 'mental wellness daily habits'],
  walking: ['walking benefits mental health', 'daily walking health benefits', '10000 steps health benefits', 'walking reduces anxiety', 'morning walk benefits', 'walking for fitness wellness'],
  water:   ['drinking water health benefits', 'hydration mental clarity', 'water intake wellness tips', 'dehydration effects mood', 'hydration daily habits', 'water and brain health'],
  stories: ['mental health recovery story', 'fitness transformation story', 'wellness journey personal story', 'overcoming anxiety story', 'healthy lifestyle success story', 'mental strength inspiring story'],
  wellness:['daily wellness routine', 'holistic health tips', 'self care mental health', 'healthy habits wellness', 'sleep mental health benefits', 'nutrition mental health connection'],
};

// Pick a query based on today's date so it rotates daily
const getDailyQuery = (pool) => {
  const dayIndex = Math.floor(Date.now() / 86400000) % pool.length;
  return pool[dayIndex];
};

// Curated fallback articles (shown when API key not set or fails)
const FALLBACK_ARTICLES = [
  {
    id: 'f1', category: 'mental',
    title: 'How to Manage Anxiety: 10 Proven Techniques',
    description: 'Anxiety affects millions of people worldwide. These evidence-based strategies can help you regain calm and control in your daily life.',
    source: 'Mental Health Foundation', readTime: '5 min',
    url: 'https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/anxiety',
    color: [COLORS.purple, '#9A7FC8'],
  },
  {
    id: 'f2', category: 'walking',
    title: 'Walking 30 Minutes a Day Changes Your Brain',
    description: 'New research shows that a daily 30-minute walk dramatically improves mood, memory, and reduces the risk of depression by up to 26%.',
    source: 'Harvard Health', readTime: '4 min',
    url: 'https://www.health.harvard.edu/mind-and-mood/a-prescription-for-better-health-go-alfresco',
    color: [COLORS.blue, '#7AA0C8'],
  },
  {
    id: 'f3', category: 'water',
    title: 'Dehydration and Mood: The Surprising Connection',
    description: 'Even mild dehydration of 1-2% can impair concentration, increase anxiety, and cause fatigue. Here\'s how proper hydration transforms your mental state.',
    source: 'Healthline', readTime: '3 min',
    url: 'https://www.healthline.com/nutrition/dehydration-effects-on-the-brain',
    color: [COLORS.sage, '#5F8A6E'],
  },
  {
    id: 'f4', category: 'stories',
    title: '"Running Saved My Life" — A Mental Health Journey',
    description: 'Sarah, 28, shares how she went from struggling with severe depression to completing her first marathon — one step at a time.',
    source: "Runner's World", readTime: '7 min',
    url: 'https://www.runnersworld.com/runners-stories/',
    color: [COLORS.orange, '#C4784A'],
  },
  {
    id: 'f5', category: 'wellness',
    title: 'The Science of Sleep and Mental Health',
    description: 'Sleep and mental health are deeply connected. Poor sleep worsens anxiety and depression, while good sleep can be your most powerful wellness tool.',
    source: 'Sleep Foundation', readTime: '6 min',
    url: 'https://www.sleepfoundation.org/mental-health',
    color: [COLORS.gold, '#C49A30'],
  },
  {
    id: 'f6', category: 'mental',
    title: 'Gratitude Practice: How Writing Changes Your Brain',
    description: 'Studies show that writing just 5 things you are grateful for each day rewires neural pathways and significantly boosts happiness over time.',
    source: 'Psychology Today', readTime: '4 min',
    url: 'https://www.psychologytoday.com/us/basics/gratitude',
    color: [COLORS.purple, '#9A7FC8'],
  },
  {
    id: 'f7', category: 'walking',
    title: 'Why a Morning Walk is the Best Medicine',
    description: 'Exposing yourself to natural light within an hour of waking regulates your circadian rhythm, boosts serotonin, and sets a positive tone for the day.',
    source: 'WebMD', readTime: '4 min',
    url: 'https://www.webmd.com/fitness-exercise/benefits-of-walking',
    color: [COLORS.blue, '#7AA0C8'],
  },
  {
    id: 'f8', category: 'stories',
    title: '"How I Beat Burnout with 10,000 Steps a Day"',
    description: 'A software engineer shares how a simple daily walking habit transformed his mental health, productivity, and relationships over 6 months.',
    source: 'Medium', readTime: '8 min',
    url: 'https://medium.com/tag/mental-health',
    color: [COLORS.orange, '#C4784A'],
  },
  {
    id: 'f9', category: 'water',
    title: '8 Glasses a Day: Myth or Science?',
    description: 'The truth about daily water requirements, how to tell if you\'re properly hydrated, and why individual needs vary more than you think.',
    source: 'Mayo Clinic', readTime: '3 min',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256',
    color: [COLORS.sage, '#5F8A6E'],
  },
  {
    id: 'f10', category: 'wellness',
    title: 'Digital Detox: Why Unplugging Heals Your Mind',
    description: 'Constant connectivity is linked to increased anxiety, FOMO, and reduced attention spans. Here\'s a simple weekly digital detox protocol.',
    source: 'Verywell Mind', readTime: '5 min',
    url: 'https://www.verywellmind.com/why-and-how-to-do-a-digital-detox-4771321',
    color: [COLORS.gold, '#C49A30'],
  },
];

// Article card component
function ArticleCard({ article, onPress }) {
  const cat = CATEGORIES.find(c => c.id === article.category) || CATEGORIES[0];
  return (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={article.color || [cat.color, cat.color]} style={styles.articleColorBar} />
      <View style={styles.articleBody}>
        <View style={styles.articleMeta}>
          <View style={[styles.catBadge, { backgroundColor: cat.light }]}>
            <Text style={styles.catBadgeText}>{cat.emoji} {cat.label}</Text>
          </View>
          <Text style={styles.readTime}>⏱ {article.readTime || '4 min'}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.articleDesc} numberOfLines={3}>{article.description}</Text>
        <View style={styles.articleFooter}>
          <Text style={styles.articleSource}>📰 {article.source}</Text>
          <View style={styles.readBtn}>
            <Text style={styles.readBtnText}>Read →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Featured large card (top article of the day)
function FeaturedCard({ article, onPress }) {
  const cat = CATEGORIES.find(c => c.id === article.category) || CATEGORIES[0];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featuredCard}>
      <LinearGradient colors={article.color || [cat.color, cat.color]} style={styles.featuredGrad}>
        <View style={[styles.catBadgeFeatured, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={styles.catBadgeFeaturedText}>{cat.emoji} {cat.label}</Text>
        </View>
        <Text style={styles.featuredLabel}>⭐ Article of the Day</Text>
        <Text style={styles.featuredTitle}>{article.title}</Text>
        <Text style={styles.featuredDesc} numberOfLines={2}>{article.description}</Text>
        <View style={styles.featuredFooter}>
          <Text style={styles.featuredSource}>📰 {article.source}</Text>
          <View style={styles.featuredReadBtn}>
            <Text style={styles.featuredReadBtnText}>Read Article →</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function ArticlesScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lastFetched, setLastFetched] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const todayKey = new Date().toDateString();

  useEffect(() => { loadArticles(); }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      // Check cache — only refresh once per day
      const cached = await AsyncStorage.getItem(`articles_${todayKey}`);
      if (cached) {
        setArticles(JSON.parse(cached));
        setLastFetched(todayKey);
        setUsingFallback(false);
        setLoading(false);
        return;
      }
      await fetchFromAPI();
    } catch (e) {
      useFallback();
    }
    setLoading(false);
  };

  const fetchFromAPI = async () => {
    if (GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY') {
      // No API key set — use curated fallback with daily rotation
      useFallback();
      return;
    }

    try {
      const categories = ['mental', 'walking', 'water', 'stories', 'wellness'];
      const allArticles = [];

      for (const cat of categories) {
        const query = getDailyQuery(QUERY_POOLS[cat]);
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=3&token=${GNEWS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.articles) {
          data.articles.forEach((a, i) => {
            const catConfig = CATEGORIES.find(c => c.id === cat);
            allArticles.push({
              id: `${cat}_${i}_${Date.now()}`,
              category: cat,
              title: a.title,
              description: a.description || a.content?.substring(0, 150) + '...',
              source: a.source?.name || 'News',
              url: a.url,
              image: a.image,
              readTime: `${Math.floor(Math.random() * 5) + 3} min`,
              color: [catConfig.color, catConfig.color + 'CC'],
            });
          });
        }
      }

      if (allArticles.length > 0) {
        // Shuffle so order is different each day
        const shuffled = allArticles.sort(() => Math.random() - 0.5);
        setArticles(shuffled);
        setUsingFallback(false);
        await AsyncStorage.setItem(`articles_${todayKey}`, JSON.stringify(shuffled));
        setLastFetched(todayKey);
      } else {
        useFallback();
      }
    } catch (e) {
      useFallback();
    }
  };

  const useFallback = async () => {
    // Rotate fallback articles daily based on date
    const dayOffset = Math.floor(Date.now() / 86400000);
    const rotated = [...FALLBACK_ARTICLES].sort((a, b) => {
      const ai = parseInt(a.id.replace('f',''));
      const bi = parseInt(b.id.replace('f',''));
      return ((ai + dayOffset) % FALLBACK_ARTICLES.length) - ((bi + dayOffset) % FALLBACK_ARTICLES.length);
    });
    setArticles(rotated);
    setUsingFallback(true);
    setLastFetched(todayKey);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Clear today's cache to force fresh fetch
    await AsyncStorage.removeItem(`articles_${todayKey}`);
    await loadArticles();
    setRefreshing(false);
  }, []);

  const openArticle = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (e) {}
  };

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const featured = articles[0];
  const rest = activeCategory === 'all' ? articles.slice(1) : filtered;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      {/* Header */}
      <LinearGradient colors={['#EAF2EC', '#FAF7F2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Articles</Text>
          <Text style={styles.headerSub}>
            {lastFetched ? `Updated: ${lastFetched}` : 'Loading...'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.sage} />
          <Text style={styles.loadingText}>Curating today's articles...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.sage} />}>

          {/* Category filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id}
                style={[styles.catChip, activeCategory === cat.id && { backgroundColor: cat.color }]}
                onPress={() => setActiveCategory(cat.id)}>
                <Text style={[styles.catChipText, activeCategory === cat.id && { color: 'white' }]}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* API info banner if using fallback */}
          {usingFallback && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                📚 Showing curated articles · Add GNews API key for live articles
              </Text>
            </View>
          )}

          <View style={{ padding: 16 }}>
            {/* Featured card — only on "All" tab */}
            {activeCategory === 'all' && featured && (
              <>
                <Text style={styles.sectionLabel}>⭐ TODAY'S TOP PICK</Text>
                <FeaturedCard article={featured} onPress={() => openArticle(featured.url)} />
              </>
            )}

            {/* Articles list */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
              {activeCategory === 'all' ? '📰 MORE ARTICLES' : `${CATEGORIES.find(c=>c.id===activeCategory)?.emoji} ${CATEGORIES.find(c=>c.id===activeCategory)?.label?.toUpperCase()}`}
            </Text>

            {rest.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No articles in this category today</Text>
              </View>
            ) : (
              rest.map((article) => (
                <ArticleCard key={article.id} article={article}
                  onPress={() => openArticle(article.url)} />
              ))
            )}

            {/* Refresh tip */}
            <View style={styles.refreshTip}>
              <Text style={styles.refreshTipText}>
                🔄 Pull down to refresh · Articles change daily
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
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

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#8A8A8A', fontSize: 14 },

  categoryScroll: { marginVertical: 10 },
  catChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0D8CF' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#2C2C2C' },

  infoBanner: { marginHorizontal: 16, marginBottom: 4, backgroundColor: COLORS.lightGold, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EDE0C0' },
  infoBannerText: { fontSize: 12, color: COLORS.gold, textAlign: 'center', fontWeight: '500' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#8A8A8A', letterSpacing: 1.2, marginBottom: 12 },

  // Featured card
  featuredCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 6, elevation: 6, shadowColor: '#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.15, shadowRadius:16 },
  featuredGrad: { padding: 24 },
  catBadgeFeatured: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 10 },
  catBadgeFeaturedText: { color: 'white', fontSize: 12, fontWeight: '600' },
  featuredLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  featuredTitle: { color: 'white', fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 10 },
  featuredDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredSource: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  featuredReadBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  featuredReadBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },

  // Article card
  articleCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', elevation: 3, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8 },
  articleColorBar: { width: 5 },
  articleBody: { flex: 1, padding: 16 },
  articleMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: '#2C2C2C' },
  readTime: { fontSize: 11, color: '#8A8A8A' },
  articleTitle: { fontSize: 15, fontWeight: '700', color: '#2C2C2C', lineHeight: 22, marginBottom: 6 },
  articleDesc: { fontSize: 13, color: '#8A8A8A', lineHeight: 20, marginBottom: 12 },
  articleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  articleSource: { fontSize: 12, color: '#8A8A8A' },
  readBtn: { backgroundColor: '#EAF2EC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  readBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.sage },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#8A8A8A', textAlign: 'center' },

  refreshTip: { alignItems: 'center', padding: 20, marginBottom: 20 },
  refreshTipText: { fontSize: 12, color: '#8A8A8A' },
});
