import { Platform } from "react-native";
import mobileAds, {
    AdEventType,
    InterstitialAd,
    MaxAdContentRating,
    RewardedAd,
    RewardedAdEventType,
    TestIds
} from "react-native-google-mobile-ads";
import { AD_CONFIG } from "../constants/gameConfig";
import { useAdStore } from "../store/adStore";

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
let isInterstitialLoading = false;
let isRewardedLoading = false;
let interstitialLoadGeneration = 0;
let rewardedLoadGeneration = 0;
let interstitialRetryTimer: ReturnType<typeof setTimeout> | null = null;
let rewardedRetryTimer: ReturnType<typeof setTimeout> | null = null;
let interstitialLoadUnsubs: Array<() => void> = [];
let rewardedLoadUnsubs: Array<() => void> = [];

const cleanupInterstitialLoadListeners = () => {
    interstitialLoadUnsubs.forEach((unsubscribe) => unsubscribe());
    interstitialLoadUnsubs = [];
};

const cleanupRewardedLoadListeners = () => {
    rewardedLoadUnsubs.forEach((unsubscribe) => unsubscribe());
    rewardedLoadUnsubs = [];
};

const clearInterstitialRetry = () => {
    if (interstitialRetryTimer) {
        clearTimeout(interstitialRetryTimer);
        interstitialRetryTimer = null;
    }
};

const clearRewardedRetry = () => {
    if (rewardedRetryTimer) {
        clearTimeout(rewardedRetryTimer);
        rewardedRetryTimer = null;
    }
};

const scheduleInterstitialLoad = (delayMs = 0) => {
    clearInterstitialRetry();
    interstitialRetryTimer = setTimeout(() => {
        interstitialRetryTimer = null;
        loadInterstitial();
    }, delayMs);
};

const scheduleRewardedLoad = (delayMs = 0) => {
    clearRewardedRetry();
    rewardedRetryTimer = setTimeout(() => {
        rewardedRetryTimer = null;
        loadRewarded();
    }, delayMs);
};

// ==========================================
// INTERSTITIAL ADS
// ==========================================

export const loadInterstitial = () => {
    if (isInterstitialLoaded || isInterstitialLoading) return;

    const generation = interstitialLoadGeneration + 1;
    interstitialLoadGeneration = generation;
    isInterstitialLoading = true;
    isInterstitialLoaded = false;
    clearInterstitialRetry();
    cleanupInterstitialLoadListeners();
    useAdStore.getState().actions.setInterstitialReady(false);

    try {
        const ad = InterstitialAd.createForAdRequest(getInterstitialId());
        interstitialAd = ad;

        const isCurrent = () =>
            generation === interstitialLoadGeneration && interstitialAd === ad;

        interstitialLoadUnsubs.push(ad.addAdEventListener(AdEventType.LOADED, () => {
            if (!isCurrent()) return;
            isInterstitialLoading = false;
            isInterstitialLoaded = true;
            useAdStore.getState().actions.setInterstitialReady(true);
            console.log("📺 Interstitial loaded");
        }));

        interstitialLoadUnsubs.push(ad.addAdEventListener(AdEventType.CLOSED, () => {
            if (!isCurrent()) return;
            isInterstitialLoading = false;
            isInterstitialLoaded = false;
            useAdStore.getState().actions.setInterstitialReady(false);
            scheduleInterstitialLoad();
        }));

        interstitialLoadUnsubs.push(ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
            if (!isCurrent()) return;
            console.log("📺 Interstitial error:", error);
            isInterstitialLoading = false;
            isInterstitialLoaded = false;
            useAdStore.getState().actions.setInterstitialReady(false);
            if (!useAdStore.getState().isAdShowing) {
                scheduleInterstitialLoad(5000);
            }
        }));

        ad.load();
    } catch (error) {
        console.log("📺 Interstitial init error:", error);
        isInterstitialLoading = false;
        isInterstitialLoaded = false;
        useAdStore.getState().actions.setInterstitialReady(false);
        scheduleInterstitialLoad(5000);
    }
};

export const showInterstitial = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        let resolved = false;
        let unsubOpened: () => void = () => {};
        let unsubClose: () => void = () => {};
        let unsubError: () => void = () => {};
        const cleanupShowListeners = () => {
            unsubOpened();
            unsubClose();
            unsubError();
        };
        const finish = (shown: boolean) => {
            if (resolved) return;
            resolved = true;
            cleanupShowListeners();
            useAdStore.getState().actions.setAdShowing(false);
            resolve(shown);
        };

        try {
            if (!interstitialAd || !isInterstitialLoaded) {
                console.log("📺 Interstitial show skipped: not loaded");
                resolve(false);
                return;
            }

            const ad = interstitialAd;
            let markedCooldown = false;
            unsubOpened = ad.addAdEventListener(
                AdEventType.OPENED,
                () => {
                    unsubOpened();
                    if (!markedCooldown) {
                        markedCooldown = true;
                        useAdStore.getState().actions.markInterstitialShown();
                    }
                },
            );

            unsubClose = ad.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log("📺 Interstitial closed by user");
                    finish(markedCooldown);
                },
            );

            unsubError = ad.addAdEventListener(
                AdEventType.ERROR,
                () => {
                    console.log("📺 Interstitial error during show");
                    isInterstitialLoaded = false;
                    isInterstitialLoading = false;
                    useAdStore.getState().actions.setInterstitialReady(false);
                    finish(markedCooldown);
                    scheduleInterstitialLoad(5000);
                },
            );

            isInterstitialLoaded = false;
            useAdStore.getState().actions.setInterstitialReady(false);
            useAdStore.getState().actions.setAdShowing(true);
            ad.show();
        } catch (error) {
            console.log("📺 Interstitial show error:", error);
            isInterstitialLoaded = false;
            isInterstitialLoading = false;
            useAdStore.getState().actions.setInterstitialReady(false);
            finish(false);
            scheduleInterstitialLoad(5000);
        }
    });
};

