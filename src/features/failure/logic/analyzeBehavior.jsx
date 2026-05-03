export function analyzeBehavior(healthData) {
  const insights = [];
  const calories = healthData.calories.consumed;
  const calorieTarget = healthData.calories.target;
  const calorieGoal = healthData.calories.goal;
  const protein = healthData.protein.consumed;
  const proteinTarget = healthData.protein.target;

  if (calories > 0) {
    const calorieGap = calorieTarget
      ? Math.round(((calories - calorieTarget) / calorieTarget) * 100)
      : null;

    insights.push({
      label: "Calories vs diet target",
      value: calorieTarget ? `${calories} / ${calorieTarget}` : `${calories}`,
      impact:
        calorieGap === null || Math.abs(calorieGap) <= 10
          ? "Strong"
          : Math.abs(calorieGap) <= 20
            ? "Medium"
            : "High",
      description:
        calorieTarget
          ? calorieGoal === "Fat loss" && calorieGap > 0
            ? `Fat loss needs a calorie deficit, but your calories are ${calorieGap}% above the target.`
            : `Your calories are ${Math.abs(calorieGap)}% ${calorieGap >= 0 ? "above" : "below"} the target estimated from your diet profile.`
          : "Calories were entered, but a target could not be calculated because profile data is incomplete."
    });
  }

  if (protein > 0) {
    const proteinGap = proteinTarget
      ? Math.max(0, Math.round(((proteinTarget - protein) / proteinTarget) * 100))
      : null;

    insights.push({
      label: "Protein vs diet target",
      value: proteinTarget ? `${protein}g / ${proteinTarget}g` : `${protein}g`,
      impact:
        proteinGap === null || proteinGap === 0
          ? "Strong"
          : proteinGap <= 25
            ? "Medium"
            : "High",
      description:
        proteinTarget
          ? proteinGap === 0
            ? "Your protein meets the estimated target for diet success."
            : `Protein is about ${proteinGap}% under the estimated target.`
          : "Protein was entered, but a target could not be calculated because profile data is incomplete."
    });
  }

  if (!calories || !protein) {
    insights.push({
      label: "Nutrition data missing",
      value: "Incomplete",
      impact: "High",
      description:
        "Calories and protein are required before the diet success risk can be calculated clearly."
    });
  }

  if (healthData.sleep.lastNight < 6) {
    insights.push({
      label: "Low sleep detected",
      value: `${healthData.sleep.lastNight}h`,
      impact: "High",
      description:
        "Low sleep increases cravings, hunger, stress response, and poor food decisions."
    });
  }

  if (healthData.stress.score >= 7) {
    insights.push({
      label: "Stress pressure",
      value: `${healthData.stress.score}/10`,
      impact: "High",
      description:
        "High stress can reduce diet consistency and increase emotional eating."
    });
  }

  if (healthData.cravings.score >= 7) {
    insights.push({
      label: "Strong cravings",
      value: `${healthData.cravings.score}/10`,
      impact: "Medium",
      description:
        "Cravings are elevated. A planned snack can prevent uncontrolled eating."
    });
  }

  if (healthData.mood.score <= 5) {
    insights.push({
      label: "Mood pressure",
      value: `${healthData.mood.score}/10`,
      impact: "Medium",
      description:
        "Lower mood can make it harder to follow planned meals and resist cravings."
    });
  }

  if (healthData.wearable?.steps > 0) {
    insights.push({
      label: "Uploaded steps",
      value: `${healthData.wearable.steps}`,
      impact: healthData.wearable.steps < 3000 ? "Medium" : "Input",
      description:
        "This value came from your uploaded phone or wearable health data."
    });
  }

  if (healthData.wearable?.heartRate > 0) {
    insights.push({
      label: "Uploaded heart rate",
      value: `${healthData.wearable.heartRate} bpm`,
      impact: healthData.wearable.heartRate > 90 ? "Medium" : "Input",
      description:
        "This heart-rate value is used as recovery context for the risk calculation."
    });
  }

  if (healthData.wearable?.recoveryScore > 0) {
    insights.push({
      label: "Uploaded recovery",
      value: `${healthData.wearable.recoveryScore}%`,
      impact: healthData.wearable.recoveryScore < 45 ? "Medium" : "Input",
      description:
        "This recovery score came from the wearable data saved in your account."
    });
  }

  if (insights.length === 0) {
    insights.push({
      label: "No major driver",
      value: "OK",
      impact: "Low",
      description:
        "The values you entered do not show a strong failure pressure right now."
    });
  }

  return insights;
}
