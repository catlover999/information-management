export const Colors = {
  // Primary Navy Palette
  navyDark: '#0A1E32',
  navyPrimary: '#0F2942',
  navyMedium: '#1B3B5A',
  navyLight: '#2B547E',
  navySoft: '#E8EFF5',

  // Primary Green Palette
  greenDark: '#047857',
  greenPrimary: '#10B981',
  greenMedium: '#34D399',
  greenLight: '#D1FAE5',
  greenSoft: '#ECFDF5',

  // Backgrounds & Surfaces
  background: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  modalOverlay: 'rgba(10, 30, 50, 0.55)',

  // Text Colors
  textPrimary: '#0F2942',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Status & Semantic Colors
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderFocus: '#10B981',
  divider: '#F1F5F9',
};

export const Fonts = {
  regular: 'Poppins-Regular',
  italic: 'Poppins-Italic',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  extraBold: 'Poppins-ExtraBold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 9999,
};

export const Typography = {
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  caption: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  small: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#0F2942',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F2942',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
};
