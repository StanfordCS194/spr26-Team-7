import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { WireframeHeader } from '../components/WireframeHeader'
import { fetchProfileSummary, ProfileSummary } from '../lib/profiles'
import { formatMemberSince, formatReportDate } from '../lib/reportMapper'
import { useAuth } from '../providers/AuthProvider'

export const ProfileScreen = () => {
  const { user, signOut } = useAuth()
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSummary(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    void fetchProfileSummary(user)
      .then((nextSummary) => {
        if (!isMounted) {
          return
        }
        setSummary(nextSummary)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }
        setSummary(null)
      })
      .finally(() => {
        if (!isMounted) {
          return
        }
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const displayName = summary?.fullName ?? user?.email ?? 'Signed in'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <View style={styles.page}>
      <WireframeHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Profile</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Text style={styles.bodyText}>{displayName}</Text>
          {summary?.email ? <Text style={styles.bodyText}>{summary.email}</Text> : null}
          {summary?.zipCode ? <Text style={styles.bodyText}>ZIP {summary.zipCode}</Text> : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notification Preferences</Text>
          <PreferenceRow label="Status changes on my reports" />
          <PreferenceRow label="Updates on followed reports" />
          <PreferenceRow label="Resolved issue notifications" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Impact</Text>
          {isLoading ? (
            <Text style={styles.bodyText}>Loading your activity...</Text>
          ) : (
            <>
              <Text style={styles.bodyText}>Total submitted: {summary?.totalSubmitted ?? 0}</Text>
              <Text style={styles.bodyText}>Resolved: {summary?.resolvedCount ?? 0}</Text>
              <Text style={styles.bodyText}>
                Using app for:{' '}
                {summary?.memberSince ? formatMemberSince(summary.memberSince) : 'Just joined'}
              </Text>
            </>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Reports</Text>
          {isLoading ? (
            <Text style={styles.bodyText}>Loading your reports...</Text>
          ) : summary?.reports.length ? (
            summary.reports.map((report) => (
              <Text key={report.id} style={styles.bodyText}>
                • {report.title} · {report.status} · {formatReportDate(report.createdAt)}
              </Text>
            ))
          ) : (
            <Text style={styles.bodyText}>No reports submitted yet.</Text>
          )}
        </View>
        <Pressable style={styles.secondaryButton} onPress={handleSignOut} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Log Out</Text>
        </Pressable>
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
  cardTitle: { fontWeight: '800', fontSize: 17 },
  secondaryButton: { borderColor: '#D5DEE9', borderWidth: 2, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '700', fontSize: 16 },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preferenceLabel: { flex: 1, color: '#304057', fontWeight: '500', marginRight: 10 },
  bodyText: { color: '#304057', fontWeight: '500' },
})
