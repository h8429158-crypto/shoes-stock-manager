import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useStore } from '@/store/useStore';

let configured = false;

/** Foreground presentation: show a banner + play sound when a timer fires. */
export function configureNotifications() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const sound = useStore.getState().settings.soundEnabled;
      return {
        // shouldShowAlert is deprecated but still required by the current types
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: sound,
        shouldSetBadge: false,
      };
    },
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rest-timer', {
        name: 'Rest Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        sound: 'default',
      });
    }
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule the "rest over" notification `seconds` from now so it fires even if
 * the screen is off / app is backgrounded. Returns the notification id.
 */
export async function scheduleRestDone(seconds: number): Promise<string | null> {
  try {
    const sound = useStore.getState().settings.soundEnabled;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest complete 💪',
        body: 'Time for your next set.',
        sound: sound ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: Platform.OS === 'android' ? 'rest-timer' : undefined,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelScheduled(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}
