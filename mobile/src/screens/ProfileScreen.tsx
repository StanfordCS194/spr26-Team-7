import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useState } from 'react'
import { WireframeHeader } from '../components/WireframeHeader'
import {
  formatAccountAge,
  formatReportDate,
  formatReportStatus,
  getProfileImpactStats,
  ProfileReport,
} from '../lib/profileStats'

type ProfileScreenProps = {
  isSignedIn: boolean
  onToggleAuth: () => void
  displayName?: string | null
  email?: string | null
  memberSince?: string | null
  reports: ProfileReport[]
  onViewReport: (reportId: string) => void
}

export const ProfileScreen = ({
  isSignedIn,
  onToggleAuth,
  displayName,
  email,
  memberSince,
  reports,
  onViewReport,
}: ProfileScreenProps) => {
  const { totalSubmitted, resolved } = getProfileImpactStats(reports)
  const accountAge = memberSince ? formatAccountAge(memberSince) : 'Unknown'
  const sortedReports = [...reports].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
  )

  return (
    <View style={styles.page}>
      <WireframeHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Profile</Text>
        {!isSignedIn ? (
          <View style={styles.card}>
            <Text style={styles.promptTitle}>Use app without login, or sign in for history and follows.</Text>
            <Pressable style={styles.primaryButton} onPress={onToggleAuth} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Log In</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              {displayName ? <Text style={styles.bodyText}>{displayName}</Text> : null}
              {email ? <Text style={styles.mutedText}>{email}</Text> : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notification Preferences</Text>
              <PreferenceRow label="Status changes on my reports" />
              <PreferenceRow label="Updates on followed reports" />
              <PreferenceRow label="Resolved issue notifications" />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal Impact</Text>
              <Text style={styles.bodyText}>Total submitted: {totalSubmitted}</Text>
              <Text style={styles.bodyText}>Resolved: {resolved}</Text>
              <Text style={styles.bodyText}>Using app for: {accountAge}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>My Reports</Text>
              {sortedReports.length === 0 ? (
                <Text style={styles.mutedText}>No reports yet. File one from the Report tab.</Text>
              ) : (
                sortedReports.map((report) => (
                  <Pressable
                    key={report.id}
                    onPress={() => onViewReport(report.id)}
                    style={styles.reportRow}
                    accessibilityRole="button"
                    accessibilityLabel={`View report: ${report.title}`}
                  >
                    <View style={styles.reportCopy}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportMeta}>
                        {`${report.category} · ${formatReportStatus(report.status)} · ${formatReportDate(report.submittedAt)}`}
                      </Text>
                    </View>
                    <Text style={styles.reportChevron}>›</Text>
                  </Pressable>
                ))
              )}
            </View>
            <Pressable style={styles.secondaryButton} onPress={onToggleAuth} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Log Out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const PreferenceRow = ({ label }: { label: string }) => {
  const [enabled, setEnabled] = useState(true)
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch value={enabled} onValueChange={setEnabled} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800' },
  card: { borderColor: '#E2EAF2', borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  promptTitle: { color: '#324159', lineHeight: 22, fontSize: 16, fontWeight: '500' },
  cardTitle: { fontWeight: '800', fontSize: 17 },
  primaryButton: { marginTop: 4, backgroundColor: '#1565FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { borderColor: '#D5DEE9', borderWidth: 2, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '700', fontSize: 16 },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preferenceLabel: { flex: 1, color: '#304057', fontWeight: '500', marginRight: 10 },
  bodyText: { color: '#304057', fontWeight: '500' },
  mutedText: { color: '#737E91', fontWeight: '500' },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  reportCopy: { flex: 1, gap: 2 },
  reportTitle: { color: '#304057', fontWeight: '700', fontSize: 15 },
  reportMeta: { color: '#737E91', fontWeight: '500', fontSize: 13 },
  reportChevron: { color: '#737E91', fontSize: 22, lineHeight: 24 },
})
