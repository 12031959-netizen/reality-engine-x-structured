import { Flame } from "lucide-react";

export default function StreakCard({ hasCheckIn }) {
  return (
    <article className="panel streak-card">
      <div className="streak-icon">
        <Flame size={24} />
      </div>

      <div>
        <p className="eyebrow">Consistency streak</p>
        <h2>{hasCheckIn ? "1 day" : "Not started"}</h2>
        <p>
          {hasCheckIn
            ? "Your streak starts from the check-ins you actually saved."
            : "Complete a daily check-in to start tracking consistency."}
        </p>
      </div>
    </article>
  );
}
