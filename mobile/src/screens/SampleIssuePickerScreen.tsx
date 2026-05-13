import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SampleIssueImage } from '../components/SampleIssueImage'
import { sampleIssues } from '../data/sampleIssues'

// Pothole, streetlight, graffiti, illegal dumping, sidewalk — 5 photos
const GALLERY_ISSUES = sampleIssues.filter((i) => i.id !== 'SJ-D3-DEMO-004')

const GAP = 2
const COLS = 3
const THUMB_SIZE = (Dimensions.get('window').width - GAP * (COLS - 1)) / COLS

type SampleIssuePickerScreenProps = {
  onSelectIssue: (issueId: string) => void
  onOpenCamera: () => void
}

export const SampleIssuePickerScreen = ({
  onSelectIssue,
  onOpenCamera,
}: SampleIssuePickerScreenProps) => {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.albumTitle}>Recents</Text>
        <Pressable
          onPress={onOpenCamera}
          style={styles.cancelBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <FlatList
        data={GALLERY_ISSUES}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectIssue(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.type}
          >
            <SampleIssueImage image={item.image} style={styles.thumb} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#222428',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#35373D',
  },
  albumTitle: {
    color: '#F2F3F5',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cancelBtn: {
    position: 'absolute',
    right: 16,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  cancelText: {
    color: '#8D939E',
    fontSize: 17,
    fontWeight: '400',
  },

  row: { gap: GAP },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE },
})
