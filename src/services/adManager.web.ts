export const loadInterstitial = () => {};

export const showInterstitial = async (): Promise<boolean> => false;

export const loadRewarded = () => {};

export const showRewarded = (): Promise<boolean> => Promise.resolve(false);

export async function initializeAds(): Promise<void> {}
