import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { T } from "../theme";

type DuplicateScreenProps = {
  onMerge: () => void;
  onNew: () => void;
  onBack: () => void;
};

export const DuplicateScreen = ({
  onMerge,
  onNew,
  onBack,
}: DuplicateScreenProps) => (
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
      <Text style={styles.headerTitle}>Already reported?</Text>
    </View>

    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Alert banner */}
      <View style={styles.alertBanner}>
        <Text style={styles.alertIcon}>⚠</Text>
        <View style={styles.alertText}>
          <Text style={styles.alertTitle}>Similar report nearby</Text>
          <Text style={styles.alertBody}>
            Someone reported a pothole on Willow St 0.1 mi away — 3 days ago.
          </Text>
        </View>
      </View>

      {/* Existing report card */}
      <View style={styles.reportCard}>
        <View style={styles.reportPhoto}>
          <Image source={require('../../assets/pothole.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          <View style={styles.reportPhotoOverlay} />
          <View style={styles.reportBadges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>Pothole</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>👥 4 reports</Text>
            </View>
          </View>
        </View>
        <View style={styles.reportBody}>
          <Text style={styles.reportTitle}>Pothole — Willow St</Text>
          <Text style={styles.reportDesc}>
            Large pothole near Lincoln Ave intersection. Reported 3 days ago.
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

      {/* +1 button */}
      <Pressable
        onPress={onMerge}
        style={styles.mergeButton}
        accessibilityRole="button"
      >
        <Text style={styles.mergeIcon}>👥</Text>
        <Text style={styles.mergeText}>Yes, add my +1 to this report</Text>
      </Pressable>

      {/* New report button */}
      <Pressable
        onPress={onNew}
        style={styles.newButton}
        accessibilityRole="button"
      >
        <Text style={styles.newIcon}>📷</Text>
        <Text style={styles.newText}>No, this is different</Text>
      </Pressable>
    </ScrollView>
  </View>
);

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
  headerTitle: { fontSize: 16, fontWeight: "700", color: T.ink },

  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  alertBanner: {
    backgroundColor: T.amberLight,
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  alertIcon: { fontSize: 20, lineHeight: 24 },
  alertText: { flex: 1, gap: 3 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#92400e" },
  alertBody: { fontSize: 13, color: "#b45309", lineHeight: 20 },

  reportCard: {
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  reportPhoto: {
    height: 200,
    backgroundColor: "#111",
    overflow: "hidden",
    position: "relative",
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
  reportTitle: { fontSize: 14, fontWeight: "700", color: T.ink },
  reportDesc: { fontSize: 13, color: T.ink3, lineHeight: 20 },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingText: { color: T.amber, fontSize: 11, fontWeight: "700" },
  estText: { fontSize: 12, color: T.ink4 },

  question: {
    fontSize: 14,
    fontWeight: "600",
    color: T.ink,
    textAlign: "center",
  },

  mergeButton: {
    backgroundColor: T.blue,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mergeIcon: { fontSize: 18 },
  mergeText: { color: "white", fontSize: 15, fontWeight: "700" },

  newButton: {
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  newIcon: { fontSize: 18 },
  newText: { color: T.ink2, fontSize: 15, fontWeight: "600" },
});
