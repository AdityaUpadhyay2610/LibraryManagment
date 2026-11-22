import { createContext, useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import { storage } from '../../services/storage';

const USER_STORAGE_KEY = 'library_user_session';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [theme, setThemeState] = useState(() => storage.getTheme());

  // Instant synchronous initialization (loads in 0-1ms from local storage)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Zero-delay: do not block the page with full-screen loading spinners
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync theme to document element
  useEffect(() => {
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Background, non-blocking session check
  const checkSession = async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      return currentUser;
    } catch {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  };

  // Check Session on mount silently in background
  useEffect(() => {
    checkSession();

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      showToast('Session expired. Please login again.', 'error');
    };
    window.addEventListener('unauthorized-api-call', handleUnauthorized);
    return () => window.removeEventListener('unauthorized-api-call', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    try {
      const loggedInUser = await authApi.login(username, password);
      setUser(loggedInUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      showToast(`Welcome back, ${loggedInUser.fullName || loggedInUser.username}!`);
      return loggedInUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const registerAdmin = async (username, password, fullName) => {
    try {
      await authApi.registerAdmin(username, password, fullName);
      showToast('Admin registered successfully! Please login.');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout warning:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      showToast('Logged out successfully.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        setUser,
        loading,
        setLoading,
        toast,
        showToast,
        login,
        registerAdmin,
        logout,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
