import SectionHeader from "../../../components/shared/SectionHeader";
import PredictionCard from "../components/PredictionCard";
import { usePredictions } from "../hooks/usePredictions";

export default function Predictions() {
  const { predictions } = usePredictions();

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="AI prediction center"
        title="Predictions"
        description="Predictions are generated only from your diet setup and latest daily check-in."
      />

      {predictions.length === 0 ? (
        <article className="panel">
          <p className="eyebrow">No entered data</p>
          <h2>No predictions yet</h2>
          <p>
            Save a daily check-in first. The prediction center will not show
            sample predictions that you did not create data for.
          </p>
        </article>
      ) : (
        <section className="card-list">
          {predictions.map((prediction) => (
            <PredictionCard key={prediction.title} prediction={prediction} />
          ))}
        </section>
      )}
    </div>
  );
}
