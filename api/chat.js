/**
 * Vercel serverless function: POST /api/chat
 *
 * The browser never sees the API key. It sends the user's question to this
 * function, which calls the Gemini API and returns the answer.
 *
 * Environment variables (set in Vercel > Project > Settings > Environment Variables):
 *   GEMINI_API_KEY  (required)
 *   GEMINI_MODEL    (optional, default below)
 */
const data = require("../data/schemes.json");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY = 8;

// Compact scheme list given to the model as its knowledge base.
const SCHEME_CONTEXT = data.schemes
  .map(
    (s) =>
      `- ${s.name} [${s.category}]: ${s.benefit} Caveats: ${(s.caveats || []).join(" ")} Apply: ${s.steps.join(" ")} Official site: ${s.link}`
  )
  .join("\n");

// Five-part prompt applied to the chatbot itself: role, task, context, constraints, output format.
const SYSTEM_PROMPT = `ROLE: You are "Yojana Mitra", a friendly, patient guide who helps Indian citizens understand government welfare schemes.

TASK: Answer the user's questions about the schemes listed below: who can get them, what they give, which documents are needed, and how to apply. If the user shares a profile (age, income, occupation), suggest the most relevant schemes from the list.

CONTEXT: Many people miss benefits because information is scattered and confusing. Users may be farmers, students, street vendors, workers, women or senior citizens, and may have limited English. Keep language simple.

CONSTRAINTS:
- Use only the schemes in the knowledge base below. If a scheme is not listed, say you do not have it and point to https://www.myscheme.gov.in.
- Never invent amounts, dates, eligibility rules or links.
- Always remind the user that eligibility is indicative and must be confirmed on the official portal or at a Common Service Centre.
- Refuse anything unrelated to government schemes in one polite sentence and steer back to schemes.
- Never ask for Aadhaar, bank, OTP or password details.
- Do not give legal, medical or investment advice.
- If the user writes in Hindi, reply in Hindi.

OUTPUT FORMAT: Short answers (under 150 words). Use short bullet points for steps or documents. Bold the scheme names with **double asterisks**. End with one helpful follow-up question when useful.

KNOWLEDGE BASE (last reviewed ${data.lastReviewed}):
${SCHEME_CONTEXT}`;

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

function buildContents(history, message, profile) {
  const turns = [];
  (Array.isArray(history) ? history.slice(-MAX_HISTORY) : []).forEach((h) => {
    if (h && typeof h.text === "string" && (h.role === "user" || h.role === "model")) {
      turns.push({ role: h.role, parts: [{ text: h.text.slice(0, 1500) }] });
    }
  });
  let text = message;
  if (profile && typeof profile === "object") {
    const { age, income, occupation, gender, category } = profile;
    text = `(User profile: age ${Number(age) || "?"}, annual income ₹${Number(income) || "?"}, occupation ${String(occupation || "?").slice(0, 30)}, gender ${String(gender || "?").slice(0, 15)}, category ${String(category || "?").slice(0, 15)})\n${message}`;
  }
  turns.push({ role: "user", parts: [{ text }] });
  return turns;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 500, { error: "The chatbot is not configured yet (missing API key)." });

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) return send(res, 400, { error: "Please type a question first." });
  if (message.length > MAX_MESSAGE_CHARS)
    return send(res, 400, { error: `Please keep your question under ${MAX_MESSAGE_CHARS} characters.` });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: buildContents(body.history, message, body.profile),
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
        })
      }
    );
    clearTimeout(timer);

    if (apiRes.status === 429) return send(res, 429, { error: "Too many requests right now. Please try again in a minute." });
    if (!apiRes.ok) return send(res, 502, { error: "The AI service had a problem. Please try again." });

    const json = await apiRes.json();
    const reply = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
    if (!reply) return send(res, 502, { error: "The AI did not return an answer. Try rephrasing your question." });

    return send(res, 200, { reply });
  } catch (err) {
    if (err.name === "AbortError") return send(res, 504, { error: "The AI took too long to respond. Please try again." });
    return send(res, 500, { error: "Something went wrong. Please try again." });
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

module.exports.SYSTEM_PROMPT = SYSTEM_PROMPT;
