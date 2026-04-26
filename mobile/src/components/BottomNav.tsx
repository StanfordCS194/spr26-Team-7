import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppTab } from '../types'

type BottomNavProps = {
  currentTab: AppTab
  onChangeTab: (tab: AppTab) => void
}

const tabs: { key: AppTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u25A3' },
  { key: 'report', label: 'Report', icon: '\u25EF' },
  { key: 'profile', label: 'Profile', icon: '\u25C7' },
]

export const BottomNav = ({ currentTab, onChangeTab }: BottomNavProps) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === currentTab
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive ? styles.activeTab : null]}
            onPress={() => onChangeTab(tab.key)}
            accessibilityRole="button"
          >
            <Text style={[styles.icon, isActive ? styles.activeText : null]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive ? styles.activeText : null]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#121519',
    paddingTop: 8,
    paddingBottom: 14,
    borderTopColor: '#20242A',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  activeTab: {
    borderTopColor: '#1F6DFF',
    borderTopWidth: 3,
    marginTop: -3,
  },
  icon: {
    color: '#D7DEE9',
    fontSize: 20,
  },
  label: {
    color: '#D7DEE9',
    fontWeight: '600',
    fontSize: 15,
  },
  activeText: {
    color: '#1F6DFF',
  },
})
