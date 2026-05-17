import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { AdsConsent, AdsConsentStatus } from "react-native-google-mobile-ads";
import { initializeAds } from "./adManager";

export async function runMobileAdsSetup(): Promise<void> {
  try {
    await requestTrackingPermissionsAsync();
  } catch (e) {
    console.log("📺 Tracking permission skipped:", e);
  }

  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (
      consentInfo.status === AdsConsentStatus.REQUIRED ||
      consentInfo.status === AdsConsentStatus.UNKNOWN
    ) {
      await AdsConsent.showForm();
    }
  } catch (e) {
    console.log("📺 Consent flow skipped (simulator?):", e);
  }

  await initializeAds();
}
