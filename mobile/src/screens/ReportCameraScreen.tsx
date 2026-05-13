import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MockStreetPhoto } from "../components/MockStreetPhoto";
import { SampleIssueImage } from "../components/SampleIssueImage";
import { SampleIssueImage as SampleIssueImageType } from "../types";
import { T } from "../theme";

type ReportCameraScreenProps = {
  onCapture: () => void;
  onBack: () => void;
  photos: SampleIssueImageType[];
  onChangePhotos: (photos: SampleIssueImageType[]) => void;
};

const MAX_PHOTOS = 5;

export const ReportCameraScreen = ({
  onCapture,
  onBack,
  photos,
  onChangePhotos,
}: ReportCameraScreenProps) => {
  const addPhoto = (photo: SampleIssueImageType) => {
    if (photos.length >= MAX_PHOTOS) {
      return;
    }
    onChangePhotos([...photos, photo]);
  };

  const removePhoto = (uri: string) => {
    onChangePhotos(
      photos.filter((photo) => photo.kind !== "uri" || photo.uri !== uri),
    );
  };

  const handleTakePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    addPhoto({
      kind: "uri",
      uri: result.assets[0].uri,
      alt: "Captured issue photo",
    });
  };

  const handlePickFile = async () => {
    if (photos.length >= MAX_PHOTOS) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    addPhoto({
      kind: "uri",
      uri: result.assets[0].uri,
      alt: result.assets[0].name || "Uploaded issue image",
    });
  };

  const handleContinue = () => {
    if (photos.length > 0) {
      onCapture();
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.viewfinder}>
        {photos[0] ? (
          <SampleIssueImage
            image={photos[0]}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <MockStreetPhoto style={{ width: "100%", height: "100%" }} />
        )}

        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={onBack}
            accessibilityRole="button"
          >
            <Text style={styles.iconText}>✕</Text>
          </Pressable>
          <View style={styles.reportBadge}>
            <Text style={styles.reportBadgeText}>
              {photos.length > 0 ? "REVIEW PHOTOS" : "REPORT ISSUE"}
            </Text>
          </View>
          <View style={styles.counterBubble}>
            <Text style={styles.counterText}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>
        </View>

        {photos.length > 0 ? (
          <View style={styles.photoStrip}>
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoStripContent}
              >
                {photos.map((photo, i) => (
                  <View
                    key={photo.kind === "uri" ? photo.uri : `${photo.kind}-${i}`}
                    style={styles.thumbnail}
                  >
                    <SampleIssueImage image={photo} style={styles.thumbnailPhoto} />
                    {photo.kind === "uri" ? (
                      <Pressable
                        onPress={() => removePhoto(photo.uri)}
                        style={styles.removeButton}
                        accessibilityRole="button"
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </Pressable>
                    ) : null}
                    {i === 0 ? (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>MAIN</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <Pressable
                    onPress={handleTakePhoto}
                    style={styles.addPhotoButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.addPhotoPlus}>+</Text>
                    <Text style={styles.addPhotoLabel}>camera</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
            <Text style={styles.photoCount}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              Take a photo or upload one from files
            </Text>
            <Text style={styles.emptyCopy}>
              Add at least one image before continuing with the report.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={handleTakePhoto}
          style={styles.secondaryAction}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
        >
          <Text style={styles.secondaryActionText}>Camera</Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          style={[styles.shutter, photos.length === 0 && styles.shutterDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Continue to report details"
        >
          <View style={styles.shutterInner}>
            <Text style={styles.nextText}>Next</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.libraryButton}
          onPress={handlePickFile}
          accessibilityRole="button"
          accessibilityLabel="Choose image file"
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
          <Text style={styles.libraryLabel}>Files</Text>
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
  counterBubble: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: { color: "white", fontSize: 12, fontWeight: "700" },

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

  emptyState: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 120,
    backgroundColor: "rgba(0,0,0,0.56)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyCopy: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  controls: {
    backgroundColor: "#111",
    paddingHorizontal: 18,
    paddingBottom: 10,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  secondaryAction: {
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  secondaryActionText: { color: "white", fontSize: 13, fontWeight: "700" },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterDisabled: {
    opacity: 0.45,
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: T.ink, fontSize: 12, fontWeight: "800" },
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
