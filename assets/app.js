/* Yojana Mitra – front-end logic: eligibility form, results, and AI chatbot UI. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let DATA = null;
  let profile = null;
  let matches = [];
  let activeCategory = "All";
  const history = []; // {role: "user" | "model", text}

  /* ---------- Load scheme data ---------- */
  fetch("data/schemes.json")
    .then((r) => r.json())
    .then((d) => {
      DATA = d;
      $("schemeCount").textContent = d.schemes.length;
      $("reviewed").textContent = "Scheme data last reviewed on " + d.lastReviewed + ".";
    })
    .catch(() => showFormError("Could not load scheme data. Please refresh the page."));

  /* ---------- Eligibility form ---------- */
  $("finder").addEventListener("submit", (e) => {
    e.preventDefault();
    hideFormError();
    if (!DATA) return showFormError("Scheme data is still loading. Try again in a moment.");

    const f = e.target;
    profile = {
      age: f.age.value === "" ? NaN : Number(f.age.value),
      income: f.income.value === "" ? NaN : Number(f.income.value),
      occupation: f.occupation.value,
      gender: f.gender.value,
      category: f.category.value
    };

    const errors = SchemeEngine.validateProfile(profile);
    if (errors.length) return showFormError(errors.join(" "));

    matches = SchemeEngine.matchSchemes(profile, DATA.schemes);
    activeCategory = "All";
    renderResults();
    $("results").hidden = false;
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function showFormError(msg) {
    const el = $("formError");
    el.textContent = msg;
    el.hidden = false;
  }
  function hideFormError() {
    $("formError").hidden = true;
  }

  /* ---------- Results ---------- */
  function renderResults() {
    const grid = $("grid");
    grid.textContent = "";

    $("resultsSub").textContent = matches.length
      ? `${matches.length} scheme${matches.length === 1 ? "" : "s"} matched your details. Open any card for documents and steps.`
      : "";

    renderChips();

    const shown = activeCategory === "All" ? matches : matches.filter((s) => s.category === activeCategory);

    if (!shown.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = matches.length
        ? "No schemes in this category."
        : "No schemes in our list matched these details. Try the official search at myscheme.gov.in, or ask the assistant.";
      grid.appendChild(empty);
    } else {
      shown.forEach((s) => grid.appendChild(schemeCard(s)));
    }

    $("notice").textContent = DATA.disclaimer;
  }

  function renderChips() {
    const chips = $("chips");
    chips.textContent = "";
    if (!matches.length) return;
    const cats = ["All", ...new Set(matches.map((s) => s.category))];
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = c;
      b.setAttribute("aria-pressed", String(c === activeCategory));
      b.addEventListener("click", () => {
        activeCategory = c;
        renderResults();
      });
      chips.appendChild(b);
    });
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function listBlock(title, items, ordered) {
    const wrap = document.createDocumentFragment();
    wrap.appendChild(el("h4", null, title));
    const list = el(ordered ? "ol" : "ul");
    items.forEach((t) => list.appendChild(el("li", null, t)));
    wrap.appendChild(list);
    return wrap;
  }

  function schemeCard(s) {
    const card = el("article", "scheme");
    card.appendChild(el("span", "tag", s.category));
    card.appendChild(el("h3", null, s.name));
    card.appendChild(el("p", "benefit", s.benefit));

    if (s.caveats && s.caveats.length) {
      card.appendChild(el("p", "caveat", "Check: " + s.caveats.join(" ")));
    }

    const d = el("details");
    d.appendChild(el("summary", null, "Documents & how to apply"));
    d.appendChild(listBlock("Documents needed", s.documents, false));
    d.appendChild(listBlock("Steps to apply", s.steps, true));
    card.appendChild(d);

    const a = el("a", "go", "Official website ↗");
    a.href = s.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    card.appendChild(a);
    return card;
  }

  /* ---------- Chatbot ---------- */
  const panel = $("chatPanel");
  const fab = $("chatFab");
  const log = $("chatLog");
  const input = $("chatInput");
  const sendBtn = $("chatSend");
  const SUGGESTIONS = [
    "Which scheme is best for a small farmer?",
    "What documents do I need for Ayushman Bharat?",
    "मुझे पेंशन योजना के बारे में बताइए"
  ];

  function openChat() {
    panel.hidden = false;
    fab.hidden = true;
    fab.setAttribute("aria-expanded", "true");
    if (!log.children.length) {
      addBot("Namaste! I am **Yojana Mitra**. Ask me about any government scheme: who can apply, which documents you need and how to apply. You can write in English or Hindi.");
      renderSuggestions();
    }
    input.focus();
  }
  function closeChat() {
    panel.hidden = true;
    fab.hidden = false;
    fab.setAttribute("aria-expanded", "false");
    fab.focus();
  }
  fab.addEventListener("click", openChat);
  $("openChatNav").addEventListener("click", openChat);
  $("chatClose").addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) closeChat();
  });

  function renderSuggestions() {
    const box = $("chatSuggest");
    box.textContent = "";
    SUGGESTIONS.forEach((q) => {
      const b = el("button", null, q);
      b.type = "button";
      b.addEventListener("click", () => send(q));
      box.appendChild(b);
    });
  }

  /** Safe mini-markdown: escape HTML first, then allow **bold** and "- " bullets. */
  function renderMarkdown(text) {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = esc.split("\n");
    let html = "";
    let inList = false;
    lines.forEach((line) => {
      const m = line.match(/^\s*[-*•]\s+(.*)/);
      const fmt = (t) => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (m) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + fmt(m[1]) + "</li>";
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        if (line.trim()) html += "<p>" + fmt(line) + "</p>";
      }
    });
    if (inList) html += "</ul>";
    return html;
  }

  function addUser(text) {
    const m = el("div", "msg user", text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }
  function addBot(text) {
    const m = el("div", "msg bot");
    m.innerHTML = renderMarkdown(text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }
  function addError(text) {
    log.appendChild(el("div", "msg err", text));
    log.scrollTop = log.scrollHeight;
  }
  function addTyping() {
    const m = el("div", "msg bot");
    m.innerHTML = '<span class="typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span>';
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  async function send(text) {
    text = (text || "").trim();
    if (!text) return addError("Please type a question first.");
    if (text.length > 500) return addError("Please keep your question under 500 characters.");

    $("chatSuggest").textContent = "";
    addUser(text);
    input.value = "";
    sendBtn.disabled = true;
    input.disabled = true;
    const typing = addTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-8), profile })
      });
      let data = {};
      try { data = await res.json(); } catch (_) { /* non-JSON error page */ }
      typing.remove();

      if (!res.ok || !data.reply) {
        addError(data.error || "The assistant is unavailable right now. Please try again.");
      } else {
        addBot(data.reply);
        history.push({ role: "user", text }, { role: "model", text: data.reply });
      }
    } catch (err) {
      typing.remove();
      addError("Could not reach the assistant. Check your internet connection and try again.");
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  $("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
  });
})();
