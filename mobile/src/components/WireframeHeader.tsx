import { Pressable, StyleSheet, Text, View } from 'react-native'

type WireframeHeaderProps = {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export const WireframeHeader = ({ title, showBack, onBack }: WireframeHeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Wireframe: {title}</Text>
      <View style={styles.rightControls}>
        {showBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
            <Text style={styles.backButtonText}>{"\u2190 Back"}</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.resetButton} accessibilityRole="button">
          <Text style={styles.resetButtonText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1E2227',
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetButton: {
    backgroundColor: '#3A3F45',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backButtonText: {
    color: '#2D6CFF',
    fontWeight: '700',
    fontSize: 18,
  },
})
