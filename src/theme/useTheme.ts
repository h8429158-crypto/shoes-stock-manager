import { useStore } from '@/store/useStore';
import { getTheme, Theme } from '@/theme';

/** Returns the active theme derived from the persisted settings. */
export function useTheme(): Theme {
  const mode = useStore((s) => s.settings.theme);
  return getTheme(mode);
}
