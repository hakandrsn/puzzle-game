import { COLORS } from "@/src/constants/gameConfig";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

interface GameStatsProps {
  moves: number;
  height?: number; // Optional
  movesAnimatedStyle?: any;
}

const GameStats: React.FC<GameStatsProps> = ({
  moves,
  height,
  movesAnimatedStyle,
}) => {
  return (
    <View style={[styles.statsContainer, height ? { height } : undefined]}>
      <Animated.View style={[styles.movesBlock, movesAnimatedStyle]}>
        <Text style={styles.movesValueBig}>{moves}</Text>
        <Text style={styles.movesLabelSmall}>HAMLE</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  movesBlock: {
    alignItems: "center",
  },
  movesValueBig: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  movesLabelSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: -2,
    letterSpacing: 1,
  },
});

export default GameStats;
