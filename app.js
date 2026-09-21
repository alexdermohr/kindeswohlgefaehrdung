(() => {
  const STORAGE_KEY = "kwg-fallwerkstatt-v1";
  const totalSteps = 8;
  const state = loadState();

  const steps = [...document.querySelectorAll(".step")];
  const navButtons = [...document.querySelectorAll("[data-goto]")];
  const navItems = [...document.querySelectorAll("#step-list li")];
  const notes = [...document.querySelectorAll("[data-note]")];
  const completeBoxes = [...document.querySelectorAll("[data-complete]")];
  const progressLabel = document.querySelector("#progress-label");
  const progressBar = document.querySelector("#progress-bar");
  const completionPanel = document.querySelector("#completion-panel");
  const completionText = document.querySelector("#completion-text");
  const toast = document.querySelector("#toast");

  function defaultState() {
    return {
      currentStep: 1,
      completed: {},
      notes: {}
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return parsed && typeof parsed === "object"
        ? { ...defaultState(), ...parsed }
        : defaultState();
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 2400);
  }

  function showStep(number, options = {}) {
    const stepNumber = Math.min(totalSteps, Math.max(1, Number(number) || 1));
    state.currentStep = stepNumber;
    saveState();

    completionPanel.hidden = true;

    steps.forEach((step) => {
      const active = Number(step.dataset.step) === stepNumber;
      step.hidden = !active;
      step.classList.toggle("active", active);
    });

    document.querySelectorAll("#step-list button").forEach((button) => {
      const active = Number(button.dataset.goto) === stepNumber;
      if (active) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (options.scroll !== false) {
      document.querySelector("#lernstrecke")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const heading = document.querySelector(`[data-step="${stepNumber}"] h2`);
    if (options.focus && heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }

    history.replaceState(null, "", `#schritt-${stepNumber}`);
  }

  function updateProgress() {
    const done = Object.values(state.completed).filter(Boolean).length;
    progressLabel.textContent = `${done} von ${totalSteps}`;
    progressBar.style.width = `${(done / totalSteps) * 100}%`;

    navItems.forEach((item, index) => {
      item.classList.toggle("completed", Boolean(state.completed[index + 1]));
    });
  }

  notes.forEach((field) => {
    const key = field.dataset.note;
    field.value = state.notes[key] || "";
    field.addEventListener("input", () => {
      state.notes[key] = field.value;
      saveState();
    });
  });

  completeBoxes.forEach((box) => {
    const key = box.dataset.complete;
    box.checked = Boolean(state.completed[key]);
    box.addEventListener("change", () => {
      state.completed[key] = box.checked;
      saveState();
      updateProgress();
      showToast(box.checked ? `Schritt ${key} gespeichert.` : `Markierung für Schritt ${key} entfernt.`);
    });
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showStep(button.dataset.goto, { focus: true });
    });
  });

  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      showStep(button.dataset.next, { focus: true });
    });
  });

  document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => {
      const container = button.closest(".choice-list");
      const feedback = container?.parentElement?.querySelector(".choice-feedback");
      container?.querySelectorAll(".choice").forEach((choice) => choice.classList.remove("selected"));
      button.classList.add("selected");

      if (!feedback) return;
      const kind = button.dataset.feedback;
      const messages = {
        good: "Tragfähig: Die Aussage nimmt Mikas Sorge ernst, öffnet das Gespräch und legt noch keine Deutung fest.",
        weak: "Zu eng: Die Frage drängt auf eine Ja/Nein-Festlegung und kann das Gespräch verengen. Besser zunächst offen und konkret nach Mikas Erleben fragen.",
        mixed: "Problematisch: Vertrauen ist wichtig, aber absolute Geheimhaltung darf nicht versprochen werden, wenn Schutzschritte notwendig werden."
      };
      feedback.textContent = messages[kind] || "";
    });
  });

  document.querySelector("#print-button")?.addEventListener("click", () => window.print());

  document.querySelector("#reset-button")?.addEventListener("click", () => {
    const confirmed = window.confirm("Lokalen Fortschritt und alle Notizen auf diesem Gerät löschen?");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    location.hash = "#schritt-1";
    location.reload();
  });

  document.querySelector("#summary-button")?.addEventListener("click", () => {
    const done = Object.values(state.completed).filter(Boolean).length;
    completionText.textContent = `${done} von ${totalSteps} Schritten sind als bearbeitet markiert. Die Zusammenfassung übernimmt nur eure lokal gespeicherten Notizen und bleibt auf diesem Gerät, bis ihr sie selbst kopiert.`;
    steps.forEach((step) => { step.hidden = true; });
    completionPanel.hidden = false;
    document.querySelector("#lernstrecke")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("#close-summary")?.addEventListener("click", () => {
    showStep(state.currentStep || 8, { focus: true });
  });

  document.querySelector("#copy-summary")?.addEventListener("click", async () => {
    const sections = steps.map((step) => {
      const number = step.dataset.step;
      const title = step.querySelector("h2")?.textContent?.trim() || `Schritt ${number}`;
      const value = state.notes[number]?.trim() || "—";
      return `## Schritt ${number}: ${title}\n${value}`;
    });

    const text = [
      "# Fallwerkstatt – Arbeitsstand",
      "",
      ...sections,
      "",
      `Bearbeitet: ${Object.values(state.completed).filter(Boolean).length}/${totalSteps}`
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      showToast("Arbeitsstand kopiert.");
    } catch {
      showToast("Kopieren war nicht möglich. Nutzt die Druckfunktion als Alternative.");
    }
  });

  const initialHash = location.hash.match(/^#schritt-([1-8])$/);
  const initialStep = initialHash ? Number(initialHash[1]) : state.currentStep || 1;
  updateProgress();
  showStep(initialStep, { scroll: false });
})();
