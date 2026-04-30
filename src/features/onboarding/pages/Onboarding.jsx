import { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useAuth } from "../../../hooks/useAuth";

const initialProfile = {
  personName: "",
  age: "",
  gender: "",
  heightCm: "",
  currentWeightKg: "",
  targetWeightKg: "",
  goal: "Fat loss",
  activityLevel: "Moderate",
  dietStyle: "Balanced",
  mealsPerDay: "3",
  allergies: "",
  healthConditions: "",
  targetDate: "",
  notes: ""
};

export default function Onboarding() {
  const { account, logout, saveDietProfile } = useAuth();
  const [profile, setProfile] = useState({
    ...initialProfile,
    ...account.dietProfile,
    personName: account.dietProfile?.personName || account.name || "",
    currentWeightKg:
      account.dietProfile?.currentWeightKg || account.weightKg || "",
    targetWeightKg:
      account.dietProfile?.targetWeightKg || account.targetWeightKg || "",
    goal: account.dietProfile?.goal || account.goal || initialProfile.goal
  });

  function updateField(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveDietProfile(profile);
  }

  return (
    <section className="auth-page">
      <form className="auth-card onboarding-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Diet setup</p>
          <h1>Who is this diet plan for?</h1>
        </div>

        <div className="form-grid">
          <Input
            label="Person name"
            value={profile.personName}
            required
            onChange={(event) => updateField("personName", event.target.value)}
          />
          <Input
            label="Age"
            type="number"
            min="12"
            max="100"
            value={profile.age}
            required
            onChange={(event) => updateField("age", event.target.value)}
          />

          <label className="form-field">
            <span>Gender</span>
            <select
              value={profile.gender}
              required
              onChange={(event) => updateField("gender", event.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>

          <Input
            label="Height (cm)"
            type="number"
            min="100"
            max="240"
            value={profile.heightCm}
            required
            onChange={(event) => updateField("heightCm", event.target.value)}
          />
          <Input
            label="Current weight (kg)"
            type="number"
            min="30"
            max="250"
            step="0.1"
            value={profile.currentWeightKg}
            required
            onChange={(event) => updateField("currentWeightKg", event.target.value)}
          />
          <Input
            label="Target weight (kg)"
            type="number"
            min="30"
            max="250"
            step="0.1"
            value={profile.targetWeightKg}
            required
            onChange={(event) => updateField("targetWeightKg", event.target.value)}
          />

          <label className="form-field">
            <span>Main goal</span>
            <select
              value={profile.goal}
              onChange={(event) => updateField("goal", event.target.value)}
            >
              <option value="Fat loss">Fat loss</option>
              <option value="Lean bulk">Lean bulk</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Muscle gain">Muscle gain</option>
              <option value="Health improvement">Health improvement</option>
            </select>
          </label>

          <label className="form-field">
            <span>Activity level</span>
            <select
              value={profile.activityLevel}
              onChange={(event) => updateField("activityLevel", event.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Athlete">Athlete</option>
            </select>
          </label>

          <label className="form-field">
            <span>Diet style</span>
            <select
              value={profile.dietStyle}
              onChange={(event) => updateField("dietStyle", event.target.value)}
            >
              <option value="Balanced">Balanced</option>
              <option value="High protein">High protein</option>
              <option value="Low carb">Low carb</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Mediterranean">Mediterranean</option>
            </select>
          </label>

          <Input
            label="Meals per day"
            type="number"
            min="1"
            max="8"
            value={profile.mealsPerDay}
            onChange={(event) => updateField("mealsPerDay", event.target.value)}
          />
          <Input
            label="Allergies or avoided foods"
            value={profile.allergies}
            placeholder="Peanuts, lactose, seafood..."
            onChange={(event) => updateField("allergies", event.target.value)}
          />
          <Input
            label="Target date"
            type="date"
            value={profile.targetDate}
            onChange={(event) => updateField("targetDate", event.target.value)}
          />
        </div>

        <label className="form-field">
          <span>Health conditions</span>
          <textarea
            value={profile.healthConditions}
            placeholder="Diabetes, blood pressure, digestion issues, injuries..."
            onChange={(event) => updateField("healthConditions", event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Notes for the diet plan</span>
          <textarea
            value={profile.notes}
            placeholder="Food preferences, schedule, cravings, work routine, training days..."
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </label>

        <div className="form-actions">
          <Button type="submit">Continue to Dashboard</Button>
          <Button type="button" variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </form>
    </section>
  );
}
