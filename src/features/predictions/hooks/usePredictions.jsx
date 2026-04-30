import { useAuth } from "../../../hooks/useAuth";

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildPredictions(checkIn, profile, todayKey) {
  if (!checkIn?.savedAt || checkIn.checkInDate !== todayKey) return [];

  const sleep = Number(checkIn.sleep);
  const stress = Number(checkIn.stress);
  const cravings = Number(checkIn.cravings);
  const calories = Number(checkIn.calories);
  const protein = Number(checkIn.protein);
  const targetWeight = Number(profile?.targetWeightKg);
  const currentWeight = Number(profile?.currentWeightKg);

  const riskScore = clamp(stress * 5 + cravings * 5 + Math.max(0, 7 - sleep) * 8);
  const recoveryScore = clamp((sleep / 8) * 100 - stress * 3);
  const nutritionScore = clamp((protein > 0 ? 55 : 0) + (calories > 0 ? 35 : 0));

  const predictions = [
    {
      title: "Diet failure risk",
      level: riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low",
      probability: riskScore,
      description:
        "Calculated from the sleep, stress, and cravings values you entered in the latest check-in."
    },
    {
      title: "Recovery support",
      level: recoveryScore >= 70 ? "Positive" : recoveryScore >= 40 ? "Watch" : "Low",
      probability: recoveryScore,
      description:
        "Estimated from your entered sleep and stress values. Better recovery usually makes the diet easier to follow."
    },
    {
      title: "Nutrition logging completeness",
      level: nutritionScore >= 80 ? "Strong" : "Incomplete",
      probability: nutritionScore,
      description:
        "Based only on whether you entered calories and protein in your latest check-in."
    }
  ];

  if (targetWeight && currentWeight) {
    predictions.push({
      title: "Goal direction",
      level: targetWeight > currentWeight ? "Gain phase" : "Loss phase",
      probability: clamp(Math.abs(targetWeight - currentWeight) * 12),
      description:
        "Based on the current and target weight you entered in the diet setup form."
    });
  }

  return predictions;
}

export function usePredictions() {
  const { account } = useAuth();
  const todayKey = new Date().toISOString().slice(0, 10);
  const predictions = buildPredictions(
    account.dailyCheckIn,
    account.dietProfile,
    todayKey
  );

  return {
    predictions,
    total: predictions.length
  };
}
