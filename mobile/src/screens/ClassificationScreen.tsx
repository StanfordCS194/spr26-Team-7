import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SampleIssueImage } from "../components/SampleIssueImage";
import { MiniMapView } from "../components/MiniMapView";
import { SampleIssueRecord } from "../types";

const SCREEN_HEIGHT = Dimensions.get('window').height;

const TAGS_BY_CATEGORY: Record<string, string[]> = {
  Pothole: [
    "Pothole",
    "Cracked Pavement",
    "Damaged Sidewalk",
    "Broken Curb",
    "Uneven Surface",
  ],
  "Streetlight Outage": [
    "Light Out",
    "Broken Fixture",
    "Flickering Light",
    "Downed Pole",
  ],
  Graffiti: [
    "Public Property",
    "Private Property",
    "Park Facility",
    "Underpass / Bridge",
  ],
  "Illegal Dumping": [
    "Bulk Waste",
    "Construction Debris",
    "Household Items",
    "Hazardous Material",
  ],
  "Vehicle Concerns": [
    "Abandoned Vehicle",
    "Illegally Parked",
    "Stolen Vehicle",
    "Vehicle Parts",
  ],
  "Encampment Concerns": [
    "Public Property",
    "Roadway / Sidewalk",
    "Park",
    "Underpass / Bridge",
  ],
};

const LOCATION_MAIN_LINE = "Glen Eyrie Ave & Carolyn Ave";
const LOCATION_SUB_LINE = "San Jose, CA 95125";

const DEPT_BY_CATEGORY: Record<string, { name: string; division: string }> = {
  Pothole: {
    name: "San Jose Dept. of Transportation",
    division: "Street Maintenance Division · 311",
  },
  "Streetlight Outage": {
    name: "Dept. of Public Works",
    division: "Electrical Services · 311",
  },
  Graffiti: {
    name: "Parks & Recreation Dept.",
    division: "Beautification Division · 311",
  },
  "Illegal Dumping": {
    name: "Environmental Services",
    division: "Solid Waste Division · 311",
  },
  "Vehicle Concerns": {
    name: "San Jose Police Dept.",
    division: "Traffic Division · 311",
  },
  "Encampment Concerns": {
    name: "Dept. of Housing",
    division: "Homelessness Response Team · 311",
  },
};

export type Classification = {
  category: string;
  tag: string;
  desc: string;
  locationMain: string;
  locationSub: string;
};

type ClassificationScreenProps = {
  onBack: () => void;
  onConfirm: (c: Classification) => void;
  selectedSampleIssue?: SampleIssueRecord | null;
};

const CATEGORY_COLOR: Record<string, string> = {
  'Pothole':             '#E8514A',
  'Streetlight Outage':  '#5B9BF8',
  'Graffiti':            '#3ECF82',
  'Illegal Dumping':     '#F0A030',
  'Vehicle Concerns':    '#E8514A',
  'Encampment Concerns': '#A78BFA',
};

const CATEGORY_ICON: Record<string, string> = {
  'Pothole':             'road-variant',
  'Streetlight Outage':  'lightbulb-on-outline',
  'Graffiti':            'format-paint',
  'Illegal Dumping':     'trash-can-outline',
  'Vehicle Concerns':    'car',
  'Encampment Concerns': 'tent',
};

const getInitialCategory = (selectedSampleIssue?: SampleIssueRecord | null): string => {
  return selectedSampleIssue?.category ?? "Pothole";
};

