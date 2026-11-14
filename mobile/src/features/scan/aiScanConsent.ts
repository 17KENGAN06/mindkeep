import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Food and receipt scans send the photo (and the meal note) through our server to Google Gemini.
 * App Store guideline 5.1.2(i) asks apps to name a third-party AI and get the user's permission
 * before the first such transfer, so both scans call this before sending anything. The answer is
 * kept on this device; "Cancel" sends nothing and asks again next time.
 */
const CONSENT_KEY = 'mindkeep.aiScanConsent.v1';

let granted = false;

type Translate = (key: string) => string;

export async function ensureAiScanConsent(t: Translate): Promise<boolean> {
  if (granted) return true;
  try {
    if ((await AsyncStorage.getItem(CONSENT_KEY)) === '1') {
      granted = true;
      return true;
    }
  } catch {
    // Storage unavailable: fall through and ask.
  }
  return new Promise((resolve) => {
    let answered = false;
    const answer = (value: boolean) => {
      if (answered) return;
      answered = true;
      resolve(value);
    };
    Alert.alert(
      t('scanConsent.title'),
      t('scanConsent.body'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => answer(false) },
        {
          text: t('scanConsent.allow'),
          onPress: () => {
            granted = true;
            void AsyncStorage.setItem(CONSENT_KEY, '1').catch(() => undefined);
            answer(true);
          },
        },
      ],
      { cancelable: true, onDismiss: () => answer(false) },
    );
  });
}
