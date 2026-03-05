import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, logout as firebaseLogout } from '../lib/firebase';
import { api } from '../lib/api';
import type { UserProfile } from '@rotavans/shared';

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  logout: async () => {
    await firebaseLogout();
    set({ user: null, profile: null });
  },
  fetchProfile: async () => {
    try {
      const profile = await api.get<UserProfile>('/auth/perfil');
      set({ profile });
    } catch {
      set({ profile: null });
    }
  },
}));

// Listen to auth state changes
onAuthStateChanged(auth, async (user) => {
  useAuth.setState({ user, loading: false });
  if (user) {
    useAuth.getState().fetchProfile();
  } else {
    useAuth.setState({ profile: null });
  }
});
