import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useThemeStore = create()(persist((set, get) => ({
    theme: 'dark',
    setTheme: (theme) => {
        set({ theme });
        updateDocumentTheme(theme);
    },
    toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        updateDocumentTheme(newTheme);
    },
}), {
    name: 'rotavans-theme',
    onRehydrateStorage: () => (state) => {
        if (state) {
            updateDocumentTheme(state.theme);
        }
    },
}));
function updateDocumentTheme(theme) {
    if (theme === 'light') {
        document.documentElement.classList.add('light');
    }
    else {
        document.documentElement.classList.remove('light');
    }
}
