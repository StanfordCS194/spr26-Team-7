import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useML, MlStage } from "../ml/MLProvider";
import { assetToDataUrl, uriToDataUrl } from "../ml/imageToDataUrl";
import { MlClassification } from "../ml/types";
import { SampleIssueImage } from "../types";

type AnalyzingScreenProps = {
  image?: SampleIssueImage | null;
  imageUri?: string | null;
  onDone: (result: MlClassification | null) => void;
};

const STAGE_LABEL: Record<MlStage, string> = {
  router: "Identifying the issue…",
  extract: "Analyzing the details…",
  describe: "Writing the report…",
};

export const AnalyzingScreen = ({ image, imageUri, onDone }: AnalyzingScreenProps) => {
  const { status, loadPct, classify } = useML();
  const [phaseText, setPhaseText] = useState("Preparing photo…");
  const [progress, setProgress] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

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

    const resolveDataUrl = async (): Promise<string | null> => {
      if (imageUri) {
        return uriToDataUrl(imageUri);
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
          onDoneRef.current(null);
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
          onDoneRef.current(result);
        }
      } catch (error) {
        console.error("[ml] classification failed", error);
        if (!cancelled) {
          onDoneRef.current(null);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
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
});
