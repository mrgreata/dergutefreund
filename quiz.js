(() => {
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxoG_ARDdrz0I4xiNxJxk_R9gyRgdjQLAUDdZ-n4W-59WQ5JhKJNbG8wHExYrpyWnL3/exec";

  const QUESTIONS = [
    {
      id: "name_initial",
      type: "text",
      title: "Mit welchem Buchstaben beginnt dein Name?",
      placeholder: "z.B. E"
    },
    {
      id: "right_arm",
      type: "single",
      title: "Was ist mit deinem rechten Arm?",
      options: ["verstaucht", "gesund", "gebrochen"]
    },
    {
      id: "where_happened",
      type: "single",
      title: "Wo ist das passiert?",
      options: ["berg", "see", "auf dem feld", "daheim"]
    },
    {
      id: "cool_name",
      type: "text",
      title: "Gebe einen coolen Namen ein.",
      placeholder: "M..."
    },
    {
        id: "flowers",
        type: "info",
        title: "Die sind für dich 🌸",
        text: "Ein kleines Dankeschön fürs Mitmachen.",
        image: "images/blumen.jpg"
        },
         {
        id: "yes",
        type: "single",
        title: "Du heißt Eunice, kann das sein? Ich lade dich gerne auf ein Abendessen ein.",
        options: ["Ja", "Nein"]
        },
        {
        id: "time",
        type: "single",
        title: "Samstag, 17.01 – Uhrzeit?",
        options: ["15:00", "16:00", "17:00", "18:00"]
        }

  ];

  // richtige Antworten (Gate)
  const CORRECT = {
    name_initial: "e",
    right_arm: "gebrochen",
    where_happened: "berg"
  };

  const sessionId =
    (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) +
    "-" +
    Math.random().toString(16).slice(2);

  const startedAt = new Date().toISOString();
  let idx = 0;
  const answers = {};

  const form = document.getElementById("quizForm");
  if (!form) return;

  const host = document.getElementById("questionHost");
  const hint = document.getElementById("quizHint");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const done = document.getElementById("quizDone");
  const restartBtn = document.getElementById("restartBtn");
  const progressText = document.getElementById("quizProgressText");
  const barFill = document.getElementById("quizBarFill");

  // ===== Modal elements =====
  const modal = document.getElementById("quizModal");
  const closeBtn = document.getElementById("quizCloseBtn");
  const closeBtn2 = document.getElementById("quizCloseBtn2");
  const backdrop = document.getElementById("quizBackdrop");

  const KEY = "dgf_quiz_seen_v1";
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const openQuizBtn = document.getElementById("openQuizBtn");

openQuizBtn?.addEventListener("click", () => {
  // Sperre bewusst ignorieren
  openModal();
});


  function openModal() {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    localStorage.setItem(KEY, String(Date.now()));
  }

  closeBtn?.addEventListener("click", closeModal);
  closeBtn2?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
  });

  // Popup nur alle 7 Tage
  const last = Number(localStorage.getItem(KEY) || "0");
  if (Date.now() - last > SEVEN_DAYS) openModal();

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[s]));
  }

  function sendRow({ questionId, answer, step, event }) {
    const payload = {
      timestamp: new Date().toISOString(),
      sessionId,
      page: location.pathname,
      step,
      questionId,
      answer,
      event, // ANSWER / REJECT / ABORT / COMPLETE / START
      userAgent: navigator.userAgent,
      referrer: document.referrer || ""
    };

    fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(console.error);
  }

  function render() {
    const q = QUESTIONS[idx];
    progressText.textContent = `Frage ${idx + 1}/${QUESTIONS.length}`;
    barFill.style.width = `${(idx / QUESTIONS.length) * 100}%`;

    prevBtn.disabled = idx === 0;
    nextBtn.textContent = (idx === QUESTIONS.length - 1) ? "Absenden" : "Weiter";
    hint.textContent = "";

    const current = answers[q.id] ?? "";

    if (q.type === "info") {
  host.innerHTML = `
    <div class="dgf-q" style="text-align:center;">
      <h3>${escapeHtml(q.title)}</h3>
      ${q.image ? `<img src="${escapeHtml(q.image)}" alt="" style="max-width:100%; border-radius:12px; margin:12px 0;">` : ""}
      ${q.text ? `<p style="opacity:.85;">${escapeHtml(q.text)}</p>` : ""}
    </div>
  `;

  // Bei Info-Fragen: direkt weiter
  prevBtn.disabled = idx === 0;
  nextBtn.textContent = "Weiter";
  hint.textContent = "";
  return;
}


    if (q.type === "single") {
      host.innerHTML = `
        <div class="dgf-q">
          <h3>${escapeHtml(q.title)}</h3>
          <div class="dgf-options">
            ${q.options.map((opt, i) => {
              const inputId = `${q.id}_${i}`;
              const checked = current === opt ? "checked" : "";
              return `
                <label class="dgf-option" for="${inputId}">
                  <input id="${inputId}" type="radio" name="${q.id}" value="${escapeHtml(opt)}" ${checked}/>
                  <span>${escapeHtml(opt)}</span>
                </label>
              `;
            }).join("")}
          </div>
        </div>
      `;
    } else {
  const maxLen = q.maxLength ?? 200;
  const helper = q.helper ? `<p class="dgf-quiz-hint" style="margin-top:6px; opacity:.75;">${escapeHtml(q.helper)}</p>` : "";

  host.innerHTML = `
    <div class="dgf-q">
      <h3>${escapeHtml(q.title)}</h3>
      <input class="dgf-text" type="text" name="${q.id}"
        value="${escapeHtml(current)}"
        placeholder="${escapeHtml(q.placeholder || "")}"
        maxlength="${maxLen}"
        autocomplete="off"
      />
      ${helper}
    </div>
  `;
}
  }

  function readCurrentAnswer() {
    const q = QUESTIONS[idx];
    if (q.type === "single") {
      const selected = form.querySelector(`input[name="${q.id}"]:checked`);
      return selected ? selected.value : "";
    }
    const input = form.querySelector(`input[name="${q.id}"]`);
    return input ? input.value.trim() : "";
  }

  function reject(reason, qId, val) {
    sendRow({
      questionId: "REJECT",
      answer: `${reason} | ${qId}=${val}`,
      step: idx + 1,
      event: "REJECT"
    });

    hint.textContent = "Sorry, du kannst leider nicht weitermachen.";
    nextBtn.disabled = true;
    prevBtn.disabled = true;

    // optional: nach kurzer Zeit schließen + nicht wieder anzeigen
    localStorage.setItem(KEY, String(Date.now()));
    setTimeout(() => closeModal(), 1200);
  }

  prevBtn.addEventListener("click", () => {
    const val = readCurrentAnswer();
    if (val) answers[QUESTIONS[idx].id] = val;
    idx = Math.max(0, idx - 1);
    render();
  });

  form.addEventListener("submit", (e) => {
    
    e.preventDefault();

    const q = QUESTIONS[idx];
    let val = readCurrentAnswer();
    if (q.type === "info") {
  // optional loggen:
  // sendRow({ questionId: q.id, answer: "shown", step: idx + 1, event: "INFO" });

  idx += 1;
  render();
  return;
}

if (!val) {
  hint.textContent = "Bitte wähle/fülle eine Antwort aus 🙂";
  return;
}


    // normalize input for first question (single letter)
    if (q.id === "name_initial") {
      val = (val[0] || "").toLowerCase();
    }

    // log the given answer
    answers[q.id] = val;
    sendRow({ questionId: q.id, answer: val, step: idx + 1, event: "ANSWER" });

    // gate checks
    const correct = CORRECT[q.id];
    if (typeof correct !== "undefined") {
      const ok = val.toLowerCase() === String(correct).toLowerCase();
      if (!ok) {
        reject("wrong_answer", q.id, val);
        return;
      }
    }

    // next / complete
    if (idx === QUESTIONS.length - 1) {
      sendRow({ questionId: "COMPLETE", answer: "completed", step: idx + 1, event: "COMPLETE" });

      barFill.style.width = "100%";
      form.hidden = true;
      done.hidden = false;

      localStorage.setItem(KEY, String(Date.now()));
      return;
    }

    idx += 1;
    render();
  });

  restartBtn?.addEventListener("click", () => {
    idx = 0;
    for (const k of Object.keys(answers)) delete answers[k];
    nextBtn.disabled = false;
    prevBtn.disabled = true;
    hint.textContent = "";
    form.hidden = false;
    done.hidden = true;
    render();
    openModal();
  });

  window.addEventListener("beforeunload", () => {
    if (idx < QUESTIONS.length - 1) {
      sendRow({ questionId: "ABORT", answer: `aborted_at_step_${idx + 1}`, step: idx + 1, event: "ABORT" });
    }
  });

  sendRow({ questionId: "START", answer: startedAt, step: 0, event: "START" });
  render();
})();
