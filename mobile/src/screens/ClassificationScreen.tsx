import { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MiniMapView } from "../components/MiniMapView";
import { MockStreetPhoto } from "../components/MockStreetPhoto";
import { T } from "../theme";

const CATEGORIES = [
  "Roads & Infrastructure",
  "Public Transit",
  "Buildings & Facilities",
  "Parks & Recreation",
  "Utilities",
];

const TAGS_BY_CATEGORY: Record<string, string[]> = {
  "Roads & Infrastructure": [
    "Pothole",
    "Cracked Road",
    "Missing Sign",
    "Broken Curb",
    "Flooding",
  ],
  "Public Transit": [
    "Bus Stop Damage",
    "Missing Shelter",
    "Broken Bench",
    "Graffiti",
  ],
  "Buildings & Facilities": [
    "Graffiti",
    "Broken Door",
    "Lighting Out",
    "Vandalism",
  ],
  "Parks & Recreation": ["Broken Equipment", "Graffiti", "Dead Tree", "Litter"],
  Utilities: [
    "Light Out",
    "Downed Wire",
    "Water Main Break",
    "Leaking Hydrant",
  ],
};

const DEPT_BY_CATEGORY: Record<string, { name: string; division: string }> = {
  "Roads & Infrastructure": {
    name: "San Jose Dept. of Transportation",
    division: "Street Maintenance Division · 311",
  },
  "Public Transit": {
    name: "Transportation Authority",
    division: "Transit Operations · 311",
  },
  "Buildings & Facilities": {
    name: "Parks & Recreation Dept.",
    division: "Beautification Division · 311",
  },
  "Parks & Recreation": {
    name: "Parks & Recreation Dept.",
    division: "Maintenance Division · 311",
  },
  Utilities: {
    name: "Dept. of Public Works",
    division: "Electrical Services · 311",
  },
};

export type Classification = {
  category: string;
  tag: string;
  desc: string;
};

type ClassificationScreenProps = {
  onBack: () => void;
  onConfirm: (c: Classification) => void;
};

