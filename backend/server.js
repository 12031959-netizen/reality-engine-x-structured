import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const DB_PATH = join(DATA_DIR, "db.json");
const PORT = Number(process.env.PORT || 5000);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const defaultAccount = {
  id: "user-001",
  name: "Mahmoud",
  username: "mahmoud",
  email: "mahmoud@example.com",
  password: "",
  role: "user",
  dietProfile: {
    completed: false
  },
  preferences: {
    dailyReminders: true,
    riskAlerts: true,
    weeklySummary: false,
    privateMode: false,
    hourlyReminders: true,
    appNotifications: false,
    emailNotifications: false,
    remindMood: true,
    remindFood: true,
    remindWater: true
  },
  notificationLog: [],
  dailyHistory: []
};

const adminAccount = {
  id: "admin-001",
  name: "Admin",
  username: "admin",
  email: "admin@realityenginex.local",
  password: "admin123",
  role: "admin",
  dietProfile: {
    completed: true
  },
  preferences: {
    dailyReminders: false,
    riskAlerts: true,
    weeklySummary: true,
    privateMode: false,
    hourlyReminders: false,
    appNotifications: false,
    emailNotifications: false,
    remindMood: false,
    remindFood: false,
    remindWater: false
  },
  notificationLog: [],
  dailyHistory: []
};

function migrateStarterAccount(account) {
  if (account.id === "user-001" && account.username !== "mahmoud") {
    return {
      ...account,
      name: "Mahmoud",
      username: "mahmoud",
      email: "mahmoud@example.com",
      password: ""
    };
  }

  return account;
}

async function ensureDatabase() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const database = JSON.parse(await readFile(DB_PATH, "utf8"));
    const hasAdmin = (database.accounts || []).some(
      (account) => account.role === "admin" || account.id === adminAccount.id
    );
    const migratedAccounts = [
      ...(hasAdmin ? [] : [adminAccount]),
      ...(database.accounts || []).map(migrateStarterAccount)
    ];

    if (JSON.stringify(migratedAccounts) !== JSON.stringify(database.accounts)) {
      await writeDatabase({
        ...database,
        accounts: migratedAccounts
      });
    }
  } catch {
    await writeDatabase({
      accounts: [adminAccount, defaultAccount],
      feedback: []
    });
  }
}

async function readDatabase() {
  await ensureDatabase();
  return JSON.parse(await readFile(DB_PATH, "utf8"));
}

async function writeDatabase(database) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(database, null, 2));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function upsertDailyHistory(history = [], date, patch) {
  const existingRecord = history.find((record) => record.date === date);
  const nextRecord = {
    ...(existingRecord || { date }),
    ...patch,
    updatedAt: new Date().toISOString()
  };

  return [
    nextRecord,
    ...history.filter((record) => record.date !== date)
  ].sort((a, b) => b.date.localeCompare(a.date));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

function sendNoContent(response) {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end();
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

function withoutPassword(account) {
  const { password, ...safeAccount } = account;
  return safeAccount;
}

function publicAccounts(accounts) {
  return accounts.map(withoutPassword);
}

function findAccount(database, accountId) {
  return database.accounts.find((account) => account.id === accountId);
}

function updateAccount(database, accountId, updater) {
  const accountIndex = database.accounts.findIndex(
    (account) => account.id === accountId
  );

  if (accountIndex === -1) return null;

  const nextAccount = updater(database.accounts[accountIndex]);
  database.accounts[accountIndex] = nextAccount;
  return nextAccount;
}

function buildAiDietInstructions(accountContext = {}) {
  return [
    "You are Reality Engine X's real AI Diet Assistant.",
    "Answer the user's diet, food, calorie, protein, BMR, weight goal, health habit, and meal-planning questions.",
    "Use the provided user context when available: diet profile, latest daily check-in, wearable data, BMR targets, and goals.",
    "Be practical, specific, and explain calculations clearly.",
    "Do not diagnose disease or replace a doctor. For medical symptoms, medication, eating disorders, pregnancy, diabetes, heart disease, kidney disease, or severe restriction, tell the user to consult a qualified clinician.",
    "If data is missing, say what data is missing and how it affects the answer.",
    "Prefer concise answers with numbers, next steps, and safe assumptions.",
    `User context JSON: ${JSON.stringify(accountContext)}`
  ].join("\n");
}

function extractOpenAiText(data) {
  if (data.output_text) return data.output_text;

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function createAiDietReply({ message, messages = [], accountContext = {} }) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error(
      "OpenAI API key is missing. Add OPENAI_API_KEY before starting the backend."
    );
    error.statusCode = 503;
    throw error;
  }

  const recentConversation = messages
    .slice(-8)
    .map((item) => `${item.role === "assistant" ? "Assistant" : "User"}: ${item.text}`)
    .join("\n");
  const input = [
    recentConversation ? `Recent conversation:\n${recentConversation}` : "",
    `User question:\n${message}`
  ]
    .filter(Boolean)
    .join("\n\n");

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: buildAiDietInstructions(accountContext),
      input
    })
  });

  const data = await aiResponse.json();

  if (!aiResponse.ok) {
    const error = new Error(data.error?.message || "AI request failed.");
    error.statusCode = aiResponse.status;
    throw error;
  }

  return extractOpenAiText(data) || "I could not generate an answer.";
}

