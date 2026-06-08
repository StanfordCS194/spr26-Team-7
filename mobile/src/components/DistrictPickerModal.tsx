import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DISTRICT_NEIGHBORHOODS } from '../data/dashboardMockData'

type DistrictPickerModalProps = {
  visible: boolean
  current: number
  onSelect: (district: number) => void
  onClose: () => void
}

export const DistrictPickerModal = ({
  visible,
  current,
  onSelect,
  onClose,
}: DistrictPickerModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Select Home District</Text>
        <ScrollView bounces={false}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((district) => (
            <Pressable
              key={district}
              style={[styles.districtRow, district === current && styles.districtRowActive]}
              onPress={() => {
                onSelect(district)
                onClose()
              }}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.districtRowNum, district === current && styles.districtRowNumActive]}>
                  District {district}
                </Text>
                <Text style={styles.districtRowSub}>{DISTRICT_NEIGHBORHOODS[district]}</Text>
              </View>
              {district === current ? <Text style={styles.districtCheck}>✓</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Pressable>
  </Modal>
)

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#222428',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '72%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#35373D',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalTitle: {
    color: '#8D939E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: 12,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#35373D',
  },
  districtRowActive: { backgroundColor: '#2C2D32' },
  districtRowNum: { color: '#8D939E', fontSize: 15, fontWeight: '700' },
  districtRowNumActive: { color: '#F2F3F5' },
  districtRowSub: { color: '#55595F', fontSize: 12, marginTop: 1 },
  districtCheck: { color: '#3ECF82', fontSize: 16, fontWeight: '700' },
})
