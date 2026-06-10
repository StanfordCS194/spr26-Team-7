import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { AppTab } from '../types'

type BottomNavProps = {
  currentTab: AppTab
  onChangeTab: (tab: AppTab) => void
}

const ACTIVE   = '#5B9BF8'
const INACTIVE = '#636870'

function DashboardIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Rect x="3"    y="3"    width="7.5" height="7.5"  rx="1.5" stroke={c} strokeWidth={1.8} />
      <Rect x="13.5" y="3"    width="7.5" height="5"    rx="1.5" stroke={c} strokeWidth={1.8} />
      <Rect x="13.5" y="11"   width="7.5" height="10"   rx="1.5" stroke={c} strokeWidth={1.8} />
      <Rect x="3"    y="13.5" width="7.5" height="7.5"  rx="1.5" stroke={c} strokeWidth={1.8} />
    </Svg>
  )
}

function ReportIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5M9.5 9.5h5" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : INACTIVE
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={1.8} />
      <Path d="M4 20.5a8 8 0 0 1 16 0" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export const BottomNav = ({ currentTab, onChangeTab }: BottomNavProps) => (
  <View style={s.bar}>
    {([
      ['dashboard', 'Dashboard', DashboardIcon],
      ['report',    'Report',    ReportIcon],
      ['profile',   'Profile',   ProfileIcon],
    ] as [AppTab, string, React.ComponentType<{ active: boolean }>][]).map(([key, label, Icon]) => {
      const active = currentTab === key
      return (
        <Pressable key={key} style={s.item} onPress={() => onChangeTab(key)} accessibilityRole="button">
          <Icon active={active} />
          <Text style={[s.label, active && s.labelActive]}>{label}</Text>
        </Pressable>
      )
    })}
  </View>
)

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#18191C',
    borderTopWidth: 1, borderTopColor: '#313338',
    paddingTop: 10, paddingBottom: 16,
  },
  item:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  label:       { fontSize: 10, fontWeight: '500', color: '#636870' },
  labelActive: { color: '#5B9BF8' },
})
