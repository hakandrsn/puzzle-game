import * as Updates from "expo-updates";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";

export type CheckUpdateResult =
  | { kind: "no_update" }
  | { kind: "fetch_started" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

export function useAppUpdate() {
  const supported = Platform.OS !== "web" && Updates.isEnabled;

  const {
    isChecking,
    isDownloading,
    isRestarting,
    isUpdatePending,
    checkError,
    downloadError,
    ...rest
  } = Updates.useUpdates();

  useEffect(() => {
    if (!supported || !isUpdatePending) return;
    void Updates.reloadAsync();
  }, [supported, isUpdatePending]);

  const checkAndApplyUpdate = useCallback(async (): Promise<CheckUpdateResult> => {
    if (!supported) {
      return { kind: "unsupported" };
    }

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isRollBackToEmbedded) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        return { kind: "fetch_started" };
      }

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        return { kind: "fetch_started" };
      }

      return { kind: "no_update" };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Güncelleme kontrol edilemedi.";
      return { kind: "error", message };
    }
  }, [supported]);

  const busy = isChecking || isDownloading || isRestarting;

  return {
    supported,
    busy,
    checkAndApplyUpdate,
    checkError,
    downloadError,
    ...rest,
  };
}
