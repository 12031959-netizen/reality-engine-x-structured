import SectionHeader from "../../../components/shared/SectionHeader";
import { useAuth } from "../../../hooks/useAuth";
import TrendChart from "../components/TrendChart";
import ProgressChart from "../components/ProgressChart";

function buildAnalyticsData(checkIn, todayKey) {
  if (!checkIn?.savedAt || checkIn.checkInDate !== todayKey) return [];

  const sleep = Number(checkIn.sleep);
  const mood = Number(checkIn.mood);
  const stress = Number(checkIn.stress);
  const cravings = Number(checkIn.cravings);
  const score = Math.round(
    (Math.min(100, (sleep / 8) * 100) +
      mood * 10 +
      Math.max(0, 100 - stress * 10) +
      Math.max(0, 100 - cravings * 10)) /
      4
  );

  return [
    {
      day: "Latest",
      calories: Number(checkIn.calories),
      sleep,
      mood,
      score
    }
  ];
}

export default function Analytics() {
  const { account } = useAuth();
  const todayKey = new Date().toISOString().slice(0, 10);
  const analyticsData = buildAnalyticsData(account.dailyCheckIn, todayKey);

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Progress analytics"
        title="Analytics"
        description="Analytics now use only the daily check-in data you entered. Save more check-ins to build richer trends."
      />

      <section className="two-column">
        <TrendChart data={analyticsData} />
        <ProgressChart data={analyticsData} />
      </section>
    </div>
  );
}
