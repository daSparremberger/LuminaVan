import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { Motorista } from '@rotavans/shared';

interface AuthState {
  motorista: Motorista | null;
  pinVerified: boolean;
  loading: boolean;
  setMotorista: (m: Motorista | null) => void;
  verifyPin: () => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  motorista: null,
  pinVerified: false,
  loading: true,

  setMotorista: (motorista) => {
    set({ motorista });
    if (motorista) {
      SecureStore.setItemAsync('motorista', JSON.stringify(motorista));
    } else {
      SecureStore.deleteItemAsync('motorista');
    }
  },

  verifyPin: () => set({ pinVerified: true }),

  logout: () => {
    SecureStore.deleteItemAsync('motorista');
    set({ motorista: null, pinVerified: false });
  },

  loadFromStorage: async () => {
    try {
      const data = await SecureStore.getItemAsync('motorista');
      if (data) {
        set({ motorista: JSON.parse(data), loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },
}));
