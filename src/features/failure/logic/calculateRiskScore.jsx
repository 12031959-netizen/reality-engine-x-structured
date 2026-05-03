export function calculateRiskScore(healthData) {
  if (!healthData) return null;

  const sleep = healthData.sleep.lastNight;
  const mood = healthData.mood.score;
  const stress = healthData.stress.score;
  const cravings = healthData.cravings.score;
  const calories = healthData.calories.consumed;
  const calorieTarget = healthData.calories.target;
  const calorieGoal = healthData.calories.goal;
  const protein = healthData.protein.consumed;
  const proteinTarget = healthData.protein.target;

  const calorieGap =
    calories && calorieTarget
      ? Math.abs(calories - calorieTarget) / calorieTarget
      : 1;
  const calorieOverTarget =
    calories && calorieTarget ? Math.max(0, calories - calorieTarget) : 0;
  const calorieOverRatio =
    calorieOverTarget && calorieTarget ? calorieOverTarget / calorieTarget : 0;
  const proteinGap =
    protein && proteinTarget
      ? Math.max(0, proteinTarget - protein) / proteinTarget
      : 1;

  const calorieRisk =
    calorieGoal === "Fat loss" && calorieOverRatio > 0
      ? calorieOverRatio >= 0.35
        ? 42
        : calorieOverRatio >= 0.2
          ? 32
          : calorieOverRatio >= 0.1
            ? 18
            : 8
      : calorieGap >= 0.35
        ? 22
        : calorieGap >= 0.2
          ? 14
          : calorieGap >= 0.1
            ? 7
            : 2;
  const proteinRisk =
    proteinGap >= 0.5 ? 16 : proteinGap >= 0.25 ? 10 : proteinGap > 0 ? 6 : 2;
  const missingNutritionRisk = calories > 0 && protein > 0 ? 0 : 14;
  const sleepRisk = sleep < 5 ? 20 : sleep < 6 ? 15 : sleep < 7 ? 8 : 3;
  const stressRisk = stress >= 8 ? 18 : stress >= 7 ? 14 : stress >= 5 ? 8 : 3;
  const cravingRisk =
    cravings >= 8 ? 18 : cravings >= 7 ? 14 : cravings >= 5 ? 8 : 3;
  const moodRisk = mood <= 3 ? 12 : mood <= 5 ? 8 : 3;
  const wearableRisk = healthData.wearable
    ? (healthData.wearable.steps > 0 && healthData.wearable.steps < 3000 ? 8 : 0) +
      (healthData.wearable.activeMinutes > 0 &&
      healthData.wearable.activeMinutes < 15
        ? 6
        : 0) +
      (healthData.wearable.recoveryScore > 0 &&
      healthData.wearable.recoveryScore < 45
        ? 8
        : 0) +
      (healthData.wearable.heartRate > 90 ? 6 : 0)
    : 0;

  const risk =
    calorieRisk +
    proteinRisk +
    missingNutritionRisk +
    sleepRisk +
    stressRisk +
    cravingRisk +
    moodRisk +
    wearableRisk;

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
      message:
        "Nutrition and lifestyle signals show strong pressure against the diet plan."
    };
  }

  if (score >= 45) {
    return {
      label: "Medium Risk",
      className: "risk-medium",
      message:
        "There are warning signs, but the plan is still recoverable."
    };
  }

  return {
    label: "Low Risk",
    className: "risk-low",
    message: "Your current nutrition and lifestyle pattern supports your diet goal."
  };
}
