import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logout as firebaseLogout } from '../lib/firebase';
import { api } from '../lib/api';
export const useAuth = create((set, get) => ({
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
            const profile = await api.get('/auth/perfil');
            set({ profile });
        }
        catch {
            set({ profile: null });
        }
    },
}));
// Listen to auth state changes
onAuthStateChanged(auth, async (user) => {
    useAuth.setState({ user, loading: false });
    if (user) {
        useAuth.getState().fetchProfile();
    }
    else {
        useAuth.setState({ profile: null });
    }
});
