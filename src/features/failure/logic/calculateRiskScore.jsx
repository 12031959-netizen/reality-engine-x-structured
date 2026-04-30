export function calculateRiskScore(healthData) {
  if (!healthData) return null;

  const sleep = healthData.sleep.lastNight;
  const mood = healthData.mood.score;
  const stress = healthData.stress.score;
  const cravings = healthData.cravings.score;

  const sleepRisk = sleep < 5 ? 30 : sleep < 6 ? 22 : sleep < 7 ? 12 : 4;
  const stressRisk = stress >= 8 ? 28 : stress >= 7 ? 20 : stress >= 5 ? 12 : 4;
  const cravingRisk =
    cravings >= 8 ? 26 : cravings >= 7 ? 18 : cravings >= 5 ? 10 : 4;
  const moodRisk = mood <= 3 ? 16 : mood <= 5 ? 10 : 4;
  const missingNutritionRisk =
    healthData.calories.consumed > 0 && healthData.protein.consumed > 0 ? 0 : 8;

  const risk =
    sleepRisk + stressRisk + cravingRisk + moodRisk + missingNutritionRisk;

  return Math.min(100, Math.round(risk));
}

export function getRiskLevel(score) {
  if (score === null || score === undefined) {
    return {
      label: "No Risk Data",
      className: "risk-low",
      message: "Save a daily check-in before the system calculates risk."
    };
  }

  if (score >= 75) {
    return {
      label: "High Risk",
      className: "risk-high",
      message: "Your plan may fail soon unless behavior is adjusted."
    };
  }

  if (score >= 45) {
    return {
      label: "Medium Risk",
      className: "risk-medium",
      message: "There are warning signs, but the plan is still recoverable."
    };
  }

  return {
    label: "Low Risk",
    className: "risk-low",
    message: "Your current lifestyle pattern supports your diet goal."
  };
}
