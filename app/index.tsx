import GameSettings from "@/src/components/GameSettings";
import {CoinCountInline, StarCountInline} from "@/src/components/StarCount";
import {
    BOARD_PADDING,
    COLORS,
    getResponsiveValue,
} from "@/src/constants/gameConfig";
import {useClickSound} from "@/src/hooks/useClickSound";
import {useAdActions} from "@/src/store/adStore";
import {useChapters, useDataActions} from "@/src/store/dataStore";
import {
    useProgressActions,
    useProgressStore,
    useTotalCoins,
    useTotalStars,
} from "@/src/store/progressStore";
import {Image} from "expo-image";

import {useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Animated, {FadeInUp, ZoomIn} from "react-native-reanimated";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useHasSeenOnboarding, useOnboardingHydrated} from "@/src/store/onboardingStore";

export default function StartScreen() {
    const router = useRouter();
    const {width} = useWindowDimensions();
    const {top, bottom} = useSafeAreaInsets();
    const totalStars = useTotalStars();
    const totalCoins = useTotalCoins();
    const chapters = useChapters();

    const hasProgress = useProgressStore(
        (state) => Object.keys(state.progress.completedLevels).length > 0,
    );

    const {getChapters, getLevelById} = useDataActions();
    const {loadProgress} = useProgressActions();
    const {loadAdState} = useAdActions();

    const {playClick} = useClickSound();

    const {getNextPlayableLevel} = useProgressActions();

    const hasSeenOnboarding = useHasSeenOnboarding();
    const onboardingHydrated = useOnboardingHydrated();
    const [isReady, setIsReady] = useState(false);


    useEffect(() => {
        if (!isReady || !onboardingHydrated) return;
        if (!hasSeenOnboarding) {
            router.push("//onboarding");
        }
    }, [isReady, onboardingHydrated, hasSeenOnboarding, router]);

    useEffect(() => {
        const initGame = async () => {
            await Promise.all([loadProgress(), loadAdState(), getChapters()]);
            setIsReady(true);
            const target = getNextPlayableLevel();

            if (target) {
                const levelData = await getLevelById(target.chapterId, target.levelId);
                if (
                    levelData?.imageSource &&
                    typeof levelData.imageSource === "object" &&
                    "uri" in levelData.imageSource &&
                    levelData.imageSource.uri
                ) {
                    console.log(
                        "🚀 Prefetching Target Level Image:",
                        levelData.imageSource.uri,
                    );
                    Image.prefetch(levelData.imageSource.uri).catch((e) =>
                        console.warn("Prefetch failed", e),
                    );
                }
            }
        };

        initGame();
    }, []);

    const buttonWidth = getResponsiveValue(width, {
        phone: "85%",
        tablet: 320 as any,
    });

    const continueButtonWidth = getResponsiveValue(width, {
        phone: "80%",
        tablet: 200 as any,
    });

    const handleContinue = async () => {
        playClick();

        try {
            const target = getNextPlayableLevel() || {chapterId: 1, levelId: 1};

            const chapterId = target.chapterId || 1;
            const levelId = target.levelId || 1;
            router.push(`/game/jigsaw/${chapterId}/${levelId}`);
        } catch (error) {
            router.push("/game/jigsaw/1/1");
        }
    };

    const handleChapters = () => {
        router.push("/chapters");
    };

    return (
        <SafeAreaProvider style={[styles.container, {paddingTop: top + 12, paddingBottom: bottom + 12}]}>
            <View style={styles.statsTopBar}>
                <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                        <StarCountInline
                            count={totalStars}
                            iconSize={16}
                            gap={4}
                            textStyle={styles.statValue}
                        />
                    </View>
                    <View style={styles.statBadge}>
                        <CoinCountInline
                            count={totalCoins}
                            iconSize={16}
                            gap={4}
                            textStyle={styles.statValue}
                        />
                    </View>
                </View>
                <GameSettings/>

            </View>

            <View style={styles.content}>
                <View style={styles.hero}>
                    <Animated.View entering={ZoomIn.delay(100).springify()}>
                        <Image
                            source={require("../src/assets/images/splash-icon.png")}
                            style={styles.logoIcon}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                    </Animated.View>
                    <Animated.Text
                        entering={FadeInUp.delay(280).springify()}
                        style={styles.appTitle}
                    >Tilo
                    </Animated.Text>
                </View>

                {!isReady ? (
                    <ActivityIndicator
                        size="large"
                        color={COLORS.primary}
                        style={styles.loader}
                    />
                ) : (
                    <Animated.View
                        entering={FadeInUp.delay(400).springify()}
                        style={[styles.actionsBlock, {width: buttonWidth as any}]}
                    >
                        <TouchableOpacity
                            style={styles.chaptersButton}
                            onPress={handleChapters}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.chaptersButtonText}>Bölümler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                {width: continueButtonWidth as any},
                            ]}
                            onPress={handleContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueTitle}>
                                {hasProgress ? "Devam Et" : "Başla"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: BOARD_PADDING,
    },
    statsTopBar: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        alignItems: "center",
    },
    hero: {
        alignItems: "center",
        marginTop: "15%"
    },
    logoIcon: {
        width: 244,
        height: 244,
    },
    appTitle: {
        fontSize: 30,
        fontWeight: "700",
        color: COLORS.white,
    },
    loader: {
        marginTop: 8,
    },
    actionsBlock: {
        gap: 12,
        alignItems: "center",
        marginTop: "30%",
    },
    chaptersButton: {
        backgroundColor: COLORS.surface,
        width: "55%",
        paddingVertical: 16,
        paddingHorizontal: 36,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "space-between",
    },
    chaptersButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    chaptersCount: {
        color: COLORS.textPrimary,
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 40,
    },
    continueTitle: {
        color: COLORS.grayDark,
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    settingsOverlay: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 1000,
    },
});
