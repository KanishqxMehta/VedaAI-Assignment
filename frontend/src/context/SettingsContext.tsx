'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
interface Settings {
  schoolName: string;
  schoolLocation: string;
  userName: string;
  avatarUrl: string;
}
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}
const defaultSettings: Settings = {
  schoolName: 'Delhi Public School',
  schoolLocation: 'Bokaro Steel City',
  userName: 'John Doe',
  avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
};
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  useEffect(() => {
    const stored = localStorage.getItem('veda_settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('veda_settings', JSON.stringify(updated));
      return updated;
    });
  };
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
