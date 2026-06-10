import { useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { DashboardMap } from './DashboardMap'
import { InsightsScreen } from './InsightsScreen'
import { MapReport } from '../data/mockMapReports'
import { DISTRICT_NEIGHBORHOODS } from '../data/dashboardMockData'
import { ChronicSpotV2, districtNames } from '../data/dashboard311v2'
import { useDashboardData } from '../context/DashboardContext'

// ─── Palette ──────────────────────────────────────────────────────────────────
const D = {
  bg:          '#18191C',
  surface:     '#222428',
  surfaceHigh: '#2C2D32',
  border:      '#35373D',
  text1:       '#F2F3F5',
  text2:       '#8D939E',
} as const

// ─── District picker modal ────────────────────────────────────────────────────
type PickerProps = {
  visible:  boolean
  current:  number
  onSelect: (d: number) => void
  onClose:  () => void
}

const DistrictPicker = ({ visible, current, onSelect, onClose }: PickerProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.modalOverlay} onPress={onClose}>
      <View style={s.modalSheet}>
        <View style={s.modalHandle} />
        <Text style={s.modalTitle}>Select District</Text>
        <ScrollView bounces={false}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(d => (
            <Pressable
              key={d}
              style={[s.districtRow, d === current && s.districtRowActive]}
              onPress={() => { onSelect(d); onClose() }}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.districtRowNum, d === current && { color: D.text1 }]}>District {d}</Text>
                <Text style={s.districtRowSub}>{DISTRICT_NEIGHBORHOODS[d]}</Text>
              </View>
              {d === current && <Text style={s.districtCheck}>✓</Text>}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Pressable>
  </Modal>
)

// ─── Dashboard screen ─────────────────────────────────────────────────────────
type DashboardScreenProps = {
  onViewReport?:      (report: MapReport)   => void
  onViewChronicSpot?: (spot: ChronicSpotV2) => void
}

export const DashboardScreen = ({ onViewReport, onViewChronicSpot }: DashboardScreenProps) => {
  const { dashboardV2 } = useDashboardData()
  const [district,      setDistrict]      = useState(3)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [activeTab,     setActiveTab]     = useState<'map' | 'insights'>('map')

  const { width: screenWidth } = useWindowDimensions()
  const pagerRef = useRef<ScrollView>(null)

  const handleDistrictChange = (d: number) => setDistrict(d)

  const monthReportCount = (dashboardV2.districts[String(district)]?.categoryComparison.month ?? [])
    .reduce((sum, c) => sum + c.volume, 0)
    .toLocaleString('en-US')

  const switchTab = (tab: 'map' | 'insights') => {
    pagerRef.current?.scrollTo({ x: tab === 'map' ? 0 : screenWidth, animated: true })
    setActiveTab(tab)
  }

  return (
    <View style={s.page}>
      <DistrictPicker
        visible={pickerVisible}
        current={district}
        onSelect={handleDistrictChange}
        onClose={() => setPickerVisible(false)}
      />

      {/* ── Fixed header ── */}
      <View style={s.header}>
        <Text style={s.headerEyebrow}>YOUR NEIGHBORHOOD</Text>
        <Pressable
          style={s.headerRow}
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Change district"
        >
          <Text style={s.headerNeighborhood}>District {district}</Text>
          <Text style={s.headerChevron}>  ▾</Text>
        </Pressable>
        <Text style={s.headerSubline}>
          {districtNames[String(district)]} · {monthReportCount} reports this month
        </Text>
      </View>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {(['map', 'insights'] as const).map(tab => (
          <Pressable
            key={tab}
            style={s.tabItem}
            onPress={() => switchTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab === 'map' ? 'Map' : 'Insights'}
            </Text>
            {activeTab === tab && <View style={s.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      {/* ── Horizontal pager ── */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth)
          setActiveTab(page === 0 ? 'map' : 'insights')
        }}
        style={{ flex: 1 }}
      >
        {/* ── Tab 1: Map ── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <DashboardMap
            district={district}
            onViewReport={onViewReport ?? (() => {})}
          />
        </View>

        {/* ── Tab 2: Insights ── */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <InsightsScreen
            district={district}
            onDistrictChange={handleDistrictChange}
            onViewChronicSpot={onViewChronicSpot}
          />
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: D.bg },

  // ── Header
  header:             { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerEyebrow:      { color: D.text2, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  headerRow:          { flexDirection: 'row', alignItems: 'baseline' },
  headerNeighborhood: { color: D.text1, fontSize: 26, fontWeight: '800' },
  headerChevron:      { color: D.text2, fontSize: 18, fontWeight: '600' },
  headerSubline:      { color: D.text2, fontSize: 12.5, marginTop: 3, letterSpacing: 0.1 },

  // ── Tab bar
  tabBar:         { flexDirection: 'row', backgroundColor: D.bg, borderBottomWidth: 1, borderBottomColor: D.border },
  tabItem:        { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabLabel:       { fontSize: 14, fontWeight: '600', color: D.text2 },
  tabLabelActive: { color: D.text1 },
  tabIndicator:   { position: 'absolute', bottom: 0, left: 20, right: 20, height: 2, backgroundColor: D.text1, borderRadius: 1 },

  // ── District picker modal
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:        { backgroundColor: D.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '72%' },
  modalHandle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: D.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalTitle:        { color: D.text2, fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center', paddingVertical: 12 },
  districtRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: D.border },
  districtRowActive: { backgroundColor: D.surfaceHigh },
  districtRowNum:    { color: D.text2, fontSize: 15, fontWeight: '700' },
  districtRowSub:    { color: '#55595F', fontSize: 12, marginTop: 1 },
  districtCheck:     { color: '#3ECF82', fontSize: 16, fontWeight: '700' },
})
