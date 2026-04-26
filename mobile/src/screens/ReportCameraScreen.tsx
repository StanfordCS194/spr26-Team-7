import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MockStreetPhoto } from "../components/MockStreetPhoto";
import { T } from "../theme";

type ReportCameraScreenProps = {
  onCapture: () => void;
};

export const ReportCameraScreen = ({ onCapture }: ReportCameraScreenProps) => {
  const [photos, setPhotos] = useState([1]);
  const [nextId, setNextId] = useState(2);

  const addPhoto = () => {
    if (photos.length < 5) {
      setPhotos((p) => [...p, nextId]);
      setNextId((n) => n + 1);
    }
  };

  const removePhoto = (id: number) =>
    setPhotos((p) => p.filter((x) => x !== id));

  const handleShutter = () => {
    if (photos.length > 0) {
      onCapture();
    } else {
      addPhoto();
    }
  };

  return (
    <View style={styles.page}>
      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        <MockStreetPhoto style={StyleSheet.absoluteFillObject} />

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
          <Pressable style={styles.iconButton} accessibilityRole="button">
            <Text style={styles.iconText}>⚡</Text>
          </Pressable>
        </View>

        {/* Photo strip */}
        {photos.length > 0 && (
          <View style={styles.photoStrip}>
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoStripContent}
              >
                {photos.map((id, i) => (
                  <View key={id} style={styles.thumbnail}>
                    <MockStreetPhoto style={styles.thumbnailPhoto} />
                    <Pressable
                      onPress={() => removePhoto(id)}
                      style={styles.removeButton}
                      accessibilityRole="button"
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                    {i === 0 && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>MAIN</Text>
                      </View>
                    )}
                  </View>
                ))}
                {photos.length < 5 && (
                  <Pressable
                    onPress={addPhoto}
                    style={styles.addPhotoButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.addPhotoPlus}>+</Text>
                    <Text style={styles.addPhotoLabel}>photo</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
            <Text style={styles.photoCount}>{photos.length}/5</Text>
          </View>
        )}
      </View>

      {/* Camera controls */}
      <View style={styles.controls}>
        <View style={{ width: 60 }} />
        <Pressable
          onPress={handleShutter}
          style={styles.shutter}
          accessibilityRole="button"
          accessibilityLabel="Capture photo"
        >
          <View style={styles.shutterInner} />
          {photos.length > 0 && (
            <View style={styles.nextBadge}>
              <Text style={styles.nextBadgeText}>Next</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.libraryButton} accessibilityRole="button">
          <View style={styles.libraryIconBox}>
            {/* Photo frame */}
            <View style={styles.libFrame}>
              {/* Sun dot */}
              <View style={styles.libSun} />
              {/* Mountains */}
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
  page: { flex: 1, backgroundColor: "#0f0f0f" },

  viewfinder: { flex: 1, overflow: "hidden" },

  corner: { position: "absolute", width: 22, height: 22 },
  cornerTL: {
    top: 14,
    left: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cornerTR: {
    top: 14,
    right: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cornerBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cornerBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "white", fontSize: 14, fontWeight: "600" },
  reportBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  reportBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },

  photoStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.72)",
    gap: 10,
  },
  photoStripContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thumbnail: {
    width: 52,
    height: 52,
    position: "relative",
  },
  thumbnailPhoto: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: { color: "white", fontSize: 8, fontWeight: "700" },
  mainBadge: {
    position: "absolute",
    bottom: 3,
    left: 3,
    backgroundColor: "rgba(37,99,235,0.85)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  mainBadgeText: { color: "white", fontSize: 8, fontWeight: "700" },
  addPhotoButton: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoPlus: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 20,
    lineHeight: 22,
  },
  addPhotoLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "500",
  },
  photoCount: { color: "rgba(255,255,255,0.5)", fontSize: 11 },

  controls: {
    backgroundColor: "#111",
    paddingBottom: 10,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  nextBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: T.blue,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: "#111",
  },
  nextBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },
  libraryButton: {
    alignItems: "center",
    width: 60,
    gap: 6,
  },
  libraryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(60,60,60,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  libFrame: {
    width: 26,
    height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
    position: "relative",
  },
  libSun: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  libMountainRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 2,
  },
  libMtnSmall: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.9)",
  },
  libMtnLarge: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.9)",
    marginLeft: 1,
  },
  libraryLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "500",
  },
});
