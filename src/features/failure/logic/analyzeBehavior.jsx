export function analyzeBehavior(healthData) {
  const insights = [];

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

  if (healthData.calories.consumed > 0) {
    insights.push({
      label: "Calories entered",
      value: `${healthData.calories.consumed}`,
      impact: "Input",
      description:
        "This value came from your latest daily check-in and is used as context, not a fake target comparison."
    });
  }

  if (healthData.protein.consumed > 0) {
    insights.push({
      label: "Protein entered",
      value: `${healthData.protein.consumed}g`,
      impact: "Input",
      description:
        "This protein value came from your latest daily check-in."
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
