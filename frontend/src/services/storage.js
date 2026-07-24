const THEME_KEY = 'theme';

export const storage = {
  getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  },
  
  setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.className = `theme-${theme}`;
  }
};