async function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "Reality Engine X API" });
      return;
    }

    const database = await readDatabase();

    if (request.method === "POST" && url.pathname === "/ai/diet-chat") {
      const payload = await readBody(request);
      const message = String(payload.message || "").trim();

      if (!message) {
        sendJson(response, 400, {
          ok: false,
          message: "Message is required."
        });
        return;
      }

      const reply = await createAiDietReply({
        message,
        messages: payload.messages,
        accountContext: payload.accountContext
      });

      sendJson(response, 200, {
        ok: true,
        reply,
        model: OPENAI_MODEL
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/auth/login") {
      const { identifier = "", password = "" } = await readBody(request);
      const normalizedIdentifier = identifier.trim().toLowerCase();

      if (!normalizedIdentifier || !password) {
        sendJson(response, 400, {
          ok: false,
          message: "Enter your username/email and password."
        });
        return;
      }

      const account = database.accounts.find(
        (item) =>
          item.username?.toLowerCase() === normalizedIdentifier ||
          item.email?.toLowerCase() === normalizedIdentifier
      );

      if (!account || account.password !== password) {
        sendJson(response, 401, {
          ok: false,
          message: "Username/email or password is incorrect."
        });
        return;
      }

      sendJson(response, 200, { ok: true, account });
      return;
    }

    if (request.method === "GET" && url.pathname === "/admin/accounts") {
      sendJson(response, 200, {
        accounts: publicAccounts(
          database.accounts.filter((account) => account.role !== "admin")
        )
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/auth/signup") {
      const payload = await readBody(request);
      const existingAccount = database.accounts.find(
        (account) =>
          account.username?.toLowerCase() === payload.username?.toLowerCase() ||
          account.email?.toLowerCase() === payload.email?.toLowerCase()
      );

      if (existingAccount) {
        sendJson(response, 409, {
          ok: false,
          message: "Username or email already exists."
        });
        return;
      }

      const account = {
        ...defaultAccount,
        ...payload,
        id: `user-${Date.now()}`,
        role: "user",
        dietProfile: {
          completed: false
        },
        notificationLog: [],
        dailyHistory: []
      };

      database.accounts.push(account);
      await writeDatabase(database);
      sendJson(response, 201, { ok: true, account });
      return;
    }

    if (pathParts[0] === "accounts" && pathParts[1]) {
      const accountId = pathParts[1];

      if (request.method === "GET" && pathParts.length === 2) {
        const account = findAccount(database, accountId);

        if (!account) {
          sendJson(response, 404, { message: "Account not found." });
          return;
        }

        sendJson(response, 200, { account });
        return;
      }

      if (request.method === "PUT" && pathParts.length === 2) {
        const payload = await readBody(request);
        const account = updateAccount(database, accountId, (current) => ({
          ...current,
          ...payload
        }));

        if (!account) {
          sendJson(response, 404, { message: "Account not found." });
          return;
        }

        await writeDatabase(database);
        sendJson(response, 200, { ok: true, account });
        return;
      }

      if (request.method === "POST" && pathParts[2] === "daily-checkin") {
        const payload = await readBody(request);
        const todayKey = getTodayKey();
        const dailyCheckIn = {
          ...payload,
          checkInDate: todayKey,
          savedAt: new Date().toISOString()
        };
        const account = updateAccount(database, accountId, (current) => ({
          ...current,
          dailyCheckIn,
          dailyHistory: upsertDailyHistory(current.dailyHistory, todayKey, {
            checkIn: dailyCheckIn
          })
        }));

        if (!account) {
          sendJson(response, 404, { message: "Account not found." });
          return;
        }

        await writeDatabase(database);
        sendJson(response, 200, { ok: true, account });
        return;
      }

      if (request.method === "POST" && pathParts[2] === "wearable") {
        const payload = await readBody(request);
        const todayKey = getTodayKey();
        const wearableData = {
          ...payload,
          wearableDate: todayKey,
          savedAt: new Date().toISOString()
        };
        const account = updateAccount(database, accountId, (current) => ({
          ...current,
          wearableData,
          dailyHistory: upsertDailyHistory(current.dailyHistory, todayKey, {
            wearableData
          })
        }));

        if (!account) {
          sendJson(response, 404, { message: "Account not found." });
          return;
        }

        await writeDatabase(database);
        sendJson(response, 200, { ok: true, account });
        return;
      }

      if (request.method === "POST" && pathParts[2] === "feedback") {
        const payload = await readBody(request);
        const feedback = {
          id: Date.now(),
          accountId,
          createdAt: new Date().toISOString(),
          ...payload
        };
        feedback.accountId = accountId;

        database.feedback.unshift(feedback);
        await writeDatabase(database);
        sendJson(response, 201, { ok: true, feedback });
        return;
      }
    }

    if (request.method === "GET" && url.pathname === "/feedback") {
      sendJson(response, 200, { feedback: database.feedback });
      return;
    }

    sendJson(response, 404, { message: "Route not found." });
  } catch (error) {
    sendJson(response, 500, {
      message: error.message || "Server error."
    });
  }
}

createServer(handleRequest).listen(PORT, () => {
  console.log(`Reality Engine X API running on http://localhost:${PORT}`);
});
