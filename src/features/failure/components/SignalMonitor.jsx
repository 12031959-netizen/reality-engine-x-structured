const signals = [
  {
    label: "Sleep",
    getValue: (data) => `${data.sleep.lastNight}h`,
    getScore: (data) => Math.min(100, Math.round((data.sleep.lastNight / 8) * 100)),
    target: "From daily check-in"
  },
  {
    label: "Mood",
    getValue: (data) => `${data.mood.score}/10`,
    getScore: (data) => data.mood.score * 10,
    target: "From daily check-in"
  },
  {
    label: "Stress",
    getValue: (data) => `${data.stress.score}/10`,
    getScore: (data) => Math.max(0, 100 - data.stress.score * 10),
    target: "Lower is safer"
  },
  {
    label: "Cravings",
    getValue: (data) => `${data.cravings.score}/10`,
    getScore: (data) => Math.max(0, 100 - data.cravings.score * 10),
    target: "Lower is safer"
  },
  {
    label: "Calories",
    getValue: (data) =>
      data.calories.consumed ? `${data.calories.consumed}` : "Not entered",
    getScore: (data) => (data.calories.consumed ? 100 : 0),
    target: "Entered value only"
  },
  {
    label: "Protein",
    getValue: (data) =>
      data.protein.consumed ? `${data.protein.consumed}g` : "Not entered",
    getScore: (data) => (data.protein.consumed ? 100 : 0),
    target: "Entered value only"
  }
];

export default function SignalMonitor({ healthData }) {
  return (
    <article className="panel signal-monitor">
      <div className="panel-header">
        <div>
          <p className="eyebrow">System inputs</p>
          <h2>Your latest check-in signals</h2>
        </div>
      </div>

      <div className="signal-grid">
        {signals.map((signal) => {
          const score = signal.getScore(healthData);

          return (
            <div className="signal-card" key={signal.label}>
              <div className="signal-card-header">
                <span>{signal.label}</span>
                <strong>{signal.getValue(healthData)}</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${score}%` }} />
              </div>
              <small>{signal.target}</small>
            </div>
          );
        })}
      </div>
    </article>
  );
}
