// _ondemand.js
// Core OnDemand client — a direct refactor of the original Python script's flow:
//   1) create a chat session
//   2) submit a query to the agent
//   3) return the agent's answer
// Runs server-side only. The API key comes from an environment variable and is
// NEVER sent to the browser.

const BASE_URL = "https://api.on-demand.io/chat/v1";

const API_KEY = process.env.ONDEMAND_API_KEY;
const AGENT_IDS = (process.env.ONDEMAND_AGENT_IDS || "agent-1741770626")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ENDPOINT_ID = process.env.ONDEMAND_ENDPOINT_ID || "predefined-claude-4-8-opus";

// --- Step 1: create a chat session (mirrors create_chat_session) ---
async function createSession(externalUserId, contextMetadata = []) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { apikey: API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      agentIds: AGENT_IDS,
      externalUserId: externalUserId || "email-command-center",
      contextMetadata,
    }),
  });
  if (!res.ok) {
    throw new Error(`createSession failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.id;
}

// --- Step 2: submit a query (mirrors submit_query, sync mode) ---
// Sync keeps the proxy simple and reliable for request/response use.
async function submitQuery(sessionId, query, opts = {}) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/query`, {
    method: "POST",
    headers: { apikey: API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      endpointId: ENDPOINT_ID,
      query,
      agentIds: AGENT_IDS,
      responseMode: "sync",
      modelConfigs: {
        fulfillmentPrompt: opts.fulfillmentPrompt || "",
        stopSequences: [],
        temperature: opts.temperature ?? 0.7,
        topP: 1,
        maxTokens: opts.maxTokens ?? 0,
        presencePenalty: 0,
        frequencyPenalty: 0,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`submitQuery failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.data?.answer ?? "";
}

// Convenience: session + query in one call
async function ask(query, opts = {}) {
  if (!API_KEY) throw new Error("ONDEMAND_API_KEY is not set on the server.");
  const sessionId = await createSession(opts.externalUserId, opts.contextMetadata);
  return submitQuery(sessionId, query, opts);
}

// Pull the first JSON object/array out of a possibly-prose answer.
// The agent is asked to return pure JSON, but this makes parsing robust
// if it wraps the JSON in explanation or code fences.
function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const slice = candidate.slice(start);
  try {
    return JSON.parse(slice);
  } catch {
    // try trimming to the last closing bracket
    const lastArr = slice.lastIndexOf("]");
    const lastObj = slice.lastIndexOf("}");
    const end = Math.max(lastArr, lastObj);
    if (end === -1) return null;
    try {
      return JSON.parse(slice.slice(0, end + 1));
    } catch {
      return null;
    }
  }
}

module.exports = { createSession, submitQuery, ask, extractJson };
