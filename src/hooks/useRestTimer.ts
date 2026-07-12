import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { haptic } from '@/utils/feedback';
import {
  cancelScheduled,
  ensureNotificationPermissions,
  scheduleRestDone,
} from '@/utils/notifications';

interface RestTimerState {
  running: boolean;
  /** whole seconds remaining */
  remaining: number;
  /** the total the current run was started with */
  total: number;
  start: (seconds: number) => void;
  addTime: (delta: number) => void;
  stop: () => void;
}

/**
 * A rest countdown driven by an absolute end-timestamp so it stays accurate
 * across screen-off / background time. A local notification is scheduled to
 * fire when it ends; on natural completion in the foreground we buzz.
 */
export function useRestTimer(): RestTimerState {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);

  const endAtRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef = useRef<string | null>(null);
  const firedRef = useRef(false);

  const clearLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearLoop();
    setRunning(false);
    setRemaining(0);
    if (!firedRef.current) {
      firedRef.current = true;
      haptic.celebrate();
    }
  }, [clearLoop]);

  const tick = useCallback(() => {
    const secs = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setRemaining(secs);
    if (secs <= 0) finish();
  }, [finish]);

  const stop = useCallback(() => {
    clearLoop();
    setRunning(false);
    setRemaining(0);
    cancelScheduled(notifIdRef.current);
    notifIdRef.current = null;
  }, [clearLoop]);

  const start = useCallback(
    (seconds: number) => {
      clearLoop();
      cancelScheduled(notifIdRef.current);
      firedRef.current = false;
      endAtRef.current = Date.now() + seconds * 1000;
      setTotal(seconds);
      setRemaining(seconds);
      setRunning(true);
      ensureNotificationPermissions().then(() => {
        scheduleRestDone(seconds).then((id) => {
          notifIdRef.current = id;
        });
      });
      intervalRef.current = setInterval(tick, 250);
    },
    [clearLoop, tick]
  );

  const addTime = useCallback(
    (delta: number) => {
      if (!running) return;
      endAtRef.current = Math.max(Date.now(), endAtRef.current + delta * 1000);
      const secs = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(secs);
      setTotal((t) => Math.max(secs, t + delta));
      // reschedule the notification to the new end time
      cancelScheduled(notifIdRef.current);
      notifIdRef.current = null;
      scheduleRestDone(secs).then((id) => {
        notifIdRef.current = id;
      });
    },
    [running]
  );

  // Re-sync when returning from background (interval may have been throttled).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active' && running) tick();
    });
    return () => sub.remove();
  }, [running, tick]);

  useEffect(() => () => clearLoop(), [clearLoop]);

  return { running, remaining, total, start, addTime, stop };
}
