import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WireframeHeader } from '../components/WireframeHeader'

type ReportCameraScreenProps = {
  onCapture: () => void
}

export const ReportCameraScreen = ({ onCapture }: ReportCameraScreenProps) => {
  return (
    <View style={styles.page}>
      <WireframeHeader title="Camera" />
      <View style={styles.cameraBody}>
        <Text style={styles.cameraIcon}>\u25A3</Text>
        <Text style={styles.cameraText}>Camera Viewfinder</Text>
        <Text style={styles.gpsText}>(GPS capturing... please give the gps a moment to process.)</Text>
      </View>
      <View style={styles.captureBar}>
        <Pressable style={styles.smallButton} accessibilityRole="button">
          <Text style={styles.smallButtonText}>Gallery</Text>
        </Pressable>
        <Pressable style={styles.captureButton} onPress={onCapture} accessibilityRole="button" accessibilityLabel="Capture photo" />
        <Pressable style={styles.smallButton} accessibilityRole="button">
          <Text style={styles.smallButtonText}>Layers</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  cameraBody: {
    flex: 1,
    backgroundColor: '#E5EAF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: { fontSize: 58, color: '#6B778C' },
  cameraText: { marginTop: 10, fontSize: 36 / 2, color: '#677286', fontWeight: '600' },
  gpsText: { marginTop: 2, fontSize: 14, color: '#7B8799', fontWeight: '600' },
  captureBar: {
    backgroundColor: '#0F1215',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  smallButton: {
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  smallButtonText: { color: '#fff', fontWeight: '700' },
  captureButton: {
    width: 86,
    height: 86,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: '#fff',
    backgroundColor: '#3E4349',
  },
})
