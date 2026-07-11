import { create } from 'zustand';

interface SyncState {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (n: number) => void;
  setLastSyncAt: (iso: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  online: true,
  syncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  setOnline: (online) => set({ online }),
  setSyncing: (syncing) => set({ syncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}));
