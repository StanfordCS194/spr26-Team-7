import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native'
import MapView, { Marker, Region } from 'react-native-maps'
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg'
import {
  ALL_CATEGORY_IDS, CATEGORY_CONFIG, DISTRICT_CENTERS,
  MapReport, MapReportCategoryId, MapReportStatus,
} from '../data/mockMapReports'
import { fetchAllMapReports } from '../lib/mapReports'
import { SampleIssueImage as SampleIssueImageData } from '../types'
import { SampleIssueImage } from '../components/SampleIssueImage'

// ── Palette ────────────────────────────────────────────────────────────────────
const D = {
  bg:       '#18191C',
  surface:  '#222428',
  surface2: '#2C2D32',
  line:     '#3A3C42',
  lineSoft: '#313338',
  text:     '#F2F3F5',
  muted:    '#8D939E',
  faint:    '#636870',
  accent:   '#5B9BF8',
  accent2:  '#7EB4F5',
  good:     '#3ECF82',
  warn:     '#F0A030',
  red:      '#E8514A',
} as const

// ── SVG icon paths ─────────────────────────────────────────────────────────────
const ICON_PATH: Record<string, string> = {
  junk:        'M3 6h18M8 6V4.2A1.2 1.2 0 0 1 9.2 3h5.6A1.2 1.2 0 0 1 16 4.2V6M6 6l.9 13.2A1.6 1.6 0 0 0 8.5 21h7A1.6 1.6 0 0 0 17.1 19.2L18 6',
  graffiti:    'M9 11V5.5a1.5 1.5 0 0 1 1.5-1.5H12M7 11h6v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM14 4l1.5 1M15.5 7l1.8.3M15 10l1.7-.6',
  dumping:     'M4 8h16l-1.2 11.2A1.8 1.8 0 0 1 17 21H7a1.8 1.8 0 0 1-1.8-1.8zM9 8V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V8M3 8l3-4M21 8l-3-4M10 12v5M14 12v5',
  pothole:     'M10.3 4.2 2.6 18.1A1.5 1.5 0 0 0 3.9 20.4h16.2a1.5 1.5 0 0 0 1.3-2.3L13.7 4.2a1.6 1.6 0 0 0-3.4 0ZM12 9.5v4.5M12 17v.6',
  light:       'M9.2 17.5h5.6M10 20.5h4M12 3.2a6 6 0 0 0-3.8 10.7c.7.6 1.1 1.3 1.2 2.1h5.2c.1-.8.5-1.5 1.2-2.1A6 6 0 0 0 12 3.2Z',
  streetlight: 'M9.2 17.5h5.6M10 20.5h4M12 3.2a6 6 0 0 0-3.8 10.7c.7.6 1.1 1.3 1.2 2.1h5.2c.1-.8.5-1.5 1.2-2.1A6 6 0 0 0 12 3.2Z',
  vehicle:     'M3.5 13.5 5.3 8.4A2 2 0 0 1 7.2 7h9.6a2 2 0 0 1 1.9 1.4l1.8 5.1M3 13.5h18v3.5a1 1 0 0 1-1 1h-1.5M3 13.5V17a1 1 0 0 0 1 1h1.5M6.5 18a1.5 1.5 0 0 0 3 0M14.5 18a1.5 1.5 0 0 0 3 0',
  encampment:  'M3 19.5 11.4 5a.7.7 0 0 1 1.2 0L21 19.5M12 7.5v12M12 19.5l-4.5-6M12 19.5l4.5-6',
  container:   'M12 3 3.5 7v10L12 21l8.5-4V7zM3.5 7 12 11l8.5-4M12 11v10',
}

