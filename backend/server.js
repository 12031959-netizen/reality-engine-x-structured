import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const DB_PATH = join(DATA_DIR, "db.json");
const PORT = Number(process.env.PORT || 5000);

const defaultAccount = {
  id: "user-001",
  name: "Karim",
  username: "karim",
  email: "karim@example.com",
  password: "reality123",
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

async function ensureDatabase() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeDatabase({
      accounts: [defaultAccount],
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

    if (request.method === "POST" && url.pathname === "/auth/login") {
      const { identifier = "", password = "" } = await readBody(request);
      const normalizedIdentifier = identifier.trim().toLowerCase();
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
