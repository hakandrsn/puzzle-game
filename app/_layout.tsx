import {COLORS} from "@/src/constants/colors";
import {initializeAds} from "@/src/services/adManager";
import {loginWithDevice} from "@/src/services/authService";
import {getDeviceId} from "@/src/services/deviceService";
import {useAdActions} from "@/src/store/adStore";
import {useProgressActions} from "@/src/store/progressStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {createAsyncStoragePersister} from "@tanstack/query-async-storage-persister";
import {QueryClient} from "@tanstack/react-query";
import {PersistQueryClientProvider} from "@tanstack/react-query-persist-client";
import {Stack} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {StatusBar} from "expo-status-bar";
import {useEffect, useState} from "react";
import {StyleSheet, View} from "react-native";
import {SafeAreaProvider} from "react-native-safe-area-context";
import CustomSplashScreen from "../src/components/CustomSplashScreen";
import {requestTrackingPermissionsAsync} from "expo-tracking-transparency";
import {setupSyncListener} from "@/src/services/syncQueue";
import {AdsConsent, AdsConsentStatus} from "react-native-google-mobile-ads";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 60 * 24, // 24 hours (Aggressive caching for offline)
            gcTime: 1000 * 60 * 60 * 24 * 2, // 48 hours
        },
    },
});

const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    const progressActions = useProgressActions();
    const adActions = useAdActions();

    useEffect(() => {
        async function prepare() {
            try {
                await SplashScreen.hideAsync();

                await loginWithDevice();
                await progressActions.loadProgress();
                await adActions.loadAdState();

                const {getChapters} = await import("../src/store/dataStore").then(
                    (m) => m.useDataStore.getState().actions,
                );
                await getChapters();

                try {
                    await requestTrackingPermissionsAsync();

                    const consentInfo = await AdsConsent.requestInfoUpdate();
                    if (
                        consentInfo.status === AdsConsentStatus.REQUIRED ||
                        consentInfo.status === AdsConsentStatus.UNKNOWN
                    ) {
                        await AdsConsent.showForm();
                    }

                    initializeAds()
                } catch (error) {
                    console.log("📺 Ad initialization skipped:", error);
                }
            } catch (e) {
                console.warn("App init error:", e);
            } finally {
                // Data is ready, start transitioning out the splash screen
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    // Sync Queue Setup
    useEffect(() => {
        let unsubscribe = setupSyncListener();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return (
        <SafeAreaProvider>
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{persister: asyncStoragePersister}}
            >
                <View style={styles.container}>
                    <StatusBar style="dark"/>

                    {/* Main App Content - Rendered but covered by Splash until ready */}
                    {appIsReady && (
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: {backgroundColor: COLORS.background},
                            }}
                        >
                            <Stack.Screen name="index"/>
                            <Stack.Screen
                                name="chapters"
                                options={{animation: "slide_from_right"}}
                            />
                            <Stack.Screen
                                name="levels/[chapterId]"
                                options={{
                                    animation: "slide_from_right",
                                    freezeOnBlur: true,
                                }}
                            />
                            <Stack.Screen
                                name="game/jigsaw/[chapterId]/[levelId]"
                                options={{animation: "slide_from_right"}}
                            />
                            <Stack.Screen
                                name="onboarding/index"
                                options={{
                                    animation: "fade",
                                    gestureEnabled: false,
                                }}
                            />
                        </Stack>
                    )}
                    {!appIsReady && <CustomSplashScreen/>}
                </View>
            </PersistQueryClientProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: COLORS.background},
});