// ── Dark map style ─────────────────────────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry',          stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',  stylers: [{ color: '#636870' }] },
  { elementType: 'labels.text.stroke',stylers: [{ color: '#18191C' }] },
  { elementType: 'labels.icon',       stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry',        stylers: [{ color: '#2C2D32' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18191C' }] },
  { featureType: 'road.highway', elementType: 'geometry',stylers: [{ color: '#3A3C42' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8D939E' }] },
  { featureType: 'water',  elementType: 'geometry',      stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'poi',    elementType: 'geometry',      stylers: [{ color: '#1E2028' }] },
  { featureType: 'poi.park',elementType: 'geometry',     stylers: [{ color: '#1c2a1c' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#35373D' }] },
  { featureType: 'transit',elementType: 'geometry',      stylers: [{ color: '#222428' }] },
]

// ── Filter options ─────────────────────────────────────────────────────────────
type TimeFilterId   = 'last24h' | 'week' | 'month' | 'alltime'
type StatusFilterId = 'unresolved' | 'resolved' | 'all'

const TIME_OPTS: { id: TimeFilterId; label: string; maxAgeMs: number }[] = [
  { id: 'last24h', label: 'Last 24h',    maxAgeMs: 24 * 3_600_000 },
  { id: 'week',    label: 'This Week',   maxAgeMs: 7 * 24 * 3_600_000 },
  { id: 'month',   label: 'This Month',  maxAgeMs: 30 * 24 * 3_600_000 },
  { id: 'alltime', label: 'All Time',    maxAgeMs: Infinity },
]
const STATUS_OPTS: { id: StatusFilterId; label: string }[] = [
  { id: 'unresolved', label: 'Unresolved' },
  { id: 'resolved',   label: 'Resolved'   },
  { id: 'all',        label: 'All'         },
]

// ── Cluster types ──────────────────────────────────────────────────────────────
type ClusterSingle = { kind: 'single'; report: MapReport }
type ClusterGroup  = { kind: 'cluster'; count: number; lat: number; lon: number; dominantCat: MapReportCategoryId }
type ClusteredItem = ClusterSingle | ClusterGroup

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(date: Date): string | null {
  const ms = Date.now() - date.getTime()
  if (ms < 0) return null
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return null
}

function isUnresolved(status: MapReportStatus) { return status !== 'Closed' }

function clusterReports(reports: MapReport[], latDelta: number): ClusteredItem[] {
  const epsilon = Math.max(0.0005, latDelta / 8)
  const buckets = new Map<string, MapReport[]>()
  for (const r of reports) {
    const key = `${Math.round(r.lat / epsilon)},${Math.round(r.lon / epsilon)}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(r)
  }
  const result: ClusteredItem[] = []
  for (const group of buckets.values()) {
    if (group.length === 1) {
      result.push({ kind: 'single', report: group[0] })
    } else {
      const lat = group.reduce((s, r) => s + r.lat, 0) / group.length
      const lon = group.reduce((s, r) => s + r.lon, 0) / group.length
      const catCount: Partial<Record<MapReportCategoryId, number>> = {}
      for (const r of group) catCount[r.categoryId] = (catCount[r.categoryId] ?? 0) + 1
      const dominantCat = (Object.entries(catCount).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]) as MapReportCategoryId
      result.push({ kind: 'cluster', count: group.length, lat, lon, dominantCat })
    }
  }
  return result
}

// ── DiagonalStripePlaceholder ─────────────────────────────────────────────────
function PhotoPlaceholder({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1A1B1F', borderWidth: 1, borderColor: '#313338', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <Pattern id="diag" patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(135)">
            <Rect width={12} height={12} fill="#242528" />
            <Rect y={0} width={12} height={6} fill="#1E1F22" />
          </Pattern>
        </Defs>
        <Rect width={size} height={size} fill="url(#diag)" />
      </Svg>
      <Text style={{ color: '#636870', fontSize: 8, fontWeight: '600', letterSpacing: 1, zIndex: 1 }}>PHOTO</Text>
    </View>
  )
}

// ── PulseRing ──────────────────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] })
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.35, 0] })
  return (
    <Animated.View style={[
      ms.pulseRing, { borderColor: color, transform: [{ scale }], opacity },
    ]} />
  )
}

// ── ReportMarkerView ───────────────────────────────────────────────────────────
const BADGE_H  = 26
const BADGE_GAP = 5
const DOT_SIZE  = 34

const ReportMarkerView = ({
  report, isActive, isRecent, showTimeBadge,
}: {
  report: MapReport; isActive: boolean; isRecent: boolean; showTimeBadge: boolean
}) => {
  const cat   = CATEGORY_CONFIG[report.categoryId]
  const ago   = timeAgo(report.createdAt)
  const hasBadge = showTimeBadge && ago != null
  const iconD = ICON_PATH[report.categoryId] ?? ''
  return (
    <View style={{ alignItems: 'center' }}>
      {hasBadge ? (
        <View style={ms.timeBadge}>
          <View style={ms.timeDot} />
          <Text style={ms.timeText}>{ago}</Text>
        </View>
      ) : (
        <View style={{ height: BADGE_H + BADGE_GAP }} />
      )}
      <View style={{ width: DOT_SIZE, height: DOT_SIZE }}>
        {isRecent && <PulseRing color={cat.color} />}
        <View style={[ms.dot, {
          backgroundColor: isActive ? cat.color : '#1A1B1F',
          borderColor: cat.color,
        }]}>
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path
              d={iconD}
              stroke={isActive ? '#18191C' : cat.color}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
    </View>
  )
}

// ── ClusterMarkerView ──────────────────────────────────────────────────────────
const ClusterMarkerView = ({ count, dominantCat }: { count: number; dominantCat: MapReportCategoryId }) => {
  const cat = CATEGORY_CONFIG[dominantCat]
  const col = cat.color
  return (
    <View style={[ms.cluster, {
      backgroundColor: 'rgba(16,17,21,0.88)',
      borderColor:     col + 'BB',
    }]}>
      <View style={[ms.clusterDot, { backgroundColor: col }]} />
      <Text style={[ms.clusterText, { color: D.text }]}>
        {count}
        <Text style={[ms.clusterSep, { color: D.muted }]}> · </Text>
        <Text style={{ color: col, fontWeight: '500' }}>{cat.label}</Text>
      </Text>
    </View>
  )
}

// ── PreviewCard ────────────────────────────────────────────────────────────────
const PreviewCard = ({
  report, image, onTap,
}: {
  report: MapReport; image?: SampleIssueImageData | null; onTap: () => void
}) => {
  const slideY = useRef(new Animated.Value(20)).current
  const ago    = timeAgo(report.createdAt) ?? report.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start()
  }, [report.id])

  const statusIsResolved = report.status === 'Closed'
  const statusLabel  = statusIsResolved ? 'Resolved' : 'Unresolved'
  const statusColor  = statusIsResolved ? D.good : D.warn
  const statusBg     = statusIsResolved ? D.good + '28' : D.warn + '28'

  return (
    <Animated.View style={[pc.card, { transform: [{ translateY: slideY }] }]}>
      <Pressable style={pc.top} onPress={onTap}>
        {image
          ? <SampleIssueImage image={image} style={{ width: 64, height: 64, borderRadius: 10 }} />
          : <PhotoPlaceholder size={64} />
        }
        <View style={pc.info}>
          <Text style={pc.type} numberOfLines={1}>{report.title.split(' at ')[0]}</Text>
          <Text style={pc.loc}  numberOfLines={2}>{report.address.replace(', San Jose, CA', '').replace(', San José, CA', '')}</Text>
          <View style={pc.meta}>
            <View style={[pc.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[pc.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={pc.time}>{ago}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ── FilterDropdown ─────────────────────────────────────────────────────────────
function FilterDropdown<T extends string>({
  options, selected, onSelect, style,
}: {
  options: { id: T; label: string }[]
  selected: T
  onSelect: (id: T) => void
  style?: object
}) {
  return (
    <View style={[fd.menu, style]}>
      {options.map(opt => (
        <Pressable
          key={opt.id}
          style={[fd.row, opt.id === selected && fd.rowSel]}
          onPress={() => onSelect(opt.id)}
        >
          <Text style={[fd.label, opt.id === selected && fd.labelSel]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

// ── Category filter bar ────────────────────────────────────────────────────────
function CategoryBar({
  active, onSelect,
}: {
  active: MapReportCategoryId | 'all'
  onSelect: (id: MapReportCategoryId | 'all') => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cb.row} style={cb.scroll}>
      <Pressable style={[cb.pill, active === 'all' && cb.pillAll]} onPress={() => onSelect('all')}>
        <Text style={[cb.label, active === 'all' && cb.labelAll]}>All</Text>
      </Pressable>
      {ALL_CATEGORY_IDS.map(id => {
        const cat = CATEGORY_CONFIG[id]
        const on  = active === id
        return (
          <Pressable
            key={id}
            style={[cb.pill, on && { backgroundColor: cat.color + '28', borderColor: cat.color + '88' }]}
            onPress={() => onSelect(id)}
          >
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d={ICON_PATH[id] ?? ''}
                stroke={on ? cat.color : D.faint}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[cb.label, on && { color: cat.color }]}>{cat.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
type Props = {
  district: number
  onViewReport: (report: MapReport) => void
  extraReports?: MapReport[]
  focusReport?: MapReport | null
  onFocusConsumed?: () => void
  reportImages?: Record<string, SampleIssueImageData>
}

const CARD_W  = 252
const CARD_H  = 96
const FILTER_H = 116

const ANCHOR_Y_WITH_BADGE    = (BADGE_H + BADGE_GAP + DOT_SIZE / 2) / (BADGE_H + BADGE_GAP + DOT_SIZE)
const MARKER_ANCHOR = { x: 0.5, y: ANCHOR_Y_WITH_BADGE }

export const DashboardMap = ({ district, onViewReport, extraReports, focusReport, onFocusConsumed, reportImages }: Props) => {
  const mapRef       = useRef<MapView>(null)
  const currentRegion= useRef<Region>({
    latitude: DISTRICT_CENTERS[district]?.latitude  ?? 37.338,
    longitude: DISTRICT_CENTERS[district]?.longitude ?? -121.886,
    latitudeDelta: 0.04, longitudeDelta: 0.04,
  })
  const containerSize = useRef({ width: 390, height: 700 })

  const [dbReports,     setDbReports]     = useState<MapReport[]>([])
  const [latDelta,      setLatDelta]      = useState(0.04)
  const [catFilter,     setCatFilter]     = useState<MapReportCategoryId | 'all'>('all')
  const [timeFilter,    setTimeFilter]    = useState<TimeFilterId>('alltime')
  const [statusFilter,  setStatusFilter]  = useState<StatusFilterId>('unresolved')
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [cardPos,       setCardPos]       = useState<{ x: number; y: number } | null>(null)
  const [timeMenuOpen,  setTimeMenuOpen]  = useState(false)
  const [statMenuOpen,  setStatMenuOpen]  = useState(false)

  const center = DISTRICT_CENTERS[district] ?? DISTRICT_CENTERS[3]

  useEffect(() => {
    fetchAllMapReports()
      .then(setDbReports)
      .catch(err => console.error('[map] fetch failed', err))
  }, [])

  useEffect(() => {
    if (!focusReport) return
    mapRef.current?.animateToRegion({
      latitude: focusReport.lat,
      longitude: focusReport.lon,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    }, 800)
    onFocusConsumed?.()
  }, [focusReport])

  const allReports = useMemo(() => {
    const dbIds = new Set(dbReports.map(r => r.id))
    const deduped = (extraReports ?? []).filter(r => !dbIds.has(r.id))
    return [...dbReports, ...deduped]
  }, [dbReports, extraReports])

  const filtered = useMemo(() => {
    const now      = Date.now()
    const maxAgeMs = TIME_OPTS.find(o => o.id === timeFilter)!.maxAgeMs
    return allReports.filter(r => {
      if (r.district !== district) return false
      if (catFilter !== 'all' && r.categoryId !== catFilter) return false
      if (statusFilter === 'unresolved' && !isUnresolved(r.status)) return false
      if (statusFilter === 'resolved'   &&  isUnresolved(r.status)) return false
      if (now - r.createdAt.getTime() > maxAgeMs) return false
      return true
    })
  }, [allReports, district, catFilter, timeFilter, statusFilter])

  const clustered = useMemo(() => clusterReports(filtered, latDelta), [filtered, latDelta])

  const recentIds = useMemo(() => {
    const withAgo = filtered.filter(r => timeAgo(r.createdAt) !== null)
    withAgo.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return new Set(withAgo.slice(0, 3).map(r => r.id))
  }, [filtered])

  const unresolvedTotal = useMemo(
    () => allReports.filter(r => r.district === district && isUnresolved(r.status)).length,
    [allReports, district],
  )

  const selectedReport = useMemo(
    () => filtered.find(r => r.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const closeMenus = () => { setTimeMenuOpen(false); setStatMenuOpen(false) }

  const handlePinTap = (report: MapReport) => {
    closeMenus()
    setSelectedId(null)
    setCardPos(null)
    onViewReport(report)
  }

  const cardLayout = useMemo(() => {
    if (!cardPos) return null
    const { width: W } = containerSize.current
    const left = Math.max(8, Math.min(cardPos.x - CARD_W / 2, W - CARD_W - 8))
    const pinY = cardPos.y
    const filterAreaTop = containerSize.current.height - FILTER_H
    const above = pinY > CARD_H + 60 && pinY < filterAreaTop - 20
    const top   = above ? pinY - CARD_H - 30 : pinY + 28
    return { left, top }
  }, [cardPos])

  const handleRegionChange = (region: Region) => {
    currentRegion.current = region
    setLatDelta(region.latitudeDelta)
    const { width: W, height: H } = containerSize.current

    if (region.latitudeDelta < 0.018) {
      const threshold = region.latitudeDelta * 0.35
      let nearest: MapReport | null = null
      let minDist = Infinity
      for (const r of filtered) {
        const d = Math.hypot(r.lat - region.latitude, r.lon - region.longitude)
        if (d < threshold && d < minDist) { minDist = d; nearest = r }
      }
      if (nearest) {
        setSelectedId(nearest.id)
        const pinX = W / 2 + ((nearest.lon - region.longitude) / region.longitudeDelta) * W
        const pinY = H / 2 - ((nearest.lat - region.latitude) / region.latitudeDelta) * H
        setCardPos({ x: pinX, y: pinY })
      } else {
        setSelectedId(null); setCardPos(null)
      }
    } else {
      setSelectedId(null); setCardPos(null)
    }
  }

  const handleRecenter = () => {
    mapRef.current?.animateToRegion({
      latitude: center.latitude, longitude: center.longitude,
      latitudeDelta: 0.04, longitudeDelta: 0.04,
    }, 400)
  }

  const timeLabel   = TIME_OPTS.find(o => o.id === timeFilter)!.label
  const statusLabel = STATUS_OPTS.find(o => o.id === statusFilter)!.label
  const isDefault   = catFilter === 'all' && timeFilter === 'alltime' && statusFilter === 'unresolved'

  return (
    <View
      style={s.container}
      onLayout={e => { containerSize.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height } }}
    >
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        userInterfaceStyle="dark"
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={currentRegion.current}
        onRegionChangeComplete={handleRegionChange}
        onPress={() => { setSelectedId(null); setCardPos(null); closeMenus() }}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
      >
        {clustered.map((item, i) => {
          if (item.kind === 'cluster') {
            return (
              <Marker
                key={`cl-${i}`}
                coordinate={{ latitude: item.lat, longitude: item.lon }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <ClusterMarkerView count={item.count} dominantCat={item.dominantCat} />
              </Marker>
            )
          }
          const r = item.report
          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.lat, longitude: r.lon }}
              anchor={MARKER_ANCHOR}
              tracksViewChanges={recentIds.has(r.id)}
              onPress={() => handlePinTap(r)}
            >
              <ReportMarkerView
                report={r}
                isActive={selectedId === r.id}
                isRecent={recentIds.has(r.id)}
                showTimeBadge={recentIds.has(r.id)}
              />
            </Marker>
          )
        })}
      </MapView>

      {/* ── Count badge ── */}
      <View style={s.countBadge} pointerEvents="none">
        <View style={s.countDot} />
        <Text style={s.countText}>{unresolvedTotal} unresolved</Text>
        <Text style={s.countVia}> · via CityFix</Text>
      </View>

      {/* ── Recenter button ── */}
      <Pressable style={s.recenter} onPress={handleRecenter}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" stroke={D.text} strokeWidth={1.8} />
          <Path d="M12 2.5v3.5M12 18v3.5M2.5 12h3.5M18 12h3.5" stroke={D.text} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      </Pressable>

      {/* ── Floating preview card ── */}
      {selectedReport && cardLayout && (
        <View
          key={selectedReport.id}
          style={[s.floatingCard, { left: cardLayout.left, top: cardLayout.top, width: CARD_W }]}
          pointerEvents="box-none"
        >
          <PreviewCard
            report={selectedReport}
            image={reportImages?.[selectedReport.id]}
            onTap={() => onViewReport(selectedReport)}
          />
        </View>
      )}

      {/* ── Filter area ── */}
      <View style={s.filterArea}>
        {/* ── Time dropdown ── */}
        {timeMenuOpen && (
          <FilterDropdown
            options={TIME_OPTS}
            selected={timeFilter}
            onSelect={id => { setTimeFilter(id); setTimeMenuOpen(false) }}
            style={{ bottom: '100%', left: 14, marginBottom: 8 }}
          />
        )}
        {/* ── Status dropdown ── */}
        {statMenuOpen && (
          <FilterDropdown
            options={STATUS_OPTS}
            selected={statusFilter}
            onSelect={id => { setStatusFilter(id); setStatMenuOpen(false) }}
            style={{ bottom: '100%', left: 148, marginBottom: 8 }}
          />
        )}
        <View style={s.filterRow}>
          <Pressable
            style={s.fpill}
            onPress={() => { setTimeMenuOpen(v => !v); setStatMenuOpen(false); setSelectedId(null); setCardPos(null) }}
          >
            <Text style={s.fpillKey}>When </Text>
            <Text style={s.fpillVal}>{timeLabel}</Text>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={D.faint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable
            style={s.fpill}
            onPress={() => { setStatMenuOpen(v => !v); setTimeMenuOpen(false); setSelectedId(null); setCardPos(null) }}
          >
            <Text style={s.fpillKey}>Status </Text>
            <Text style={s.fpillVal}>{statusLabel}</Text>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={D.faint} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable
            onPress={() => { setCatFilter('all'); setTimeFilter('alltime'); setStatusFilter('unresolved'); closeMenus() }}
          >
            <Text style={[s.reset, isDefault && s.resetDim]}>Reset</Text>
          </Pressable>
        </View>
        <CategoryBar active={catFilter} onSelect={id => { setCatFilter(id); closeMenus() }} />
      </View>
    </View>
  )
}

// ── Marker styles ──────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,17,22,0.92)',
    borderWidth: 1, borderColor: '#3A3C42',
    borderRadius: 13, paddingHorizontal: 7, paddingVertical: 3,
    marginBottom: BADGE_GAP,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 3,
  },
  timeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8514A', shadowColor: '#E8514A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 3 },
  timeText: { color: '#F2F3F5', fontSize: 10, fontWeight: '600' },
  pulseRing: {
    position: 'absolute', width: DOT_SIZE, height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2, borderWidth: 1.5,
  },
  dot: {
    width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2,
    borderWidth: 1.6, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.55, shadowRadius: 5, elevation: 5,
  },
  cluster: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 11, borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 5,
  },
  clusterDot:  { width: 8, height: 8, borderRadius: 4 },
  clusterText: { fontSize: 12, fontWeight: '600' },
  clusterSep:  { fontSize: 12, fontWeight: '400' },
})

// ── Preview card styles ────────────────────────────────────────────────────────
const pc = StyleSheet.create({
  card: {
    backgroundColor: '#222428', borderRadius: 16,
    borderWidth: 1, borderColor: '#3A3C42',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.65, shadowRadius: 20, elevation: 16,
    padding: 11,
  },
  top:        { flexDirection: 'row', gap: 11 },
  info:       { flex: 1, minWidth: 0 },
  type:       { fontSize: 14.5, fontWeight: '600', color: '#F2F3F5', letterSpacing: -0.1 },
  loc:        { fontSize: 11.5, color: '#636870', marginTop: 2, lineHeight: 15 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
  time:       { fontSize: 11, color: '#8D939E' },
})

// ── Dropdown styles ────────────────────────────────────────────────────────────
const fd = StyleSheet.create({
  menu:     { position: 'absolute', backgroundColor: '#222428', borderWidth: 1, borderColor: '#3A3C42', borderRadius: 12, paddingVertical: 5, minWidth: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 24, zIndex: 50 },
  row:      { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, marginHorizontal: 4 },
  rowSel:   { backgroundColor: '#5B9BF8' },
  label:    { fontSize: 12.5, fontWeight: '600', color: '#8D939E' },
  labelSel: { color: '#fff' },
})

// ── Category bar styles ────────────────────────────────────────────────────────
const cb = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 3, gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18,
    borderWidth: 1, borderColor: '#3A3C42',
    backgroundColor: 'rgba(20,22,28,0.78)',
  },
  pillAll:   { backgroundColor: '#F2F3F5', borderColor: '#F2F3F5' },
  label:     { fontSize: 12.5, fontWeight: '600', color: '#636870' },
  labelAll:  { color: '#18191C' },
})

// ── Container styles ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1 },
  countBadge:  {
    position: 'absolute', top: 12, right: 12, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(16,17,22,0.86)', borderWidth: 1, borderColor: '#3A3C42',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 8,
  },
  countDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8514A', shadowColor: '#E8514A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  countText: { color: '#F2F3F5', fontSize: 11.5, fontWeight: '600' },
  countVia:  { color: '#636870', fontSize: 11.5, fontWeight: '500' },
  recenter: {
    position: 'absolute', right: 14, bottom: FILTER_H + 24, zIndex: 20,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(18,20,26,0.92)', borderWidth: 1, borderColor: '#3A3C42',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  floatingCard: { position: 'absolute', zIndex: 30 },
  filterArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 22,
    gap: 9, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#18191C',
    borderTopWidth: 1, borderTopColor: '#35373D',
  },
  filterRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  fpill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(20,22,28,0.92)', borderWidth: 1, borderColor: '#3A3C42',
    borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 5, elevation: 3,
  },
  fpillKey:  { fontSize: 12.5, fontWeight: '500', color: '#636870' },
  fpillVal:  { fontSize: 12.5, fontWeight: '600', color: '#F2F3F5' },
  reset:     { fontSize: 12.5, fontWeight: '600', color: '#7EB4F5', marginLeft: 'auto', paddingVertical: 8, paddingHorizontal: 4 },
  resetDim:  { color: '#636870' },
})
