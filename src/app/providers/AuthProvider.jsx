import { createContext, useEffect, useMemo, useState } from "react";
import { mockUser } from "../../data/mockUser";
import { apiClient } from "../../services/apiClient";
import { getLocalDateKey } from "../../utils/dateKeys";

export const AuthContext = createContext(null);

const STORAGE_KEY = "reality-engine-x-account";
const USERS_STORAGE_KEY = "reality-engine-x-users";
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

const localAdminAccount = {
  id: "admin-001",
  name: "Admin",
  username: "admin",
  email: "admin@realityenginex.local",
  password: "admin123",
  role: "admin",
  dietProfile: {
    completed: true
  },
  preferences: defaultPreferences,
  notificationLog: [],
  dailyHistory: []
};

function migrateStarterAccount(account) {
  if (account.id === "user-001" && account.username !== "mahmoud") {
    return {
      ...account,
      name: "Mahmoud",
      username: "mahmoud",
      email: "mahmoud@example.com",
      password: ""
    };
  }

  return account;
}

function getTodayKey() {
  return getLocalDateKey();
}

function loadAccount() {
  try {
    const storedAccount = window.localStorage.getItem(STORAGE_KEY);
    const parsedAccount = storedAccount ? JSON.parse(storedAccount) : {};
    const safeAccount = migrateStarterAccount(parsedAccount);

    return {
      ...mockUser,
      ...safeAccount,
      preferences: {
        ...defaultPreferences,
        ...(safeAccount.preferences || {})
      }
    };
  } catch {
    return mockUser;
  }
}

function loadLocalUsers() {
  try {
    const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    const parsedUsers = storedUsers ? JSON.parse(storedUsers) : [];
    const users = Array.isArray(parsedUsers) ? parsedUsers : [];
    const currentAccount = loadAccount();
    const shouldIncludeCurrent =
      currentAccount?.id &&
      currentAccount.role !== "admin" &&
      !users.some((account) => account.id === currentAccount.id);

    return shouldIncludeCurrent ? [...users, currentAccount] : users;
  } catch {
    return [];
  }
}

function saveAccount(account) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // Local storage can be unavailable in private or restricted browsers.
  }
}

function saveLocalUsers(accounts) {
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Local storage can be unavailable in private or restricted browsers.
  }
}

function upsertLocalUser(account) {
  if (!account?.id || account.role === "admin") return;

  const users = loadLocalUsers();
  const nextUsers = [
    account,
    ...users.filter((storedAccount) => storedAccount.id !== account.id)
  ];

  saveLocalUsers(nextUsers);
}

function findLocalUser(identifier) {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return loadLocalUsers().find(
    (storedAccount) =>
      storedAccount.username?.toLowerCase() === normalizedIdentifier ||
      storedAccount.email?.toLowerCase() === normalizedIdentifier
  );
}

function createCleanUserAccount(payload) {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    name: payload.name || "",
    username: payload.username || "",
    email: payload.email || "",
    password: payload.password || "",
    age: "",
    goal: "",
    heightCm: "",
    weightKg: "",
    targetWeightKg: "",
    activityLevel: "",
    dailyCaloriesTarget: "",
    proteinTarget: "",
    preferences: defaultPreferences,
    notificationLog: [],
    dailyHistory: [],
    dailyCheckIn: null,
    previousDailyCheckIn: null,
    wearableData: null,
    dietProfile: {
      completed: false
    }
  };
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

  async function login(identifier, password, requestedRole = "user") {
    if (!identifier.trim() || !password) {
      return {
        ok: false,
        message: "Enter your username/email and password."
      };
    }

    try {
      const result = await apiClient.post("/auth/login", {
        identifier,
        password
      });

      if ((result.account.role || "user") !== requestedRole) {
        return {
          ok: false,
          message:
            requestedRole === "admin"
              ? "This is not an admin account."
              : "Use Admin login for admin accounts."
        };
      }

      setAccount(result.account);
      if (result.account.role !== "admin") {
        saveAccount(result.account);
        upsertLocalUser(result.account);
      }
      setUser(result.account);
      return { ok: true };
    } catch {
      // The app can still run locally when the API server is not started.
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const matchesAdmin =
      localAdminAccount.username === normalizedIdentifier ||
      localAdminAccount.email === normalizedIdentifier;

    if (matchesAdmin && localAdminAccount.password === password) {
      if (requestedRole !== "admin") {
        return {
          ok: false,
          message: "Use Admin login for admin accounts."
        };
      }

      setUser(localAdminAccount);
      return { ok: true };
    }

    if (requestedRole === "admin") {
      return {
        ok: false,
        message: "Admin username or password is incorrect."
      };
    }

    const localUser = findLocalUser(identifier);
    const fallbackAccount = localUser || account;
    const matchesIdentifier =
      fallbackAccount.username.toLowerCase() === normalizedIdentifier ||
      fallbackAccount.email.toLowerCase() === normalizedIdentifier;

    if (!matchesIdentifier || fallbackAccount.password !== password) {
      return {
        ok: false,
        message: "Username/email or password is incorrect."
      };
    }

    setAccount(fallbackAccount);
    saveAccount(fallbackAccount);
    upsertLocalUser(fallbackAccount);
    setUser(fallbackAccount);
    return { ok: true };
  }

  async function signup(payload) {
    try {
      const result = await apiClient.post("/auth/signup", payload);

      setAccount(result.account);
      saveAccount(result.account);
      upsertLocalUser(result.account);
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

    const localExistingAccount = findLocalUser(payload.username) || findLocalUser(payload.email);

    if (localExistingAccount) {
      return {
        ok: false,
        message: "Username or email already exists."
      };
    }

    const nextAccount = createCleanUserAccount(payload);

    setAccount(nextAccount);
    saveAccount(nextAccount);
    upsertLocalUser(nextAccount);
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
    upsertLocalUser(nextAccount);
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
