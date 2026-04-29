import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MockStreetPhoto } from "../components/MockStreetPhoto";
import { T } from "../theme";

type AnalyzingScreenProps = {
  onDone: () => void;
};

const PHASES = [
  "Checking location…",
  "Identifying issue…",
  "Finding the right agency…",
];

export const AnalyzingScreen = ({ onDone }: AnalyzingScreenProps) => {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const phaseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spinner
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Progress bar
    const interval = setInterval(
      () => setProgress((p) => Math.min(p + 2.5, 100)),
      70,
    );

    // Phase transitions with fade
    const advancePhase = (nextPhase: number) => {
      Animated.timing(phaseOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setPhase(nextPhase);
        Animated.timing(phaseOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    };

    const t1 = setTimeout(() => advancePhase(1), 800);
    const t2 = setTimeout(() => advancePhase(2), 1800);
    const t3 = setTimeout(() => onDone(), 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.page}>
      {/* Dimmed photo background */}
      <MockStreetPhoto style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Spinner */}
        <View style={styles.spinnerContainer}>
          <View style={styles.spinnerTrack} />
          <Animated.View
            style={[styles.spinnerArc, { transform: [{ rotate: spin }] }]}
          />
          <View style={styles.spinnerCenter}>
            <Text style={styles.zapIcon}>⚡</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Analyzing photo</Text>
          <Animated.Text style={[styles.phase, { opacity: phaseOpacity }]}>
            {PHASES[phase]}
          </Animated.Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f0a05" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,10,5,0.72)",
  },
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
    borderTopColor: T.blue,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  spinnerCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  zapIcon: { fontSize: 26 },

  textBlock: { alignItems: "center", gap: 8 },
  title: { color: "white", fontSize: 18, fontWeight: "700" },
  phase: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "400",
    minHeight: 20,
    textAlign: "center",
  },

  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: T.blue,
    borderRadius: 4,
  },
});
