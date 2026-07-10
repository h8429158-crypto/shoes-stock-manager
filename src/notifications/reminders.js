import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Show reminders even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = 'daily-reminder';

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#4CC38A',
    });
  }
}

export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

// (Re)schedule the single daily reminder. Called on app start and whenever the
// pending-task count or reminder settings change, so the body stays accurate.
export async function scheduleDailyReminder({ enabled, hour, minute, pendingCount }) {
  try {
    await ensureAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const count = pendingCount ?? 0;
    const body =
      count > 0
        ? `You have ${count} task${count === 1 ? '' : 's'} pending today`
        : 'Keep your streak alive — check in on today\'s tasks';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reward Habits',
        body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  } catch (e) {
    // Notifications are best-effort (e.g. unsupported on web) — never crash.
    // eslint-disable-next-line no-console
    console.warn('Failed to schedule reminder', e);
  }
}
