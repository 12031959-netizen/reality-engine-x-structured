import { Flame } from "lucide-react";

export default function StreakCard({ streakDays }) {
  const hasStreak = streakDays > 0;

  return (
    <article className="panel streak-card">
      <div className="streak-icon">
        <Flame size={24} />
      </div>

      <div>
        <p className="eyebrow">Consistency streak</p>
        <h2>
          {hasStreak
            ? `${streakDays} ${streakDays === 1 ? "day" : "days"}`
            : "Not started"}
        </h2>
        <p>
          {hasStreak
            ? "Your streak includes consecutive daily check-ins through today."
            : "Complete a daily check-in to start tracking consistency."}
        </p>
      </div>
    </article>
  );
}
