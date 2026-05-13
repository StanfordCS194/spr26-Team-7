import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SampleIssueImage } from '../components/SampleIssueImage';
import { Classification } from './ClassificationScreen';
import { T } from '../theme';
import { SampleIssueRecord } from '../types';

type ReportConfirmationScreenProps = {
  merged: boolean;
  classification: Classification | null;
  onDone: () => void;
  selectedSampleIssue?: SampleIssueRecord | null;
};

export const ReportConfirmationScreen = ({
  merged,
  classification,
  onDone,
  selectedSampleIssue,
}: ReportConfirmationScreenProps) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const delay = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
    return () => clearTimeout(delay);
  }, [fadeAnim, scaleAnim, slideAnim]);

  const tag = classification?.tag ?? 'Pothole';
  const address = classification?.locationMain
    ? `${classification.locationMain}, ${classification.locationSub}`
    : 'Glen Eyrie Ave & Carolyn Ave, San Jose';
  const circleColor = merged ? T.blueLight : T.greenLight;
  const checkColor = merged ? T.blue : T.green;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.checkCircle, { backgroundColor: circleColor, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.checkMark, { color: checkColor }]}>✓</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {merged ? 'Report added!' : 'Report filed!'}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {merged
            ? `Your report joined nearby reports for ${tag.toLowerCase()}.`
            : `Thanks for helping improve your neighborhood. Your ${tag.toLowerCase()} report is ready for the city workflow.`}
        </Animated.Text>

        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.summaryPhoto}>
            <SampleIssueImage
              image={
                selectedSampleIssue?.image ?? {
                  kind: 'asset',
                  source: require('../../assets/pothole.jpg'),
                  alt: 'Submitted report preview',
                }
              }
              style={{ width: '100%', height: '100%' }}
            />
            <View style={styles.summaryPhotoOverlay} />
          </View>
          <View style={styles.summaryBody}>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTag}>{tag}</Text>
                <Text style={styles.summaryAddr}>{address}</Text>
              </View>
              <View style={[styles.filedBadge, { backgroundColor: merged ? T.blueLight : T.greenLight }]}>
                <Text style={[styles.filedBadgeText, { color: merged ? T.blue : T.green }]}>
                  {merged ? '+1 · 5 total' : 'Filed'}
                </Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selectedSampleIssue?.assignedTo ?? 'San Jose D.O.T.'}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selectedSampleIssue?.district ?? 'San Jose District 3'}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.tagText, { color: T.amber }]}>Pending</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ width: '100%', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Pressable onPress={onDone} style={styles.homeButton} accessibilityRole="button">
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.homeText}>Back to home</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.cream },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 16,
  },

  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  checkMark: { fontSize: 42, fontWeight: '700', lineHeight: 50 },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: T.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: T.ink2,
    textAlign: 'center',
    lineHeight: 23,
  },

  summaryCard: {
    width: '100%',
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  summaryPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  summaryBody: { padding: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  summaryTag: { fontSize: 15, fontWeight: '700', color: T.ink },
  summaryAddr: { fontSize: 12, color: T.ink3, marginTop: 2 },
  filedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  filedBadgeText: { fontSize: 11, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: T.warm, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 11, color: T.ink3, fontWeight: '500' },

  homeButton: {
    backgroundColor: T.blue,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  homeIcon: { fontSize: 18 },
  homeText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
