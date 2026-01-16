import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/gameConfig";

interface NetworkErrorProps {
  onRetry: () => void;
  message?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  message = "Veri yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📡</Text>
      </View>
      <Text style={styles.title}>Bağlantı Hatası</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Text style={styles.retryText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
});
