# PantryLens

**PantryLens** is a React Native mobile application designed to help households manage their pantry and emergency supplies through an interactive inventory checklist (pre-populated with the official **Swiss Emergency Plan** supplies) and a live camera scanning experience.

---

## Features

- **Pantry & Emergency Checklist (`Pantry` Tab)**
  - Pre-populated with all **24 official Swiss Emergency Plan supplies** organized across `Beverages`, `Food`, and `Additional supplies`.
  - **Preparedness Progress Bar**: Real-time summary of stocked vs. total supplies.
  - **Category Filtering**: Filter items by `All`, `Beverages`, `Food`, or `Additional supplies`.
  - **Add, Edit & Delete Items**: Full CRUD support with form validation and delete confirmation dialogs.
  - **Rich Item Metadata**: Edit item name, category, storage location, expiry date (via native date picker with semantic expiry status indicators), and multiline notes.
  - **Item Detail Bottom Sheet**: Tap any supply item to inspect its full metadata, toggle stocked status, edit fields, or delete the item.
  - **Drag-and-Drop Reordering**: Hold and drag the `⠿` handle (or long-press an item card) to rearrange supplies in any custom order.
  - **Offline-First Local Persistence**: Automatically persists custom items, metadata, checkbox states, and custom item ordering using `@react-native-async-storage/async-storage` without overwriting existing user data on restart.
- **Live Camera Scanner (`Scan` Tab)**
  - **Runtime Camera Permissions**: Requests Android camera permission and provides a graceful recovery UI with direct deep-linking to Android System Settings if denied.
  - **Live Hardware Camera Preview**: Powered by `react-native-vision-camera` (CameraX on Android) with framing reticle, flash mode toggle (`OFF` / `ON` / `AUTO`), and front/rear lens switching.
  - **Photo Capture & Inspection**: Captures real photos using the device camera, displays the captured image preview with resolution and capture timestamp metadata, and allows retaking photos at any time.

---

## Dependencies

| Package | Purpose |
| :--- | :--- |
| `react-native` (`0.88.1`) & `react` (`19.3.0`) | Core mobile framework |
| `@react-navigation/native` & `@react-navigation/bottom-tabs` | Bottom-tab navigation (`Pantry` & `Scan`) |
| `react-native-screens` & `react-native-safe-area-context` | Native navigation primitives & safe area insets |
| `@react-native-async-storage/async-storage` | Offline local persistence for inventory state |
| `react-native-vision-camera`, `react-native-nitro-modules`, `react-native-nitro-image` | Live camera preview and hardware photo capture |
| `react-native-draglist` | Smooth drag-and-drop list reordering |
| `@react-native-community/datetimepicker` | Native date picker for item expiry dates |

---

## Project Architecture

```text
PantryLens/
├── App.tsx                           # Application root & SafeArea/StatusBar setup
├── src/
│   ├── components/
│   │   ├── CategoryFilterBar.tsx     # Horizontal category filter pills with counts
│   │   ├── ConfirmDeleteModal.tsx    # App-themed delete confirmation dialog modal
│   │   ├── EmptyState.tsx            # Empty state views with recovery actions
│   │   ├── HeaderLogo.tsx            # PantryLens brand header & lens emblem
│   │   ├── InventoryItemCard.tsx     # Checklist row with checkbox, badges & drag handle
│   │   ├── ItemDetailModal.tsx       # Bottom sheet modal displaying full item details
│   │   ├── ItemFormModal.tsx         # Add/Edit modal with validation & date picker
│   │   └── ProgressSummaryCard.tsx   # Preparedness progress bar & quick-add button
│   ├── hooks/
│   │   ├── useCameraPermission.tsx   # Android & VisionCamera permission state hook
│   │   └── useInventory.ts           # Inventory CRUD, drag-and-drop & persistence hook
│   ├── models/
│   │   └── inventory.ts              # Strongly typed TypeScript interfaces
│   ├── navigation/
│   │   └── AppNavigator.tsx          # Bottom-tab navigator (Pantry & Scan tabs)
│   ├── screens/
│   │   ├── PantryScreen.tsx          # Primary inventory checklist & management screen
│   │   └── ScanScreen.tsx            # Live camera preview, capture & photo review screen
│   ├── services/
│   │   ├── permissionService.ts      # Android camera permissions & settings helper
│   │   └── seedData.ts               # Swiss Emergency Plan initial 24 items
│   ├── storage/
│   │   └── inventoryStorage.ts       # AsyncStorage persistence layer
│   ├── theme/
│   │   └── index.ts                  # Design tokens (Navy & Green palette, spacing, shadows)
│   └── utils/
│       ├── dateUtils.ts              # ISO date formatting & expiry status calculation
│       ├── idGenerator.ts            # Unique ID generator for custom items
│       └── validation.ts             # Form validation rules
└── android/                          # Native Android project & Gradle configuration
```

---

## Installation Instructions

1. **Clone the repository and install Node dependencies**:
   > Requires **Node.js >= 22.11.0** and **JDK 21**.

   ```bash
   npm install --legacy-peer-deps
   ```

---

## Android Setup

1. **Android SDK Configuration**:
   Ensure the Android SDK is installed via Android Studio (`~/Library/Android/sdk` on macOS).
   Verify that `android/local.properties` points to your SDK location:
   ```properties
   sdk.dir=/Users/<your-username>/Library/Android/sdk
   ```
   Or export `ANDROID_HOME` in your `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```

2. **Permissions (`AndroidManifest.xml`)**:
   Camera permissions are pre-configured in `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-feature android:name="android.hardware.camera" android:required="false" />
   ```

3. **Connect a Device or Launch an Emulator**:
   Verify an Android device or emulator is connected:
   ```bash
   adb devices
   ```

---

## iOS Setup

> **Note**: This project primarily targets Android devices. For standard React Native iOS setup on macOS:
1. Install CocoaPods dependencies:
   ```bash
   cd ios && bundle install && bundle exec pod install && cd ..
   ```
2. Add `NSCameraUsageDescription` to `ios/PantryLens/Info.plist`.

---

## How to Run the Application

1. **Start the Metro Bundler**:
   ```bash
   npm start
   ```

2. **Build and Install on Android**:
   In a separate terminal window, run:
   ```bash
   npm run android
   ```
   Or build and install the debug APK directly via Gradle:
   ```bash
   cd android && ./gradlew installDebug
   ```

3. **Run Unit Tests & Typecheck**:
   ```bash
   npm test
   npx tsc --noEmit
   ```
