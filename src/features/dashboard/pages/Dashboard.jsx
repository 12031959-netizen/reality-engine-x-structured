import {
  Apple,
  Bed,
  ClipboardCheck,
  Droplets,
  HeartPulse,
  Scale,
  ShieldAlert,
  Target
} from "lucide-react";
import SectionHeader from "../../../components/shared/SectionHeader";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import StatCard from "../components/StatCard";
import HealthScoreCard from "../components/HealthScoreCard";
import StreakCard from "../components/StreakCard";

function valueOrMissing(value, suffix = "") {
  return value ? `${value}${suffix}` : "Not entered";
}

function calculateScore(checkIn) {
  if (!checkIn) return null;

  const sleepScore = Math.min(100, Math.round((Number(checkIn.sleep) / 8) * 100));
  const moodScore = Number(checkIn.mood) * 10;
  const stressScore = Math.max(0, 100 - Number(checkIn.stress) * 10);
  const cravingScore = Math.max(0, 100 - Number(checkIn.cravings) * 10);

  return Math.round((sleepScore + moodScore + stressScore + cravingScore) / 4);
}

function calculateRisk(checkIn) {
  if (!checkIn) {
    return {
      label: "Not entered",
      trend: "",
      message: "Complete a daily check-in to calculate failure risk."
    };
  }

  const sleep = Number(checkIn.sleep);
  const stress = Number(checkIn.stress);
  const cravings = Number(checkIn.cravings);
  const risk = Math.min(
    100,
    Math.round((stress * 4 + cravings * 4 + Math.max(0, 8 - sleep) * 7) * 1.6)
  );

  if (risk >= 70) {
    return {
      label: "High",
      trend: `${risk}%`,
      message: "Your own check-in shows high pressure from today's signals."
    };
  }

  if (risk >= 40) {
    return {
      label: "Medium",
      trend: `${risk}%`,
      message: "Your own check-in shows some risk signals to watch."
    };
  }

  return {
    label: "Low",
    trend: `${risk}%`,
    message: "Your own check-in currently shows low failure risk."
  };
}

export default function Dashboard({ setActiveRoute }) {
  const { account } = useAuth();
  const profile = account.dietProfile || {};
  const checkIn = account.dailyCheckIn;
  const todayKey = new Date().toISOString().slice(0, 10);
  const hasCheckIn = Boolean(checkIn?.savedAt && checkIn.checkInDate === todayKey);
  const todayCheckIn = hasCheckIn ? checkIn : null;
  const score = calculateScore(todayCheckIn);
  const risk = calculateRisk(todayCheckIn);

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Reality Engine X"
        title={`${profile.personName || account.name || "Your"} Diet Dashboard`}
        description="This dashboard now shows only information you entered in diet setup or daily check-in."
        action={
          <Button onClick={() => setActiveRoute("checkin")}>
            <ClipboardCheck size={18} />
            Daily Check-In
          </Button>
        }
      />

      <section className="hero-grid">
        <article className="hero-card">
          <div>
            <p className="eyebrow">Personal dashboard</p>
            <h2>
              {hasCheckIn
                ? `Today's risk is ${risk.label.toLowerCase()}.`
                : "No daily check-in has been saved yet."}
            </h2>
            <p>
              {hasCheckIn
                ? risk.message
                : "Enter today's calories, protein, sleep, water, mood, stress, and cravings to unlock live dashboard metrics."}
            </p>
          </div>

          <div className="hero-actions">
            <Button onClick={() => setActiveRoute("checkin")}>
              {hasCheckIn ? "Update Check-In" : "Add Check-In"}
            </Button>

            <Button variant="ghost" onClick={() => setActiveRoute("account")}>
              View Saved Info
            </Button>
          </div>
        </article>

        <HealthScoreCard score={score} />
      </section>

      <section className="stats-grid">
        <StatCard
          title="Goal"
          value={valueOrMissing(profile.goal)}
          subtitle="From diet setup"
          icon={Target}
        />

        <StatCard
          title="Current Weight"
          value={valueOrMissing(profile.currentWeightKg, "kg")}
          subtitle="From diet setup"
          icon={Scale}
        />

        <StatCard
          title="Target Weight"
          value={valueOrMissing(profile.targetWeightKg, "kg")}
          subtitle="From diet setup"
          icon={Target}
        />

        <StatCard
          title="Calories"
          value={valueOrMissing(todayCheckIn?.calories)}
          subtitle={hasCheckIn ? "From daily check-in" : "Not checked in"}
          icon={Apple}
        />

        <StatCard
          title="Protein"
          value={valueOrMissing(todayCheckIn?.protein, "g")}
          subtitle={hasCheckIn ? "From daily check-in" : "Not checked in"}
          icon={HeartPulse}
        />

        <StatCard
          title="Sleep"
          value={valueOrMissing(todayCheckIn?.sleep, "h")}
          subtitle={hasCheckIn ? "From daily check-in" : "Not checked in"}
          icon={Bed}
        />

        <StatCard
          title="Water"
          value={valueOrMissing(todayCheckIn?.water, "L")}
          subtitle={hasCheckIn ? "From daily check-in" : "Not checked in"}
          icon={Droplets}
        />

        <StatCard
          title="Risk"
          value={risk.label}
          subtitle="Calculated from your check-in"
          trend={risk.trend}
          icon={ShieldAlert}
        />
      </section>

      <section className="two-column">
        <StreakCard hasCheckIn={hasCheckIn} />

        <article className="panel">
          <p className="eyebrow">Data source</p>
          <h2>No hidden sample values</h2>
          <p>
            Dashboard cards use your diet setup and daily check-in only. If you
            have not entered a value, the dashboard will show it as missing.
          </p>

          <div className="tag-row">
            <span>Diet setup</span>
            <span>Daily check-in</span>
            <span>Saved locally</span>
            <span>No mock stats</span>
          </div>
        </article>
      </section>
    </div>
  );
}
