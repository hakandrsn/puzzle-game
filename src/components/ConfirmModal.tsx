import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { COLORS } from "../constants/gameConfig";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // Made optional
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Onayla",
  cancelText = "Vazgeç",
  isDestructive = false,
}: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.springify()} style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                isDestructive && styles.destructiveButton,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  destructiveButton: {
    backgroundColor: "#FF453A", // iOS system red or a defined error color
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 15,
  },
  confirmText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
});
