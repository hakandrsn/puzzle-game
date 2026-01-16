import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { COLORS } from '../constants/gameConfig';

interface WinModalProps {
  visible: boolean;
  moves: number;
  stars: number;
  isLastLevel: boolean;
  chapterColor?: string;
  onNextLevel: () => void;
  onReplay: () => void;
  onBackToLevels: () => void;
}

const Star: React.FC<{ filled: boolean; delay: number }> = ({ filled, delay }) => (
  <Animated.View entering={SlideInDown.delay(delay).springify()}>
    <Text style={[styles.star, filled && styles.starFilled]}>★</Text>
  </Animated.View>
);

const WinModal: React.FC<WinModalProps> = ({
  visible,
  moves,
  stars,
  isLastLevel,
  chapterColor,
  onNextLevel,
  onReplay,
  onBackToLevels,
}) => {
  const accentColor = chapterColor || COLORS.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.modalContainer}>
          <Text style={styles.title}>Tebrikler!</Text>
          <Text style={styles.subtitle}>Bulmacayı Tamamladın</Text>

          <View style={styles.starsContainer}>
            <Star filled={stars >= 1} delay={100} />
            <Star filled={stars >= 2} delay={200} />
            <Star filled={stars >= 3} delay={300} />
          </View>

          <View style={styles.statsContainer}>
            <Text style={[styles.statValue, { color: accentColor }]}>{moves}</Text>
            <Text style={styles.statLabel}>Hamle</Text>
          </View>

          <View style={styles.buttonsContainer}>
            {!isLastLevel && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={onNextLevel}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Sonraki Seviye</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onReplay} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onBackToLevels} activeOpacity={0.8}>
              <Text style={styles.tertiaryButtonText}>Seviyelere Dön</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  star: {
    fontSize: 44,
    color: COLORS.starEmpty,
  },
  starFilled: {
    color: COLORS.starFilled,
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButton: {},
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceLight,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

export default WinModal;
