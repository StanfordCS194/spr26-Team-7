import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SampleIssueImage } from '../components/SampleIssueImage';
import { dashboard311 } from '../data/dashboard311';
import { Classification } from './ClassificationScreen';
import { SampleIssueRecord } from '../types';

type ReportConfirmationScreenProps = {
  merged: boolean;
  classification: Classification | null;
  onDone: () => void;
  selectedSampleIssue?: SampleIssueRecord | null;
  onViewIssue?: () => void;
};

export const ReportConfirmationScreen = ({
  merged,
  classification,
  onDone,
  selectedSampleIssue,
  onViewIssue,
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
  const category = classification?.category ?? selectedSampleIssue?.category ?? 'Pothole';
  const d3IssueTypes = dashboard311.districts['3']?.issueTypes ?? [];
  const issueMetrics = d3IssueTypes.find(t => t.name === category);
  const estimatedTime = issueMetrics?.all.avgTimeLabel ?? selectedSampleIssue?.estimatedResolution ?? '2–3 weeks';
  const address = classification?.locationMain
    ? `${classification.locationMain}, ${classification.locationSub}`
    : 'Glen Eyrie Ave & Carolyn Ave, San Jose';
  const circleColor = merged ? '#F0A03028' : '#4F8EF728';
  const checkColor = merged ? '#F0A030' : '#4F8EF7';

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.checkCircle, { backgroundColor: circleColor, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.checkMark, { color: checkColor }]}>✓</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {merged ? 'Report Added' : 'Report Filed'}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {`Thank you for contributing to your neighborhood!`}
        </Animated.Text>

        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={onViewIssue} disabled={!onViewIssue} accessibilityRole="button">
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
                <View style={[styles.filedBadge, { backgroundColor: '#F0A03028' }]}>
                  <Text style={[styles.filedBadgeText, { color: '#F0A030' }]}>
                    Submitted
                  </Text>
                </View>
              </View>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selectedSampleIssue?.district ?? 'San Jose District 3'}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: '#4F8EF728' }]}>
                  <Text style={[styles.tagText, { color: '#4F8EF7' }]}>Est. {estimatedTime}</Text>
                </View>
              </View>
            </View>
            {onViewIssue && (
              <View style={styles.viewReportRow}>
                <Text style={styles.viewReportText}>View Report</Text>
                <Text style={styles.viewReportChevron}>›</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={{ width: '100%', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Pressable onPress={onDone} style={styles.homeButton} accessibilityRole="button">
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.homeText}>Back to Reporting</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
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
    color: '#F2F3F5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8D939E',
    textAlign: 'center',
    lineHeight: 23,
  },

  summaryCard: {
    width: '100%',
    backgroundColor: '#222428',
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
  summaryTag: { fontSize: 15, fontWeight: '700', color: '#F2F3F5' },
  summaryAddr: { fontSize: 12, color: '#55595F', marginTop: 2 },
  filedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  filedBadgeText: { fontSize: 11, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#2C2D32', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 11, color: '#8D939E', fontWeight: '500' },

  viewReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#35373D',
  },
  viewReportText: { fontSize: 14, fontWeight: '600', color: '#F2F3F5' },
  viewReportChevron: { fontSize: 20, color: '#55595F', lineHeight: 22 },

  homeButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  homeIcon: { fontSize: 18 },
  homeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
