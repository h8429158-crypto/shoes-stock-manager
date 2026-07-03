// On the web, React Native's Alert.alert shows the message but never calls the
// button handlers, so confirmations like "Sell", "Delete" or "Sign out" would
// do nothing. This maps Alert.alert to the browser's native confirm/alert so
// those actions work in the web app too. No effect on native (phone) builds.
import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');

    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      const only = buttons && buttons[0];
      if (only && only.onPress) only.onPress();
      return;
    }

    const ok = window.confirm(text);
    if (ok) {
      const action = buttons.find((b) => b.style !== 'cancel');
      if (action && action.onPress) action.onPress();
    } else {
      const cancel = buttons.find((b) => b.style === 'cancel');
      if (cancel && cancel.onPress) cancel.onPress();
    }
  };
}
