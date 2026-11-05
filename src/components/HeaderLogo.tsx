import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Fonts, Spacing } from '../theme';

const pantryLensLogo = require('../assets/pantrylens_logo.png');

interface HeaderLogoProps {
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({
  subtitle = 'Swiss Emergency & Pantry Checklist',
  rightElement,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.brandRow}>
        <View style={styles.logoFrame}>
          <Image
            source={pantryLensLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.brandPantry}>Pantry</Text>
            <Text style={styles.brandLens}>Lens</Text>
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      {rightElement ? <View>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.navyPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyMedium,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoFrame: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.greenPrimary,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  titleBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandPantry: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: Colors.textOnPrimary,
    letterSpacing: -0.3,
  },
  brandLens: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: Colors.greenMedium,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: -2,
  },
});
