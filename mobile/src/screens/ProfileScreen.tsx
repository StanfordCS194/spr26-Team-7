import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useState } from 'react'
import { WireframeHeader } from '../components/WireframeHeader'

type ProfileScreenProps = {
  isSignedIn: boolean
  onToggleAuth: () => void
}

export const ProfileScreen = ({ isSignedIn, onToggleAuth }: ProfileScreenProps) => {
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
              <Text style={styles.cardTitle}>Notification Preferences</Text>
              <PreferenceRow label="Status changes on my reports" />
              <PreferenceRow label="Updates on followed reports" />
              <PreferenceRow label="Resolved issue notifications" />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal Impact</Text>
              <Text style={styles.bodyText}>Total submitted: 18</Text>
              <Text style={styles.bodyText}>Resolved: 11</Text>
              <Text style={styles.bodyText}>Using app for: 7 months</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>My Reports</Text>
              <Text style={styles.bodyText}>• Pothole · In Review · Apr 19, 2026</Text>
              <Text style={styles.bodyText}>• Streetlight Outage · Submitted · Apr 16, 2026</Text>
              <Text style={styles.bodyText}>• Graffiti · Resolved · Apr 10, 2026</Text>
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
})
