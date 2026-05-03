function valueOrMissing(value, suffix = "") {
  return value ? `${value}${suffix}` : "Not available";
}

function goalText(goal) {
  if (goal === "Fat loss") {
    return "Fat loss: calories are set below maintenance to create a deficit.";
  }

  if (goal === "Lean bulk" || goal === "Muscle gain") {
    return "Muscle gain: calories are set above maintenance to support growth.";
  }

  return "Maintenance: calories stay close to estimated daily needs.";
}

export default function BmrPlanCard({ healthData }) {
  const plan = healthData.nutritionPlan || {};

  return (
    <article className="panel bmr-plan-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">BMR nutrition system</p>
          <h2>Calories and protein targets</h2>
        </div>
      </div>

      <p>{goalText(plan.goal)}</p>

      <div className="profile-summary">
        <div>
          <span>BMR</span>
          <strong>{valueOrMissing(plan.bmr, " cal")}</strong>
        </div>
        <div>
          <span>Maintenance</span>
          <strong>{valueOrMissing(plan.maintenanceCalories, " cal")}</strong>
        </div>
        <div>
          <span>Goal calories</span>
          <strong>{valueOrMissing(plan.calorieTarget, " cal")}</strong>
        </div>
        <div>
          <span>Protein target</span>
          <strong>{valueOrMissing(plan.proteinTarget, "g")}</strong>
        </div>
        <div>
          <span>Protein formula</span>
          <strong>
            {plan.proteinMultiplier
              ? `${plan.proteinMultiplier}g per kg`
              : "Not available"}
          </strong>
        </div>
        <div>
          <span>Activity factor</span>
          <strong>
            {plan.activityMultiplier ? `x${plan.activityMultiplier}` : "Not available"}
          </strong>
        </div>
      </div>
    </article>
  );
}
