import { COLORS } from "@/src/constants/gameConfig";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";

interface LevelCompleteOverlayProps {
  visible: boolean;
  animatedStyle?: any;
  onNext: () => void;
  onReplay: () => void;
}

const LevelCompleteOverlay: React.FC<LevelCompleteOverlayProps> = ({
  visible,
  animatedStyle,
  onNext,
  onReplay,
}) => {
  // if (!visible) return null; // Parent controls layout, we just fill it

  return (
    <Animated.View style={[styles.continueContainer, animatedStyle]}>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.replayButton} onPress={onReplay}>
          <Ionicons name="refresh" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={onNext}>
          <Text style={styles.continueText}>SONRAKİ</Text>
          <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  continueContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start", // Top align as requested ("üst kısmın ortasında")
    alignItems: "center",
    paddingTop: 0, // Remove default padding if any to fit tight space
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  continueText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  replayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)", // Semi-transparent white background
    alignItems: "center",
    justifyContent: "center",
  },
  // replayText removed
});

export default LevelCompleteOverlay;
