import * as Haptics from 'expo-haptics';
import { useStore } from '@/store/useStore';

/** Haptics gated on the user setting. Safe no-ops if unavailable. */
export const haptic = {
  light() {
    if (!useStore.getState().settings.hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium() {
    if (!useStore.getState().settings.hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy() {
    if (!useStore.getState().settings.hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  success() {
    if (!useStore.getState().settings.hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
  },
  warning() {
    if (!useStore.getState().settings.hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {}
    );
  },
  /** A celebratory triple-buzz for PRs. */
  celebrate() {
    if (!useStore.getState().settings.hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    setTimeout(
      () =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
      140
    );
    setTimeout(
      () =>
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
      280
    );
  },
};
