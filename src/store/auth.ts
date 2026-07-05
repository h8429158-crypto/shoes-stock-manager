import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { cacheClearAll, cacheGetAll, cachePut } from '@/db/database';
import { friendlyError, supabase } from '@/lib/supabase';
import type { Org, OrgMember, Role } from '@/lib/types';

const ACTIVE_ORG_KEY = 'stockroom.activeOrgId';

interface AuthState {
  initialized: boolean;
  session: Session | null;
  /** Orgs the user belongs to, with their role in each. */
  orgs: Org[];
  roleByOrg: Record<string, Role>;
  activeOrgId: string | null;
  orgsLoaded: boolean;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadOrgs: () => Promise<void>;
  createOrg: (name: string) => Promise<Org>;
  joinOrg: (code: string) => Promise<Org>;
  setActiveOrg: (orgId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  session: null,
  orgs: [],
  roleByOrg: {},
  activeOrgId: null,
  orgsLoaded: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    const activeOrgId = await AsyncStorage.getItem(ACTIVE_ORG_KEY);
    set({ session: data.session, activeOrgId, initialized: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      const prev = get().session;
      set({ session });
      if (prev && !session) {
        // Signed out elsewhere / session expired
        set({ orgs: [], roleByOrg: {}, activeOrgId: null, orgsLoaded: false });
      }
    });

    if (data.session) {
      await get().loadOrgs().catch(() => set({ orgsLoaded: true }));
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyError(error));
    await get().loadOrgs().catch(() => set({ orgsLoaded: true }));
  },

  signUp: async (fullName, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(friendlyError(error));
    return { needsConfirmation: !data.session };
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(friendlyError(error));
  },

  signOut: async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(ACTIVE_ORG_KEY);
    cacheClearAll();
    set({ session: null, orgs: [], roleByOrg: {}, activeOrgId: null, orgsLoaded: false });
  },

  loadOrgs: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;

    try {
      const { data: memberships, error } = await supabase
        .from('org_members')
        .select('org_id, user_id, role, created_at, orgs (*)')
        .eq('user_id', userId);
      if (error) throw error;

      const orgs: Org[] = [];
      const roleByOrg: Record<string, Role> = {};
      for (const m of memberships ?? []) {
        const org = (m as unknown as { orgs: Org }).orgs;
        if (org) {
          orgs.push(org);
          roleByOrg[org.id] = m.role as Role;
        }
      }
      cachePut('orgs', orgs as unknown as Record<string, unknown>[]);
      cachePut(
        'org_members',
        (memberships ?? []).map((m) => ({
          org_id: m.org_id,
          user_id: m.user_id,
          role: m.role,
          created_at: m.created_at,
        }))
      );

      let activeOrgId = get().activeOrgId;
      if (!activeOrgId || !orgs.some((o) => o.id === activeOrgId)) {
        activeOrgId = orgs[0]?.id ?? null;
        if (activeOrgId) await AsyncStorage.setItem(ACTIVE_ORG_KEY, activeOrgId);
      }
      set({ orgs, roleByOrg, activeOrgId, orgsLoaded: true });
    } catch (err) {
      // Offline: fall back to the cached memberships so the app still opens.
      const userId2 = get().session?.user.id;
      const cachedMembers = cacheGetAll<OrgMember>('org_members').filter((m) => m.user_id === userId2);
      const cachedOrgs = cacheGetAll<Org>('orgs').filter((o) => cachedMembers.some((m) => m.org_id === o.id));
      if (cachedOrgs.length > 0) {
        const roleByOrg: Record<string, Role> = {};
        for (const m of cachedMembers) roleByOrg[m.org_id] = m.role;
        set({
          orgs: cachedOrgs,
          roleByOrg,
          activeOrgId: get().activeOrgId ?? cachedOrgs[0].id,
          orgsLoaded: true,
        });
        return;
      }
      throw err;
    }
  },

  createOrg: async (name) => {
    const { data, error } = await supabase.rpc('create_org', { p_name: name });
    if (error) throw new Error(friendlyError(error));
    const org = data as Org;
    await AsyncStorage.setItem(ACTIVE_ORG_KEY, org.id);
    set({ activeOrgId: org.id });
    await get().loadOrgs().catch(() => {});
    return org;
  },

  joinOrg: async (code) => {
    const { data, error } = await supabase.rpc('join_org', { p_code: code });
    if (error) throw new Error(friendlyError(error));
    const org = data as Org;
    await AsyncStorage.setItem(ACTIVE_ORG_KEY, org.id);
    set({ activeOrgId: org.id });
    await get().loadOrgs().catch(() => {});
    return org;
  },

  setActiveOrg: async (orgId) => {
    await AsyncStorage.setItem(ACTIVE_ORG_KEY, orgId);
    set({ activeOrgId: orgId });
  },
}));

/** The caller's role in the active org (null while loading / no org). */
export function useActiveRole(): Role | null {
  const { activeOrgId, roleByOrg } = useAuthStore();
  return activeOrgId ? (roleByOrg[activeOrgId] ?? null) : null;
}

export function useActiveOrg(): Org | null {
  const { activeOrgId, orgs } = useAuthStore();
  return orgs.find((o) => o.id === activeOrgId) ?? null;
}