export const ClassificationScreen = ({
  onBack,
  onConfirm,
}: ClassificationScreenProps) => {
  const [category, setCategory] = useState("Roads & Infrastructure");
  const [tag, setTag] = useState("Pothole");
  const [desc, setDesc] = useState(
    "Significant pothole on Willow St near Lincoln Ave causing road hazard. Approximately 2ft wide with visible asphalt damage.",
  );
  const [showTagMenu, setShowTagMenu] = useState(false);

  const pinAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pinAnim.x, dy: pinAnim.y }],
        { useNativeDriver: false },
      ),
    }),
  ).current;

  const handleTagSelect = (t: string) => {
    setTag(t);
    // update category based on selected tag
    for (const [cat, tags] of Object.entries(TAGS_BY_CATEGORY)) {
      if (tags.includes(t)) {
        setCategory(cat);
        break;
      }
    }
    setShowTagMenu(false);
  };

  const dept =
    DEPT_BY_CATEGORY[category] ?? DEPT_BY_CATEGORY["Roads & Infrastructure"];

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Confirm &amp; submit</Text>
          <Text style={styles.headerSubtitle}>Review details, then send</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo thumbnail */}
        <View style={styles.photoStrip}>
          <MockStreetPhoto style={StyleSheet.absoluteFillObject} />
          <View style={styles.categoryChip}>
            <View style={styles.categoryDot} />
            <Text style={styles.categoryChipText}>{category}</Text>
          </View>
        </View>

        {/* Classification card */}
        <View style={styles.card}>
          {/* Category — read-only */}
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>CATEGORY</Text>
            <Text style={styles.rowValue}>{category}</Text>
          </View>

          {/* Issue type — dropdown */}
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>ISSUE TYPE</Text>
            <Pressable
              onPress={() => setShowTagMenu((v) => !v)}
              style={styles.selector}
              accessibilityRole="button"
            >
              <Text style={styles.selectorText}>{tag}</Text>
              <Text style={styles.selectorChevron}>⌄</Text>
            </Pressable>
            {showTagMenu && (
              <View style={styles.dropdown}>
                {(TAGS_BY_CATEGORY[category] ?? []).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => handleTagSelect(t)}
                    style={[
                      styles.dropdownItem,
                      t === tag && styles.dropdownItemActive,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        t === tag && styles.dropdownItemTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Description — editable */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>DESCRIPTION</Text>
            <TextInput
              multiline
              value={desc}
              onChangeText={setDesc}
              style={styles.descInput}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Location card */}
        <View style={styles.card}>
          <View style={[styles.locationHeader, styles.rowBorder]}>
            <Text style={styles.rowLabel}>LOCATION</Text>
            <View style={styles.gpsBadge}>
              <Text style={styles.gpsPin}>📍</Text>
              <Text style={styles.gpsBadgeText}>GPS auto-detected</Text>
            </View>
          </View>

          {/* Mini map with draggable pin overlay */}
          <View style={styles.mapArea}>
            <MiniMapView style={StyleSheet.absoluteFillObject} />
            {/* Draggable pin — Animated.View so Animated.Value works */}
            <Animated.View
              style={[
                styles.draggablePin,
                { transform: pinAnim.getTranslateTransform() },
              ]}
              {...panResponder.panHandlers}
            >
              <Text style={styles.draggablePinText}>📍</Text>
            </Animated.View>
            <View style={styles.mapHint} pointerEvents="none">
              <Text style={styles.mapHintText}>Drag pin to move</Text>
            </View>
          </View>

          {/* Address row */}
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Text>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressMain}>
                Willow St &amp; Lincoln Ave
              </Text>
              <Text style={styles.addressSub}>San Jose, CA 95125</Text>
            </View>
            <Pressable accessibilityRole="button">
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Routing info */}
        <View style={styles.routingCard}>
          <Text style={styles.routingLabel}>WILL BE ROUTED TO</Text>
          <Text style={styles.routingName}>{dept.name}</Text>
          <Text style={styles.routingDiv}>{dept.division}</Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <Pressable
          onPress={() => onConfirm({ category, tag, desc })}
          style={styles.submitButton}
          accessibilityRole="button"
        >
          <Text style={styles.submitCheck}>✓</Text>
          <Text style={styles.submitText}>Confirm &amp; submit</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.cream },

  header: {
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: { padding: 4, marginLeft: -4 },
  backIcon: { fontSize: 28, color: T.ink2, lineHeight: 30, fontWeight: "300" },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: T.ink },
  headerSubtitle: { fontSize: 12, color: T.ink3, marginTop: 1 },

  scroll: { padding: 14, gap: 10, paddingBottom: 24 },

  photoStrip: {
    height: 120,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  categoryChip: {
    position: "absolute",
    bottom: 10,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fbbf24",
  },
  categoryChipText: { color: "white", fontSize: 11, fontWeight: "600" },

  card: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "visible",
  },

  row: { paddingHorizontal: 14, paddingVertical: 13, gap: 5 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  rowLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: T.ink3,
    letterSpacing: 0.5,
  },
  rowValue: { fontSize: 15, fontWeight: "600", color: T.ink },

  selector: {
    backgroundColor: T.warm,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  selectorText: { fontSize: 14, fontWeight: "600", color: T.ink },
  selectorChevron: { fontSize: 14, color: T.ink3 },

  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: T.white,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  dropdownItemActive: { backgroundColor: T.blueLight },
  dropdownItemText: { fontSize: 14, color: T.ink },
  dropdownItemTextActive: { color: T.blue, fontWeight: "600" },

  descInput: {
    backgroundColor: T.warm,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: T.ink,
    minHeight: 80,
    fontFamily: undefined,
    lineHeight: 22,
    marginTop: 2,
  },

  locationHeader: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpsBadge: {
    backgroundColor: T.greenLight,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.2)",
  },
  gpsPin: { fontSize: 11 },
  gpsBadgeText: { color: T.green, fontSize: 11, fontWeight: "700" },

  mapArea: {
    height: 140,
    overflow: "hidden",
    position: "relative",
  },
  draggablePin: {
    position: "absolute",
    top: "28%",
    left: "33%",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  draggablePinText: { fontSize: 28, lineHeight: 32 },
  mapHint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  mapHintText: { color: "white", fontSize: 10, fontWeight: "500" },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  addressIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: T.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addressMain: { fontSize: 14, fontWeight: "700", color: T.ink },
  addressSub: { fontSize: 12, color: T.ink3, marginTop: 1 },
  editLink: { color: T.blue, fontSize: 12, fontWeight: "600" },

  routingCard: {
    backgroundColor: T.blueLight,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.15)",
    borderRadius: 12,
    padding: 14,
    gap: 3,
  },
  routingLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: T.blue,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routingName: { fontSize: 14, fontWeight: "700", color: T.ink },
  routingDiv: { fontSize: 12, color: T.ink3 },

  ctaBar: {
    padding: 14,
    paddingBottom: 10,
    backgroundColor: T.white,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  submitButton: {
    backgroundColor: T.blue,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitCheck: { color: "white", fontSize: 16, fontWeight: "800" },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },
});
