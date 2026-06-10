import { useEffect } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { WireframeHeader } from '../components/WireframeHeader'

type ReportSubmittingScreenProps = {
  onDone: () => void
}

export const ReportSubmittingScreen = ({ onDone }: ReportSubmittingScreenProps) => {
  useEffect(() => {
    const timeout = setTimeout(onDone, 1400)
    return () => clearTimeout(timeout)
  }, [onDone])

  return (
    <View style={styles.page}>
      <Image source={require('../../assets/pothole.jpg')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={styles.overlay} />
      <WireframeHeader title="Submitting" />
      <View style={styles.body}>
        <View style={styles.spinner} />
        <Text style={styles.title}>Submitting Report</Text>
        <Text style={styles.subtitle}>Routing to Public Works...</Text>
        <Text style={styles.bodyText}>Creating case and notifying the appropriate department</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24,25,28,0.78)' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  spinner: {
    width: 82,
    height: 82,
    borderRadius: 999,
    borderWidth: 8,
    borderTopColor: '#4F8EF7',
    borderColor: '#35373D',
    marginBottom: 30,
  },
  title: { color: '#F2F3F5', fontWeight: '800', fontSize: 46 / 2, marginBottom: 8 },
  subtitle: { fontWeight: '600', fontSize: 38 / 2, color: '#D1D5DB', marginBottom: 14 },
  bodyText: { fontWeight: '500', fontSize: 32 / 2, color: '#8D939E', textAlign: 'center' },
})
