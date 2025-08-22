'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import type { AppSettings, AutoSelectionCriteria } from '@/types/index';
import {
  getSettings,
  updateSettings as updateSettingsApi
} from '@/app/api/proxy-api';
import {
  transformApiToAppSettings,
  transformAppToApiSettings
} from '@/lib/settings-api';

const SETTINGS_STORAGE_KEY = 'jd-tx-selection-settings';

// Default settings
const defaultAutoSelectionCriteria: AutoSelectionCriteria = {
  enabled: false,
  selectionStrategy: 'maximizeFees',
  minFeeRate: 1,
  maxSize: 1000000,
  minBaseFee: 0,
  maxAncestorCount: 25,
  maxDescendantCount: 25,
  excludeBip125Replaceable: false,
  excludeUnbroadcast: false,
  maxTransactionCount: 100,
  requireTemplate: false,
  clearExistingSelections: true,
  periodicEnabled: false,
  periodicInterval: 30,
  autoJobDeclaration: false
};

const defaultSettings: AppSettings = {
  autoSelection: {
    onNewTemplate: { ...defaultAutoSelectionCriteria }
  },
  general: {
    autoScrollToTable: true,
    showNotifications: true,
    pauseOnSelection: false,
    clearSelectionOnJobDeclaration: false,
    autoCleanInvalidTransactions: true
  }
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to load from API first
        abortControllerRef.current = new AbortController();
        const response = await getSettings(abortControllerRef.current.signal);

        if (response.success && response.data) {
          const apiSettings = transformApiToAppSettings(response.data);
          setSettings(apiSettings);
        } else {
          // If API fails, try localStorage as fallback
          const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
          if (stored) {
            const parsedSettings = JSON.parse(stored) as AppSettings;
            setSettings({
              ...defaultSettings,
              ...parsedSettings,
              autoSelection: {
                ...defaultSettings.autoSelection,
                ...parsedSettings.autoSelection,
                onNewTemplate: {
                  ...defaultSettings.autoSelection.onNewTemplate,
                  ...parsedSettings.autoSelection?.onNewTemplate
                }
              },
              general: {
                ...defaultSettings.general,
                ...parsedSettings.general
              }
            });
          } else {
            setSettings(defaultSettings);
          }

          if (response.message) {
            console.warn('Settings API warning:', response.message);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load settings:', err);
          setError(err.message || 'Failed to load settings');

          // Fallback to localStorage on network error
          try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
              const parsedSettings = JSON.parse(stored) as AppSettings;
              setSettings({
                ...defaultSettings,
                ...parsedSettings,
                autoSelection: {
                  ...defaultSettings.autoSelection,
                  ...parsedSettings.autoSelection,
                  onNewTemplate: {
                    ...defaultSettings.autoSelection.onNewTemplate,
                    ...parsedSettings.autoSelection?.onNewTemplate
                  }
                },
                general: {
                  ...defaultSettings.general,
                  ...parsedSettings.general
                }
              });
            }
          } catch (localStorageError) {
            console.error(
              'Failed to load from localStorage:',
              localStorageError
            );
            setSettings(defaultSettings);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save to localStorage as backup whenever settings change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
      }
    }
  }, [settings, isLoading]);

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      const updatedSettings: AppSettings = {
        ...settings,
        ...newSettings,
        autoSelection: {
          ...settings.autoSelection,
          ...newSettings.autoSelection,
          onNewTemplate: {
            ...settings.autoSelection.onNewTemplate,
            ...newSettings.autoSelection?.onNewTemplate
          }
        },
        general: {
          ...settings.general,
          ...newSettings.general
        }
      };

      setSettings(updatedSettings);
    },
    [settings]
  );

  const saveSettings = useCallback(async () => {
    const startTime = Date.now();
    try {
      setIsSaving(true);
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const apiUpdate = transformAppToApiSettings(settings);
      const response = await updateSettingsApi(
        apiUpdate,
        abortControllerRef.current.signal
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to save settings');
      }

      // Update the settings with the response from the server
      if (response.data) {
        const updatedSettings = transformApiToAppSettings(response.data);
        setSettings(updatedSettings);
      }

      // Ensure minimum 1 second loading time
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsed);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to save settings:', err);
        setError(err.message || 'Failed to save settings');

        // Still ensure minimum loading time even on error
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsed);
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        throw err; // Re-throw so components can handle it
      }
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    const startTime = Date.now();
    try {
      setIsSaving(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Reset to default settings via API
      const apiUpdate = transformAppToApiSettings(defaultSettings);
      const response = await updateSettingsApi(
        apiUpdate,
        abortControllerRef.current.signal
      );

      if (response.success && response.data) {
        const resetSettings = transformApiToAppSettings(response.data);
        setSettings(resetSettings);
      } else {
        // Fallback to local reset
        setSettings(defaultSettings);
        if (response.message) {
          setError(response.message);
        }
      }

      // Also clear localStorage
      try {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to remove settings from localStorage:', error);
      }

      // Ensure minimum 1 second loading time
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsed);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to reset settings:', err);
        setError(err.message || 'Failed to reset settings');

        // Still ensure minimum loading time even on error
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsed);
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Fallback to local reset
        setSettings(defaultSettings);
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    saveSettings,
    resetSettings,
    isLoading,
    error,
    isSaving
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the Settings context
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook for components that only need auto-selection settings
export function useAutoSelectionSettings() {
  const { settings, updateSettings } = useSettings();
  return {
    autoSelection: settings.autoSelection,
    updateAutoSelection: (
      newAutoSelection: Partial<AppSettings['autoSelection']>
    ) =>
      updateSettings({
        autoSelection: {
          ...settings.autoSelection,
          ...newAutoSelection
        }
      })
  };
}

// Hook for components that only need general settings
export function useGeneralSettings() {
  const { settings, updateSettings } = useSettings();
  return {
    general: settings.general,
    updateGeneral: (newGeneral: Partial<AppSettings['general']>) =>
      updateSettings({
        general: {
          ...settings.general,
          ...newGeneral
        }
      })
  };
}
