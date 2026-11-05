import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Fonts, Spacing } from '../theme';

const pantryLensLogo = require('../assets/pantrylens_logo.png');

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image
          source={pantryLensLogo}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onActionPress ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onActionPress}
          activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

      {secondaryActionLabel && onSecondaryActionPress ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onSecondaryActionPress}
          activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: 68,
    height: 68,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.navyPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.greenPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 14,
  },
  secondaryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  secondaryButtonText: {
    fontFamily: Fonts.semiBold,
    color: Colors.navyLight,
    fontSize: 13,
  },
});
