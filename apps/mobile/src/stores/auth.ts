import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Motorista } from '@rotavans/shared';
import { setToken } from '../lib/api';

interface DriverProfile {
  motorista: Motorista;
  token: string;
  pinConfigured: boolean;
  vehicleBound: boolean;
}

interface AuthState {
  profiles: DriverProfile[];
  activeMotoristaId: number | null;
  pinVerified: boolean;
  loading: boolean;
  upsertProfile: (profile: DriverProfile) => Promise<void>;
  setActiveProfile: (motoristaId: number) => Promise<void>;
  setPinConfigured: (motoristaId: number, value: boolean) => Promise<void>;
  setVehicleBound: (motoristaId: number, value: boolean) => Promise<void>;
  clearActiveProfile: () => Promise<void>;
  verifyPin: () => void;
  logoutActiveProfile: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const PROFILES_KEY = 'motorista_profiles';
const ACTIVE_ID_KEY = 'motorista_active_id';

function normalizeProfiles(raw: string | null): DriverProfile[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.motorista?.id && item?.token);
  } catch {
    return [];
  }
}

async function persistState(profiles: DriverProfile[], activeId: number | null) {
  await SecureStore.setItemAsync(PROFILES_KEY, JSON.stringify(profiles));
  if (activeId) {
    await SecureStore.setItemAsync(ACTIVE_ID_KEY, String(activeId));
  } else {
    await SecureStore.deleteItemAsync(ACTIVE_ID_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profiles: [],
  activeMotoristaId: null,
  pinVerified: false,
  loading: true,

  upsertProfile: async (incoming) => {
    const profiles = [...get().profiles];
    const index = profiles.findIndex((item) => item.motorista.id === incoming.motorista.id);
    if (index >= 0) {
      profiles[index] = { ...profiles[index], ...incoming };
    } else {
      profiles.push(incoming);
    }
    await persistState(profiles, incoming.motorista.id);
    await setToken(incoming.token);
    set({ profiles, activeMotoristaId: incoming.motorista.id, pinVerified: false });
  },

  setActiveProfile: async (motoristaId) => {
    const profile = get().profiles.find((item) => item.motorista.id === motoristaId);
    if (!profile) return;
    await persistState(get().profiles, motoristaId);
    await setToken(profile.token);
    set({ activeMotoristaId: motoristaId, pinVerified: false });
  },

  setPinConfigured: async (motoristaId, value) => {
    const profiles = get().profiles.map((item) =>
      item.motorista.id === motoristaId ? { ...item, pinConfigured: value } : item
    );
    await persistState(profiles, get().activeMotoristaId);
    set({ profiles });
  },

  setVehicleBound: async (motoristaId, value) => {
    const profiles = get().profiles.map((item) =>
      item.motorista.id === motoristaId ? { ...item, vehicleBound: value } : item
    );
    await persistState(profiles, get().activeMotoristaId);
    set({ profiles });
  },

  clearActiveProfile: async () => {
    await persistState(get().profiles, null);
    await setToken(null);
    set({ activeMotoristaId: null, pinVerified: false });
  },

  verifyPin: () => set({ pinVerified: true }),

  logoutActiveProfile: async () => {
    const activeId = get().activeMotoristaId;
    if (!activeId) return;
    const profiles = get().profiles.filter((item) => item.motorista.id !== activeId);
    const nextActive = profiles[0]?.motorista.id ?? null;
    await persistState(profiles, nextActive);
    if (nextActive) {
      const profile = profiles.find((item) => item.motorista.id === nextActive)!;
      await setToken(profile.token);
    } else {
      await setToken(null);
    }
    set({ profiles, activeMotoristaId: nextActive, pinVerified: false });
  },

  loadFromStorage: async () => {
    try {
      const [profilesRaw, activeIdRaw] = await Promise.all([
        SecureStore.getItemAsync(PROFILES_KEY),
        SecureStore.getItemAsync(ACTIVE_ID_KEY),
      ]);
      const profiles = normalizeProfiles(profilesRaw);
      const activeMotoristaId = activeIdRaw ? Number(activeIdRaw) : profiles[0]?.motorista.id ?? null;
      const active = profiles.find((item) => item.motorista.id === activeMotoristaId);
      await setToken(active?.token || null);
      set({ profiles, activeMotoristaId: activeMotoristaId || null, loading: false, pinVerified: false });
    } catch {
      await setToken(null);
      set({ profiles: [], activeMotoristaId: null, loading: false, pinVerified: false });
    }
  },
}));

export function getActiveProfile() {
  const state = useAuthStore.getState();
  if (!state.activeMotoristaId) return null;
  return state.profiles.find((item) => item.motorista.id === state.activeMotoristaId) || null;
}
