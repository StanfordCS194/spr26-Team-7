import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { WireframeHeader } from '../components/WireframeHeader'

type ReportPreviewScreenProps = {
  onBack: () => void
  onContinue: () => void
}

export const ReportPreviewScreen = ({ onBack, onContinue }: ReportPreviewScreenProps) => {
  return (
    <View style={styles.page}>
      <WireframeHeader title="Preview" showBack onBack={onBack} />
      <View style={styles.previewArea}>
        <Image source={require('../../assets/pothole.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={styles.analyzingBubble}>
          <Text style={styles.analyzingText}>Analyzing...</Text>
        </View>
        <Text style={styles.caption}>Captured Image</Text>
      </View>
      <View style={styles.thumbnailStrip}>
        <View style={[styles.thumbnail, styles.thumbnailActive]}>
          <Image source={require('../../assets/pothole.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        </View>
        <Pressable style={styles.thumbnailAdd} accessibilityRole="button">
          <Text style={styles.thumbnailAddText}>+</Text>
        </Pressable>
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={styles.ghostButton} accessibilityRole="button">
          <Text style={styles.ghostButtonText}>Retake</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} accessibilityRole="button">
          <Text style={styles.ghostButtonText}>Add More</Text>
        </Pressable>
      </View>
      <Pressable style={styles.primaryButton} onPress={onContinue} accessibilityRole="button">
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  previewArea: {
    flex: 1,
    backgroundColor: '#2E3D52',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  analyzingBubble: {
    position: 'absolute',
    top: 18,
    right: 16,
    backgroundColor: '#151A21',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  analyzingText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  caption: { color: '#AEB8C8', fontWeight: '600', marginTop: 10 },
  thumbnailStrip: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#132030',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  thumbnail: { width: 66, height: 66, borderRadius: 8, backgroundColor: '#5E6D82', overflow: 'hidden' },
  thumbnailActive: { borderColor: '#1F6DFF', borderWidth: 2 },
  thumbnailAdd: {
    width: 66,
    height: 66,
    borderRadius: 8,
    borderColor: '#6D7A90',
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailAddText: { color: '#8896AA', fontSize: 30, fontWeight: '700' },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  ghostButton: {
    flex: 1,
    borderColor: '#CED6E0',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ghostButtonText: { fontSize: 30 / 2, fontWeight: '700' },
  primaryButton: {
    margin: 14,
    borderRadius: 14,
    backgroundColor: '#1565FF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 32 / 2 },
})
