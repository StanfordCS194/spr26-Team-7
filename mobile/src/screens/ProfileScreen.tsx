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
  followingReports: ProfileReport[]
  onReplayOnboarding: () => void
  onViewReport: (reportId: string) => void
}

const ReportList = ({
  reports,
  emptyMessage,
  onViewReport,
}: {
  reports: ProfileReport[]
  emptyMessage: string
  onViewReport: (reportId: string) => void
}) => {
  const sortedReports = [...reports].sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
  )

  if (sortedReports.length === 0) {
    return <Text style={styles.mutedText}>{emptyMessage}</Text>
  }

  return sortedReports.map((report) => (
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
}

export const ProfileScreen = ({
  isSignedIn,
  onToggleAuth,
  displayName,
  email,
  memberSince,
  reports,
  followingReports,
  onReplayOnboarding,
  onViewReport,
}: ProfileScreenProps) => {
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved'>('active')
  const { totalSubmitted, resolved } = getProfileImpactStats(reports)
  const accountAge = memberSince ? formatAccountAge(memberSince) : 'Unknown'
  const filterReports = (items: ProfileReport[]) =>
    items.filter((report) =>
      statusFilter === 'resolved'
        ? formatReportStatus(report.status) === 'Resolved'
        : formatReportStatus(report.status) !== 'Resolved',
    )
  const filteredReports = filterReports(reports)
  const filteredFollowingReports = filterReports(followingReports)
  const emptySuffix = statusFilter === 'resolved' ? 'resolved reports' : 'active reports'

  return (
    <View style={styles.page}>
      <WireframeHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Profile</Text>
        {!isSignedIn ? (
          <>
            <View style={styles.card}>
              <Text style={styles.promptTitle}>Use app without login, or sign in for history and follows.</Text>
              <Pressable style={styles.primaryButton} onPress={onToggleAuth} accessibilityRole="button">
                <Text style={styles.primaryButtonText}>Log In</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Help</Text>
              <Pressable style={styles.secondaryButton} onPress={onReplayOnboarding} accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>How CityFix Works</Text>
              </Pressable>
            </View>
          </>
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
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterTab, statusFilter === 'active' ? styles.filterTabActive : null]}
                onPress={() => setStatusFilter('active')}
                accessibilityRole="button"
                accessibilityState={{ selected: statusFilter === 'active' }}
              >
                <Text style={[styles.filterTabText, statusFilter === 'active' ? styles.filterTabTextActive : null]}>
                  Active
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterTab, statusFilter === 'resolved' ? styles.filterTabActive : null]}
                onPress={() => setStatusFilter('resolved')}
                accessibilityRole="button"
                accessibilityState={{ selected: statusFilter === 'resolved' }}
              >
                <Text style={[styles.filterTabText, statusFilter === 'resolved' ? styles.filterTabTextActive : null]}>
                  Resolved
                </Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>My Reports</Text>
              <ReportList
                reports={filteredReports}
                emptyMessage={`No ${emptySuffix} yet.`}
                onViewReport={onViewReport}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Following</Text>
              <ReportList
                reports={filteredFollowingReports}
                emptyMessage={`No followed ${emptySuffix}.`}
                onViewReport={onViewReport}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Help</Text>
              <Pressable style={styles.secondaryButton} onPress={onReplayOnboarding} accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>How CityFix Works</Text>
              </Pressable>
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
  page: { flex: 1, backgroundColor: '#18191C' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  title: { color: '#F2F3F5', fontSize: 22, fontWeight: '800' },
  card: { backgroundColor: '#222428', borderRadius: 14, padding: 12, gap: 10 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#222428',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#F2F3F5',
  },
  filterTabText: {
    color: '#8D939E',
    fontWeight: '800',
  },
  filterTabTextActive: {
    color: '#18191C',
  },
  promptTitle: { color: '#F2F3F5', lineHeight: 22, fontSize: 16, fontWeight: '600' },
  cardTitle: { color: '#F2F3F5', fontWeight: '800', fontSize: 17 },
  primaryButton: { marginTop: 4, backgroundColor: '#4F8EF7', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { backgroundColor: '#2C2D32', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#F2F3F5', fontWeight: '700', fontSize: 16 },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preferenceLabel: { flex: 1, color: '#F2F3F5', fontWeight: '500', marginRight: 10 },
  bodyText: { color: '#F2F3F5', fontWeight: '500' },
  mutedText: { color: '#8D939E', fontWeight: '500' },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  reportCopy: { flex: 1, gap: 2 },
  reportTitle: { color: '#F2F3F5', fontWeight: '700', fontSize: 15 },
  reportMeta: { color: '#8D939E', fontWeight: '500', fontSize: 13 },
  reportChevron: { color: '#8D939E', fontSize: 22, lineHeight: 24 },
})