export const ClassificationScreen = ({
  onBack,
  onConfirm,
  selectedSampleIssue,
}: ClassificationScreenProps) => {
  const locationMainLine =
    selectedSampleIssue?.locationName ?? LOCATION_MAIN_LINE;
  const locationSubLine =
    selectedSampleIssue?.address ?? LOCATION_SUB_LINE;

  const [category, setCategory] = useState(getInitialCategory(selectedSampleIssue));
  const [tag, setTag] = useState(selectedSampleIssue?.tag ?? "Pothole");
  const [desc, setDesc] = useState(
    selectedSampleIssue?.description ??
      "Significant pothole on Glen Eyrie Ave near Carolyn Ave causing road hazard. Approximately 2ft wide with visible asphalt damage.",
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

  const handleTagSelect = (nextTag: string) => {
    setTag(nextTag);
    for (const [nextCategory, tags] of Object.entries(TAGS_BY_CATEGORY)) {
      if (tags.includes(nextTag)) {
        setCategory(nextCategory);
        break;
      }
    }
    setShowTagMenu(false);
  };

  const dept =
    DEPT_BY_CATEGORY[category] ?? DEPT_BY_CATEGORY["Roads & Infrastructure"];

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoStrip}>
          <SampleIssueImage
            image={
              selectedSampleIssue?.image ?? {
                kind: "asset",
                source: require("../../assets/pothole.jpg"),
                alt: "Captured pothole preview",
              }
            }
            style={{ width: "100%", height: "100%" }}
          />
          <View style={styles.categoryChip}>
            <MaterialCommunityIcons
              name={(CATEGORY_ICON[category] ?? 'alert-circle-outline') as any}
              size={13}
              color={CATEGORY_COLOR[category] ?? '#8D939E'}
            />
            <Text style={styles.categoryChipText}>{category}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>ISSUE TYPE</Text>
            <Pressable
              onPress={() => setShowTagMenu((value) => !value)}
              style={styles.selector}
              accessibilityRole="button"
            >
              <Text style={styles.selectorText}>{tag}</Text>
              <Text style={styles.selectorChevron}>⌄</Text>
            </Pressable>
            {showTagMenu && (
              <View style={styles.dropdown}>
                {(TAGS_BY_CATEGORY[category] ?? []).map((nextTag) => (
                  <Pressable
                    key={nextTag}
                    onPress={() => handleTagSelect(nextTag)}
                    style={[
                      styles.dropdownItem,
                      nextTag === tag && styles.dropdownItemActive,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        nextTag === tag && styles.dropdownItemTextActive,
                      ]}
                    >
                      {nextTag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>DESCRIPTION</Text>
            <TextInput
              multiline
              value={desc}
              onChangeText={setDesc}
              style={styles.descInput}
              textAlignVertical="top"
              placeholderTextColor="#55595F"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.locationHeader, styles.rowBorder]}>
            <Text style={styles.rowLabel}>LOCATION</Text>
            <View style={styles.gpsBadge}>
              <Text style={styles.gpsBadgeText}>📍 GPS</Text>
            </View>
          </View>

          <View style={styles.mapArea}>
            <MiniMapView style={StyleSheet.absoluteFillObject} />
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

          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Text>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressMain}>{locationMainLine}</Text>
              <Text style={styles.addressSub}>{locationSubLine}</Text>
            </View>
            <Pressable accessibilityRole="button">
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.routingCard}>
          <Text style={styles.routingLabel}>WILL BE ROUTED TO</Text>
          <Text style={styles.routingName}>{dept.name}</Text>
          <Text style={styles.routingDiv}>{dept.division}</Text>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <Pressable
          onPress={() =>
            onConfirm({
              category,
              tag,
              desc,
              locationMain: locationMainLine,
              locationSub: locationSubLine,
            })
          }
          style={styles.submitButton}
          accessibilityRole="button"
        >
          <Text style={styles.submitCheck}>✓</Text>
          <Text style={styles.submitText}>Confirm</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },


  scroll: { padding: 12, gap: 8, paddingBottom: 20 },

  photoStrip: {
    width: "100%",
    height: Math.round(SCREEN_HEIGHT * 0.30),
    overflow: "hidden",
    backgroundColor: "#111",
    borderRadius: 14,
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
    backgroundColor: '#222428',
    borderRadius: 14,
    overflow: "visible",
  },

  row: { paddingHorizontal: 14, paddingVertical: 11, gap: 5 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#35373D' },
  rowLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: '#8D939E',
    letterSpacing: 0.5,
  },

  selector: {
    backgroundColor: '#2C2D32',
    borderWidth: 1,
    borderColor: '#35373D',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  selectorText: { fontSize: 14, fontWeight: "600", color: '#F2F3F5' },
  selectorChevron: { fontSize: 14, color: '#8D939E' },

  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#35373D',
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: '#222428',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  dropdownItemActive: { backgroundColor: '#4F8EF728' },
  dropdownItemText: { fontSize: 14, color: '#F2F3F5' },
  dropdownItemTextActive: { color: '#4F8EF7', fontWeight: "600" },

  descInput: {
    backgroundColor: '#2C2D32',
    borderWidth: 1,
    borderColor: '#35373D',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F2F3F5',
    minHeight: 80,
    fontFamily: undefined,
    lineHeight: 22,
    marginTop: 2,
  },

  locationHeader: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpsBadge: {
    backgroundColor: '#4F8EF728',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gpsBadgeText: { color: '#4F8EF7', fontSize: 10, fontWeight: "600" },

  mapArea: {
    height: 130,
    overflow: "hidden",
    position: "relative",
    backgroundColor: '#1a1d22',
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
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  mapHintText: { color: '#8D939E', fontSize: 10, fontWeight: "500" },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#35373D',
  },
  addressIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#2C2D32',
    alignItems: "center",
    justifyContent: "center",
  },
  addressMain: { fontSize: 14, fontWeight: "700", color: '#F2F3F5' },
  addressSub: { fontSize: 12, color: '#8D939E', marginTop: 1 },
  editLink: { color: '#8D939E', fontSize: 12, fontWeight: "600" },

  routingCard: {
    backgroundColor: '#222428',
    borderRadius: 12,
    padding: 12,
    gap: 3,
  },
  routingLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: '#8D939E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routingName: { fontSize: 14, fontWeight: "700", color: '#F2F3F5' },
  routingDiv: { fontSize: 12, color: '#8D939E' },

  ctaBar: {
    padding: 14,
    paddingBottom: 10,
    backgroundColor: '#18191C',
    borderTopWidth: 1,
    borderTopColor: '#35373D',
  },
  submitButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitCheck: { color: '#fff', fontSize: 16, fontWeight: "800" },
  submitText: { color: '#fff', fontSize: 16, fontWeight: "700" },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
  },
  closeButton: {
    backgroundColor: '#2C2D32',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { color: '#8D939E', fontSize: 14, fontWeight: '600' },
});
