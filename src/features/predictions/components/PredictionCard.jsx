export default function PredictionCard({ prediction }) {
  return (
    <article className="panel prediction-card">
      <div className="prediction-top">
        <div>
          <p className="eyebrow">{prediction.level}</p>
          <h2>{prediction.title}</h2>
        </div>

        <strong>{prediction.probability}%</strong>
      </div>

      <p>{prediction.description}</p>

      <div className="progress-track">
        <span style={{ width: `${prediction.probability}%` }} />
      </div>
    </article>
  );
}