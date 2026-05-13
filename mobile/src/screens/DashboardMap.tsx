import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MockStreetPhoto } from "../components/MockStreetPhoto";
import {
  ALL_CATEGORY_IDS,
  CATEGORY_CONFIG,
  DISTRICT_CENTERS,
  MOCK_MAP_REPORTS,
  MapReport,
  MapReportCategoryId,
} from "../data/mockMapReports";

// ── Palette (matches DashboardScreen) ──────────────────────────────────────
const D = {
  bg: "#18191C",
  surface: "#222428",
  surfaceHigh: "#2C2D32",
  border: "#35373D",
  text1: "#F2F3F5",
  text2: "#8D939E",
  text3: "#55595F",
  green: "#3ECF82",
  amber: "#F0A030",
  red: "#E8514A",
} as const;

// ── Dark map style for Android (Google Maps) ───────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8d9199" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2d32" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#17181c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a3c45" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f2f3f5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d1b2a" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1e2028" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1a2e1a" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#35373d" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#222428" }],
  },
];

// ── Time-ago helper — only returns a value for reports within the last 24h ──
function timeAgo(date: Date): string | null {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return null; // future-dated reports (e.g. device clock skew)
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return null; // ≥24h: no badge
}

// ── JS clustering ───────────────────────────────────────────────────────────
type ClusterSingle = { kind: "single"; report: MapReport };
type ClusterGroup = {
  kind: "cluster";
  count: number;
  lat: number;
  lon: number;
};
type ClusteredItem = ClusterSingle | ClusterGroup;

