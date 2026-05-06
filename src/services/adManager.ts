import {Platform} from "react-native";
import mobileAds ,{
    MaxAdContentRating,
    InterstitialAd,
    RewardedAd,
    AdEventType,
    RewardedAdEventType,
    TestIds
} from "react-native-google-mobile-ads";
import {AD_CONFIG} from "../constants/gameConfig";
import {useAdStore} from "../store/adStore";

const getInterstitialId = () => {
    if (__DEV__ && TestIds) return TestIds.INTERSTITIAL;
    return Platform.OS === "ios"
        ? AD_CONFIG.interstitial.ios
        : AD_CONFIG.interstitial.android;
};

const getRewardedId = () => {
    if (__DEV__ && TestIds) return TestIds.REWARDED;
    return Platform.OS === "ios"
        ? AD_CONFIG.rewarded.ios
        : AD_CONFIG.rewarded.android;
};

// ==========================================
// AD INSTANCES
// ==========================================

let interstitialAd: any = null;
let rewardedAd: any = null;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;

// ==========================================
// INTERSTITIAL ADS
// ==========================================

export const loadInterstitial = () => {

    try {
        interstitialAd = InterstitialAd.createForAdRequest(getInterstitialId());

        interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
            isInterstitialLoaded = true;
            useAdStore.getState().actions.setInterstitialReady(true);
            console.log("📺 Interstitial loaded");
        });

        interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
            isInterstitialLoaded = false;
            useAdStore.getState().actions.setInterstitialReady(false);
            loadInterstitial(); // Preload next
        });

        interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
            console.log("📺 Interstitial error:", error);
            isInterstitialLoaded = false;
            useAdStore.getState().actions.setInterstitialReady(false);
        });

        interstitialAd.load();
    } catch (error) {
        console.log("📺 Interstitial init error:", error);
    }
};

export const showInterstitial = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        try {
            // Listen for ad close event BEFORE showing
            const closeListener = interstitialAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log("📺 Interstitial closed by user");
                    useAdStore.getState().actions.setAdShowing(false); // Enable other ads
                    closeListener(); // Remove listener
                    resolve(true); // Ad was watched
                },
            );

            // Also handle errors
            const errorListener = interstitialAd.addAdEventListener(
                AdEventType.ERROR,
                () => {
                    console.log("📺 Interstitial error during show");
                    errorListener();
                    resolve(false);
                },
            );

            interstitialAd.show();
            useAdStore.getState().actions.setAdShowing(true); // Disable other ads
            useAdStore.getState().actions.markInterstitialShown();
        } catch (error) {
            console.log("📺 Interstitial show error:", error);
            useAdStore.getState().actions.setAdShowing(false); // Reset on error
            resolve(false);
        }
    });
};

// ==========================================
// REWARDED ADS
// ==========================================

export const loadRewarded = () => {
    try {
        rewardedAd = RewardedAd.createForAdRequest(getRewardedId());

        rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
            isRewardedLoaded = true;
            useAdStore.getState().actions.setRewardedReady(true);
            console.log("🎁 Rewarded loaded");
        });

        rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            console.log("🎁 Reward earned");
        });

        rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
            isRewardedLoaded = false;
            useAdStore.getState().actions.setRewardedReady(false);
            loadRewarded(); // Preload next
        });

        rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
            console.log("🎁 Rewarded error:", error);
            isRewardedLoaded = false;
            useAdStore.getState().actions.setRewardedReady(false);
        });

        rewardedAd.load();
    } catch (error) {
        console.log("🎁 Rewarded init error:", error);
    }
};

export const showRewarded = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const unsubscribeReward = rewardedAd.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => {
                unsubscribeReward();
                useAdStore.getState().actions.setAdShowing(false);
                useAdStore.getState().actions.markRewardedShown();
                resolve(true);
            },
        );

        const unsubscribeClose = rewardedAd.addAdEventListener(
            AdEventType.CLOSED,
            () => {
                unsubscribeClose();
                useAdStore.getState().actions.setAdShowing(false);
            },
        );

        const unsubscribeError = rewardedAd.addAdEventListener(
            AdEventType.ERROR,
            () => {
                unsubscribeError();
                useAdStore.getState().actions.setAdShowing(false);
                resolve(false);
            },
        );

        try {
            if (rewardedAd) {
                rewardedAd.show();
                useAdStore.getState().actions.setAdShowing(true);
            } else {
                throw new Error("Rewarded ad instance is null");
            }
        } catch (error) {
            console.log("🎁 Rewarded show error:", error);
            useAdStore.getState().actions.setAdShowing(false);
            resolve(false);
        }
    });
};

// ==========================================
// INITIALIZATION
// ==========================================

// PERFORMANCE: Deferred initialization to prevent blocking splash/animations
export const initializeAds = () => {

    // Defer ad loading to prevent JS bridge contention during startup
    // This allows splash screen and initial animations to complete smoothly
    setTimeout(() => {
        console.log("📺 Initializing ads (deferred)...");

        mobileAds()
            .setRequestConfiguration({
                // Child-directed setting
                tagForChildDirectedTreatment: true,
                // Under-age of consent setting
                tagForUnderAgeOfConsent: true,
                // Content rating: General audiences (G)
                maxAdContentRating: MaxAdContentRating.G,
            })
            .then(() => {
                console.log("📺 AdMob configuration set for Families Policy");
            });

        loadInterstitial();
        loadRewarded();
    }, 1500); // 1.5s delay after app is interactive
};
