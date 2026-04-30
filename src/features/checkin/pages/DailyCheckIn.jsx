import SectionHeader from "../../../components/shared/SectionHeader";
import DailyCheckInForm from "../components/DailyCheckInForm";

export default function DailyCheckIn() {
  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Daily behavior input"
        title="Daily Check-In"
        description="Enter today's nutrition, recovery, and behavior signals. These values power the dashboard, predictions, analytics, and failure-risk system."
      />

      <DailyCheckInForm />
    </div>
  );
}
