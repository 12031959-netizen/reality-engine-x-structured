import { useMemo, useState } from "react";

export default function ScenarioSimulator({ baseScore }) {
  const [sleep, setSleep] = useState(6);
  const [stress, setStress] = useState(7);
  const [cravings, setCravings] = useState(8);

  const simulatedScore = useMemo(() => {
    let score = baseScore;

    if (sleep >= 7) score -= 14;
    if (sleep < 6) score += 10;

    if (stress <= 4) score -= 12;
    if (stress >= 8) score += 8;

    if (cravings <= 4) score -= 10;
    if (cravings >= 8) score += 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [baseScore, sleep, stress, cravings]);

  return (
    <article className="panel simulator-card">
      <p className="eyebrow">Scenario simulator</p>
      <h2>Test tomorrow&apos;s risk</h2>
      <p>
        Adjust sleep, stress, and cravings to see how lifestyle changes could
        affect your failure risk.
      </p>

      <div className="simulator-controls">
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
      </div>

      <div className="simulated-result">
        <span>Simulated risk</span>
        <strong>{simulatedScore}%</strong>
      </div>
    </article>
  );
}