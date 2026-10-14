    let BANK = [];
    const STORE_KEY = "ai-fieldnotes-attempt-v1";
    const MARKS_PER_QUESTION = 1;
    const DURATION_MS = 90 * 60 * 1000;
    let attempt = null;
    let timerHandle = null;
    let toastHandle = null;

    function shuffle(values) {
      const result = values.slice();
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    function newAttempt() {
      attempt = {
        order: shuffle(BANK.map((_, i) => i)),
        orderVersion: 2,
        optionOrders: BANK.map((q) => shuffle(q.options.map((_, i) => i))),
        answers: Array(BANK.length).fill(-1),
        flags: Array(BANK.length).fill(false),
        index: 0,
        deadline: Date.now() + DURATION_MS,
        finished: false,
        score: 0
      };
      saveAttempt();
    }

    function validAttempt(value) {
      if (!value || !Array.isArray(value.order) || value.order.length !== BANK.length ||
          !Array.isArray(value.optionOrders) || value.optionOrders.length !== BANK.length ||
          !Array.isArray(value.answers) || value.answers.length !== BANK.length ||
          !Array.isArray(value.flags) || value.flags.length !== BANK.length ||
          (value.orderVersion !== undefined && value.orderVersion !== 2) ||
          !Number.isInteger(value.index) || value.index < 0 || value.index >= BANK.length ||
          !Number.isFinite(value.deadline) || typeof value.finished !== "boolean") return false;
      const isPermutation = (items, size) => items.every(Number.isInteger) &&
        items.every((item) => item >= 0 && item < size) && new Set(items).size === size;
      return isPermutation(value.order, BANK.length) &&
        value.optionOrders.every((items) => Array.isArray(items) && items.length === 4 && isPermutation(items, 4)) &&
        value.answers.every((answer) => Number.isInteger(answer) && answer >= -1 && answer < 4) &&
        value.flags.every((flag) => typeof flag === "boolean") &&
        (!value.finished || (Number.isFinite(value.score) && value.score >= 0 && value.score <= BANK.length * MARKS_PER_QUESTION));
    }

    function normalizeAttemptOrder(value) {
      if (value.orderVersion === 2) return value;
      const answersByQuestion = new Map(value.order.map((questionId, index) => [questionId, value.answers[index]]));
      const flagsByQuestion = new Map(value.order.map((questionId, index) => [questionId, value.flags[index]]));
      const currentQuestion = value.order[value.index];
      value.order = shuffle(value.order.slice());
      value.answers = value.order.map((questionId) => answersByQuestion.get(questionId));
      value.flags = value.order.map((questionId) => flagsByQuestion.get(questionId));
      value.index = value.order.indexOf(currentQuestion);
      value.orderVersion = 2;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch (_) {}
      return value;
    }

    function loadAttempt() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return validAttempt(parsed) ? normalizeAttemptOrder(parsed) : null;
      } catch (_) { return null; }
    }

    function saveAttempt() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(attempt)); } catch (_) {}
    }

    function showView(which) {
      document.getElementById("welcome-view").classList.toggle("hidden", which !== "welcome");
      document.getElementById("quiz-view").classList.toggle("hidden", which !== "quiz");
      document.getElementById("result-view").classList.toggle("hidden", which !== "result");
    }

    function beginAttempt() {
      const saved = loadAttempt();
      if (saved && !saved.finished && saved.deadline > Date.now()) {
        attempt = saved;
        renderQuiz();
        startTimer();
        return;
      }
      if (saved && !saved.finished && saved.deadline <= Date.now()) {
        attempt = saved;
        finishAttempt(true);
        return;
      }
      newAttempt();
      showView("quiz");
      renderQuiz();
      startTimer();
    }

    function getQuestion(position) {
      return BANK[attempt.order[position]];
    }

    function makeOption(label, value, selected, action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option" + (selected ? " selected" : "");
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.addEventListener("click", action);
      const key = document.createElement("span");
      key.className = "option-key";
      key.textContent = label;
      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = value;
      const check = document.createElement("span");
      check.className = "option-check";
      check.textContent = "✓";
      button.append(key, text, check);
      return button;
    }

    function renderQuiz() {
      showView("quiz");
      const root = document.getElementById("quiz-view");
      const q = getQuestion(attempt.index);
      const orderId = attempt.order[attempt.index];
      const displayed = attempt.optionOrders[orderId];
      const answeredCount = attempt.answers.filter((answer) => answer >= 0).length;
      const pct = Math.round((answeredCount / BANK.length) * 100);
      root.innerHTML = "";
      const layout = document.createElement("div");
      layout.className = "quiz-layout";
      const side = document.createElement("aside");
      side.className = "quiz-side";
      const sideHeading = document.createElement("div");
      sideHeading.className = "side-heading";
      sideHeading.textContent = "Your session";
      const sideTitle = document.createElement("div");
      sideTitle.className = "side-title";
      sideTitle.textContent = "AI fundamentals";
      const sideMeta = document.createElement("div");
      sideMeta.className = "side-meta";
      sideMeta.textContent = "Exam practice | 100 questions | 100 marks";
      const track = document.createElement("div");
      track.className = "progress-track";
      const fill = document.createElement("div");
      fill.className = "progress-fill";
      fill.style.width = pct + "%";
      track.appendChild(fill);
      const progressLabel = document.createElement("div");
      progressLabel.className = "progress-label";
      progressLabel.innerHTML = "<span>" + answeredCount + " answered</span><span>" + pct + "%</span>";
      const nav = document.createElement("nav");
      nav.className = "question-nav";
      nav.setAttribute("aria-label", "Jump to question");
      for (let i = 0; i < BANK.length; i++) {
        const number = document.createElement("button");
        number.type = "button";
        number.className = "nav-number" + (i === attempt.index ? " current" : "") +
          (attempt.answers[i] >= 0 ? " answered" : "") + (attempt.flags[i] ? " flagged" : "");
        number.textContent = String(i + 1).padStart(2, "0");
        number.setAttribute("aria-label", "Question " + (i + 1) +
          (attempt.answers[i] >= 0 ? ", answered" : ", unanswered") + (attempt.flags[i] ? ", flagged" : ""));
        number.addEventListener("click", () => { attempt.index = i; saveAttempt(); renderQuiz(); });
        nav.appendChild(number);
      }
      const legend = document.createElement("div");
      legend.className = "side-legend";
      legend.innerHTML = '<span><i class="legend-dot"></i>Answered</span><span><i class="legend-dot orange"></i>Review</span>';
      const timer = document.createElement("div");
      timer.className = "timer-box";
      timer.innerHTML = '<span class="timer-label">Time remaining</span><span id="timer-value" class="timer-value">90:00</span>';
      side.append(sideHeading, sideTitle, sideMeta, track, progressLabel, nav, legend, timer);

      const panel = document.createElement("section");
      panel.className = "question-panel";
      panel.setAttribute("aria-label", "Quiz question");
      const top = document.createElement("div");
      top.className = "q-topline";
      const qNum = document.createElement("span");
      qNum.className = "q-number";
      qNum.textContent = "QUESTION " + String(attempt.index + 1).padStart(2, "0") + " / " + BANK.length;
      const difficulty = document.createElement("span");
      difficulty.className = "difficulty-badge difficulty-" + q.difficulty;
      difficulty.textContent = q.difficulty.toUpperCase();
      const topic = document.createElement("span");
      topic.className = "q-topic";
      topic.textContent = q.topic;
      const flag = document.createElement("button");
      flag.type = "button";
      flag.className = "flag-btn" + (attempt.flags[attempt.index] ? " active" : "");
      flag.textContent = attempt.flags[attempt.index] ? "⚑  Marked for review" : "⚑  Mark for review";
      flag.setAttribute("aria-pressed", attempt.flags[attempt.index] ? "true" : "false");
      flag.addEventListener("click", () => {
        attempt.flags[attempt.index] = !attempt.flags[attempt.index];
        saveAttempt();
        renderQuiz();
      });
      const topLeft = document.createElement("div");
      topLeft.className = "q-topline-info";
      topLeft.append(qNum, difficulty, topic);
      top.append(topLeft, flag);
      const prompt = document.createElement("h1");
      prompt.className = "question-text";
      prompt.textContent = q.question;
      const hint = document.createElement("div");
      hint.className = "select-hint";
      hint.textContent = "SELECT ONE ANSWER | 1 MARK";
      const options = document.createElement("div");
      options.className = "option-list";
      options.setAttribute("role", "group");
      options.setAttribute("aria-label", "Answer choices");
      for (let visualIndex = 0; visualIndex < displayed.length; visualIndex++) {
        const bankIndex = displayed[visualIndex];
        options.appendChild(makeOption(
          String.fromCharCode(65 + visualIndex),
          q.options[bankIndex],
          attempt.answers[attempt.index] === visualIndex,
          () => {
            attempt.answers[attempt.index] = visualIndex;
            saveAttempt();
            renderQuiz();
          }
        ));
      }
      const bottom = document.createElement("div");
      bottom.className = "q-bottom";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "quiet-btn";
      previous.textContent = "← Previous";
      previous.disabled = attempt.index === 0;
      previous.addEventListener("click", () => { attempt.index--; saveAttempt(); renderQuiz(); });
      const actions = document.createElement("div");
      actions.className = "q-actions";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "primary-btn";
      next.innerHTML = attempt.index === BANK.length - 1 ? "Review & submit <span class=\"arrow\">↗</span>" : "Next question <span class=\"arrow\">→</span>";
      next.addEventListener("click", () => {
        if (attempt.index < BANK.length - 1) {
          attempt.index++;
          saveAttempt();
          renderQuiz();
        } else {
          showSubmitDialog();
        }
      });
      actions.appendChild(next);
      bottom.append(previous, actions);
      const keyboard = document.createElement("div");
      keyboard.className = "keyboard-tip";
      keyboard.innerHTML = 'TIP &nbsp; <span class="kbd">1</span>–<span class="kbd">4</span> select &nbsp; <span class="kbd">←</span> <span class="kbd">→</span> move';
      panel.append(top, prompt, hint, options, bottom, keyboard);
      layout.append(side, panel);
      root.appendChild(layout);
      updateTimerDisplay();
    }

    function showSubmitDialog() {
      const unanswered = attempt.answers.filter((answer) => answer < 0).length;
      const root = document.getElementById("modal-root");
      root.innerHTML = "";
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) root.innerHTML = "";
      });
      const modal = document.createElement("section");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "submit-title");
      const title = document.createElement("h2");
      title.id = "submit-title";
      title.textContent = "Ready to see your result?";
      const copy = document.createElement("p");
      copy.textContent = unanswered ? unanswered + " question" + (unanswered === 1 ? " is" : "s are") +
        " unanswered and will receive zero marks. You can still go back and review your answers." :
        "You answered all " + BANK.length + " questions. Your score and explanations will be ready as soon as you submit.";
      const actions = document.createElement("div");
      actions.className = "modal-actions";
      const back = document.createElement("button");
      back.className = "quiet-btn";
      back.textContent = "Keep reviewing";
      back.addEventListener("click", () => { root.innerHTML = ""; });
      const submit = document.createElement("button");
      submit.className = "primary-btn";
      submit.textContent = "Submit quiz";
      submit.addEventListener("click", () => { root.innerHTML = ""; finishAttempt(false); });
      actions.append(back, submit);
      modal.append(title, copy, actions);
      backdrop.appendChild(modal);
      root.appendChild(backdrop);
      submit.focus();
    }

    function startTimer() {
      if (timerHandle) clearInterval(timerHandle);
      timerHandle = setInterval(() => {
        if (!attempt || attempt.finished) return;
        if (Date.now() >= attempt.deadline) {
          finishAttempt(true);
          return;
        }
        updateTimerDisplay();
      }, 1000);
    }

    function updateTimerDisplay() {
      const node = document.getElementById("timer-value");
      if (!node || !attempt) return;
      const seconds = Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      node.textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
      node.classList.toggle("urgent", seconds <= 300);
      node.setAttribute("aria-label", mins + " minutes and " + secs + " seconds remaining");
    }

    function calculateScore(value) {
      let score = 0;
      for (let position = 0; position < BANK.length; position++) {
        const q = getQuestion(position);
        const originalId = value.order[position];
        const correctVisual = value.optionOrders[originalId].indexOf(q.answer);
        if (value.answers[position] === correctVisual) score += MARKS_PER_QUESTION;
      }
      return score;
    }

    function finishAttempt(timedOut) {
      if (!attempt || attempt.finished) return;
      document.getElementById("modal-root").innerHTML = "";
      attempt.score = calculateScore(attempt);
      attempt.finished = true;
      attempt.timedOut = timedOut;
      attempt.finishedAt = Date.now();
      saveAttempt();
      if (timerHandle) clearInterval(timerHandle);
      renderResults();
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
      }[char]));
    }

    function renderResults() {
      showView("result");
      const totalMarks = BANK.length * MARKS_PER_QUESTION;
      const correct = attempt.score / MARKS_PER_QUESTION;
      const percent = totalMarks ? (100 * attempt.score / totalMarks) : 0;
      const root = document.getElementById("result-view");
      root.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "result-wrap";
      const eyebrow = document.createElement("div");
      eyebrow.className = "eyebrow";
      eyebrow.textContent = attempt.timedOut ? "Time's up · Challenge complete" : "Challenge complete · Nicely done";
      const title = document.createElement("h2");
      title.textContent = percent >= 80 ? "A sharp mind at work." : percent >= 55 ? "Good thinking. Keep building." : "A strong place to start.";
      const subtitle = document.createElement("p");
      subtitle.className = "muted";
      subtitle.textContent = "Your result, with a question-by-question review so every answer becomes a useful next step.";
      wrap.append(eyebrow, title, subtitle);

      const hero = document.createElement("div");
      hero.className = "result-hero";
      const scoreCard = document.createElement("section");
      scoreCard.className = "result-card score-card";
      const scoreLabel = document.createElement("div");
      scoreLabel.className = "score-label";
      scoreLabel.textContent = "Your quiz score";
      const score = document.createElement("div");
      score.className = "score-big";
      score.innerHTML = attempt.score + '<small> / ' + totalMarks + '</small>';
      const message = document.createElement("div");
      message.className = "score-message";
      message.textContent = correct + " of " + BANK.length + " correct | Each question was worth " + MARKS_PER_QUESTION + " mark. Assignment marks are not included. No marks were deducted for incorrect answers.";
      const printButton = document.createElement("button");
      printButton.className = "primary-btn";
      printButton.textContent = "Print / save result";
      printButton.addEventListener("click", () => window.print());
      scoreCard.append(scoreLabel, score, message, printButton);

      const statSide = document.createElement("div");
      statSide.className = "result-side";
      const elapsed = Math.max(0, Math.min(DURATION_MS, DURATION_MS - (attempt.deadline - attempt.finishedAt)));
      const usedMins = Math.floor(elapsed / 60000);
      const usedSecs = Math.floor((elapsed % 60000) / 1000);
      const timeText = attempt.timedOut ? "90:00" : String(usedMins).padStart(2, "0") + ":" + String(usedSecs).padStart(2, "0");
      statSide.appendChild(statCard("Correct answers", correct + " / " + BANK.length));
      statSide.appendChild(statCard("Time used", timeText));
      hero.append(scoreCard, statSide);
      wrap.appendChild(hero);

      const topicScores = new Map();
      for (let position = 0; position < BANK.length; position++) {
        const q = getQuestion(position);
        const originalId = attempt.order[position];
        const correctVisual = attempt.optionOrders[originalId].indexOf(q.answer);
        const entry = topicScores.get(q.topic) || { got: 0, total: 0 };
        entry.total += MARKS_PER_QUESTION;
        if (attempt.answers[position] === correctVisual) entry.got += MARKS_PER_QUESTION;
        topicScores.set(q.topic, entry);
      }
      const section = document.createElement("section");
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "section-title";
      sectionTitle.innerHTML = "<h3>Score by topic</h3><span>1 mark per question</span>";
      const breakdown = document.createElement("div");
      breakdown.className = "breakdown";
      for (const [name, entry] of topicScores.entries()) {
        const row = document.createElement("div");
        row.className = "break-row";
        const topicName = document.createElement("span");
        topicName.className = "break-name";
        topicName.textContent = name;
        const bar = document.createElement("progress");
        bar.className = "break-bar";
        bar.max = 100;
        bar.value = Math.round(100 * entry.got / entry.total);
        bar.setAttribute("aria-label", name + " score");
        const topicScore = document.createElement("span");
        topicScore.className = "break-score";
        topicScore.textContent = entry.got + " / " + entry.total;
        row.append(topicName, bar, topicScore);
        breakdown.appendChild(row);
      }
      section.append(sectionTitle, breakdown);
      wrap.appendChild(section);

      const reviewTitle = document.createElement("div");
      reviewTitle.className = "section-title";
      reviewTitle.innerHTML = '<h3>Answer review</h3><span>Open any question to see why</span>';
      wrap.appendChild(reviewTitle);
      for (let position = 0; position < BANK.length; position++) {
        const q = getQuestion(position);
        const originalId = attempt.order[position];
        const correctVisual = attempt.optionOrders[originalId].indexOf(q.answer);
        const selected = attempt.answers[position];
        const isCorrect = selected === correctVisual;
        const details = document.createElement("details");
        details.className = "review-box";
        const summary = document.createElement("summary");
        const icon = document.createElement("span");
        icon.className = "review-icon " + (isCorrect ? "correct" : "incorrect");
        icon.textContent = isCorrect ? "✓" : "×";
        const qText = document.createElement("span");
        qText.className = "review-q";
        qText.textContent = String(position + 1).padStart(2, "0") + " · " + q.question;
        const mark = document.createElement("span");
        mark.className = "review-score";
        mark.textContent = isCorrect ? MARKS_PER_QUESTION + " / " + MARKS_PER_QUESTION : "0 / " + MARKS_PER_QUESTION;
        summary.append(icon, qText, mark);
        const content = document.createElement("div");
        content.className = "review-content";
        const your = document.createElement("p");
        your.innerHTML = "<b>Your answer:</b> " + (selected < 0
          ? '<span class="your-answer neutral">Not answered</span>'
          : '<span class="' + (isCorrect ? "correct-answer" : "your-answer") + '">' +
            escapeHtml(q.options[attempt.optionOrders[originalId][selected]]) + "</span>");
        const answer = document.createElement("p");
        answer.innerHTML = '<b>Correct answer:</b> <span class="correct-answer">' +
          escapeHtml(q.options[q.answer]) + "</span>";
        const why = document.createElement("p");
        why.innerHTML = "<b>Why:</b> " + escapeHtml(q.explanation);
        content.append(your, answer, why);
        details.append(summary, content);
        wrap.appendChild(details);
      }

      const actions = document.createElement("div");
      actions.className = "result-actions";
      const retake = document.createElement("button");
      retake.className = "primary-btn";
      retake.textContent = "Take the challenge again ↗";
      retake.addEventListener("click", () => {
        newAttempt();
        showView("quiz");
        renderQuiz();
        startTimer();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      const home = document.createElement("button");
      home.className = "quiet-btn";
      home.textContent = "Back to overview";
      home.addEventListener("click", () => {
        if (timerHandle) clearInterval(timerHandle);
        attempt = null;
        try { localStorage.removeItem(STORE_KEY); } catch (_) {}
        showView("welcome");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      actions.append(retake, home);
      wrap.appendChild(actions);
      root.appendChild(wrap);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function statCard(label, value) {
      const card = document.createElement("div");
      card.className = "stat-card";
      const title = document.createElement("span");
      title.textContent = label;
      const number = document.createElement("b");
      number.textContent = value;
      card.append(title, number);
      return card;
    }

    function showToast(message) {
      const root = document.getElementById("toast-root");
      root.innerHTML = "";
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;
      root.appendChild(toast);
      if (toastHandle) clearTimeout(toastHandle);
      toastHandle = setTimeout(() => { root.innerHTML = ""; }, 1500);
    }

    async function initializeApp() {
      const startButton = document.getElementById("start-btn");
      const endSavedButton = document.getElementById("end-saved-btn");
      const appStatus = document.getElementById("app-status");
      try {
        const response = await fetch("./questions.json?v=100-difficulty-random", { cache: "no-store" });
        if (!response.ok) throw new Error("Quiz data could not be loaded.");
        BANK = await response.json();
        if (!Array.isArray(BANK) || BANK.length !== 100 ||
            !BANK.every((question) => ["easy", "medium", "hard"].includes(question.difficulty) &&
            Array.isArray(question.options) && question.options.length === 4 &&
              Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4)) {
          throw new Error("Quiz data is incomplete.");
        }
        startButton.disabled = false;
        startButton.removeAttribute("aria-busy");
        const saved = loadAttempt();
        const hasUnfinishedAttempt = saved && !saved.finished;
        const canResume = hasUnfinishedAttempt && saved.deadline > Date.now();
        const startLabel = canResume ? 'Resume the quiz' : hasUnfinishedAttempt ? 'See quiz results' : 'Start the quiz';
        startButton.innerHTML = startLabel + ' <span class="arrow">&#8599;</span>';
        endSavedButton.classList.toggle("hidden", !canResume);
        if (canResume) {
          endSavedButton.addEventListener("click", () => {
            const current = loadAttempt();
            if (!current || current.finished) return;
            attempt = current;
            finishAttempt(attempt.deadline <= Date.now());
          });
        }
        appStatus.classList.add("hidden");
        startButton.addEventListener("click", beginAttempt);
        document.addEventListener("keydown", (event) => {
                  if (document.getElementById("quiz-view").classList.contains("hidden")) return;
                  if (!attempt || attempt.finished) return;
                  if (event.altKey || event.ctrlKey || event.metaKey) return;
                  const target = event.target;
                  if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
                  if (/^[1-4]$/.test(event.key)) {
                    const q = getQuestion(attempt.index);
                    const displayOrder = attempt.optionOrders[attempt.order[attempt.index]];
                    if (Number(event.key) <= q.options.length) {
                      attempt.answers[attempt.index] = Number(event.key) - 1;
                      saveAttempt();
                      renderQuiz();
                    }
                  } else if (event.key === "ArrowRight" && attempt.index < BANK.length - 1) {
                    event.preventDefault();
                    attempt.index++;
                    saveAttempt();
                    renderQuiz();
                  } else if (event.key === "ArrowLeft" && attempt.index > 0) {
                    event.preventDefault();
                    attempt.index--;
                    saveAttempt();
                    renderQuiz();
                  }
                });

      } catch (error) {
        console.error("Quiz initialization failed:", error);
        appStatus.textContent = "The quiz could not load. Check your connection, then refresh this page.";
        appStatus.classList.add("error");
      }
    }

    initializeApp();

    let deferredInstallPrompt = null;
    const installButton = document.getElementById("install-btn");
    const clearSavedButton = document.getElementById("clear-saved-btn");
    const installIsStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    clearSavedButton.addEventListener("click", () => {
      if (!window.confirm("Clear this browser's saved quiz answers and progress?")) return;
      try {
        localStorage.removeItem(STORE_KEY);
        document.getElementById("end-saved-btn").classList.add("hidden");
        const startButton = document.getElementById("start-btn");
        if (!startButton.disabled) {
          startButton.innerHTML = 'Start the quiz <span class="arrow">&#8599;</span>';
        }
        showToast("Saved quiz progress cleared.");
      } catch (_) {
        showToast("This browser could not clear the saved progress.");
      }
    });

    function showInstallHelp() {
      const userAgent = navigator.userAgent || "";
      const isIOS = /iPhone|iPad|iPod/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isMacSafari = /Macintosh/.test(userAgent) && /Safari/.test(userAgent) &&
        !/Chrome|Chromium|Edg/.test(userAgent);
      let titleText = "Install AI Fieldnotes";
      let instructionText = "Open your browser menu and choose Install app or Install this site as an app. It will open in its own window and keep your quiz progress on this device.";
      if (isIOS) {
        titleText = "Add to your Home Screen";
        instructionText = "Open this page in Safari, tap Share, choose Add to Home Screen, and turn on Open as Web App. The installed quiz opens like an app and can work offline after its first visit.";
      } else if (isMacSafari) {
        titleText = "Add AI Fieldnotes to your Dock";
        instructionText = "In Safari on macOS Sonoma or later, choose File, then Add to Dock. In Chrome or Edge, use the install icon in the address bar or the browser menu.";
      } else if (/Android/.test(userAgent)) {
        titleText = "Install on Android";
        instructionText = "In Chrome, tap Install app here or open the browser menu and choose Install app or Add to Home screen.";
      } else if (/Firefox/.test(userAgent)) {
        titleText = "Install from a supported browser";
        instructionText = "The quiz works in Firefox. To install it as an app, open this HTTPS page in Safari on Apple devices or Chrome or Edge on desktop and Android.";
      }
      const root = document.getElementById("modal-root");
      root.innerHTML = "";
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) root.innerHTML = "";
      });
      const modal = document.createElement("section");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "install-title");
      const title = document.createElement("h2");
      title.id = "install-title";
      title.textContent = titleText;
      const copy = document.createElement("p");
      copy.textContent = instructionText;
      const note = document.createElement("p");
      note.textContent = "Installation requires a secure HTTPS address (or localhost on this device).";
      const actions = document.createElement("div");
      actions.className = "modal-actions";
      const close = document.createElement("button");
      close.className = "quiet-btn";
      close.textContent = "Got it";
      close.addEventListener("click", () => { root.innerHTML = ""; });
      actions.appendChild(close);
      modal.append(title, copy, note, actions);
      backdrop.appendChild(modal);
      root.appendChild(backdrop);
      close.focus();
    }

    installButton.addEventListener("click", async () => {
      if (installIsStandalone) {
        showToast("AI Fieldnotes is already installed.");
        return;
      }
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        return;
      }
      showInstallHelp();
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      installButton.textContent = "Installed";
      installButton.disabled = true;
      showToast("AI Fieldnotes was installed.");
    });

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
    }
