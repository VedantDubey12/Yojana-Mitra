/* Dependency-free tests. Run with: node tests/run-tests.js */
const assert = require("assert");
const Engine = require("../assets/eligibility.js");
const data = require("../data/schemes.json");

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log("  ok  " + name); })
    .catch((e) => { console.error("FAIL  " + name + "\n      " + e.message); process.exitCode = 1; });
}
const ids = (p) => Engine.matchSchemes(p, data.schemes).map((s) => s.id);

(async () => {
  console.log("Eligibility engine");
  await test("farmer aged 40, low income gets farm schemes and PM-JAY", () => {
    const r = ids({ age: 40, income: 100000, occupation: "farmer", gender: "male", category: "OBC" });
    ["pm-kisan", "pmfby", "kcc", "pmjay", "pmay", "apy"].forEach((id) => assert(r.includes(id), id));
    assert(!r.includes("svanidhi"));
  });
  await test("student with ₹3 lakh income gets scholarship + skill training, not farm schemes", () => {
    const r = ids({ age: 20, income: 300000, occupation: "student", gender: "", category: "" });
    assert(r.includes("scholarship") && r.includes("skill-india"));
    assert(!r.includes("pm-kisan"));
  });
  await test("student above ₹4.5 lakh income loses scholarship", () => {
    assert(!ids({ age: 20, income: 600000, occupation: "student", gender: "", category: "" }).includes("scholarship"));
  });
  await test("PM-JAY: 72-year-old with high income still qualifies (age 70+)", () => {
    assert(ids({ age: 72, income: 2000000, occupation: "retired", gender: "", category: "" }).includes("pmjay"));
  });
  await test("PM-JAY: 45-year-old with high income does not", () => {
    assert(!ids({ age: 45, income: 2000000, occupation: "salaried", gender: "", category: "" }).includes("pmjay"));
  });
  await test("Ujjwala needs a woman, 18+, low income", () => {
    assert(ids({ age: 30, income: 90000, occupation: "homemaker", gender: "female", category: "" }).includes("ujjwala"));
    assert(!ids({ age: 30, income: 90000, occupation: "homemaker", gender: "male", category: "" }).includes("ujjwala"));
    assert(!ids({ age: 30, income: 90000, occupation: "homemaker", gender: "", category: "" }).includes("ujjwala"));
  });
  await test("Stand-Up India: woman or SC/ST business owner only", () => {
    assert(ids({ age: 35, income: 400000, occupation: "small_business", gender: "female", category: "General" }).includes("standup"));
    assert(ids({ age: 35, income: 400000, occupation: "small_business", gender: "male", category: "SC" }).includes("standup"));
    assert(!ids({ age: 35, income: 400000, occupation: "small_business", gender: "male", category: "General" }).includes("standup"));
  });
  await test("APY age window is 18-40", () => {
    assert(ids({ age: 18, income: 0, occupation: "unemployed", gender: "", category: "" }).includes("apy"));
    assert(!ids({ age: 41, income: 0, occupation: "unemployed", gender: "", category: "" }).includes("apy"));
    assert(!ids({ age: 17, income: 0, occupation: "student", gender: "", category: "" }).includes("apy"));
  });
  await test("senior citizen BPL gets old-age pension", () => {
    assert(ids({ age: 65, income: 80000, occupation: "retired", gender: "", category: "" }).includes("ignoaps"));
    assert(!ids({ age: 65, income: 500000, occupation: "retired", gender: "", category: "" }).includes("ignoaps"));
  });
  await test("street vendor gets SVANidhi, MUDRA and e-Shram", () => {
    const r = ids({ age: 30, income: 120000, occupation: "street_vendor", gender: "", category: "" });
    ["svanidhi", "mudra", "eshram", "pmsym"].forEach((id) => assert(r.includes(id), id));
  });
  await test("profile validation rejects bad input", () => {
    assert(Engine.validateProfile({ age: NaN, income: 1, occupation: "farmer" }).length > 0);
    assert(Engine.validateProfile({ age: 200, income: 1, occupation: "farmer" }).length > 0);
    assert(Engine.validateProfile({ age: 30, income: -5, occupation: "farmer" }).length > 0);
    assert(Engine.validateProfile({ age: 30, income: 5, occupation: "" }).length > 0);
    assert.strictEqual(Engine.validateProfile({ age: 30, income: 0, occupation: "farmer" }).length, 0);
  });
  await test("every scheme has required fields", () => {
    data.schemes.forEach((s) => {
      ["id", "name", "category", "benefit", "link"].forEach((k) => assert(s[k], s.id + " missing " + k));
      assert(Array.isArray(s.documents) && s.documents.length, s.id + " documents");
      assert(Array.isArray(s.steps) && s.steps.length, s.id + " steps");
      assert(/^https:\/\//.test(s.link), s.id + " link must be https");
    });
    assert.strictEqual(new Set(data.schemes.map((s) => s.id)).size, data.schemes.length, "duplicate ids");
  });

  console.log("\nChat API handler (Gemini mocked)");
  const handler = require("../api/chat.js");
  const mkRes = () => {
    const r = { code: 0, headers: {}, body: null };
    r.status = (c) => { r.code = c; return r; };
    r.setHeader = (k, v) => { r.headers[k] = v; return r; };
    r.send = (b) => { r.body = JSON.parse(b); return r; };
    return r;
  };
  const realFetch = global.fetch;
  process.env.GEMINI_API_KEY = "test-key";

  await test("rejects non-POST", async () => {
    const r = mkRes(); await handler({ method: "GET" }, r); assert.strictEqual(r.code, 405);
  });
  await test("rejects empty message", async () => {
    const r = mkRes(); await handler({ method: "POST", body: { message: "   " } }, r); assert.strictEqual(r.code, 400);
  });
  await test("rejects over-long message", async () => {
    const r = mkRes(); await handler({ method: "POST", body: { message: "x".repeat(501) } }, r); assert.strictEqual(r.code, 400);
  });
  await test("returns AI reply and sends system prompt + key header", async () => {
    let seen;
    global.fetch = async (url, opts) => { seen = { url, opts }; return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: "Hello **farmer**" }] } }] }) }; };
    const r = mkRes();
    await handler({ method: "POST", body: { message: "What is PM-KISAN?", profile: { age: 40, income: 100000, occupation: "farmer" } } }, r);
    assert.strictEqual(r.code, 200); assert.strictEqual(r.body.reply, "Hello **farmer**");
    assert.strictEqual(seen.opts.headers["x-goog-api-key"], "test-key");
    assert(!seen.url.includes("test-key"), "key must not be in the URL");
    const sent = JSON.parse(seen.opts.body);
    assert(sent.systemInstruction.parts[0].text.includes("ROLE:") && sent.systemInstruction.parts[0].text.includes("PM-KISAN"));
    assert(sent.contents.at(-1).parts[0].text.includes("age 40"));
  });
  await test("maps API 429 to a friendly rate-limit error", async () => {
    global.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
    const r = mkRes(); await handler({ method: "POST", body: { message: "hi" } }, r); assert.strictEqual(r.code, 429);
  });
  await test("maps API 500 to 502", async () => {
    global.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const r = mkRes(); await handler({ method: "POST", body: { message: "hi" } }, r); assert.strictEqual(r.code, 502);
  });
  await test("handles empty AI answer", async () => {
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [] }) });
    const r = mkRes(); await handler({ method: "POST", body: { message: "hi" } }, r); assert.strictEqual(r.code, 502);
  });
  await test("handles network failure", async () => {
    global.fetch = async () => { throw new Error("network down"); };
    const r = mkRes(); await handler({ method: "POST", body: { message: "hi" } }, r); assert.strictEqual(r.code, 500);
  });
  await test("missing API key gives clear error", async () => {
    delete process.env.GEMINI_API_KEY;
    const r = mkRes(); await handler({ method: "POST", body: { message: "hi" } }, r); assert.strictEqual(r.code, 500);
    assert(/not configured/i.test(r.body.error));
  });
  global.fetch = realFetch;

  console.log(`\n${passed} checks passed${process.exitCode ? " (with failures)" : ""}.`);
})();
