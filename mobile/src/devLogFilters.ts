import { LogBox } from 'react-native';

// Imported first in index.ts, before any library runs its own startup code.
// Expo Go on Android has no remote push; expo-notifications logs that at startup even though
// MindKeep only uses on-device (local) reminders, which do work there. Real builds never show it.
LogBox.ignoreLogs([
  /Android Push notifications \(remote notifications\)/,
  /`expo-notifications` functionality is not fully supported in Expo Go/,
]);
