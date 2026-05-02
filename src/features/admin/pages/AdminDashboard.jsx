import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  HeartPulse,
  UserRound
} from "lucide-react";
import SectionHeader from "../../../components/shared/SectionHeader";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import { apiClient } from "../../../services/apiClient";

const LOCAL_ACCOUNT_KEY = "reality-engine-x-account";
const LOCAL_USERS_KEY = "reality-engine-x-users";

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? number : null;
}

function valueOrMissing(value, suffix = "") {
  return value !== undefined && value !== null && value !== ""
    ? `${value}${suffix}`
    : "Not entered";
}

function removePassword(account) {
  if (!account) return null;
  const { password, ...safeAccount } = account;
  return safeAccount;
}

function loadLocalUser() {
  try {
    const account = JSON.parse(
      window.localStorage.getItem(LOCAL_ACCOUNT_KEY) || "null"
    );

    if (!account || account.role === "admin") return null;
    return removePassword(account);
  } catch {
    return null;
  }
}

function loadLocalUsers() {
  try {
    const users = JSON.parse(window.localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const currentUser = loadLocalUser();
    const localUsers = Array.isArray(users)
      ? users.filter((account) => account.role !== "admin").map(removePassword)
      : [];

    if (
      currentUser &&
      !localUsers.some((account) => account.id === currentUser.id)
    ) {
      return [currentUser, ...localUsers];
    }

    return localUsers;
  } catch {
    const currentUser = loadLocalUser();
    return currentUser ? [currentUser] : [];
  }
}

function getLatestRecord(account) {
  const history = [...(account.dailyHistory || [])].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return history.find((record) => record.checkIn || record.wearableData) || null;
}

function calculateCompletion(account) {
  const profile = account.dietProfile || {};
  const latest = getLatestRecord(account);
  const hasProfile = Boolean(profile.completed);
  const hasCheckIn = Boolean(account.dailyCheckIn?.savedAt || latest?.checkIn);
  const hasWearable = Boolean(account.wearableData?.savedAt || latest?.wearableData);

  return [hasProfile, hasCheckIn, hasWearable].filter(Boolean).length;
}

function calculateRisk(account) {
  const checkIn = account.dailyCheckIn || getLatestRecord(account)?.checkIn;

  if (!checkIn) return "No check-in";

  const sleep = safeNumber(checkIn.sleep) || 0;
  const stress = safeNumber(checkIn.stress) || 0;
  const cravings = safeNumber(checkIn.cravings) || 0;
  const risk = Math.min(
    100,
    Math.round((stress * 4 + cravings * 4 + Math.max(0, 8 - sleep) * 7) * 1.6)
  );

  if (risk >= 70) return `High (${risk}%)`;
  if (risk >= 40) return `Medium (${risk}%)`;
  return `Low (${risk}%)`;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Loading users...");

  async function loadUsers() {
    setStatus("Loading users...");

    try {
      const result = await apiClient.get("/admin/accounts");
      const users = result.accounts || [];

      setAccounts(users);
      setSelectedId((current) => current || users[0]?.id || "");
      setStatus(
        users.length
          ? "Connected to backend. Showing all saved users."
          : "No users have been created yet."
      );
    } catch {
      const users = loadLocalUsers();

      setAccounts(users);
      setSelectedId((current) => current || users[0]?.id || "");
      setStatus(
        users.length
          ? "Backend is offline. Showing locally saved users from this browser."
          : "Backend is offline and no local user was found."
      );
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.id === selectedId) || accounts[0];
  }, [accounts, selectedId]);

  const profile = selectedAccount?.dietProfile || {};
  const latestRecord = selectedAccount ? getLatestRecord(selectedAccount) : null;
  const latestCheckIn = selectedAccount?.dailyCheckIn || latestRecord?.checkIn;
  const latestWearable =
    selectedAccount?.wearableData || latestRecord?.wearableData;
  const completionTotal = accounts.reduce(
    (total, account) => total + calculateCompletion(account),
    0
  );

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Admin control"
        title="Admin Dashboard"
        description="View every user dashboard, diet setup, daily check-in, wearable data, and saved history from one place."
        action={
          <div className="form-actions admin-header-actions">
            <Button variant="ghost" onClick={loadUsers}>
              Refresh
            </Button>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        }
      />

      <section className="stats-grid">
        <AdminStat
          icon={UserRound}
          label="Users"
          value={accounts.length}
          text="Non-admin accounts"
        />
        <AdminStat
          icon={ClipboardCheck}
          label="Check-ins"
          value={accounts.filter((account) => account.dailyCheckIn?.savedAt).length}
          text="Users with a saved check-in"
        />
        <AdminStat
          icon={HeartPulse}
          label="Wearable"
          value={accounts.filter((account) => account.wearableData?.savedAt).length}
          text="Users with health data"
        />
        <AdminStat
          icon={BarChart3}
          label="Data coverage"
          value={`${completionTotal}/${accounts.length * 3 || 0}`}
          text="Profile, check-in, wearable"
        />
      </section>

      <article className="panel">
        <p className="eyebrow">Connection</p>
        <h2>{status}</h2>
      </article>

      {accounts.length === 0 ? (
        <article className="panel">
          <p className="eyebrow">No user data</p>
          <h2>No dashboards available yet</h2>
          <p>
            Create a normal user account, complete diet setup, and save check-in
            data. Then the admin will be able to see that user here.
          </p>
        </article>
      ) : (
        <section className="admin-dashboard-grid">
          <aside className="panel admin-user-list">
            <p className="eyebrow">Users</p>
            <h2>All dashboards</h2>

            {accounts.map((account) => {
              const userProfile = account.dietProfile || {};
              const isSelected = account.id === selectedAccount?.id;

              return (
                <button
                  className={`admin-user-row${isSelected ? " active" : ""}`}
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedId(account.id)}
                >
                  <span>{userProfile.personName || account.name || "User"}</span>
                  <small>{account.email || account.username || account.id}</small>
                </button>
              );
            })}
          </aside>

          <section className="page-stack">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Selected user</p>
                  <h2>{profile.personName || selectedAccount.name || "User dashboard"}</h2>
                </div>
                <strong className="admin-risk-pill">
                  {calculateRisk(selectedAccount)}
                </strong>
              </div>

              <div className="profile-summary">
                <AdminProfileField label="Username" value={selectedAccount.username} />
                <AdminProfileField label="Email" value={selectedAccount.email} />
                <AdminProfileField label="Goal" value={profile.goal} />
                <AdminProfileField
                  label="Current weight"
                  value={profile.currentWeightKg}
                  suffix=" kg"
                />
                <AdminProfileField
                  label="Target weight"
                  value={profile.targetWeightKg}
                  suffix=" kg"
                />
                <AdminProfileField label="Activity" value={profile.activityLevel} />
              </div>
            </article>

            <section className="two-column">
              <article className="panel">
                <p className="eyebrow">Daily check-in</p>
                <h2>{latestCheckIn ? "Latest saved data" : "No check-in"}</h2>

                <div className="history-grid">
                  <AdminField label="Calories" value={latestCheckIn?.calories} />
                  <AdminField label="Protein" value={latestCheckIn?.protein} suffix="g" />
                  <AdminField label="Sleep" value={latestCheckIn?.sleep} suffix="h" />
                  <AdminField label="Water" value={latestCheckIn?.water} suffix="L" />
                  <AdminField label="Mood" value={latestCheckIn?.mood} suffix="/10" />
                  <AdminField label="Stress" value={latestCheckIn?.stress} suffix="/10" />
                  <AdminField
                    label="Cravings"
                    value={latestCheckIn?.cravings}
                    suffix="/10"
                  />
                </div>
              </article>

              <article className="panel">
                <p className="eyebrow">Wearable data</p>
                <h2>{latestWearable ? "Latest uploaded data" : "No wearable data"}</h2>

                <div className="history-grid">
                  <AdminField label="Device" value={latestWearable?.device} />
                  <AdminField label="Source" value={latestWearable?.source} />
                  <AdminField label="Steps" value={latestWearable?.steps} />
                  <AdminField
                    label="Heart rate"
                    value={latestWearable?.heartRate}
                    suffix=" bpm"
                  />
                  <AdminField
                    label="Active minutes"
                    value={latestWearable?.activeMinutes}
                    suffix=" min"
                  />
                  <AdminField
                    label="Recovery"
                    value={latestWearable?.recoveryScore}
                    suffix="%"
                  />
                </div>
              </article>
            </section>

            <article className="panel">
              <p className="eyebrow">Daily history</p>
              <h2>{selectedAccount.dailyHistory?.length || 0} saved days</h2>

              <div className="admin-history-list">
                {(selectedAccount.dailyHistory || []).slice(0, 6).map((record) => (
                  <div className="admin-history-row" key={record.date}>
                    <span>{record.date}</span>
                    <strong>
                      {record.checkIn ? "Check-in" : "No check-in"} /{" "}
                      {record.wearableData ? "Wearable" : "No wearable"}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </section>
      )}
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, text }) {
  return (
    <article className="panel admin-stat-card">
      <div className="stat-icon">
        <Icon size={21} />
      </div>
      <p className="eyebrow">{label}</p>
      <h2>{value}</h2>
      <span>{text}</span>
    </article>
  );
}

function AdminField({ label, value, suffix = "" }) {
  return (
    <>
      <span>{label}</span>
      <strong>{valueOrMissing(value, suffix)}</strong>
    </>
  );
}

function AdminProfileField({ label, value, suffix = "" }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{valueOrMissing(value, suffix)}</strong>
    </div>
  );
}