function clusterReports(
  reports: MapReport[],
  latDelta: number,
): ClusteredItem[] {
  // epsilon ≈ cluster radius in degrees; shrinks as user zooms in
  const epsilon = Math.max(0.0005, latDelta / 8);
  const buckets = new Map<string, MapReport[]>();

  for (const r of reports) {
    const key = `${Math.round(r.lat / epsilon)},${Math.round(r.lon / epsilon)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  const result: ClusteredItem[] = [];
  for (const group of buckets.values()) {
    if (group.length === 1) {
      result.push({ kind: "single", report: group[0] });
    } else {
      const lat = group.reduce((s, r) => s + r.lat, 0) / group.length;
      const lon = group.reduce((s, r) => s + r.lon, 0) / group.length;
      result.push({ kind: "cluster", count: group.length, lat, lon });
    }
  }
  return result;
}

// ── Individual report marker ─────────────────────────────────────────────────
const ReportMarker = ({
  report,
  onPress,
  showTimeBadge,
}: {
  report: MapReport;
  onPress: () => void;
  showTimeBadge: boolean;
}) => {
  const cat = CATEGORY_CONFIG[report.categoryId];
  const ago = timeAgo(report.createdAt);
  return (
    <Pressable onPress={onPress} style={ms.markerWrap} hitSlop={8}>
      {showTimeBadge && ago && (
        <View style={ms.timeBadge}>
          <View style={ms.timeDot} />
          <Text style={ms.timeText}>{ago}</Text>
        </View>
      )}
      <View style={[ms.markerBody, { backgroundColor: cat.color }]}>
        <MaterialCommunityIcons name={cat.icon as any} size={16} color="#fff" />
      </View>
      <View style={[ms.markerTail, { borderTopColor: cat.color }]} />
    </Pressable>
  );
};

// ── Cluster marker ────────────────────────────────────────────────────────────
const ClusterMarkerView = ({ count }: { count: number }) => (
  <View style={ms.cluster}>
    <View style={ms.clusterInner}>
      <Text style={ms.clusterCount}>{count}</Text>
    </View>
  </View>
);

// ── Preview card ──────────────────────────────────────────────────────────────
const PreviewCard = ({
  report,
  onTap,
}: {
  report: MapReport;
  onTap: () => void;
}) => {
  const slideY = useRef(new Animated.Value(160)).current;
  const statusColor =
    report.status === "Closed"
      ? "#065F46"
      : report.status === "In Progress"
        ? "#78350F"
        : "#1D4ED8";
  const statusBg =
    report.status === "Closed"
      ? "#BBF7D0"
      : report.status === "In Progress"
        ? "#FDE68A"
        : "#DBEAFE";

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[pc.card, { transform: [{ translateY: slideY }] }]}>
      <Pressable style={pc.inner} onPress={onTap} accessibilityRole="button">
        <View style={pc.photo}>
          <MockStreetPhoto style={StyleSheet.absoluteFillObject} />
          <View style={pc.photoOverlay} />
        </View>
        <View style={pc.body}>
          <Text style={pc.title} numberOfLines={1}>
            {report.title}
          </Text>
          <Text style={pc.addr} numberOfLines={1}>
            {report.address}
          </Text>
          <View style={pc.meta}>
            <View style={[pc.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[pc.statusText, { color: statusColor }]}>
                {report.status}
              </Text>
            </View>
            <Text style={pc.time}>
              {(() => {
                const ago = timeAgo(report.createdAt);
                if (ago) return ago;
                return report.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              })()}
            </Text>
          </View>
        </View>
        <Text style={pc.chevron}>›</Text>
      </Pressable>
    </Animated.View>
  );
};

// ── Category filter bar ───────────────────────────────────────────────────────
const FilterBar = ({
  active,
  onSelect,
}: {
  active: MapReportCategoryId | "all";
  onSelect: (id: MapReportCategoryId | "all") => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={fb.row}
    style={fb.bar}
  >
    <Pressable
      style={[fb.pill, active === "all" && fb.pillActiveAll]}
      onPress={() => onSelect("all")}
      accessibilityRole="button"
    >
      <Text style={[fb.label, active === "all" && fb.labelActive]}>All</Text>
    </Pressable>

    {ALL_CATEGORY_IDS.map((id) => {
      const cat = CATEGORY_CONFIG[id];
      const isOn = active === id;
      return (
        <Pressable
          key={id}
          style={[
            fb.pill,
            isOn && {
              borderColor: cat.color + "55",
              backgroundColor: cat.color + "18",
            },
          ]}
          onPress={() => onSelect(id)}
          accessibilityRole="radio"
          accessibilityState={{ selected: isOn }}
        >
          <MaterialCommunityIcons
            name={cat.icon as any}
            size={13}
            color={isOn ? cat.color : D.text3}
          />
          <Text style={[fb.label, isOn && { color: cat.color }]}>
            {cat.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  district: number;
  onViewReport: (report: MapReport) => void;
};

// Card dimensions for pin-adjacent positioning
const CARD_W = 252;
const CARD_H = 92; // estimated rendered height (photo 68 + padding 24)
const PIN_H = 50; // approx px from anchor point (tail tip) to top of circle

export const DashboardMap = ({ district, onViewReport }: Props) => {
  const [activeFilter, setActiveFilter] = useState<MapReportCategoryId | "all">(
    "all",
  );
  const [hovered, setHovered] = useState<MapReport | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [latDelta, setLatDelta] = useState(0.04);
  const containerSize = useRef({ width: 390, height: 700 });

  const center = DISTRICT_CENTERS[district] ?? DISTRICT_CENTERS[3];

  const filtered = useMemo(
    () =>
      MOCK_MAP_REPORTS.filter(
        (r) =>
          r.district === district &&
          (activeFilter === "all" || r.categoryId === activeFilter),
      ),
    [district, activeFilter],
  );

  const clustered = useMemo(
    () => clusterReports(filtered, latDelta),
    [filtered, latDelta],
  )

  const recentIds = useMemo(() => {
    const withAgo = filtered.filter(r => timeAgo(r.createdAt) !== null)
    withAgo.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return new Set(withAgo.slice(0, 3).map(r => r.id))
  }, [filtered]);

  const handleRegionChange = (region: Region) => {
    const newDelta = region.latitudeDelta;
    setLatDelta(newDelta);

    if (newDelta < 0.018) {
      const threshold = newDelta * 0.35;
      let nearest: MapReport | null = null;
      let minDist = Infinity;
      for (const r of filtered) {
        const d = Math.hypot(r.lat - region.latitude, r.lon - region.longitude);
        if (d < threshold && d < minDist) {
          minDist = d;
          nearest = r;
        }
      }
      setHovered(nearest);
      if (nearest) {
        // Project lat/lon → screen pixels using linear map projection
        const { width: W, height: H } = containerSize.current;
        const pinX =
          W / 2 +
          ((nearest.lon - region.longitude) / region.longitudeDelta) * W;
        const pinY =
          H / 2 - ((nearest.lat - region.latitude) / region.latitudeDelta) * H;
        setCardPos({ x: pinX, y: pinY });
      } else {
        setCardPos(null);
      }
    } else {
      setHovered(null);
      setCardPos(null);
    }
  };

  return (
    <View
      style={s.container}
      onLayout={(e) => {
        containerSize.current = {
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        };
      }}
    >
      <MapView
        style={StyleSheet.absoluteFillObject}
        userInterfaceStyle="dark"
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: latDelta,
          longitudeDelta: latDelta,
        }}
        onRegionChangeComplete={handleRegionChange}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
      >
        {clustered.map((item, i) => {
          if (item.kind === "cluster") {
            return (
              <Marker
                key={`cluster-${i}`}
                coordinate={{ latitude: item.lat, longitude: item.lon }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <ClusterMarkerView count={item.count} />
              </Marker>
            );
          }
          const r = item.report;
          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.lat, longitude: r.lon }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              <ReportMarker report={r} onPress={() => onViewReport(r)} showTimeBadge={recentIds.has(r.id)} />
            </Marker>
          );
        })}
      </MapView>

      {/* Top-right badge */}
      <View style={s.countBadge} pointerEvents="none">
        <Text style={s.countText}>📍 {filtered.length} unresolved reports · via CityFix</Text>
      </View>

      {/* Category filter bar */}
      <View style={s.filterWrap}>
        <FilterBar active={activeFilter} onSelect={setActiveFilter} />
      </View>

      {/* Proximity preview card — floats above the nearest pin */}
      {hovered &&
        cardPos &&
        (() => {
          const { width: W } = containerSize.current;
          const left = Math.max(
            8,
            Math.min(cardPos.x - CARD_W / 2, W - CARD_W - 8),
          );
          const top = Math.max(8, cardPos.y - PIN_H - CARD_H - 8);
          return (
            <View
              key={hovered.id}
              style={[s.floatingCard, { left, top, width: CARD_W }]}
              pointerEvents="box-none"
            >
              <PreviewCard
                report={hovered}
                onTap={() => onViewReport(hovered)}
              />
            </View>
          );
        })()}
    </View>
  );
};

// ── Marker styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  markerWrap: { alignItems: "center" },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(20,20,24,0.88)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 4,
  },
  timeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#E8514A" },
  timeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  markerBody: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  cluster: { alignItems: "center", justifyContent: "center" },
  clusterInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(91,155,248,0.9)",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  clusterCount: { color: "#fff", fontSize: 13, fontWeight: "800" },
});

// ── Preview card styles ───────────────────────────────────────────────────────
const pc = StyleSheet.create({
  card: {
    backgroundColor: D.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inner: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#111",
    flexShrink: 0,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  body: { flex: 1, gap: 3 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  title: { color: D.text1, fontSize: 15, fontWeight: "700" },
  addr: { color: D.text2, fontSize: 12 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: "700" },
  time: { color: D.text2, fontSize: 11 },
  chevron: { color: D.text3, fontSize: 22, fontWeight: "300" },
});

// ── Filter bar styles ─────────────────────────────────────────────────────────
const fb = StyleSheet.create({
  bar: { flexGrow: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: D.border,
    backgroundColor: D.surface,
  },
  pillActiveAll: { backgroundColor: D.text1, borderColor: D.text1 },
  label: { color: D.text2, fontSize: 12, fontWeight: "600" },
  labelActive: { color: D.bg },
});

// ── Container styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  countBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(20,20,24,0.82)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  filterWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(24,25,28,0.92)",
  },
  floatingCard: { position: "absolute" },
});
