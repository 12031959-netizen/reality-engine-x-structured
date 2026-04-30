import { CalendarDays, ClipboardCheck, Watch } from "lucide-react";
import SectionHeader from "../../../components/shared/SectionHeader";
import { useAuth } from "../../../hooks/useAuth";

function formatValue(value, suffix = "") {
  return value ? `${value}${suffix}` : "Not saved";
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function DailyHistory() {
  const { account } = useAuth();
  const history = account.dailyHistory || [];

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Saved records"
        title="Daily History"
        description="Every day gets one saved record. Daily Check-In and Wearable Data are stored together by date."
      />

      {history.length === 0 ? (
        <article className="panel">
          <p className="eyebrow">No records yet</p>
          <h2>Nothing has been saved</h2>
          <p>
            Save a Daily Check-In or import Wearable Data to create your first
            daily record.
          </p>
        </article>
      ) : (
        <section className="history-list">
          {history.map((record) => (
            <article className="panel history-card" key={record.date}>
              <div className="history-card-header">
                <div className="stat-icon">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <p className="eyebrow">{record.date}</p>
                  <h2>{formatDate(record.date)}</h2>
                </div>
              </div>

              <div className="history-columns">
                <div className="history-section">
                  <div className="history-section-title">
                    <ClipboardCheck size={18} />
                    <strong>Daily Check-In</strong>
                  </div>

                  <div className="history-grid">
                    <span>Calories</span>
                    <strong>{formatValue(record.checkIn?.calories)}</strong>
                    <span>Protein</span>
                    <strong>{formatValue(record.checkIn?.protein, "g")}</strong>
                    <span>Sleep</span>
                    <strong>{formatValue(record.checkIn?.sleep, "h")}</strong>
                    <span>Water</span>
                    <strong>{formatValue(record.checkIn?.water, "L")}</strong>
                    <span>Mood</span>
                    <strong>{formatValue(record.checkIn?.mood, "/10")}</strong>
                    <span>Stress</span>
                    <strong>{formatValue(record.checkIn?.stress, "/10")}</strong>
                    <span>Cravings</span>
                    <strong>{formatValue(record.checkIn?.cravings, "/10")}</strong>
                  </div>

                  {record.checkIn?.notes && (
                    <p className="history-note">{record.checkIn.notes}</p>
                  )}
                </div>

                <div className="history-section">
                  <div className="history-section-title">
                    <Watch size={18} />
                    <strong>Wearable Data</strong>
                  </div>

                  <div className="history-grid">
                    <span>Device</span>
                    <strong>{formatValue(record.wearableData?.device)}</strong>
                    <span>Steps</span>
                    <strong>{formatValue(record.wearableData?.steps)}</strong>
                    <span>Heart Rate</span>
                    <strong>{formatValue(record.wearableData?.heartRate, " bpm")}</strong>
                    <span>Active Minutes</span>
                    <strong>
                      {formatValue(record.wearableData?.activeMinutes, " min")}
                    </strong>
                    <span>Recovery</span>
                    <strong>{formatValue(record.wearableData?.recoveryScore, "%")}</strong>
                    <span>Source</span>
                    <strong>{formatValue(record.wearableData?.source)}</strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
