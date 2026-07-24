import { createContext, useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import { storage } from '../../services/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [theme, setThemeState] = useState(() => storage.getTheme());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const checkSession = async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check Session on mount
  useEffect(() => {
    checkSession();

    const handleUnauthorized = () => {
      setUser(null);
      showToast('Session expired. Please login again.', 'error');
    };
    window.addEventListener('unauthorized-api-call', handleUnauthorized);
    return () => window.removeEventListener('unauthorized-api-call', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const loggedInUser = await authApi.login(username, password);
      setUser(loggedInUser);
      showToast(`Welcome back, ${loggedInUser.fullName || loggedInUser.username}!`);
      return loggedInUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async (username, password, fullName) => {
    setLoading(true);
    try {
      await authApi.registerAdmin(username, password, fullName);
      showToast('Admin registered successfully! Please login.');
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      showToast('Logged out successfully.');
    } catch (err) {
      showToast('Logout failed: ' + err.message, 'error');
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
        logout,
        registerAdmin,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
