import { createContext, useEffect, useMemo, useState } from "react";
import { mockUser } from "../../data/mockUser";
import { apiClient } from "../../services/apiClient";

export const AuthContext = createContext(null);

const STORAGE_KEY = "reality-engine-x-account";
const ONE_HOUR = 60 * 60 * 1000;

const defaultPreferences = {
  dailyReminders: true,
  riskAlerts: true,
  weeklySummary: false,
  privateMode: false,
  hourlyReminders: true,
  appNotifications: false,
  emailNotifications: false,
  remindMood: true,
  remindFood: true,
  remindWater: true
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadAccount() {
  try {
    const storedAccount = window.localStorage.getItem(STORAGE_KEY);
    const parsedAccount = storedAccount ? JSON.parse(storedAccount) : {};

    return {
      ...mockUser,
      ...parsedAccount,
      preferences: {
        ...defaultPreferences,
        ...(parsedAccount.preferences || {})
      }
    };
  } catch {
    return mockUser;
  }
}

function saveAccount(account) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // Local storage can be unavailable in private or restricted browsers.
  }
}

async function syncAccountToBackend(account) {
  try {
    await apiClient.put(`/accounts/${account.id}`, account);
  } catch {
    // The app can still run locally when the API server is not started.
  }
}

function upsertDailyHistory(history = [], date, patch) {
  const existingRecord = history.find((record) => record.date === date);
  const nextRecord = {
    ...(existingRecord || { date }),
    ...patch,
    updatedAt: new Date().toISOString()
  };

  return [
    nextRecord,
    ...history.filter((record) => record.date !== date)
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(loadAccount);
  const [user, setUser] = useState(null);

  function resetExpiredDailyCheckIn() {
    const todayKey = getTodayKey();

    if (
      !account.dailyCheckIn?.checkInDate ||
      account.dailyCheckIn.checkInDate === todayKey
    ) {
      return;
    }

    const notification = {
      id: Date.now(),
      title: "New daily check-in needed",
      text: "A new day started. Enter today's mood, food, water, and recovery data.",
      createdAt: new Date().toLocaleString()
    };

    updateAccount({
      previousDailyCheckIn: account.dailyCheckIn,
      dailyCheckIn: null,
      lastCheckInResetDate: todayKey,
      dailyHistory: upsertDailyHistory(
        account.dailyHistory,
        account.dailyCheckIn.checkInDate,
        {
          checkIn: account.dailyCheckIn
        }
      ),
      notificationLog: [
        notification,
        ...(account.notificationLog || [])
      ].slice(0, 20)
    });

    const preferences = account.preferences || defaultPreferences;

    if (
      preferences.appNotifications &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Reality Engine X", {
        body: notification.text
      });
    }
  }

  function addNotification(notification) {
    setAccount((currentAccount) => {
      const nextAccount = {
        ...currentAccount,
        notificationLog: [
          notification,
          ...(currentAccount.notificationLog || [])
        ].slice(0, 20)
      };

      saveAccount(nextAccount);
      return nextAccount;
    });
  }

  function markNotificationsSeen() {
    const latestNotificationId = account.notificationLog?.[0]?.id;

    if (!latestNotificationId) return;

    updateAccount({
      lastSeenNotificationId: latestNotificationId
    });
  }

  function buildReminderText(preferences = {}) {
    const reminders = [];

    if (preferences.remindMood) reminders.push("mood");
    if (preferences.remindFood) reminders.push("food");
    if (preferences.remindWater) reminders.push("water");

    return reminders.length
      ? `Hourly reminder: check your ${reminders.join(", ")}.`
      : "Hourly reminder: complete your diet check-in.";
  }

  function sendAppReminder() {
    const preferences = account.preferences || defaultPreferences;
    const text = buildReminderText(preferences);
    const notification = {
      id: Date.now(),
      title: "Hourly diet reminder",
      text,
      createdAt: new Date().toLocaleString()
    };

    addNotification(notification);

    if (
      preferences.appNotifications &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Reality Engine X", {
        body: text
      });
    }
  }

  async function requestAppNotificationPermission() {
    if (!("Notification" in window)) {
      return {
        ok: false,
        message: "Browser notifications are not supported here."
      };
    }

    const permission = await Notification.requestPermission();
    const allowed = permission === "granted";

    updateAccount({
      preferences: {
        ...account.preferences,
        appNotifications: allowed
      }
    });

    return {
      ok: allowed,
      message: allowed
        ? "App notifications enabled."
        : "Notification permission was not granted."
    };
  }

  useEffect(() => {
    const preferences = account.preferences || defaultPreferences;

    if (!user || !preferences.hourlyReminders || !preferences.appNotifications) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      sendAppReminder();
    }, ONE_HOUR);

    return () => window.clearInterval(intervalId);
  }, [
    user,
    account.preferences?.hourlyReminders,
    account.preferences?.appNotifications,
    account.preferences?.remindMood,
    account.preferences?.remindFood,
    account.preferences?.remindWater
  ]);

  useEffect(() => {
    if (!user) return;

    resetExpiredDailyCheckIn();
  }, [user, account.dailyCheckIn?.checkInDate]);

  async function login(identifier, password) {
    try {
      const result = await apiClient.post("/auth/login", {
        identifier,
        password
      });

      setAccount(result.account);
      saveAccount(result.account);
      setUser(result.account);
      return { ok: true };
    } catch {
      // Fall back to the local demo account if the API is offline.
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const matchesIdentifier =
      account.username.toLowerCase() === normalizedIdentifier ||
      account.email.toLowerCase() === normalizedIdentifier;

    if (!matchesIdentifier || account.password !== password) {
      return {
        ok: false,
        message: "Username/email or password is incorrect."
      };
    }

    setUser(account);
    return { ok: true };
  }

  async function signup(payload) {
    try {
      const result = await apiClient.post("/auth/signup", payload);

      setAccount(result.account);
      saveAccount(result.account);
      setUser(result.account);
      return { ok: true };
    } catch (error) {
      if (error.message === "Username or email already exists.") {
        return {
          ok: false,
          message: error.message
        };
      }
    }

    const nextAccount = {
      ...account,
      ...payload,
      id: `user-${Date.now()}`,
      age: "",
      goal: "",
      heightCm: "",
      weightKg: "",
      targetWeightKg: "",
      activityLevel: "",
      dailyCaloriesTarget: "",
      proteinTarget: "",
      dietProfile: {
        completed: false
      }
    };

    setAccount(nextAccount);
    saveAccount(nextAccount);
    syncAccountToBackend(nextAccount);
    setUser(nextAccount);
    return { ok: true };
  }

  function updateAccount(payload) {
    const nextAccount = {
      ...account,
      ...payload
    };

    setAccount(nextAccount);
    saveAccount(nextAccount);
    syncAccountToBackend(nextAccount);
    setUser((currentUser) => (currentUser ? nextAccount : currentUser));
    return { ok: true };
  }

  function saveDietProfile(dietProfile) {
    return updateAccount({
      dietProfile: {
        ...dietProfile,
        completed: true,
        updatedAt: new Date().toISOString()
      }
    });
  }

  function saveDailyCheckIn(dailyCheckIn) {
    const todayKey = getTodayKey();
    const nextDailyCheckIn = {
      ...dailyCheckIn,
      checkInDate: todayKey,
      savedAt: new Date().toISOString()
    };

    return updateAccount({
      dailyCheckIn: nextDailyCheckIn,
      dailyHistory: upsertDailyHistory(account.dailyHistory, todayKey, {
        checkIn: nextDailyCheckIn
      })
    });
  }

  function saveWearableData(wearableData) {
    const todayKey = getTodayKey();
    const nextWearableData = {
      ...wearableData,
      wearableDate: todayKey,
      savedAt: new Date().toISOString()
    };

    return updateAccount({
      wearableData: nextWearableData,
      dailyHistory: upsertDailyHistory(account.dailyHistory, todayKey, {
        wearableData: nextWearableData
      })
    });
  }

  function resetPassword(email, password) {
    if (account.email.toLowerCase() !== email.trim().toLowerCase()) {
      return {
        ok: false,
        message: "No account found with that email."
      };
    }

    return updateAccount({ password });
  }

  const value = useMemo(
    () => ({
      account,
      user,
      login,
      markNotificationsSeen,
      signup,
      resetPassword,
      requestAppNotificationPermission,
      saveDailyCheckIn,
      saveDietProfile,
      saveWearableData,
      sendAppReminder,
      todayKey: getTodayKey(),
      updateAccount,
      logout: () => setUser(null),
      updateUser: setUser
    }),
    [account, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
