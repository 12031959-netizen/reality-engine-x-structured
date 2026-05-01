import { useMemo, useState } from "react";

export default function ScenarioSimulator({ baseScore, healthData }) {
  const [calorieChange, setCalorieChange] = useState(0);
  const [proteinChange, setProteinChange] = useState(0);
  const [sleep, setSleep] = useState(healthData?.sleep.lastNight || 6);
  const [stress, setStress] = useState(healthData?.stress.score || 7);
  const [cravings, setCravings] = useState(healthData?.cravings.score || 5);

  const simulatedScore = useMemo(() => {
    let score = baseScore;
    const calories = healthData?.calories.consumed || 0;
    const calorieTarget = healthData?.calories.target || 0;
    const protein = healthData?.protein.consumed || 0;
    const proteinTarget = healthData?.protein.target || 0;
    const simulatedCalories = calories + calorieChange;
    const simulatedProtein = protein + proteinChange;

    if (simulatedCalories && calorieTarget) {
      const currentGap = Math.abs(calories - calorieTarget);
      const nextGap = Math.abs(simulatedCalories - calorieTarget);

      if (nextGap < currentGap) score -= 14;
      if (nextGap > currentGap) score += 12;
    }

    if (simulatedProtein && proteinTarget) {
      if (simulatedProtein >= proteinTarget) score -= 16;
      if (simulatedProtein < proteinTarget * 0.75) score += 12;
    }

    if (sleep >= 7) score -= 10;
    if (sleep < 6) score += 8;

    if (stress <= 4) score -= 8;
    if (stress >= 8) score += 8;

    if (cravings <= 4) score -= 10;
    if (cravings >= 8) score += 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [baseScore, healthData, calorieChange, proteinChange, sleep, stress, cravings]);

  return (
    <article className="panel simulator-card">
      <p className="eyebrow">Scenario simulator</p>
      <h2>Test tomorrow&apos;s risk</h2>
      <p>
        Adjust calories, protein, sleep, stress, and cravings to see how changes
        could affect failure risk.
      </p>

      <div className="simulator-controls">
        <label>
          <span>
            Calories change: {calorieChange > 0 ? "+" : ""}
            {calorieChange}
          </span>
          <input
            type="range"
            min="-800"
            max="800"
            step="50"
            value={calorieChange}
            onChange={(event) => setCalorieChange(Number(event.target.value))}
          />
        </label>

        <label>
          <span>
            Protein change: {proteinChange > 0 ? "+" : ""}
            {proteinChange}g
          </span>
          <input
            type="range"
            min="-80"
            max="80"
            step="5"
            value={proteinChange}
            onChange={(event) => setProteinChange(Number(event.target.value))}
          />
        </label>

        <label>
          <span>Cravings: {cravings}/10</span>
          <input
            type="range"
            min="1"
            max="10"
            value={cravings}
            onChange={(event) => setCravings(Number(event.target.value))}
          />
        </label>

        <label>
          <span>Sleep: {sleep}h</span>
          <input
            type="range"
            min="4"
            max="9"
            step="0.5"
            value={sleep}
            onChange={(event) => setSleep(Number(event.target.value))}
          />
        </label>

        <label>
          <span>Stress: {stress}/10</span>
          <input
            type="range"
            min="1"
            max="10"
            value={stress}
            onChange={(event) => setStress(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="simulated-result">
        <span>Simulated risk</span>
        <strong>{simulatedScore}%</strong>
      </div>
    </article>
  );
}
