import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { DistrictPickerModal } from '../components/DistrictPickerModal'
import { WireframeHeader } from '../components/WireframeHeader'
import { DISTRICT_NEIGHBORHOODS } from '../data/dashboardMockData'

type ProfileSettingsScreenProps = {
  onBack: () => void
  locationEnabled: boolean
  homeDistrict: number
  onLocationEnabledChange: (enabled: boolean) => void
  onHomeDistrictChange: (district: number) => void
}

const NotificationPreferenceRow = ({ label }: { label: string }) => {
  const [enabled, setEnabled] = useState(true)
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: '#35373D', true: '#4F8EF7' }}
        thumbColor="#F2F3F5"
        ios_backgroundColor="#35373D"
      />
    </View>
  )
}

export const ProfileSettingsScreen = ({
  onBack,
  locationEnabled,
  homeDistrict,
  onLocationEnabledChange,
  onHomeDistrictChange,
}: ProfileSettingsScreenProps) => {
  const [pickerVisible, setPickerVisible] = useState(false)

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location access in your device settings to attach GPS coordinates to reports.',
        )
        return
      }
    }
    onLocationEnabledChange(enabled)
  }

  return (
    <View style={styles.page}>
      <WireframeHeader title="Settings" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityIconBox}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color="#4F8EF7" />
          </View>
          <View style={styles.availabilityCopy}>
            <Text style={styles.availabilityTitle}>Currently serving San José</Text>
            <Text style={styles.availabilityBody}>
              CityFix is live in San José today. We plan to expand to more cities and neighborhoods
              soon.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location</Text>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceLabel}>Use my location on reports</Text>
              <Text style={styles.preferenceDescription}>
                {locationEnabled
                  ? 'GPS coordinates are attached when you file a report.'
                  : 'Reports use your home district instead of GPS.'}
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: '#35373D', true: '#4F8EF7' }}
              thumbColor="#F2F3F5"
              ios_backgroundColor="#35373D"
            />
          </View>

          <Pressable
            style={styles.homeDistrictRow}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change home district"
          >
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceLabel}>Home district</Text>
              <Text style={styles.homeDistrictValue}>District {homeDistrict}</Text>
              <Text style={styles.preferenceDescription}>{DISTRICT_NEIGHBORHOODS[homeDistrict]}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Text style={styles.homeDistrictHint}>
            Personalizes your dashboard insights and is used when location is off.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notification Preferences</Text>
          <NotificationPreferenceRow label="Status changes on my reports" />
          <NotificationPreferenceRow label="Updates on followed reports" />
          <NotificationPreferenceRow label="Resolved issue notifications" />
        </View>
      </ScrollView>

      <DistrictPickerModal
        visible={pickerVisible}
        current={homeDistrict}
        onSelect={onHomeDistrictChange}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  availabilityCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#4F8EF718',
    borderColor: '#4F8EF740',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  availabilityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4F8EF728',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityCopy: { flex: 1, gap: 4 },
  availabilityTitle: { color: '#F2F3F5', fontWeight: '800', fontSize: 15 },
  availabilityBody: { color: '#8D939E', fontWeight: '500', fontSize: 13, lineHeight: 19 },
  card: {
    backgroundColor: '#222428',
    borderColor: '#35373D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  cardTitle: { fontWeight: '800', fontSize: 17, color: '#F2F3F5' },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  preferenceCopy: { flex: 1, gap: 4 },
  preferenceLabel: { color: '#F2F3F5', fontWeight: '600' },
  preferenceDescription: { color: '#8D939E', fontWeight: '500', fontSize: 13, lineHeight: 18 },
  homeDistrictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#35373D',
  },
  homeDistrictValue: { color: '#F2F3F5', fontWeight: '800', fontSize: 16 },
  homeDistrictHint: { color: '#55595F', fontWeight: '500', fontSize: 12, lineHeight: 17 },
  chevron: { color: '#8D939E', fontSize: 22, lineHeight: 24 },
})
