import { Pressable, StyleSheet, Text, View } from "react-native";

type ReportCameraScreenProps = {
  onCapture: () => void;
  onOpenLibrary: () => void;
};

export const ReportCameraScreen = ({ onOpenLibrary }: ReportCameraScreenProps) => {
  return (
    <View style={styles.page}>
      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        {/* Rule-of-thirds grid */}
        <View style={[styles.gridLine, styles.gridV1]} />
        <View style={[styles.gridLine, styles.gridV2]} />
        <View style={[styles.gridLine, styles.gridH1]} />
        <View style={[styles.gridLine, styles.gridH2]} />

        {/* Corner guides */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} accessibilityRole="button">
            <Text style={styles.iconText}>✕</Text>
          </Pressable>
          <View style={styles.reportBadge}>
            <Text style={styles.reportBadgeText}>REPORT ISSUE</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {/* Camera controls */}
      <View style={styles.controls}>
        <View style={{ width: 60 }} />

        <Pressable
          style={[styles.shutter, styles.shutterDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Capture photo"
          disabled
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <Pressable
          onPress={onOpenLibrary}
          style={styles.libraryButton}
          accessibilityRole="button"
          accessibilityLabel="Photo library"
        >
          <View style={styles.libraryIconBox}>
            <View style={styles.libFrame}>
              <View style={styles.libSun} />
              <View style={styles.libMountainRow}>
                <View style={styles.libMtnSmall} />
                <View style={styles.libMtnLarge} />
              </View>
            </View>
          </View>
          <Text style={styles.libraryLabel}>Library</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0d0d0d" },

  viewfinder: { flex: 1, backgroundColor: "#0d0d0d", overflow: "hidden" },

  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.08)" },
  gridV1: { top: 0, bottom: 0, left: "33.33%", width: 1 },
  gridV2: { top: 0, bottom: 0, left: "66.66%", width: 1 },
  gridH1: { left: 0, right: 0, top: "33.33%", height: 1 },
  gridH2: { left: 0, right: 0, top: "66.66%", height: 1 },

  corner: { position: "absolute", width: 22, height: 22 },
  cornerTL: {
    top: 14, left: 14,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cornerTR: {
    top: 14, right: 14,
    borderTopWidth: 2, borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cornerBL: {
    bottom: 14, left: 14,
    borderBottomWidth: 2, borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cornerBR: {
    bottom: 14, right: 14,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },

  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  iconText: { color: "white", fontSize: 14, fontWeight: "600" },
  reportBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  reportBadgeText: {
    color: "white", fontSize: 11, fontWeight: "600", letterSpacing: 1,
  },

  controls: {
    backgroundColor: '#18191C',
    paddingBottom: 10,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  shutter: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  shutterDisabled: { opacity: 0.35 },
  shutterInner: {
    width: 58, height: 58,
    borderRadius: 29,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  libraryButton: {
    alignItems: "center",
    width: 60,
    gap: 6,
  },
  libraryIconBox: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: '#2C2D32',
    alignItems: "center", justifyContent: "center",
  },
  libFrame: {
    width: 26, height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
    position: "relative",
  },
  libSun: {
    position: "absolute",
    top: 4, left: 4,
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  libMountainRow: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 2,
  },
  libMtnSmall: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 9,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.9)",
  },
  libMtnLarge: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 12,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.9)",
    marginLeft: 1,
  },
  libraryLabel: {
    color: '#8D939E',
    fontSize: 10,
    fontWeight: "500",
  },
});
