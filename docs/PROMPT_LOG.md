# Prompt Engineering Log – Yojana Mitra

> **Rule for this file:** record only what your group actually did. Paste the real prompts you typed, the real tool you used, and a screenshot filename for each output. The viva will ask you to demonstrate this live.

---

## Part A – Initial Project-Building Prompt (Five-Part Prompt)

Paste this **exactly** into your first AI tool (Bolt.new or Lovable recommended for a first website draft). Save the tool's output and a screenshot as `docs/screenshots/prompt1-output.png`.

```text
ROLE
You are a senior full-stack web developer who specialises in building simple, accessible,
mobile-first websites for first-time internet users in India, and who writes clean,
well-commented code that students can understand.

TASK
Build a fully functional website called "Yojana Mitra" (Government Schemes Finder).
The user enters their age, annual family income and occupation (plus optional gender and
category). The site then lists the Indian central government schemes they may qualify for,
and for each scheme shows the benefit, required documents, step-by-step application
instructions and the official website link. The site must also include an AI chatbot
that answers questions about government schemes by calling a real AI model API.

CONTEXT
Millions of Indians miss out on welfare benefits (farmers' income support, health insurance,
housing, pensions, scholarships, small-business loans) because information is scattered
across many portals and written in confusing language. Target users are farmers, students,
street vendors, small shopkeepers, daily-wage workers, women and senior citizens, many of
whom use a basic smartphone and have limited English. The project is a second-year B.Tech
Prompt Engineering final project, so the code must be readable and explainable by students.

CONSTRAINTS
- Tech: HTML, CSS and vanilla JavaScript for the front end; a Node.js serverless function
  (api/chat.js) for the chatbot; deployable on Vercel; no database.
- Store scheme data in a separate JSON file with machine-readable eligibility rules
  (min/max age, max income, occupations, gender, category), not hard-coded in the UI.
- Include at least 15 real central government schemes (e.g. PM-KISAN, Ayushman Bharat PM-JAY,
  PM Awas Yojana, Atal Pension Yojana, PM SVANidhi, PM MUDRA, National Scholarship Portal).
  Do not invent schemes or figures; add a note that eligibility is indicative.
- Chatbot: must call an LLM API (Google Gemini) from the serverless function, never from
  the browser; the API key must come from an environment variable and must never appear
  in the code. Validate input (empty, too long), and handle API errors and timeouts with
  friendly messages. It must refuse topics unrelated to government schemes.
- Design: mobile-first, warm and trustworthy look, large readable text, high colour
  contrast, keyboard accessible, no more than two fonts.
- Do not collect or store any personal data.

OUTPUT FORMAT
Give the complete project as separate files with the file name above each code block:
index.html, style.css, assets/app.js, assets/eligibility.js, data/schemes.json,
api/chat.js, .env.example, .gitignore and README.md. After the code, give a short
"How to run and deploy" section (local run and Vercel deployment) and a list of
the features implemented.
```

### How each of the five parts shaped the output (be ready to explain)

| Part | What it controlled in the generated website |
|---|---|
| **Role** | Made the AI write simple, commented, accessible code instead of a complex framework app. |
| **Task** | Defined the three main features: eligibility form, scheme results with steps, AI chatbot. |
| **Context** | Led to plain language, Hindi-friendly chatbot, mobile-first layout and real scheme categories. |
| **Constraints** | Forced JSON-based rules, serverless API with env-var key, input validation, no invented schemes. |
| **Output Format** | Produced a ready-to-upload file structure with README and deployment steps. |

---

## Part B – Tools used (minimum three, with real contributions)

Fill in during development. Delete rows for tools you did not use.

| # | Tool | Tasks performed | Why this tool | Evidence (screenshot/file) |
|---|---|---|---|---|
| 1 | bolt.new | Generated the first draft of the website from my five-part prompt (Part A) | Fast first draft from a single structured prompt | screenshots/prompt1-input.png, screenshots/prompt1-output.png, screenshots/prompt1-tool.png |
| 2 | Claude / Cursor | Refined UI, wrote `api/chat.js`, fixed bugs, wrote tests | Strong at code reasoning and refactoring | |
| 3 | ChatGPT / Gemini | Researched scheme eligibility, wrote the chatbot system prompt, drafted README | Good for research and drafting text | |
| 4 | Perplexity (optional) | Verified scheme details with sources | Cited sources | |

---

## Part C – Prompt iteration records

Copy this block for every meaningful prompt. Aim for at least 6 records covering different techniques.

### Template

