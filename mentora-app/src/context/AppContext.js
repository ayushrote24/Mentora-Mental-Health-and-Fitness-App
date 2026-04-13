import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../config/api';

const AppContext = createContext();

const defaultProfile = {
  name: '',
  email: '',
  sex: '',
  height: 165,
  weight: 65,
  stepsGoal: 8000,
  lastPeriodDay: null,
  periodDuration: 5,
  cycleLength: 28,
  onboardingCompleted: false,
};

const defaultSettings = {
  notifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  dataSync: true,
  privacyMode: true,
};

const defaultAppState = {
  doctors: {
    saved: [],
  },
  reminders: {
    meds: [],
    rest_reminder: null,
    water_reminder: null,
    bedtime_reminder: null,
    affirmation_reminder: null,
    steps_reminder: null,
  },
  journal: {
    diaryEntries: [],
    gratitudeEntries: {},
  },
  health: {
    femaleHealth: {
      priorityId: null,
      selectedPhase: 'menstrual',
      pregnancyWeek: 12,
      symptomLogs: {},
    },
    steps: {
      today: 0,
      byDate: {},
    },
    waterGlassesToday: 0,
    moodToday: '',
  },
  chat: {
    messages: [],
  },
};

const mergeAppState = (incoming = {}) => ({
  ...defaultAppState,
  ...incoming,
  doctors: {
    ...defaultAppState.doctors,
    ...(incoming.doctors || {}),
  },
  reminders: {
    ...defaultAppState.reminders,
    ...(incoming.reminders || {}),
  },
  journal: {
    ...defaultAppState.journal,
    ...(incoming.journal || {}),
  },
  health: {
    ...defaultAppState.health,
    ...(incoming.health || {}),
    femaleHealth: {
      ...defaultAppState.health.femaleHealth,
      ...((incoming.health || {}).femaleHealth || {}),
    },
    steps: {
      ...defaultAppState.health.steps,
      ...((incoming.health || {}).steps || {}),
      byDate: {
        ...defaultAppState.health.steps.byDate,
        ...(((incoming.health || {}).steps || {}).byDate || {}),
      },
    },
  },
  chat: {
    ...defaultAppState.chat,
    ...(incoming.chat || {}),
  },
});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [settings, setSettings] = useState(defaultSettings);
  const [authToken, setAuthToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [appState, setAppState] = useState(defaultAppState);
  const [appStateLoaded, setAppStateLoaded] = useState(false);

  useEffect(() => {
    const bootstrapApp = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          'mentora_settings',
          'mentora_profile',
          'mentora_user',
          'mentora_auth',
          'mentora_app_state',
        ]);

        const store = Object.fromEntries(entries);
        const storedSettings = store.mentora_settings ? JSON.parse(store.mentora_settings) : null;
        const storedProfile = store.mentora_profile ? JSON.parse(store.mentora_profile) : null;
        const storedUser = store.mentora_user ? JSON.parse(store.mentora_user) : null;
        const storedAuth = store.mentora_auth ? JSON.parse(store.mentora_auth) : null;
        const storedAppState = store.mentora_app_state ? JSON.parse(store.mentora_app_state) : null;

        if (storedSettings) {
          setSettings(storedSettings);
        }
        if (storedProfile) {
          setProfile({ ...defaultProfile, ...storedProfile });
        }
        if (storedUser) {
          setUser(storedUser);
        }
        if (storedAppState) {
          setAppState(mergeAppState(storedAppState));
        }

        const storedAccessToken = storedAuth?.accessToken || null;
        const storedRefreshToken = storedAuth?.refreshToken || null;

        if (storedRefreshToken) {
          try {
            const response = await apiClient.post('/auth/refresh', {
              refreshToken: storedRefreshToken,
            });

            const refreshedUser = response.data?.data?.user || storedUser;
            const refreshedTokens = {
              ...storedAuth,
              accessToken: response.data?.data?.accessToken || storedAccessToken,
              refreshToken: storedRefreshToken,
            };

            setAuthToken(refreshedTokens.accessToken || null);
            setRefreshToken(refreshedTokens.refreshToken || null);
            await AsyncStorage.setItem('mentora_auth', JSON.stringify(refreshedTokens));

            if (refreshedUser) {
              const nextUser = {
                id: refreshedUser.id,
                name: refreshedUser.name,
                email: refreshedUser.email,
              };
              setUser(nextUser);
              await AsyncStorage.setItem('mentora_user', JSON.stringify(nextUser));

              const nextProfile = {
                ...defaultProfile,
                ...(storedProfile || {}),
                ...refreshedUser,
              };
              setProfile(nextProfile);
              await AsyncStorage.setItem('mentora_profile', JSON.stringify(nextProfile));
            }
          } catch (error) {
            const shouldClearSession = error?.response?.status === 401;

            if (shouldClearSession && (storedUser || storedAccessToken || storedRefreshToken)) {
              await AsyncStorage.multiRemove([
                'mentora_user',
                'mentora_auth',
                'mentora_profile',
                'mentora_settings',
                'mentora_app_state',
              ]);
              setUser(null);
              setProfile(defaultProfile);
              setSettings(defaultSettings);
              setAuthToken(null);
              setRefreshToken(null);
              setAppState(defaultAppState);
            } else {
              setAuthToken(storedAccessToken);
              setRefreshToken(storedRefreshToken);
            }
          }
        } else if (storedAccessToken) {
          setAuthToken(storedAccessToken);
        }
      } finally {
        setAppStateLoaded(true);
      }
    };

    bootstrapApp();
  }, []);

  useEffect(() => {
    if (authToken) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    } else {
      delete apiClient.defaults.headers.common.Authorization;
    }
  }, [authToken]);

  const refreshAppState = async () => {
    if (!authToken) {
      return null;
    }

    try {
      const response = await apiClient.get('/user/state');
      const nextState = mergeAppState(response.data.data || {});
      setAppState(nextState);
      await AsyncStorage.setItem('mentora_app_state', JSON.stringify(nextState));
      return nextState;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (authToken) {
      refreshAppState();
    }
  }, [authToken]);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      AsyncStorage.setItem('mentora_user', JSON.stringify(nextUser));
    } else {
      AsyncStorage.removeItem('mentora_user');
    }
  };

  const persistAuth = (tokens) => {
    setAuthToken(tokens?.accessToken || null);
    setRefreshToken(tokens?.refreshToken || null);
    if (tokens?.accessToken) {
      AsyncStorage.setItem('mentora_auth', JSON.stringify(tokens));
    } else {
      AsyncStorage.removeItem('mentora_auth');
    }
  };

  const saveAppSection = async (section, valueOrUpdater) => {
    const nextState = await new Promise((resolve) => {
      setAppState((prev) => {
        const currentSection = prev[section];
        const nextSection =
          typeof valueOrUpdater === 'function'
            ? valueOrUpdater(currentSection)
            : valueOrUpdater;

        const resolvedState = {
          ...prev,
          [section]: nextSection,
        };

        resolve(resolvedState);
        return resolvedState;
      });
    });

    await AsyncStorage.setItem('mentora_app_state', JSON.stringify(nextState));

    if (authToken && nextState) {
      try {
        await apiClient.put('/user/state', { [section]: nextState[section] });
      } catch (error) {
        return nextState;
      }
    }

    return nextState;
  };

  const updateProfile = (data) => {
    setProfile(prev => {
      const next = { ...prev, ...data };
      AsyncStorage.setItem('mentora_profile', JSON.stringify(next));
      if (authToken) {
        apiClient.put('/user/profile', data).catch(() => null);
      }
      return next;
    });
  };

  const updateSettings = (data) => {
    setSettings(prev => {
      const next = { ...prev, ...data };
      AsyncStorage.setItem('mentora_settings', JSON.stringify(next));
      if (authToken) {
        apiClient.patch('/user/settings', data).catch(() => null);
      }
      return next;
    });
  };

  const login = (sessionOrName, email) => {
    if (typeof sessionOrName === 'object' && sessionOrName?.user) {
      const nextUser = {
        id: sessionOrName.user.id,
        name: sessionOrName.user.name,
        email: sessionOrName.user.email,
      };
      persistUser(nextUser);
      persistAuth(sessionOrName.tokens || null);

      const nextProfile = {
        ...defaultProfile,
        ...sessionOrName.user,
      };
      setProfile(nextProfile);
      AsyncStorage.setItem('mentora_profile', JSON.stringify(nextProfile));

      if (sessionOrName.user.settings) {
        const nextSettings = {
          ...defaultSettings,
          ...sessionOrName.user.settings,
        };
        setSettings(nextSettings);
        AsyncStorage.setItem('mentora_settings', JSON.stringify(nextSettings));
      }

      setAppState(defaultAppState);
      AsyncStorage.setItem('mentora_app_state', JSON.stringify(defaultAppState));
      refreshAppState();

      return;
    }

    persistUser({ name: sessionOrName, email });
  };

  const logout = () => {
    persistUser(null);
    persistAuth(null);
    setProfile(defaultProfile);
    setSettings(defaultSettings);
    setAppState(defaultAppState);
    AsyncStorage.removeItem('mentora_profile');
    AsyncStorage.removeItem('mentora_settings');
    AsyncStorage.removeItem('mentora_app_state');
  };

  return (
    <AppContext.Provider value={{ user, profile, settings, authToken, refreshToken, appState, appStateLoaded, refreshAppState, saveAppSection, updateProfile, updateSettings, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
