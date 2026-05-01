import Button from "../../../components/ui/Button";
import SectionHeader from "../../../components/shared/SectionHeader";
import FailureRiskCard from "../components/FailureRiskCard";
import RiskBreakdown from "../components/RiskBreakdown";
import AlertBanner from "../components/AlertBanner";
import ScenarioSimulator from "../components/ScenarioSimulator";
import FailureSystemFlow from "../components/FailureSystemFlow";
import InterventionPlan from "../components/InterventionPlan";
import SignalMonitor from "../components/SignalMonitor";
import { useFailurePrediction } from "../hooks/useFailurePrediction";

export default function FailurePrediction({ setActiveRoute }) {
  const { hasData, score, level, behaviorInsights, reasons, healthData } =
    useFailurePrediction();

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Prediction engine"
        title="Diet Failure Prediction System"
        description="A full risk engine that reads calories, protein, sleep, mood, stress, cravings, and wearable data to calculate failure probability and explain the causes."
      />

      <FailureSystemFlow />

      {!hasData ? (
        <article className="panel">
          <p className="eyebrow">No entered check-in</p>
          <h2>No failure risk calculated yet</h2>
          <p>
            The failure prediction system now uses only your saved daily
            check-in. Save calories, protein, sleep, mood, stress, and cravings
            before this page calculates risk.
          </p>

          <Button onClick={() => setActiveRoute?.("checkin")}>
            Add Daily Check-In
          </Button>
        </article>
      ) : (
        <>
          <FailureRiskCard score={score} level={level} />

          <SignalMonitor healthData={healthData} />

          <AlertBanner reasons={reasons} />

          <section className="two-column">
            <RiskBreakdown insights={behaviorInsights} />
            <ScenarioSimulator baseScore={score} healthData={healthData} />
          </section>

          <InterventionPlan healthData={healthData} />
        </>
      )}
    </div>
  );
}
