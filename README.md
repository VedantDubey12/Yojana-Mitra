# Yojana Mitra – Government Schemes Finder

An AI-powered website that helps Indian citizens find central government schemes they may qualify for. Users enter their **age, income and occupation**, and the site lists matching schemes with the **benefit, documents required, step-by-step application instructions and the official link**. An integrated **AI chatbot** answers follow-up questions in English or Hindi.

**Live website:** https://yojanamitra-three.vercel.app/
**GitHub repository:** https://github.com/VedantDubey12/Yojana-Mitra/tree/main

> This is a student project, not an official government site. Eligibility is indicative. Always confirm on the official portal before applying.

## Problem statement

Welfare schemes for farmers, students, workers, women and senior citizens go unclaimed because the information is scattered across many portals and written in complex language. People often do not know which schemes exist, whether they qualify, or what to do next.

## Objectives

1. Let a user find relevant schemes from three simple inputs.
2. Explain each scheme in plain language with documents and application steps.
3. Provide an AI assistant that answers questions about the schemes.
4. Keep the site simple, accessible and mobile-friendly, and store no personal data.

## Features

- **Eligibility checker:** rule-based matching on age, annual income, occupation, gender and category.
- **19 central schemes** across agriculture, health, housing, women and child, pensions and insurance, banking, business loans and education.
- **Scheme cards:** benefit, cautions, documents needed, numbered application steps, official link.
- **Category filters** on the results.
- **AI chatbot ("Yojana Mitra")** powered by the Google Gemini API through a Vercel serverless function:
  - answers only from the project's scheme knowledge base,
  - receives the user's profile as context,
  - validates input (empty, over 500 characters),
  - handles rate limits, timeouts and API errors with friendly messages,
  - refuses off-topic questions and replies in Hindi when asked in Hindi.
- Responsive, keyboard-accessible design. No data stored.

## Technologies

| Layer | Tech |
|---|---|
| Front end | HTML5, CSS3, vanilla JavaScript |
| Data | `data/schemes.json` (rules + content) |
| Back end | Node.js serverless function (`api/chat.js`) |
| AI model | Google Gemini API (`gemini-2.5-flash` by default, configurable) |
| Hosting | Vercel |
| Version control | Git and GitHub |

## AI tools used in development

Fill in with your real usage (see `docs/PROMPT_LOG.md`):

| Tool | Contribution |
|---|---|
| `<Tool 1>` | `<e.g. generated the first version from the five-part prompt>` |
| `<Tool 2>` | `<e.g. refined UI, wrote the chatbot API, fixed bugs>` |
| `<Tool 3>` | `<e.g. researched schemes, wrote the chatbot system prompt>` |

## Project structure

```
index.html            Page structure and chat widget markup
style.css             Styling (responsive, accessible)
assets/eligibility.js Rule engine (browser + Node, unit tested)
assets/app.js         Form, results rendering, chat UI
data/schemes.json     Scheme content and eligibility rules
api/chat.js           Serverless chatbot endpoint (Gemini)
tests/run-tests.js    Unit tests for rules and the chat API
docs/PROMPT_LOG.md    Prompt documentation
.env.example          Template for environment variables
```

## How the chatbot works

1. The user types a question in the chat panel (`assets/app.js`).
2. The browser sends `POST /api/chat` with the message, recent history and the user's profile.
3. `api/chat.js` validates the input, builds a request with a **five-part system prompt** (Role, Task, Context, Constraints, Output Format) that embeds the scheme knowledge base, and calls the Gemini API using the secret key from an environment variable.
4. The reply is returned to the browser and displayed. The API key never reaches the browser.

## How the eligibility logic works

Each scheme in `data/schemes.json` has a `rules` object, for example `{ "occupations": ["farmer"], "minAge": 18 }`. `assets/eligibility.js` checks the user's profile against each rule (including `anyOf` for either-or conditions such as "income below ₹2.5 lakh **or** age 70+") and returns the schemes that pass.

## Run locally

1. Install Node.js 18+ and the Vercel CLI: `npm i -g vercel`
2. Copy `.env.example` to `.env` and put in your free key from <https://aistudio.google.com/apikey>.
3. Run `vercel dev` and open the URL it prints.
4. Run tests: `npm test`

(Opening `index.html` directly will not work because the page loads JSON and calls `/api/chat`.)

## Deploy to Vercel

1. Push this project to GitHub (never commit `.env`).
2. On <https://vercel.com>, choose **Add New > Project** and import the repo. Leave build settings at their defaults.
3. Under **Settings > Environment Variables**, add `GEMINI_API_KEY` with your key.
4. Click **Deploy**, then test the chatbot on the live URL.
5. If you add the key after the first deploy, **redeploy** so it takes effect.

## Screenshots

Replace these with screenshots of your live site:

| Home | Results | Chatbot |
|---|---|---|
| `docs/screenshots/home.png` | `docs/screenshots/results.png` | `docs/screenshots/chat.png` |

## Testing

`npm test` runs 21 checks covering the eligibility rules (including edge cases such as age boundaries and either-or income rules) and the chat endpoint (empty and over-long input, rate limits, upstream errors, empty AI answers, network failure, missing key).

## Limitations and future scope

- Covers central schemes only; state schemes (for example Rajasthan) can be added to `schemes.json`.
- Eligibility is rule-based and indicative; some schemes use official beneficiary lists.
- Possible additions: Hindi interface, state selection, document checklist download, voice input, scheme alerts.

## Data sources

Scheme details were compiled from official portals (for example pmkisan.gov.in, pmjay.gov.in, pmaymis.gov.in, jansuraksha.gov.in, scholarships.gov.in, eshram.gov.in, pmsvanidhi.mohua.gov.in) and reviewed on 22 November 2026. Verify before relying on any figure.
