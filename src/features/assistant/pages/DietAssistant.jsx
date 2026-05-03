import { useMemo, useState } from "react";
import { Bot, Calculator, Send, Sparkles, Utensils } from "lucide-react";
import SectionHeader from "../../../components/shared/SectionHeader";
import { useAuth } from "../../../hooks/useAuth";
import { apiClient } from "../../../services/apiClient";

const starterQuestions = [
  "Calculate my calorie and protein target",
  "I ate 200g chicken and 150g rice",
  "What should I eat if my protein is low?",
  "Why is my fat loss risk high?"
];

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? number : null;
}

function calculateNutritionPlan(account) {
  const profile = account.dietProfile || {};
  const weight = numberOrNull(profile.currentWeightKg || account.weightKg);
  const height = numberOrNull(profile.heightCm || account.heightCm);
  const age = numberOrNull(profile.age || account.age);
  const gender = profile.gender || "Male";
  const activityLevel = profile.activityLevel || "Moderate";
  const goal = profile.goal || account.goal || "Maintenance";

  if (!weight || !height || !age) {
    return {
      ready: false,
      goal,
      message:
        "Complete diet setup first so I can calculate BMR, calories, and protein."
    };
  }

  const bmr =
    gender === "Female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultiplier =
    {
      Low: 1.25,
      Moderate: 1.45,
      High: 1.65,
      Athlete: 1.85
    }[activityLevel] || 1.45;
  const maintenance = Math.round(bmr * activityMultiplier);
  const calorieTarget =
    goal === "Fat loss"
      ? maintenance - 400
      : goal === "Lean bulk" || goal === "Muscle gain"
        ? maintenance + 250
        : maintenance;
  const proteinMultiplier =
    goal === "Fat loss"
      ? 2
      : goal === "Lean bulk" || goal === "Muscle gain"
        ? 1.8
        : 1.6;

  return {
    ready: true,
    goal,
    bmr: Math.round(bmr),
    maintenance,
    calorieTarget: Math.round(calorieTarget),
    proteinTarget: Math.round(weight * proteinMultiplier),
    proteinMultiplier
  };
}

function buildAccountContext(account, plan) {
  return {
    user: {
      name: account.name,
      username: account.username
    },
    dietProfile: account.dietProfile || {},
    dailyCheckIn: account.dailyCheckIn || null,
    wearableData: account.wearableData || null,
    nutritionPlan: plan
  };
}

export default function DietAssistant() {
  const { account } = useAuth();
  const plan = useMemo(() => calculateNutritionPlan(account), [account]);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me about calories, protein, BMR, food estimates, fat loss, muscle gain, or why your diet risk is high."
    }
  ]);

  async function sendMessage(text = input) {
    const message = text.trim();
    if (!message || isThinking) return;

    const nextMessages = [...messages, { role: "user", text: message }];

    setMessages(nextMessages);
    setInput("");
    setIsThinking(true);

    try {
      const result = await apiClient.post("/ai/diet-chat", {
        message,
        messages: nextMessages.slice(-8),
        accountContext: buildAccountContext(account, plan)
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.reply
        }
      ]);
    } catch (error) {
      const message =
        error.message === "Failed to fetch"
          ? "The AI backend is not reachable. Start the backend with npm.cmd run api, and make sure OPENAI_API_KEY is set before starting it."
          : error.message ||
            "The real AI service is not connected. Start the backend with an OpenAI API key.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: message
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="AI diet support"
        title="AI Diet Assistant"
        description="Ask about diet, food calories, protein, BMR, fat loss, muscle gain, and your saved health data."
      />

      <section className="assistant-layout">
        <article className="panel assistant-chat">
          <div className="assistant-chat-header">
            <div className="stat-icon">
              <Bot size={22} />
            </div>
            <div>
              <p className="eyebrow">Diet AI</p>
              <h2>Ask anything about your plan</h2>
            </div>
          </div>

          <div className="assistant-messages">
            {messages.map((message, index) => (
              <div
                className={`assistant-message assistant-message-${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.text.split("\n").map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ))}
            {isThinking && (
              <div className="assistant-message assistant-message-assistant">
                <p>Thinking with the real AI model...</p>
              </div>
            )}
          </div>

          <form
            className="assistant-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              placeholder="Ask about calories, protein, meals, or BMR..."
              disabled={isThinking}
              onChange={(event) => setInput(event.target.value)}
            />
            <button className="btn btn-md btn-primary" type="submit" disabled={isThinking}>
              <Send size={18} />
              {isThinking ? "Thinking" : "Send"}
            </button>
          </form>
        </article>

        <aside className="page-stack">
          <article className="panel assistant-plan-card">
            <div className="stat-icon">
              <Calculator size={22} />
            </div>
            <p className="eyebrow">Your target</p>
            <h2>{plan.ready ? `${plan.calorieTarget} calories` : "Needs setup"}</h2>
            <p>
              {plan.ready
                ? `${plan.proteinTarget}g protein for ${plan.goal}. BMR: ${plan.bmr}, maintenance: ${plan.maintenance}.`
                : plan.message}
            </p>
          </article>

          <article className="panel">
            <div className="assistant-chat-header">
              <div className="stat-icon">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="eyebrow">Quick prompts</p>
                <h2>Try asking</h2>
              </div>
            </div>

            <div className="assistant-prompts">
              {starterQuestions.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="assistant-chat-header">
              <div className="stat-icon">
                <Utensils size={22} />
              </div>
              <div>
                <p className="eyebrow">Food calculator</p>
                <h2>Known foods</h2>
              </div>
            </div>
            <p>
              The real AI can estimate meals, explain macros, compare foods,
              and use your profile/check-in context when the backend API key is
              configured.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
