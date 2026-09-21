(() => {
  const STORAGE_KEY = "kwg-fallwerkstatt-v1";
  const SOURCE_DATA_URL = "data/sources.json";
  const SOURCE_STATUS_URL = "quellen/pdf-quellen.md";
  const state = loadState();

  const steps = [...document.querySelectorAll(".step")];
  const totalSteps = steps.length;
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

  function makeElement(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function makeExternalLink(className, text, href) {
    const link = makeElement("a", className, text);
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  }

  function sourceMap(data) {
    return new Map(data.sources.map((source) => [source.id, source]));
  }

  function validateSourceData(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.sources) || !data.stepSources) {
      throw new Error("Ungültiger Quellenkatalog");
    }
    const sources = sourceMap(data);
    for (let step = 1; step <= totalSteps; step += 1) {
      const group = data.stepSources[String(step)];
      if (!group?.label || !Array.isArray(group.items) || group.items.length === 0) {
        throw new Error(`Fehlende Quellen für Schritt ${step}`);
      }
      for (const item of group.items) {
        const source = sources.get(item.sourceId);
        if (!source) {
          throw new Error(`Unbekannte Quelle ${item.sourceId} in Schritt ${step}`);
        }
        if (item.boardFileIds) {
          const fileIds = new Set(source.boardFiles.map((file) => file.id).filter(Boolean));
          for (const fileId of item.boardFileIds) {
            if (!fileIds.has(fileId)) {
              throw new Error(`Unbekannte Board-Datei-ID ${fileId} bei Quelle ${item.sourceId}`);
            }
          }
        }
      }
    }
    return sources;
  }

  function stepSourceDetail(item, source) {
    const parts = [];
    if (item.context) parts.push(item.context);

    if (item.includePages !== false) {
      const selectedFiles = item.boardFileIds
        ? source.boardFiles.filter((file) => item.boardFileIds.includes(file.id))
        : source.boardFiles;
      const ranges = [...new Set(selectedFiles.map((file) => file.pages).filter(Boolean))];
      if (ranges.length) parts.push(`Board-Auszug: ${ranges.join("; ")}`);
    }

    return parts.join(" ");
  }

  function renderSourceEntry(item, source) {
    const context = stepSourceDetail(item, source);
    if (source.publicPdf) {
      const link = makeExternalLink("step-source-pdf", "", source.publicPdf.url);
      link.append(makeElement("span", "source-tag", item.tag || "PDF"));
      const body = makeElement("span");
      body.append(makeElement("strong", "", source.title));
      if (context) body.append(makeElement("small", "", context));
      link.append(body);
      return link;
    }

    const note = makeElement("div", "step-source-note");
    note.append(makeElement("span", "source-tag muted", item.tag || "Boardquelle"));
    const body = makeElement("span");
    body.append(makeElement("strong", "", source.title));
    const detail = [context, source.statusNote].filter(Boolean).join(" ");
    if (detail) body.append(makeElement("small", "", detail));
    note.append(body);
    return note;
  }

  function renderStepSources(data, sources) {
    document.querySelectorAll("[data-step-sources]").forEach((container) => {
      const step = container.dataset.stepSources;
      const group = data.stepSources[step];
      container.replaceChildren();

      const head = makeElement("div", "step-sources-head");
      head.append(makeElement("span", "", group.label));
      const allLink = makeElement("a", "", "Alle Quellen");
      allLink.href = "#pdf-quellen";
      head.append(allLink);

      const list = makeElement("div", "step-source-list");
      for (const item of group.items) {
        list.append(renderSourceEntry(item, sources.get(item.sourceId)));
      }

      container.append(head, list);
    });
  }

  function renderSourceRoot(data) {
    const container = document.querySelector("#source-root");
    if (!container) return;
    container.replaceChildren();

    const body = makeElement("div");
    body.append(makeElement("span", "pdf-status", data.sourceRoot.label));
    body.append(makeElement("h3", "", data.sourceRoot.title));
    body.append(makeElement("p", "", data.sourceRoot.description));

    const link = makeExternalLink("button primary", "Board öffnen ↗", data.sourceRoot.url);
    container.append(body, link);
  }

  function renderLibrary(data) {
    const container = document.querySelector("#pdf-library-content");
    if (!container) return;
    container.replaceChildren();

    for (const group of data.libraryGroups || []) {
      const groupSources = data.sources.filter(
        (source) => source.libraryGroup === group.id && source.publicPdf
      );
      if (groupSources.length === 0) continue;

      container.append(makeElement("h3", "pdf-group-title", group.title));
      const grid = makeElement("div", "pdf-grid");

      for (const source of groupSources) {
        const card = makeElement("article", "pdf-card");
        card.append(makeElement("span", "pdf-status", source.publicPdf.label));
        card.append(makeElement("h4", "", source.title));
        card.append(makeElement("p", "", source.libraryDescription || source.citation));
        if (source.statusNote) {
          card.append(makeElement("small", "pdf-note", source.statusNote));
        }
        card.append(makeExternalLink("pdf-button", "PDF öffnen ↗", source.publicPdf.url));
        grid.append(card);
      }

      container.append(grid);
    }

    const unavailableSources = data.sources.filter((source) => !source.publicPdf);
    const unavailableBoardFiles = unavailableSources.reduce(
      (sum, source) => sum + source.boardFiles.length,
      0
    );

    const unavailable = makeElement("div", "pdf-unavailable");
    const body = makeElement("div");
    body.append(makeElement("span", "pdf-status unavailable", "kein öffentlicher PDF-Link"));
    body.append(
      makeElement(
        "h3",
        "",
        `${unavailableBoardFiles} Board-Dateien ohne belastbaren Direkt-PDF-Link`
      )
    );
    body.append(
      makeElement(
        "p",
        "",
        "Diese Quellen bleiben im Katalog sichtbar, werden aber nicht durch ähnliche oder fremd hochgeladene PDFs ersetzt."
      )
    );

    const list = makeElement("ul", "unavailable-source-list");
    for (const source of unavailableSources) {
      const item = makeElement("li");
      item.append(makeElement("strong", "", source.title));
      item.append(makeElement("small", "", source.statusNote));
      list.append(item);
    }
    body.append(list);

    unavailable.append(body, makeExternalLink("button secondary", "Status im Detail", SOURCE_STATUS_URL));
    container.append(unavailable);
  }

  function renderSourceFailure(error) {
    const message = "Quellen konnten nicht geladen werden. Die Lernaufgaben funktionieren weiterhin.";
    document.querySelectorAll("[data-step-sources]").forEach((container) => {
      container.replaceChildren(makeElement("p", "source-load-error", message));
    });

    const root = document.querySelector("#source-root");
    if (root) root.replaceChildren(makeElement("p", "source-load-error", message));

    const library = document.querySelector("#pdf-library-content");
    if (library) {
      library.replaceChildren(
        makeElement("p", "source-load-error", message),
        makeExternalLink("button secondary", "Quellenstatus im Repository", SOURCE_STATUS_URL)
      );
    }

    console.error("Quellenkatalog konnte nicht geladen werden:", error);
  }

  async function loadAndRenderSources() {
    try {
      const response = await fetch(SOURCE_DATA_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const sources = validateSourceData(data);
      renderStepSources(data, sources);
      renderSourceRoot(data);
      renderLibrary(data);
    } catch (error) {
      renderSourceFailure(error);
    }
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

  const initialHash = location.hash.match(/^#schritt-(\d+)$/);
  const requestedStep = initialHash ? Number(initialHash[1]) : state.currentStep || 1;
  const initialStep = requestedStep >= 1 && requestedStep <= totalSteps ? requestedStep : 1;
  updateProgress();
  showStep(initialStep, { scroll: false });
  loadAndRenderSources();
})();
