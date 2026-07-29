// api/send.js
// POST /api/send  body: { id, to, subject, body }
// Instructs the agent to SEND this specific, user-authorized reply.
// This is the ONLY path that sends mail. It runs only when the user clicks Send.

const { ask } = require("./_ondemand");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { id, to, subject, body } = req.body || {};
    if (!to || !body) {
      res.status(400).json({ error: "Missing recipient or reply body." });
      return;
    }
    const query = `Send an email now with the following exact content. Do not modify the body.
To: ${to}
Subject: ${subject}

${body}

After sending, confirm with a short acknowledgement.`;
    const answer = await ask(query, { temperature: 0.1 });
    res.status(200).json({ ok: true, id, confirmation: (answer || "").trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
