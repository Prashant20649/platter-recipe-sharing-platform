import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    siteName: 'Platter',
    allowReviews: true,
    requireApproval: true,
    maxIngredients: 25,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  // Fetch settings
  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      if (data?.settings) {
        setSettings(data.settings);
        setMaintenance(Boolean(data.settings.maintenanceMode));
      }
    } catch (err) {
      if (err.maintenance) {
        setMaintenance(true);
      }
    }
  }, []);

  // Fetch current user
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getCurrentUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      if (err.maintenance) {
        setMaintenance(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshUser();
  }, [refreshSettings, refreshUser]);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    if (data?.user) {
      setUser(data.user);
      await refreshSettings();
    }
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data?.user) {
      setUser(data.user);
      await refreshSettings();
    }
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const data = await api.updateProfile(profileData);
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const isRole = (role) => user && user.role === role;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        settings,
        maintenance,
        isAdmin: isRole('admin'),
        isContributor: isRole('contributor'),
        isExplorer: isRole('explorer'),
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        refreshSettings,
        setMaintenance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
