import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function BrandMark({ size = 56, withWordmark = false, subtitle = 'Mind & Body Wellness' }) {
  const dotSize = Math.max(4, Math.round(size * 0.1));

  return (
    <View style={[styles.wrap, withWordmark && styles.wrapWordmark]}>
      <LinearGradient
        colors={['#7C9E87', '#5A8A6A', '#D8A3AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.3),
          },
        ]}
      >
        <Text style={[styles.mark, { fontSize: Math.round(size * 0.42) }]}>M</Text>
        <View style={[styles.dotRow, { bottom: Math.round(size * 0.14) }]}>
          {[0.45, 0.95, 0.6].map((opacity, index) => (
            <View
              key={index}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: `rgba(255,255,255,${opacity})`,
              }}
            />
          ))}
        </View>
      </LinearGradient>

      {withWordmark ? (
        <View style={styles.wordmarkWrap}>
          <Text style={styles.wordmark}>Mentora</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapWordmark: {
    gap: 10,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#5A8A6A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  mark: {
    color: '#F7FBF7',
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: -2,
  },
  dotRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 3,
  },
  wordmarkWrap: {
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1F2522',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 11,
    color: '#7C847F',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
