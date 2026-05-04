import { ArrowRight, ClipboardCheck, LineChart, ShieldCheck } from "lucide-react";
import Button from "../../../components/ui/Button";

const highlights = [
  {
    icon: ClipboardCheck,
    title: "Daily check-ins",
    text: "Save nutrition, sleep, water, mood, stress, and cravings in one place."
  },
  {
    icon: LineChart,
    title: "Progress signals",
    text: "See your own entered and uploaded data turn into simple trends."
  },
  {
    icon: ShieldCheck,
    title: "Failure risk",
    text: "Spot pressure early with risk insights based on your latest check-in."
  }
];

export default function Welcome({ setAuthRoute }) {
  return (
    <section className="welcome-page">
      <div className="welcome-shell">
        <div className="welcome-copy">
          <p className="eyebrow">Reality Engine X</p>
          <h1>Welcome to your diet control center</h1>
          <p>
            Track your daily behavior, understand your progress, and get clearer
            signals before small slips become bigger setbacks.
          </p>

          <div className="welcome-actions">
            <Button onClick={() => setAuthRoute("login")}>
              Login
              <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setAuthRoute("signup")}>
              Create account
            </Button>
          </div>
        </div>

        <div className="welcome-preview" aria-hidden="true">
          <div className="welcome-preview-top">
            <span />
            <span />
            <span />
          </div>

          <div className="welcome-score">
            <span>Today</span>
            <strong>82%</strong>
            <small>Low risk</small>
          </div>

          <div className="welcome-bars">
            <span style={{ "--bar-height": "72%" }} />
            <span style={{ "--bar-height": "48%" }} />
            <span style={{ "--bar-height": "86%" }} />
            <span style={{ "--bar-height": "62%" }} />
            <span style={{ "--bar-height": "78%" }} />
          </div>
        </div>

        <div className="welcome-highlights">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <div className="stat-icon">
                <Icon size={20} />
              </div>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