```text


### P1 – Initial five-part prompt ([TOOL])

Technique:     Structured prompting (Role, Task, Context, Constraints, Output Format)
Prompt:        Full five-part prompt from Part A above, pasted unchanged as the first message
Output problem found: 1. The AI service had a problem. Please try again.
                      2. The Ai took too long to respond. Please try again.
CHANGE:1. The likely cause was the retiring default model, gemini-2.5-flash. The code returns this message when Google rejects the request, and the key was fine.
       2.The cause was a model that was too slow, and the request passed the code's 20-second limit.
The fix was Flash-Lite models first, a 12-second wait per model, a 25-second total limit, and fallback on timeout.
The fix was api/chat.js with model fallbacks and the real error code.
Improved prompt:       Follow-up refinement prompts P2 to P7 (see below)
Result after improvement: CHANGE: write what got better, for example: a real Gemini API chatbot with input validation and error handling, rules moved to schemes.json, 19 schemes, tests, and deployment on Vercel.
Evidence:      screenshots/prompt1-input.png, screenshots/prompt1-output.png

### Suggested refinement prompts (use them, then record the real before/after)

**P2 – Chain / step-by-step prompting (tool 2).** After pasting the generated project:
```text
Review this project step by step. First list every place where the eligibility rules are
hard-coded in the UI. Second, propose how to move them into data/schemes.json. Third,
show the refactored code. Do not change the visual design.
```

**P3 – Chatbot integration, structured prompting (tool 2).**
```text
Act as a Node.js backend engineer. Write api/chat.js for Vercel that:
1. accepts POST {message, history, profile},
2. rejects empty messages and messages over 500 characters with HTTP 400,
3. calls the Gemini generateContent endpoint using the key from process.env.GEMINI_API_KEY,
4. maps 429 to "try again in a minute", other upstream errors to 502 and timeouts to 504,
5. never returns the key or raw upstream errors to the browser.
Explain each block in a comment.
```

**P4 – Prompt refinement of the chatbot's own system prompt (tool 3).**
*Weak version:* `You are a helpful assistant for government schemes.`
*Observed problem:* the chatbot invented a scheme and an amount, and answered a cricket question.
*Improved version:* the five-part system prompt now in `api/chat.js` (Role, Task, Context, Constraints with "use only the knowledge base / never invent / refuse unrelated topics", Output format with word limit).
*Record:* test the same five questions with both versions and note the difference in accuracy.

**P5 – Reverse prompting (tool 3).**
```text
I am building a government schemes finder for farmers, students and street vendors.
Before you suggest any changes, ask me up to 8 questions you need answered to judge
whether my eligibility rules and chatbot behaviour are good enough.
```
Answer the questions the AI asks, then record what you learned and changed.

**P6 – Response evaluation and fact-checking (GEMINI).**
```text
Technique:     Role-based prompting with structured output (table with source URLs) and response evaluation
Prompt:        "Act as a fact-checker for Indian government welfare schemes..." followed by the full schemes.json
Output problem found:  CHANGE: list what Gemini flagged, for example "Gemini flagged N schemes as outdated, such as ..." or "no errors found"
Improved prompt:       CHANGE: if the first answer was vague, write the follow-up you used, for example "Give a source URL for each correction"
Result after improvement: CHANGE: write what you fixed in schemes.json, for example "I verified 3 corrections on the official sites and updated the data"
Evidence:      screenshots/gemini-prompt.png, screenshots/gemini-output.png
```
Fix what it finds, and record the number of corrections.

**P7 – Debugging prompt with context (any tool).**
```text
Context: Vercel deployment, Node 18, file api/chat.js, error shown in browser: "<paste>".
Vercel function log: "<paste>". What is the most likely cause? Give the fix and explain
why it happened.
```

---

## Part D – Errors and challenges (the viva asks for these)

| # | Error / challenge | How it appeared | Cause | Fix | Prompt that helped |
|---|---|---|---|---|---|
| 1 | Chatbot failed with "The AI service had a problem" | Red error in the chat box after sending a question on the live Vercel site | The default model name `gemini-2.5-flash` is being phased out and was likely unavailable for a new API key (the key itself was fine, since a missing key shows a different message) | Updated api/chat.js to try a list of current models in order (gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-3.8-flash, gemini-3.6-flash, gemini-2.5-flash) and move to the next if one is unavailable; the chat now shows the real error code and logs details in Vercel | P7 (debugging prompt with screenshot of the error and deployment context) |
| 2 | Chatbot failed with "The AI took too long to respond" | Red timeout message after the first fix | Newer Flash models take longer to think and the request exceeded the 20-second limit | Put the faster Flash-Lite models first, added a 12-second wait per model with a 25-second total limit, and fall back to the next model on timeout; set GEMINI_MODEL to a lite model in Vercel as a quick test | P7 (screenshot of the new error and a request for a fix) |
---

## Part E – Prompt techniques checklist

| Technique (from guidelines 2.4) | Where used in this project |
|---|---|
| Role-based prompting | Part A "ROLE"; chatbot persona "Yojana Mitra" |
| Step-by-step / chain prompting | P2 |
| Context-based prompting | Part A "CONTEXT"; user profile passed to chatbot |
| Structured prompting | Part A five-part format; P3 numbered requirements |
| Prompt refinement and optimisation | P4 weak vs improved system prompt |
| Clear instructions and constraints | Chatbot CONSTRAINTS list |
| Reverse prompting and response evaluation | P5, P6 |
