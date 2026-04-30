export function generateFailureReasons(healthData) {
  const reasons = [];

  if (healthData.sleep.lastNight < 6) {
    reasons.push("Sleep is below the recovery target.");
  }

  if (healthData.stress.score >= 7) {
    reasons.push("Stress is high enough to affect discipline and hunger.");
  }

  if (healthData.cravings.score >= 7) {
    reasons.push("Cravings are currently elevated.");
  }

  if (healthData.mood.score <= 5) {
    reasons.push("Mood is low enough to affect consistency.");
  }

  if (!healthData.calories.consumed || !healthData.protein.consumed) {
    reasons.push("Nutrition check-in is incomplete.");
  }

  if (reasons.length === 0) {
    reasons.push("No major risk drivers detected from your latest check-in.");
  }

  return reasons;
}
