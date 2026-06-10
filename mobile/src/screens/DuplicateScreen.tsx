import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SampleIssueImage } from "../components/SampleIssueImage";
import { SampleIssueRecord } from "../types";
type DuplicateScreenProps = {
  onMerge: () => void;
  onNew: () => void;
  onBack: () => void;
  selectedSampleIssue?: SampleIssueRecord | null;
};

export const DuplicateScreen = ({
  onMerge,
  onNew,
  onBack,
  selectedSampleIssue,
}: DuplicateScreenProps) => (
  <View style={styles.page}>
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        accessibilityRole="button"
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Already reported?</Text>
    </View>

    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.alertBanner}>
        <Text style={styles.alertIcon}>!</Text>
        <View style={styles.alertText}>
          <Text style={styles.alertTitle}>Similar report nearby</Text>
          <Text style={styles.alertBody}>
            {selectedSampleIssue
              ? `Someone reported a similar ${selectedSampleIssue.type.toLowerCase()} near ${selectedSampleIssue.locationName} 0.1 mi away.`
              : "Someone reported a pothole on Glen Eyrie Ave 0.1 mi away — 3 days ago."}
          </Text>
        </View>
      </View>

      <View style={styles.reportCard}>
        <View style={styles.reportPhoto}>
          <SampleIssueImage
            image={
              selectedSampleIssue?.image ?? {
                kind: "asset",
                source: require("../../assets/pothole.jpg"),
                alt: "Nearby pothole report",
              }
            }
            style={{ width: "100%", height: "100%" }}
          />
          <View style={styles.reportPhotoOverlay} />
          <View style={styles.reportBadges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{selectedSampleIssue?.type ?? "Pothole"}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>4 reports</Text>
            </View>
          </View>
        </View>
        <View style={styles.reportBody}>
          <Text style={styles.reportTitle}>
            {selectedSampleIssue
              ? `${selectedSampleIssue.type} — ${selectedSampleIssue.locationName}`
              : "Pothole — Glen Eyrie Ave"}
          </Text>
          <Text style={styles.reportDesc}>
            {selectedSampleIssue
              ? `${selectedSampleIssue.description} Reported recently by a nearby resident.`
              : "Large pothole near Carolyn Ave intersection. Reported 3 days ago."}
          </Text>
          <View style={styles.reportMeta}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
            <Text style={styles.estText}>Est. repair: 2–3 weeks</Text>
          </View>
        </View>
      </View>

      <Text style={styles.question}>Is this the same issue?</Text>

      <Pressable
        onPress={onMerge}
        style={styles.mergeButton}
        accessibilityRole="button"
      >
        <Text style={styles.mergeText}>Yes, add my +1 to this report</Text>
      </Pressable>

      <Pressable
        onPress={onNew}
        style={styles.newButton}
        accessibilityRole="button"
      >
        <Text style={styles.newText}>No, this is different</Text>
      </Pressable>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },

  header: {
    backgroundColor: '#18191C',
    borderBottomWidth: 1,
    borderBottomColor: '#35373D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: { padding: 4, marginLeft: -4 },
  backIcon: { fontSize: 28, color: '#F2F3F5', lineHeight: 30, fontWeight: "300" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: '#F2F3F5' },

  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  alertBanner: {
    backgroundColor: '#F0A03028',
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  alertIcon: { color: '#F0A030', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  alertText: { flex: 1, gap: 3 },
  alertTitle: { fontSize: 14, fontWeight: "800", color: '#F2F3F5' },
  alertBody: { fontSize: 13, color: '#D1D5DB', lineHeight: 20 },

  reportCard: {
    backgroundColor: '#222428',
    borderRadius: 14,
    overflow: "hidden",
  },
  reportPhoto: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#111",
    overflow: "hidden",
  },
  reportPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  reportBadges: {
    position: "absolute",
    bottom: 8,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  typeBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: { color: "white", fontSize: 11, fontWeight: "600" },
  countBadge: {
    backgroundColor: "rgba(37,99,235,0.8)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: { color: "white", fontSize: 11, fontWeight: "600" },

  reportBody: { padding: 14, gap: 6 },
  reportTitle: { fontSize: 14, fontWeight: "800", color: '#F2F3F5' },
  reportDesc: { fontSize: 13, color: '#8D939E', lineHeight: 20 },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#F0A03028',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingText: { color: '#F0A030', fontSize: 11, fontWeight: "700" },
  estText: { fontSize: 12, color: '#8D939E' },

  question: {
    fontSize: 14,
    fontWeight: "600",
    color: '#F2F3F5',
    textAlign: "center",
  },

  mergeButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mergeText: { color: "white", fontSize: 15, fontWeight: "700" },

  newButton: {
    backgroundColor: '#2C2D32',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  newText: { color: '#F2F3F5', fontSize: 15, fontWeight: "700" },
});
