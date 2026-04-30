import { useState } from "react";
import SectionHeader from "../../../components/shared/SectionHeader";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Toast from "../../../components/ui/Toast";
import { useAuth } from "../../../hooks/useAuth";

export default function UserDashboard() {
  const { account, logout, updateAccount } = useAuth();
  const dietProfile = account.dietProfile || {};
  const [form, setForm] = useState({
    name: account.name,
    username: account.username,
    email: account.email,
    password: account.password
  });
  const [saved, setSaved] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    updateAccount(form);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function handleEditDietProfile() {
    updateAccount({
      dietProfile: {
        ...dietProfile,
        completed: false
      }
    });
  }

  const profileRows = [
    ["Person name", dietProfile.personName],
    ["Age", dietProfile.age],
    ["Gender", dietProfile.gender],
    ["Height", dietProfile.heightCm ? `${dietProfile.heightCm} cm` : ""],
    [
      "Current weight",
      dietProfile.currentWeightKg ? `${dietProfile.currentWeightKg} kg` : ""
    ],
    [
      "Target weight",
      dietProfile.targetWeightKg ? `${dietProfile.targetWeightKg} kg` : ""
    ],
    ["Main goal", dietProfile.goal],
    ["Activity level", dietProfile.activityLevel],
    ["Diet style", dietProfile.dietStyle],
    ["Meals per day", dietProfile.mealsPerDay],
    ["Allergies", dietProfile.allergies],
    ["Target date", dietProfile.targetDate],
    ["Health conditions", dietProfile.healthConditions],
    ["Notes", dietProfile.notes]
  ];

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Access control"
        title="Users / Pass"
        description="Manage the local login account used by this Reality Engine X dashboard."
        action={
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        }
      />

      <section className="two-column">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <p className="eyebrow">User profile</p>
          <h2>Login credentials</h2>

          <div className="form-grid">
            <Input
              label="Display name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
            <Input
              label="Username"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <Input
              label="Password"
              type="text"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </div>

          <div className="form-actions">
            <Button type="submit">Save User</Button>
            <Button type="button" variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>

          <Toast type="success" message={saved ? "User credentials saved." : ""} />
        </form>

        <article className="panel">
          <p className="eyebrow">Current access</p>
          <h2>{account.name}</h2>

          <div className="credential-list">
            <div>
              <span>Username</span>
              <strong>{account.username}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{account.email}</strong>
            </div>
            <div>
              <span>Password</span>
              <strong>{account.password}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Diet profile</p>
            <h2>Saved person information</h2>
          </div>

          <Button variant="ghost" onClick={handleEditDietProfile}>
            Edit Info
          </Button>
        </div>

        <div className="profile-summary">
          {profileRows.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value || "Not provided"}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
