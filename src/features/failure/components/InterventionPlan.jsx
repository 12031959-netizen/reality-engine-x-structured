import { CheckCircle2 } from "lucide-react";

function buildActions(healthData) {
  const actions = [];

  if (healthData.sleep.lastNight < 6) {
    actions.push("Move bedtime earlier tonight and avoid late caffeine.");
  }

  if (healthData.stress.score >= 7) {
    actions.push("Use a short stress reset before the highest-risk meal.");
  }

  if (healthData.cravings.score >= 7) {
    actions.push("Plan one controlled snack before cravings peak.");
  }

  if (!healthData.protein.consumed) {
    actions.push("Enter protein in the next check-in so nutrition risk can be clearer.");
  }

  if (!healthData.calories.consumed) {
    actions.push("Enter calories in the next check-in so the system has complete context.");
  }

  return actions.length
    ? actions
    : ["Keep the current routine and check signals again tomorrow."];
}

export default function InterventionPlan({ healthData }) {
  const actions = buildActions(healthData);

  return (
    <article className="panel intervention-plan">
      <p className="eyebrow">System output</p>
      <h2>Next 24-hour action plan</h2>
      <p>
        These actions are generated from the strongest risk drivers detected by
        the failure prediction system.
      </p>

      <div className="action-list">
        {actions.map((action) => (
          <div className="action-row" key={action}>
            <CheckCircle2 size={19} />
            <span>{action}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
