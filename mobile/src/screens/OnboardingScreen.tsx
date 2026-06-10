import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

type OnboardingScreenProps = {
  onDone: () => void
}

const slides = [
  {
    icon: 'city-variant-outline' as const,
    title: 'Welcome to CityFix',
    body: 'Report local issues like potholes, graffiti, broken sidewalks, streetlights, and illegal dumping.',
  },
  {
    icon: 'camera-plus-outline' as const,
    title: 'Report an Issue',
    body: 'Take a photo or choose one from your library, then add the location and a short description.',
  },
  {
    icon: 'progress-check' as const,
    title: 'Track Progress',
    body: 'Follow each report through submitted, received, in progress, and resolved status updates.',
  },
  {
    icon: 'bookmark-check-outline' as const,
    title: 'Follow Issues',
    body: 'Follow reports from your neighborhood and find your submitted and followed issues from Profile.',
  },
]

export const OnboardingScreen = ({ onDone }: OnboardingScreenProps) => {
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const isLast = index === slides.length - 1

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>CityFix</Text>
        <Pressable onPress={onDone} style={styles.skipButton} accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={slide.icon} size={58} color="#1565FF" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((item, dotIndex) => (
            <View
              key={item.title}
              style={[styles.dot, dotIndex === index ? styles.dotActive : null]}
            />
          ))}
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => (isLast ? onDone() : setIndex((current) => current + 1))}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{isLast ? 'Start Using App' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff', padding: 18 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { color: '#142033', fontSize: 18, fontWeight: '900' },
  skipButton: { paddingHorizontal: 12, paddingVertical: 8 },
  skipText: { color: '#647187', fontWeight: '800' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: 12, alignItems: 'center', maxWidth: 330 },
  title: {
    color: '#142033',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: '#56647A',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: { gap: 22, paddingBottom: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CFD8E5',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#1565FF',
  },
  primaryButton: {
    backgroundColor: '#1565FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
})
