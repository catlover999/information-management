import React from 'react';
import * as RNW from 'react-native-web';

export * from 'react-native-web';

const absoluteFillObj = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

export const StyleSheet = {
  ...RNW.StyleSheet,
  absoluteFill: absoluteFillObj,
  absoluteFillObject: absoluteFillObj,
  create: <T extends Record<string, any>>(styles: T): T => RNW.StyleSheet.create(styles),
};

export const Image: React.FC<any> = ({ source, style, resizeMode = 'contain', ...rest }) => {
  let normalizedSource = source;
  if (typeof source === 'string') {
    normalizedSource = { uri: source };
  } else if (source && typeof source === 'object' && typeof source.uri === 'string') {
    // Strip leading file:// added by ScanScreen.tsx when wrapping data:/blob:/http: URLs
    const cleanUri = source.uri.replace(/^file:\/\/(?=(data:|blob:|https?:|\/))/i, '');
    normalizedSource = { ...source, uri: cleanUri };
  }
  return <RNW.Image source={normalizedSource} style={style} resizeMode={resizeMode} {...rest} />;
};

export const PermissionsAndroid = {
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  check: async () => true,
  request: async () => 'granted',
};

export const Linking = {
  ...RNW.Linking,
  openSettings: async () => {
    window.alert('Camera permissions can be managed in your browser address bar settings.');
  },
};
