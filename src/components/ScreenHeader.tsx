import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOARD_PADDING, COLORS } from "@/src/constants/gameConfig";
import { StarCountInline } from "@/src/components/StarCount";

export function ScreenHeaderStarsPill({ value }: { value: number }) {
  return (
    <View style={styles.starPill}>
      <StarCountInline
        count={value}
        iconSize={18}
        gap={6}
        textStyle={styles.starPillText}
      />
    </View>
  );
}

export function ScreenHeaderLevelProgressPill({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  return (
    <View style={styles.progressPill}>
      <Text style={styles.progressPillText}>
        {completed} / {total} SEVİYE
      </Text>
    </View>
  );
}

type ScreenHeaderProps = {
  /** titleNode verilirse bu kullanılır; aksi halde title metni */
  title?: string;
  titleNode?: React.ReactNode;
  onBack?: () => void;
  bottomSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  /** Varsayılan: güvenli alan üstü + BOARD_PADDING */
  contentStyle?: ViewStyle;
  /** Başlık sütunu hizası (onboarding için ortalı) */
  titlesAlign?: "flex-start" | "center";
};

export default function ScreenHeader({
  title,
  titleNode,
  onBack,
  bottomSlot,
  rightSlot,
  contentStyle,
  titlesAlign = "flex-start",
}: ScreenHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingTop: top }]}>
      <View style={[styles.headerInfoArea, contentStyle]}>
        <View style={styles.headerTop}>
          <View style={styles.leading}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="chevron-back-sharp"
                  size={24}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
          </View>
          <View
            style={[
              styles.headerTitles,
              titlesAlign === "center" && styles.headerTitlesCenter,
            ]}
          >
            {titleNode ?? (
              <Text style={styles.headerTitle}>{title ?? ""}</Text>
            )}
            {bottomSlot}
          </View>
          <View style={styles.trailing}>{rightSlot}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: COLORS.background,
  },
  headerInfoArea: {
    padding: BOARD_PADDING,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  leading: {
    width: 50,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  trailing: {
    minWidth: 50,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitles: { flex: 1 },
  headerTitlesCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  progressPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  progressPillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  starPill: {
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  starPillText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  backButton: {
    height: 50,
    width: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backPlaceholder: {
    height: 50,
    width: 50,
  },
});
