import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { topIssues } from '../data/mockData'
import { WireframeHeader } from '../components/WireframeHeader'

const filters = ['Roads', 'Utilities', 'Parks', 'Transit', 'Buildings']

export const DashboardScreen = () => {
  return (
    <View style={styles.page}>
      <WireframeHeader title="Dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Downtown Neighborhood</Text>
        <Text style={styles.subtitle}>Auto-detected · Zoom out to district/city</Text>
        <View style={styles.mapCard}>
          <View style={[styles.pin, { top: 40, left: 80, backgroundColor: '#F08B00' }]} />
          <View style={[styles.pin, { top: 110, left: 150, backgroundColor: '#0F9CFF' }]} />
          <View style={[styles.pin, { top: 70, left: 250, backgroundColor: '#28A745' }]} />
          <View style={[styles.pin, { top: 155, left: 220, backgroundColor: '#A35DFF' }]} />
        </View>
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <Pressable key={filter} style={styles.filterPill} accessibilityRole="button">
              <Text style={styles.filterText}>{filter}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Issues</Text>
          {topIssues.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month</Text>
          <Text style={styles.statLine}>Reported: 38</Text>
          <Text style={styles.statLine}>Resolved: 24</Text>
          <Text style={styles.statLine}>Avg resolution (potholes): 5.2 days</Text>
          <Text style={styles.statLine}>Trending spike: streetlight outages (+42%)</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 14, gap: 14, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#69768A', fontWeight: '500' },
  mapCard: { height: 220, borderRadius: 16, backgroundColor: '#EBF0F6', overflow: 'hidden' },
  pin: { position: 'absolute', width: 16, height: 16, borderRadius: 999 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterPill: {
    borderColor: '#9EC0F7',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F7FF',
  },
  filterText: { color: '#2457AE', fontWeight: '700', fontSize: 13 },
  card: { borderColor: '#E3EAF2', borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  cardTitle: { fontWeight: '800', fontSize: 17 },
  listItem: { color: '#2D3850', lineHeight: 21, fontWeight: '500' },
  statLine: { color: '#2D3850', lineHeight: 21, fontWeight: '500' },
})
