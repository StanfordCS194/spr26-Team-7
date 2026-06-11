import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useML, MlStage } from "../ml/MLProvider";
import { assetToDataUrl, uriToDataUrl } from "../ml/imageToDataUrl";
import { MlClassification } from "../ml/types";
import { SampleIssueImage } from "../types";

type AnalyzingScreenProps = {
  image?: SampleIssueImage | null;
  imageUri?: string | null;
  onDone: (result: MlClassification | null) => void;
  onCancel?: () => void;
};

const STAGE_LABEL: Record<MlStage, string> = {
  router: "Identifying the issue…",
  extract: "Analyzing the details…",
  describe: "Writing the report…",
};

// Keep the analysis screen up for at least this long so the result never flashes
// by instantly, even when on-device inference finishes faster.
const MIN_VISIBLE_MS = 2000;

export const AnalyzingScreen = ({ image, imageUri, onDone, onCancel }: AnalyzingScreenProps) => {
  const { status, loadPct, classify } = useML();
  const [phaseText, setPhaseText] = useState("Preparing photo…");
  const [progress, setProgress] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const startedAtRef = useRef(Date.now());
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinAnim]);

  const setPhase = (text: string) => {
    Animated.timing(phaseOpacity, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setPhaseText(text);
      Animated.timing(phaseOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    let cancelled = false;

    const finish = (result: MlClassification | null) => {
      if (cancelled) {
        return;
      }
      const remaining = MIN_VISIBLE_MS - (Date.now() - startedAtRef.current);
      if (remaining <= 0) {
        onDoneRef.current(result);
        return;
      }
      finishTimerRef.current = setTimeout(() => {
        if (!cancelled) {
          onDoneRef.current(result);
        }
      }, remaining);
    };

    const resolveDataUrl = async (): Promise<string | null> => {
      if (imageUri) {
        return uriToDataUrl(imageUri);
      }
      if (image && image.kind === "uri") {
        return uriToDataUrl(image.uri);
      }
      if (image && image.kind === "asset") {
        return assetToDataUrl(image.source);
      }
      return null;
    };

    const run = async () => {
      try {
        const dataUrl = await resolveDataUrl();
        if (cancelled) {
          return;
        }
        if (!dataUrl) {
          finish(null);
          return;
        }

        if (status !== "ready") {
          setPhase("Loading on-device model…");
        }

        const result = await classify(dataUrl, (stage) => {
          if (!cancelled) {
            setPhase(STAGE_LABEL[stage]);
            setProgress((p) => Math.max(p, stage === "router" ? 55 : stage === "extract" ? 75 : 92));
          }
        });

        if (!cancelled) {
          setProgress(100);
          finish(result);
        }
      } catch (error) {
        console.error("[ml] classification failed", error);
        finish(null);
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While the model downloads, mirror the real load percentage; otherwise creep
  // forward so the bar always feels alive during inference.
  useEffect(() => {
    if (status === "ready") {
      return;
    }
    setProgress(Math.min(45, Math.round(loadPct * 0.45)));
  }, [status, loadPct]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <View style={styles.spinnerContainer}>
          <View style={styles.spinnerTrack} />
          <Animated.View
            style={[styles.spinnerArc, { transform: [{ rotate: spin }] }]}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Analyzing photo</Text>
          <Animated.Text style={[styles.phase, { opacity: phaseOpacity }]}>
            {phaseText}
          </Animated.Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {onCancel && (
          <Pressable style={styles.cancelButton} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel analysis">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18191C' },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 32,
  },

  spinnerContainer: {
    width: 72,
    height: 72,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerTrack: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.1)",
  },
  spinnerArc: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderTopColor: '#4F8EF7',
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  textBlock: { alignItems: "center", gap: 8 },
  title: { color: "#F2F3F5", fontSize: 18, fontWeight: "700" },
  phase: {
    color: '#8D939E',
    fontSize: 14,
    fontWeight: "400",
    minHeight: 20,
    textAlign: "center",
  },

  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: '#4F8EF7',
    borderRadius: 4,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#35373D',
  },
  cancelText: {
    color: '#8D939E',
    fontSize: 14,
    fontWeight: '600',
  },
});
