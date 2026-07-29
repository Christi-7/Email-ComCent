// api/regenerate.js
// POST /api/regenerate  body: { from, org, subject, body }
// Asks the agent to draft a fresh reply for one email. Returns { reply }.

const { ask } = require("./_ondemand");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { from, org, subject, body } = req.body || {};
    if (!body) {
      res.status(400).json({ error: "Missing email body." });
      return;
    }
    const query = `Draft a professional, warm, concise reply on my behalf to the email below.
Keep the tone honest and defensible — no inflated claims. Return ONLY the reply body text, no subject line, no preamble.

From: ${from} (${org})
Subject: ${subject}

${body}`;
    const answer = await ask(query, { temperature: 0.6 });
    res.status(200).json({ reply: (answer || "").trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
