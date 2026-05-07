import { initializeAds } from "./adManager";

export async function runMobileAdsSetup(): Promise<void> {
  await initializeAds();
}
