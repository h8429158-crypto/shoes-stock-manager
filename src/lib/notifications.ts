import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let permissionAsked = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Inventory alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionAsked || !current.canAskAgain) return false;
  permissionAsked = true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Fire a local notification. Used for low-stock alerts and PO-received
 * events detected via Realtime while the app is running. (True remote push
 * would require a server component — see README.)
 */
export async function notify(title: string, body: string): Promise<void> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // Notifications are best-effort; never crash the app over them.
  }
}

// De-dupe low stock alerts per product per session so users aren't spammed.
const alertedProducts = new Set<string>();

export async function notifyLowStockOnce(productId: string, name: string, quantity: number): Promise<void> {
  if (alertedProducts.has(productId)) return;
  alertedProducts.add(productId);
  await notify(
    quantity <= 0 ? 'Out of stock' : 'Low stock',
    quantity <= 0 ? `${name} is out of stock.` : `${name} is low (${quantity} left).`
  );
}
