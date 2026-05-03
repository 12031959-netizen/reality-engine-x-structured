import { useAuth } from "../../../hooks/useAuth";
import { getLocalDateKey } from "../../../utils/dateKeys";
import {
  calculateRiskScore,
  getRiskLevel
} from "../logic/calculateRiskScore";
import { analyzeBehavior } from "../logic/analyzeBehavior";
import { generateFailureReasons } from "../logic/generateFailureReasons";

function calculateNutritionPlan(account) {
  const profile = account.dietProfile || {};
  const existingTarget = Number(account.dailyCaloriesTarget || profile.dailyCaloriesTarget);
  const existingProteinTarget = Number(account.proteinTarget || profile.proteinTarget);
  const weight = Number(profile.currentWeightKg || account.weightKg);
  const height = Number(profile.heightCm || account.heightCm);
  const age = Number(profile.age || account.age);
  const gender = profile.gender || "";
  const activityLevel = profile.activityLevel || "Moderate";
  const goal = profile.goal || account.goal || "";

  if (!weight || !height || !age) {
    return {
      bmr: 0,
      maintenanceCalories: 0,
      calorieTarget: existingTarget || 0,
      proteinTarget: existingProteinTarget || 0,
      proteinMultiplier: 0,
      activityMultiplier: 0,
      goal
    };
  }

  const bmr =
    gender === "Female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultiplier =
    {
      Low: 1.25,
      Moderate: 1.45,
      High: 1.65,
      Athlete: 1.85
    }[activityLevel] || 1.45;
  const maintenance = bmr * activityMultiplier;
  const proteinMultiplier =
    goal === "Fat loss"
      ? 2
      : goal === "Lean bulk" || goal === "Muscle gain"
        ? 1.8
        : 1.6;
  const calculatedProteinTarget = Math.round(weight * proteinMultiplier);
  let calculatedCalorieTarget = Math.round(maintenance);

  if (goal === "Fat loss") {
    calculatedCalorieTarget = Math.round(maintenance - 400);
  }

  if (goal === "Lean bulk" || goal === "Muscle gain") {
    calculatedCalorieTarget = Math.round(maintenance + 250);
  }

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenance),
    calorieTarget: existingTarget || calculatedCalorieTarget,
    proteinTarget: existingProteinTarget || calculatedProteinTarget,
    proteinMultiplier,
    activityMultiplier,
    goal
  };
}

function buildHealthData(account) {
  const checkIn = account.dailyCheckIn;
  const wearableData = account.wearableData;
  const todayKey = getLocalDateKey();

  if (!checkIn?.savedAt || checkIn.checkInDate !== todayKey) return null;
  const hasTodayWearableData =
    wearableData?.savedAt && wearableData.wearableDate === todayKey;
  const nutritionPlan = calculateNutritionPlan(account);

  return {
    calories: {
      consumed: Number(checkIn.calories) || 0,
      target: nutritionPlan.calorieTarget,
      goal: nutritionPlan.goal
    },
    protein: {
      consumed: Number(checkIn.protein) || 0,
      target: nutritionPlan.proteinTarget
    },
    water: {
      consumed: Number(checkIn.water) || 0
    },
    sleep: {
      lastNight: Number(checkIn.sleep) || 0
    },
    mood: {
      score: Number(checkIn.mood) || 0
    },
    stress: {
      score: Number(checkIn.stress) || 0
    },
    cravings: {
      score: Number(checkIn.cravings) || 0
    },
    wearable: hasTodayWearableData
      ? {
          steps: Number(wearableData.steps) || 0,
          heartRate: Number(wearableData.heartRate) || 0,
          activeMinutes: Number(wearableData.activeMinutes) || 0,
          recoveryScore: Number(wearableData.recoveryScore) || 0,
          source: wearableData.source || ""
        }
      : null,
    profile: account.dietProfile || {},
    nutritionPlan,
    savedAt: checkIn.savedAt
  };
}

export function useFailurePrediction() {
  const { account } = useAuth();
  const healthData = buildHealthData(account);

  if (!healthData) {
    return {
      hasData: false,
      score: null,
      level: getRiskLevel(null),
      behaviorInsights: [],
      reasons: [],
      healthData: null
    };
  }

  const score = calculateRiskScore(healthData);
  const level = getRiskLevel(score);
  const behaviorInsights = analyzeBehavior(healthData);
  const reasons = generateFailureReasons(healthData);

  return {
    hasData: true,
    score,
    level,
    behaviorInsights,
    reasons,
    healthData
  };
}
