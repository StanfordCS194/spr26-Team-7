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
          <Text style={styles.backButtonText}>{"‹ Back"}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#18191C',
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  title: {
    color: '#F2F3F5',
    fontWeight: '800',
    fontSize: 20,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backButtonText: {
    color: '#8D939E',
    fontWeight: '700',
    fontSize: 18,
  },
})