// ==========================================
// REWARDED ADS
// ==========================================

export const loadRewarded = () => {
    if (isRewardedLoaded || isRewardedLoading) return;

    const generation = rewardedLoadGeneration + 1;
    rewardedLoadGeneration = generation;
    isRewardedLoading = true;
    isRewardedLoaded = false;
    clearRewardedRetry();
    cleanupRewardedLoadListeners();
    useAdStore.getState().actions.setRewardedReady(false);

    try {
        const ad = RewardedAd.createForAdRequest(getRewardedId());
        rewardedAd = ad;

        const isCurrent = () =>
            generation === rewardedLoadGeneration && rewardedAd === ad;

        rewardedLoadUnsubs.push(ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            if (!isCurrent()) return;
            isRewardedLoading = false;
            isRewardedLoaded = true;
            useAdStore.getState().actions.setRewardedReady(true);
            console.log("🎁 Rewarded loaded");
        }));

        rewardedLoadUnsubs.push(ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            if (!isCurrent()) return;
            console.log("🎁 Reward earned");
        }));

        rewardedLoadUnsubs.push(ad.addAdEventListener(AdEventType.CLOSED, () => {
            if (!isCurrent()) return;
            isRewardedLoading = false;
            isRewardedLoaded = false;
            useAdStore.getState().actions.setRewardedReady(false);
            scheduleRewardedLoad();
        }));

        rewardedLoadUnsubs.push(ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
            if (!isCurrent()) return;
            console.log("🎁 Rewarded error:", error);
            isRewardedLoading = false;
            isRewardedLoaded = false;
            useAdStore.getState().actions.setRewardedReady(false);
            if (!useAdStore.getState().isAdShowing) {
                scheduleRewardedLoad(5000);
            }
        }));

        ad.load();
    } catch (error) {
        console.log("🎁 Rewarded init error:", error);
        isRewardedLoading = false;
        isRewardedLoaded = false;
        useAdStore.getState().actions.setRewardedReady(false);
        scheduleRewardedLoad(5000);
    }
};

export const showRewarded = (): Promise<boolean> => {
    return new Promise((resolve) => {
        let resolved = false;
        let earnedReward = false;
        let unsubscribeReward: () => void = () => {};
        let unsubscribeClose: () => void = () => {};
        let unsubscribeError: () => void = () => {};
        const cleanupShowListeners = () => {
            unsubscribeReward();
            unsubscribeClose();
            unsubscribeError();
        };
        const finish = (earned: boolean) => {
            if (resolved) return;
            resolved = true;
            cleanupShowListeners();
            useAdStore.getState().actions.setAdShowing(false);
            if (earned) {
                useAdStore.getState().actions.markRewardedShown();
            }
            resolve(earned);
        };

        try {
            if (!rewardedAd || !isRewardedLoaded) {
                console.log("🎁 Rewarded show skipped: not loaded");
                resolve(false);
                return;
            }

            const ad = rewardedAd;

            unsubscribeReward = ad.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => {
                unsubscribeReward();
                earnedReward = true;
            },
            );

            unsubscribeClose = ad.addAdEventListener(
            AdEventType.CLOSED,
            () => {
                finish(earnedReward);
            },
            );

            unsubscribeError = ad.addAdEventListener(
            AdEventType.ERROR,
            () => {
                isRewardedLoaded = false;
                isRewardedLoading = false;
                useAdStore.getState().actions.setRewardedReady(false);
                finish(false);
                scheduleRewardedLoad(5000);
            },
            );

            isRewardedLoaded = false;
            useAdStore.getState().actions.setRewardedReady(false);
            useAdStore.getState().actions.setAdShowing(true);
            ad.show();
        } catch (error) {
            console.log("🎁 Rewarded show error:", error);
            isRewardedLoaded = false;
            isRewardedLoading = false;
            useAdStore.getState().actions.setRewardedReady(false);
            finish(false);
            scheduleRewardedLoad(5000);
        }
    });
};

// ==========================================
// INITIALIZATION
// ==========================================

// Önce request configuration, sonra resmi SDK initialize(); ancak o zaman load çağrılır (invertase dokümantasyonu).
export async function initializeAds(): Promise<void> {
    await new Promise<void>((r) => setTimeout(r, 400));

    try {
        console.log("📺 Initializing Google Mobile Ads SDK...");
        await mobileAds().setRequestConfiguration({
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
            maxAdContentRating: MaxAdContentRating.MA,
            testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
        });
        await mobileAds().initialize();
        console.log("📺 Google Mobile Ads SDK initialized");

        loadInterstitial();
        loadRewarded();
    } catch (error) {
        console.log("📺 Ad initialization error:", error);
    }
}
