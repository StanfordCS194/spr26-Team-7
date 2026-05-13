import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SampleIssueImage } from '../components/SampleIssueImage'
import { sampleIssues } from '../data/sampleIssues'
import { T } from '../theme'

type SampleIssuePickerScreenProps = {
  onSelectIssue: (issueId: string) => void
  onOpenCamera: () => void
}

export const SampleIssuePickerScreen = ({
  onSelectIssue,
  onOpenCamera,
}: SampleIssuePickerScreenProps) => {
  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Demo report flow</Text>
        <Text style={styles.title}>Choose a sample issue photo or open the camera flow.</Text>
        <Text style={styles.subtitle}>
          Each sample opens a hardcoded San Jose District 3 issue page with structured data for later map and dashboard work.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sample photo library</Text>
          <Text style={styles.sectionCopy}>Tap a card to review the issue before submitting.</Text>
        </View>

        {sampleIssues.map((issue) => (
          <Pressable
            key={issue.id}
            style={styles.card}
            onPress={() => onSelectIssue(issue.id)}
            accessibilityRole="button"
          >
            <SampleIssueImage image={issue.image} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{issue.type}</Text>
                <View style={[styles.statusBadge, issue.status === 'Ready to submit' ? styles.statusReady : styles.statusDraft]}>
                  <Text
                    style={[
                      styles.statusText,
                      issue.status === 'Ready to submit' ? styles.statusTextReady : styles.statusTextDraft,
                    ]}
                  >
                    {issue.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.locationName}>{issue.locationName}</Text>
              <Text style={styles.address}>{issue.address}</Text>
              <Text style={styles.description}>{issue.description}</Text>
            </View>
          </Pressable>
        ))}

        <Pressable style={styles.cameraButton} onPress={onOpenCamera} accessibilityRole="button">
          <Text style={styles.cameraTitle}>Open camera app</Text>
          <Text style={styles.cameraCopy}>Use the existing camera-style report screen instead of a sample issue.</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.cream },
  hero: {
    backgroundColor: '#132030',
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 20,
    gap: 6,
  },
  kicker: {
    color: '#9EC0F7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: T.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: '#CBD5E1',
    lineHeight: 21,
    fontWeight: '500',
  },
  content: {
    padding: 14,
    gap: 14,
    paddingBottom: 28,
  },
  sectionHeader: { gap: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.ink },
  sectionCopy: { color: T.ink3, lineHeight: 20 },
  card: {
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: T.ink,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusReady: {
    backgroundColor: T.greenLight,
  },
  statusDraft: {
    backgroundColor: T.amberLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextReady: {
    color: T.green,
  },
  statusTextDraft: {
    color: T.amber,
  },
  locationName: {
    color: T.ink2,
    fontWeight: '700',
  },
  address: {
    color: '#506079',
    lineHeight: 20,
    fontWeight: '500',
  },
  description: {
    color: '#445066',
    lineHeight: 21,
  },
  cameraButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#9EC0F7',
    backgroundColor: '#F2F7FF',
    padding: 16,
    gap: 4,
  },
  cameraTitle: {
    color: T.blueDark,
    fontSize: 17,
    fontWeight: '800',
  },
  cameraCopy: {
    color: '#335B99',
    lineHeight: 20,
    fontWeight: '500',
  },
})
