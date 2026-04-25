import { useMemo, useRef, useState } from 'react'
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { issueCategories } from '../data/mockData'
import { IssueCategory, ReportDraft } from '../types'
import { WireframeHeader } from '../components/WireframeHeader'

type ReportReviewScreenProps = {
  draft: ReportDraft
  onBack: () => void
  onUpdateDraft: (nextDraft: ReportDraft) => void
  onSubmit: (isPlusOne: boolean) => void
}

export const ReportReviewScreen = ({ draft, onBack, onUpdateDraft, onSubmit }: ReportReviewScreenProps) => {
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(draft.duplicateNearby)
  const pin = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: pin.x, dy: pin.y }], { useNativeDriver: false }),
      }),
    [pin]
  )

  const handleChangeCategory = () => {
    const currentIndex = issueCategories.findIndex((category) => category === draft.category)
    const nextIndex = (currentIndex + 1) % issueCategories.length
    onUpdateDraft({ ...draft, category: issueCategories[nextIndex] as IssueCategory })
  }

  return (
    <View style={styles.page}>
      <WireframeHeader title="Review" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Review & Edit</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Photos</Text>
          <View style={styles.photoBox} />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.mapArea}>
            <Text style={styles.dragLabel}>Drag pin to adjust</Text>
            <Animated.View style={[styles.pin, { transform: pin.getTranslateTransform() }]} {...panResponder.panHandlers}>
              <Text style={styles.pinText}>📍</Text>
            </Animated.View>
          </View>
          <Text style={styles.address}>{draft.address}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Issue Type</Text>
          <Pressable style={styles.selector} onPress={handleChangeCategory} accessibilityRole="button">
            <Text style={styles.selectorText}>{draft.category}</Text>
            <Text style={styles.selectorIcon}>⌄</Text>
          </Pressable>
          <Text style={styles.meta}>Auto-detected · Tap to change</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Suggested description</Text>
          <TextInput
            multiline
            value={draft.description}
            onChangeText={(description) => onUpdateDraft({ ...draft, description })}
            style={styles.input}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            multiline
            placeholder="Add any additional context..."
            value={draft.notes}
            onChangeText={(notes) => onUpdateDraft({ ...draft, notes })}
            style={styles.input}
          />
        </View>
        {showDuplicatePrompt ? (
          <View style={styles.duplicateCard}>
            <Text style={styles.duplicateTitle}>Someone already reported this near here. Is this the same issue?</Text>
            <View style={styles.duplicateButtons}>
              <Pressable
                style={[styles.secondaryButton, styles.duplicateButton]}
                onPress={() => onSubmit(true)}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>+1 Same Issue</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, styles.duplicateButton]}
                onPress={() => setShowDuplicatePrompt(false)}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>Not Same</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
      <Pressable style={styles.submitButton} onPress={() => onSubmit(false)} accessibilityRole="button">
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  pageTitle: { fontSize: 36 / 2, fontWeight: '800' },
  card: {
    borderWidth: 1,
    borderColor: '#E3E8F0',
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  label: { fontSize: 28 / 2, fontWeight: '700', color: '#3E4857' },
  photoBox: { width: 86, height: 86, backgroundColor: '#E4E8EF', borderRadius: 8 },
  mapArea: { backgroundColor: '#EDF1F6', borderRadius: 10, height: 170, overflow: 'hidden' },
  dragLabel: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontWeight: '700',
    zIndex: 2,
  },
  pin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -18,
  },
  pinText: { fontSize: 32 },
  address: { fontSize: 32 / 2, fontWeight: '500', color: '#3A4452' },
  selector: {
    borderWidth: 1,
    borderColor: '#A9CCFF',
    borderRadius: 8,
    backgroundColor: '#EDF5FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: { fontSize: 34 / 2, color: '#004BC1', fontWeight: '700' },
  selectorIcon: { fontSize: 28 / 2, color: '#004BC1', fontWeight: '700' },
  meta: { color: '#7D889A', fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#D6DFEA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 82,
    textAlignVertical: 'top',
    fontSize: 30 / 2,
  },
  duplicateCard: {
    borderWidth: 1,
    borderColor: '#C6D5EE',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F3F7FF',
    gap: 12,
  },
  duplicateTitle: {
    fontSize: 28 / 2,
    lineHeight: 20,
    fontWeight: '600',
    color: '#2C3850',
  },
  duplicateButtons: { flexDirection: 'row', gap: 10 },
  duplicateButton: { flex: 1 },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9CB9E6',
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '700', color: '#204C94' },
  submitButton: {
    margin: 14,
    borderRadius: 14,
    backgroundColor: '#1565FF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 32 / 2 },
})
