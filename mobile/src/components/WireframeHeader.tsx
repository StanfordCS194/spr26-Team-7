import { Pressable, StyleSheet, Text, View } from 'react-native'

type WireframeHeaderProps = {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export const WireframeHeader = ({ title, showBack, onBack }: WireframeHeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {showBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
          <Text style={styles.backButtonText}>{"\u2190 Back"}</Text>
        </Pressable>
      ) : null}
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
