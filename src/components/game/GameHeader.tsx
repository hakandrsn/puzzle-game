import { COLORS } from "@/src/constants/gameConfig";
import { ImageSource } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import GameSettings from "../GameSettings";

interface GameHeaderProps {
  title: string;
  imageSource?: ImageSource;
  onBack: () => void;
  // onReplay removed
  onPreview: () => void;
  topInset: number;
  height: number;
  animatedStyle?: any;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  imageSource,
  onBack,
  // onReplay removed
  onPreview,
  topInset,
  height,
  animatedStyle,
}) => {
  return (
    <Animated.View
      style={[
        styles.header,
        { paddingTop: topInset, height: height + topInset },
        animatedStyle,
      ]}
    >
      <View style={styles.headerLeftGroups}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        {/* Spacer to balance the Right side (2 buttons vs 1 button) */}
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.headerRightGroups}>
        <TouchableOpacity onPress={onPreview} style={styles.headerBtn}>
          {imageSource && (
            <Image
              source={imageSource}
              style={styles.thumbnail}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
        </TouchableOpacity>
        <GameSettings />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    zIndex: 100,
  },
  headerLeftGroups: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerRightGroups: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerBtn: {
    padding: 8,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1, // Allow center to take space if needed, ensuring alignment if sides are equal
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default GameHeader;
