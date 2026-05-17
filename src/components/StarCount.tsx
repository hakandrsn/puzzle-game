import { Image } from "expo-image";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { COLORS } from "@/src/constants/gameConfig";

/** Yerel ikonlar — tek görünüm için kaynak buradan seçilir */
export const REWARD_ICONS = {
  star: require("@/src/assets/icons/star.png"),
  coin: require("@/src/assets/icons/coin.png"),
} as const;

export type RewardIconKey = keyof typeof REWARD_ICONS;

const lockAsset = require("@/src/assets/icons/lock.png");

export const LockIcon = React.memo(function LockIcon({
  size = 28,
}: {
  size?: number;
}) {
  return (
    <Image
      source={lockAsset}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
});

/** Tek ödül ikonu; kaynak `source` veya `name` ile */
export const RewardIcon = React.memo(function RewardIcon({
  source,
  name,
  size = 18,
  dimmed = false,
}: {
  /** Öncelikli; doğrudan `require` geçilebilir */
  source?: ImageSourcePropType;
  name?: RewardIconKey;
  size?: number;
  dimmed?: boolean;
}) {
  const resolved =
    source ?? REWARD_ICONS[name ?? "star"];
  return (
    <Image
      source={resolved}
      style={{ width: size, height: size, opacity: dimmed ? 0.35 : 1 }}
      contentFit="contain"
    />
  );
});

/** Solda adet, sağda ikon — tek bileşen, ikon `iconSource` veya `iconName` */
export const RewardCountInline = React.memo(function RewardCountInline({
  count,
  iconSource,
  iconName = "star",
  iconSize = 18,
  gap = 6,
  textStyle,
  style,
}: {
  count: number;
  iconSource?: ImageSourcePropType;
  iconName?: RewardIconKey;
  iconSize?: number;
  gap?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.inlineRow, { gap }, style]}>
      <Text style={[styles.countText, textStyle]}>{count}</Text>
      <RewardIcon source={iconSource} name={iconName} size={iconSize} />
    </View>
  );
});

export const StarIcon = React.memo(function StarIcon({
  size = 18,
  dimmed = false,
}: {
  size?: number;
  dimmed?: boolean;
}) {
  return <RewardIcon name="star" size={size} dimmed={dimmed} />;
});

export const CoinIcon = React.memo(function CoinIcon({
  size = 18,
  dimmed = false,
}: {
  size?: number;
  dimmed?: boolean;
}) {
  return <RewardIcon name="coin" size={size} dimmed={dimmed} />;
});

export const StarCountInline = React.memo(function StarCountInline(
  props: Omit<
    React.ComponentProps<typeof RewardCountInline>,
    "iconSource" | "iconName"
  >,
) {
  return <RewardCountInline {...props} iconName="star" />;
});

export const CoinCountInline = React.memo(function CoinCountInline(
  props: Omit<
    React.ComponentProps<typeof RewardCountInline>,
    "iconSource" | "iconName"
  >,
) {
  return <RewardCountInline {...props} iconName="coin" />;
});

/** Küçük çoklu yıldız (ör. seviye kartı 1–3 yıldız) */
export const StarRatingMini = React.memo(function StarRatingMini({
  filledStars,
  maxStars = 3,
  starSize = 12,
  gap = 2,
}: {
  filledStars: number;
  maxStars?: number;
  starSize?: number;
  gap?: number;
}) {
  const filled = Math.min(maxStars, Math.max(0, filledStars));
  return (
    <View style={[styles.inlineRow, { gap }]}>
      {Array.from({ length: maxStars }, (_, i) => (
        <StarIcon key={i} size={starSize} dimmed={i >= filled} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countText: {
    fontWeight: "800",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
