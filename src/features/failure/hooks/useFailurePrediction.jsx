import { useAuth } from "../../../hooks/useAuth";
import {
  calculateRiskScore,
  getRiskLevel
} from "../logic/calculateRiskScore";
import { analyzeBehavior } from "../logic/analyzeBehavior";
import { generateFailureReasons } from "../logic/generateFailureReasons";

function buildHealthData(account) {
  const checkIn = account.dailyCheckIn;
  const todayKey = new Date().toISOString().slice(0, 10);

  if (!checkIn?.savedAt || checkIn.checkInDate !== todayKey) return null;

  return {
    calories: {
      consumed: Number(checkIn.calories) || 0
    },
    protein: {
      consumed: Number(checkIn.protein) || 0
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
    profile: account.dietProfile || {},
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
