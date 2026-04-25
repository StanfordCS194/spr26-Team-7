import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WireframeHeader } from '../components/WireframeHeader'

type ReportConfirmationScreenProps = {
  caseNumber: string
  neighborhood: string
  totalInArea: number
  onViewIssue: () => void
  onReportAnother: () => void
}

export const ReportConfirmationScreen = ({
  caseNumber,
  neighborhood,
  totalInArea,
  onViewIssue,
  onReportAnother,
}: ReportConfirmationScreenProps) => {
  return (
    <View style={styles.page}>
      <WireframeHeader title="Confirmation" />
      <View style={styles.body}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.title}>Report Submitted!</Text>
        <Text style={styles.subtitle}>Thanks for helping improve {neighborhood}</Text>
        <Text style={styles.meta}>{totalInArea} total issues reported in this area</Text>

        <View style={styles.caseCard}>
          <Text style={styles.caseLabel}>Case Number</Text>
          <Text style={styles.caseValue}>{caseNumber}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={onViewIssue} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>View Issue</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onReportAnother} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Report Another</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 42,
  },
  check: { textAlign: 'center', color: '#00B643', fontSize: 84, marginBottom: 10, fontWeight: '800' },
  title: { fontSize: 48 / 2, fontWeight: '900', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 8, color: '#3E4758', fontSize: 34 / 2, fontWeight: '500' },
  meta: { textAlign: 'center', marginTop: 8, color: '#6D788B', fontSize: 28 / 2 },
  caseCard: { marginTop: 24, backgroundColor: '#F5F7FB', borderRadius: 14, padding: 14, marginBottom: 18 },
  caseLabel: { color: '#5F6B7E', marginBottom: 8, fontWeight: '600' },
  caseValue: { fontSize: 50 / 2, fontWeight: '900', letterSpacing: 0.4 },
  primaryButton: { backgroundColor: '#1565FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 34 / 2 },
  secondaryButton: {
    marginTop: 10,
    borderColor: '#D3DBE7',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#111722', fontWeight: '800', fontSize: 34 / 2 },
})
