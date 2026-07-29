// api/emails.js
// GET /api/emails
// Asks the OnDemand agent to read the inbox and return emails grouped-ready:
// a JSON array with id, from, fromEmail, org, subject, body, receivedAt, suggestedReply.
// The agent does the reading, categorizing, and drafting — this just relays it.

const { ask, extractJson } = require("./_ondemand");

const EMAIL_QUERY = `Read my current inbox and return my recent emails as a JSON array ONLY (no prose, no markdown).
Each element must have exactly these fields:
- "id": a stable unique string for the email
- "from": sender display name
- "fromEmail": sender email address
- "org": the organization this email belongs to (group personal/internal sensibly, e.g. company name)
- "subject": the subject line
- "body": the plain-text body
- "receivedAt": ISO 8601 timestamp
- "suggestedReply": a professional, concise draft reply written on my behalf, honest and without inflated claims
Return the JSON array and nothing else.`;

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const answer = await ask(EMAIL_QUERY, { temperature: 0.3 });
    const parsed = extractJson(answer);
    if (!Array.isArray(parsed)) {
      res.status(502).json({
        error: "Agent did not return a JSON array of emails.",
        rawAnswer: answer,
      });
      return;
    }
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
