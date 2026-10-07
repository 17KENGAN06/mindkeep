import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Ask before leaving a form with unsaved changes (header back, Android back, iOS swipe,
 * programmatic navigation). Call `allowLeave()` right before navigating after a successful
 * save: React Navigation only sees state changes on the next render, a ref applies at once.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const leaveAllowed = useRef(false);
  const dialogOpen = useRef(false);

  usePreventRemove(dirty, ({ data }) => {
    if (leaveAllowed.current) {
      navigation.dispatch(data.action);
      return;
    }
    if (dialogOpen.current) return;
    dialogOpen.current = true;
    Alert.alert(
      t('drafts.title'),
      t('drafts.body'),
      [
        {
          text: t('drafts.keep'),
          style: 'cancel',
          onPress: () => {
            dialogOpen.current = false;
          },
        },
        {
          text: t('drafts.discard'),
          style: 'destructive',
          onPress: () => {
            dialogOpen.current = false;
            leaveAllowed.current = true;
            navigation.dispatch(data.action);
          },
        },
      ],
      {
        cancelable: true,
        // Android: tapping outside the dialog means "stay".
        onDismiss: () => {
          dialogOpen.current = false;
        },
      },
    );
  });

  return {
    allowLeave: () => {
      leaveAllowed.current = true;
    },
  };
}
