import React from "react";
import {Platform, StyleSheet, Text, View} from "react-native";
import {AD_CONFIG, COLORS} from "../constants/gameConfig";
import {
    useAdActions,
    useIsAdShowing,
} from "../store/adStore";
import {BannerAd, BannerAdSize, TestIds} from "react-native-google-mobile-ads"


interface GameBannerAdProps {
    onAdLoaded?: () => void;
    onAdFailedToLoad?: () => void;
}

const GameBannerAd: React.FC<GameBannerAdProps> = ({
                                                       onAdLoaded,
                                                       onAdFailedToLoad,
                                                   }) => {
    const adActions = useAdActions();
    const isAdShowing = useIsAdShowing();


    if (!BannerAd || !BannerAdSize) {
        return null;
    }

    // Hide banner if a full-screen ad involves ensuring no multiple ads are shown
    if (isAdShowing) {
        return null;
    }

    const getBannerId = () => {
        if (__DEV__ && TestIds) return TestIds.BANNER;
        return Platform.OS === "ios"
            ? AD_CONFIG.banner.ios
            : AD_CONFIG.banner.android;
    };

    const handleAdLoaded = () => {
        console.log("📺 Banner ad loaded");
        adActions.setBannerReady(true);
        onAdLoaded?.();
    };

    const handleAdFailedToLoad = (error: any) => {
        console.log("📺 Banner ad failed to load:", error);
        adActions.setBannerReady(false);
        onAdFailedToLoad?.();
    };

    return (
        <View style={styles.bannerContainer}>
            <Text style={styles.adLabel}>Reklam</Text>
            <View style={styles.adWrapper}>
                <BannerAd
                    unitId={getBannerId()}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: false,
                    }}
                    onAdLoaded={handleAdLoaded}
                    onAdFailedToLoad={handleAdFailedToLoad}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        width: "100%",
        alignItems: "center",
        paddingVertical: 10, // Add spacing around banner
    },
    adLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: 4,
        opacity: 0.7,
    },
    adWrapper: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 50, // Minimum height for banner
    },
});

export default GameBannerAd;
