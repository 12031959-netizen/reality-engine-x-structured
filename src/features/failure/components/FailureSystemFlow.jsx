import { Activity, Brain, ClipboardCheck, ShieldAlert } from "lucide-react";

const steps = [
  {
    title: "Collect signals",
    description: "Calories, protein, sleep, mood, stress, and cravings are read from the daily check-in.",
    icon: Activity
  },
  {
    title: "Score risk",
    description: "The engine gives each weak signal a weight, then converts the combined pressure into a failure probability.",
    icon: Brain
  },
  {
    title: "Explain causes",
    description: "The strongest drivers are shown so the user knows why the score changed.",
    icon: ShieldAlert
  },
  {
    title: "Recommend action",
    description: "The system turns the risk into practical next steps for the next 24 hours.",
    icon: ClipboardCheck
  }
];

export default function FailureSystemFlow() {
  return (
    <section className="failure-system-flow">
      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <article className="panel system-step" key={step.title}>
            <div className="system-step-index">{index + 1}</div>
            <div className="stat-icon">
              <Icon size={22} />
            </div>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </article>
        );
      })}
    </section>
  );
}
