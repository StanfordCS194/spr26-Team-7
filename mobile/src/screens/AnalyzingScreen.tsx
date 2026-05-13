import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

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
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    const interval = setInterval(
      () => setProgress((p) => Math.min(p + 2.5, 100)),
      70,
    );

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
            {PHASES[phase]}
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
