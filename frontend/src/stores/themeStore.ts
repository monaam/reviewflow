import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

// Helper function to get system theme preference
function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

// Helper function to resolve theme (convert 'system' to actual theme)
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

// Helper function to apply theme to DOM
function applyTheme(resolvedTheme: ResolvedTheme) {
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Set up system theme listener
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    const state = get();
    if (state.theme === 'system') {
      const newResolvedTheme = getSystemTheme();
      applyTheme(newResolvedTheme);
      set({ resolvedTheme: newResolvedTheme });
    }
  };

  // Add listener for system theme changes
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  return {
    theme: 'system',
    resolvedTheme: getSystemTheme(),

    setTheme: (theme: Theme) => {
      const resolvedTheme = resolveTheme(theme);
      localStorage.setItem('theme', theme);
      applyTheme(resolvedTheme);
      set({ theme, resolvedTheme });
    },

    initializeTheme: () => {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      const theme = storedTheme && ['light', 'dark', 'system'].includes(storedTheme)
        ? storedTheme
        : 'system';

      const resolvedTheme = resolveTheme(theme);
      applyTheme(resolvedTheme);
      set({ theme, resolvedTheme });
    },
  };
});
