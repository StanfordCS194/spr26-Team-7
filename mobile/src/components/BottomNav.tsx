import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppTab } from '../types'

type BottomNavProps = {
  currentTab: AppTab
  onChangeTab: (tab: AppTab) => void
}

const tabs: { key: AppTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '▣' },
  { key: 'report', label: 'Report', icon: '◯' },
  { key: 'profile', label: 'Profile', icon: '◇' },
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
    backgroundColor: '#18191C',
    paddingTop: 8,
    paddingBottom: 14,
    borderTopColor: '#35373D',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  activeTab: {
    borderTopColor: '#F2F3F5',
    borderTopWidth: 3,
    marginTop: -3,
  },
  icon: {
    color: '#8D939E',
    fontSize: 20,
  },
  label: {
    color: '#8D939E',
    fontWeight: '600',
    fontSize: 15,
  },
  activeText: {
    color: '#F2F3F5',
  },
})
