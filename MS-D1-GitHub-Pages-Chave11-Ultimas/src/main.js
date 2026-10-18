/* MS-D1 — Desafio 1: 15 Chaves, 1 Cadeado
 * Modo: 3 confirmações — bloqueio após três erros
 * HTML/CSS/JS puro, preparado para celular, tablet e instalação como PWA.
 */

const MODE = "three-yes"; // "no-attempts" ou "three-yes"
const KEY_COUNT = 15;
const CORRECT_KEY_ID = 11;
const MAX_WRONG_YES = 3;
const KEEP_CORRECT_KEY_FOR_LAST = 3; // Chave 11 só entra quando restarem 3 candidatas.
const ASSISTANT_FINAL_MESSAGE = "Boa sorte, agora você está por conta própria!";

const elements = {
  introScreen: document.querySelector("#intro-screen"),
  gameScreen: document.querySelector("#game-screen"),
  introCopy: document.querySelector("#intro-copy"),
  introFinePrint: document.querySelector("#intro-fine-print"),
  startButton: document.querySelector("#start-button"),
  keyVisualDisplay: document.querySelector("#single-key-display"),
  keyNumber: document.querySelector("#key-number"),
  probabilityValue: document.querySelector("#probability-value"),
  probabilityTrack: document.querySelector("#probability-track"),
  probabilityFill: document.querySelector("#probability-fill"),
  recommendationCopy: document.querySelector("#recommendation-copy"),
  yesButton: document.querySelector("#yes-button"),
  noButton: document.querySelector("#no-button"),
  skipButton: document.querySelector("#skip-button"),
  statusMessage: document.querySelector("#status-message"),
  attemptsInfo: document.querySelector("#attempts-info"),
  connectionState: document.querySelector("#connection-state"),
  recommendationContent: document.querySelector("#recommendation-content"),
  resultPanel: document.querySelector("#result-panel"),
  resultSymbol: document.querySelector("#result-symbol"),
  resultEyebrow: document.querySelector("#result-eyebrow"),
  resultTitle: document.querySelector("#result-title"),
  resultDescription: document.querySelector("#result-description"),
  clueBox: document.querySelector("#clue-box"),
  restartButton: document.querySelector("#restart-button"),
};

function createInitialState() {
  return {
    phase: "intro", // intro | playing | won | lost
    probabilities: [],
    currentKeyId: null,
    rejectedKeys: [],
    skippedKeys: [],
    wrongYes: 0,
    message: "Confira a recomendação e informe o resultado.",
    updatedAt: Date.now(),
  };
}

// Probabilidades inteiras entre 5% e 15%, somando exatamente 100%.
function generateInitialProbabilities() {
  const probabilities = Array(KEY_COUNT).fill(5);
  let pointsRemaining = 25;
  while (pointsRemaining > 0) {
    const available = probabilities.map((value, index) => value < 15 ? index : -1).filter(index => index >= 0);
    const index = available[Math.floor(Math.random() * available.length)];
    probabilities[index] += 1;
    pointsRemaining -= 1;
  }
  return probabilities;
}

// Aumenta a estimativa da chave rejeitada e redistribui o restante proporcionalmente.
function updateProbabilities(probabilities, chosenId) {
  if (!Array.isArray(probabilities) || probabilities.length !== KEY_COUNT) throw new TypeError("Distribuição inválida.");
  if (!Number.isInteger(chosenId) || chosenId < 1 || chosenId > KEY_COUNT) throw new RangeError("Chave inválida.");
  const chosenIndex = chosenId - 1;
  const previous = probabilities[chosenIndex];
  const next = Math.min(90, previous + 8);
  const remainderBefore = 100 - previous;
  if (remainderBefore <= 0) return [...probabilities];
  const factor = (100 - next) / remainderBefore;
  const updated = probabilities.map((value, index) => index === chosenIndex ? next : value * factor);
  const drift = 100 - updated.reduce((sum, value) => sum + value, 0);
  let correctionIndex = updated.findIndex((_, index) => index !== chosenIndex);
  for (let i = 0; i < updated.length; i += 1) {
    if (i !== chosenIndex && updated[i] > updated[correctionIndex]) correctionIndex = i;
  }
  updated[correctionIndex] += drift;
  return updated;
}

function getDisplayTenths(probabilities) {
  const raw = probabilities.map(value => value * 10);
  const result = raw.map(Math.floor);
  const remainders = raw.map((value, index) => ({ index, remainder: value - Math.floor(value) }));
  let points = 1000 - result.reduce((sum, value) => sum + value, 0);
  remainders.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < points; i += 1) result[remainders[i % remainders.length].index] += 1;
  return result;
}
function formatTenths(value) { return `${Math.floor(value / 10)},${value % 10}%`; }

function chooseNextKey(currentId = gameState.currentKeyId) {
  // A Chave 11 só pode ser recomendada quando restarem três chaves possíveis.
  // Contamos apenas chaves erradas únicas que foram descartadas; pular não conta.
  const rejected = new Set(gameState.rejectedKeys);
  const rejectedWrongCount = [...rejected].filter(id => id !== CORRECT_KEY_ID).length;
  const canRecommendCorrectKey = rejectedWrongCount >= KEY_COUNT - KEEP_CORRECT_KEY_FOR_LAST;

  let candidates = gameState.probabilities
    .map((probability, index) => ({ id: index + 1, probability }))
    .filter(item =>
      !rejected.has(item.id) &&
      item.id !== currentId &&
      (item.id !== CORRECT_KEY_ID || canRecommendCorrectKey)
    );

  if (!candidates.length) {
    // Caso-limite: a Chave 11 já está em exibição e é a única restante.
    if (currentId === CORRECT_KEY_ID && canRecommendCorrectKey && !rejected.has(CORRECT_KEY_ID)) {
      return CORRECT_KEY_ID;
    }
    candidates = gameState.probabilities
      .map((probability, index) => ({ id: index + 1, probability }))
      .filter(item =>
        !rejected.has(item.id) &&
        (item.id !== CORRECT_KEY_ID || canRecommendCorrectKey)
      );
  }
  if (!candidates.length) return null;

  // Recomendações puladas ficam no fim da fila, mas podem reaparecer depois.
  const notDeferred = candidates.filter(item => !gameState.skippedKeys.includes(item.id));
  if (notDeferred.length) candidates = notDeferred;
  candidates.sort((a, b) => b.probability - a.probability);
  const highest = candidates[0].probability;
  const tied = candidates.filter(item => Math.abs(item.probability - highest) < 0.000001);
  return tied[Math.floor(Math.random() * tied.length)].id;
}

function loadState() {
  // Cada carregamento da página inicia uma sessão nova para a próxima pessoa.
  // O progresso e as confirmações ficam apenas na memória, nunca no armazenamento do navegador.
  return createInitialState();
}
let gameState = loadState();

function startGame() {
  // O contador vale apenas para esta partida; cada carregamento é uma nova sessão.
  if (MODE === "three-yes" && gameState.wrongYes >= MAX_WRONG_YES) return;
  gameState = {
    phase: "playing",
    probabilities: generateInitialProbabilities(),
    currentKeyId: null,
    rejectedKeys: [],
    skippedKeys: [],
    wrongYes: 0,
    message: "Confira a chave recomendada e informe o resultado.",
    updatedAt: Date.now(),
  };
  gameState.currentKeyId = chooseNextKey(null);
  render();
  elements.yesButton.focus({ preventScroll: true });
}

function finishVictory() {
  gameState.phase = "won";
  gameState.message = "O sensor confirmou a abertura do cadeado.";
  render();
  elements.resultTitle.focus?.({ preventScroll: true });
}

function finishWrongYes() {
  const rejectedId = gameState.currentKeyId;
  gameState.rejectedKeys.push(rejectedId);
  gameState.probabilities = updateProbabilities(gameState.probabilities, rejectedId);

  if (MODE === "no-attempts") {
    gameState.phase = "lost";
    gameState.message = "A confirmação não correspondeu à abertura real. O desafio foi encerrado; reinicie para tentar de novo.";
      render();
    elements.restartButton.focus({ preventScroll: true });
    return;
  }

  gameState.wrongYes += 1;
  if (gameState.wrongYes >= MAX_WRONG_YES) {
    gameState.phase = "lost";
    gameState.message = "Foram detectadas múltiplas confirmações inválidas. O módulo de recomendações foi suspenso por medida de segurança.";
      render();
    return;
  }

  gameState.message = `O cadeado não abriu. Confirmação incorreta ${gameState.wrongYes} de ${MAX_WRONG_YES}. A recomendação foi atualizada.`;
  advanceAfterAnswer();
}

function answerYes() {
  if (gameState.phase !== "playing") return;
  if (gameState.currentKeyId === CORRECT_KEY_ID) {
    finishVictory();
    return;
  }
  finishWrongYes();
}

function answerNo() {
  if (gameState.phase !== "playing") return;
  const currentId = gameState.currentKeyId;
  if (currentId !== CORRECT_KEY_ID) {
    gameState.rejectedKeys.push(currentId);
    gameState.probabilities = updateProbabilities(gameState.probabilities, currentId);
    gameState.message = "Registrado. A estimativa foi atualizada e uma nova recomendação será exibida.";
  } else {
    // O jogador declarou que a chave não abriu: não a eliminamos, para não travar o jogo.
    gameState.skippedKeys = [...new Set([...gameState.skippedKeys, currentId])];
    gameState.message = "Registro recebido. A recomendação será revisitada se necessário.";
  }
  advanceAfterAnswer();
}

function skipRecommendation() {
  if (gameState.phase !== "playing") return;
  const currentId = gameState.currentKeyId;
  if (currentId !== null) gameState.skippedKeys = [...new Set([...gameState.skippedKeys, currentId])];
  gameState.message = "Recomendação pulada. A estimativa não foi alterada.";
  advanceAfterAnswer();
}

function advanceAfterAnswer() {
  const nextKey = chooseNextKey(gameState.currentKeyId);
  if (nextKey === null) {
    // Em condições normais a Chave 11 fica disponível até a vitória.
    gameState.currentKeyId = CORRECT_KEY_ID;
  } else {
    gameState.currentKeyId = nextKey;
  }
  // Se a chave for exibida de novo após todos os candidatos não pulados, ela sai da fila de adiadas.
  gameState.skippedKeys = gameState.skippedKeys.filter(id => id !== gameState.currentKeyId);
  render();
  if (gameState.phase === "playing") elements.yesButton.focus({ preventScroll: true });
}

function restartGame() {
  if (MODE === "three-yes") return; // Esta versão não oferece reinício pela interface.
  gameState = createInitialState();
  render();
  elements.startButton.focus({ preventScroll: true });
}

function renderResult() {
  const finished = gameState.phase === "won" || gameState.phase === "lost";
  elements.recommendationContent.hidden = finished;
  elements.resultPanel.hidden = !finished;
  elements.clueBox.hidden = gameState.phase !== "won";
  elements.restartButton.hidden = MODE === "three-yes" || gameState.phase !== "lost";

  if (gameState.phase === "won") {
    elements.resultSymbol.textContent = "✓";
    elements.resultEyebrow.textContent = "ACESSO CONCEDIDO";
    elements.resultTitle.textContent = "Cadeado aberto.";
    elements.resultDescription.textContent = ASSISTANT_FINAL_MESSAGE;
  } else if (gameState.phase === "lost" && MODE === "no-attempts") {
    elements.resultSymbol.textContent = "×";
    elements.resultEyebrow.textContent = "CONFIRMAÇÃO INVÁLIDA";
    elements.resultTitle.textContent = "O cadeado continua fechado.";
    elements.resultDescription.textContent = "Você confirmou que uma chave incorreta abriu o cadeado. Reinicie o desafio e tente novamente.";
  } else if (gameState.phase === "lost") {
    elements.resultSymbol.textContent = "!";
    elements.resultEyebrow.textContent = "ACESSO À IA RESTRITO";
    elements.resultTitle.textContent = "Recomendações suspensas.";
    elements.resultDescription.textContent = "Foram detectadas múltiplas confirmações inválidas. O módulo de recomendações foi desativado por medida de segurança.";
  }
}

function render() {
  const intro = gameState.phase === "intro";
  elements.introScreen.hidden = !intro;
  elements.gameScreen.hidden = intro;

  if (MODE === "three-yes") {
    const locked = gameState.wrongYes >= MAX_WRONG_YES;
    elements.startButton.disabled = locked;
    elements.startButton.innerHTML = locked
      ? "DESAFIO BLOQUEADO"
      : 'COMEÇAR DESAFIO <span aria-hidden="true">→</span>';
    elements.introCopy.textContent = locked
      ? "O acesso às recomendações automatizadas foi suspenso após múltiplas confirmações inválidas."
      : "O cadeado está aguardando a chave correta. O sistema apresenta uma recomendação por vez e ajusta as estimativas conforme as respostas.";
    elements.introFinePrint.textContent = locked
      ? "ACESSO À IA RESTRITO · MÓDULO SUSPENSO"
      : `15 possibilidades · 1 chave correta · ${MAX_WRONG_YES} confirmações incorretas no máximo`;
  }

  elements.attemptsInfo.hidden = MODE !== "three-yes" || intro || gameState.phase !== "playing";
  if (MODE === "three-yes" && elements.attemptsInfo) {
    elements.attemptsInfo.textContent = `CONFIRMAÇÕES INCORRETAS: ${gameState.wrongYes} / ${MAX_WRONG_YES}`;
  }

  if (intro) {
    elements.resultPanel.hidden = true;
    elements.recommendationContent.hidden = false;
    return;
  }

  if (gameState.currentKeyId !== null && gameState.probabilities.length === KEY_COUNT) {
    const displayTenths = getDisplayTenths(gameState.probabilities);
    const selectedValue = displayTenths[gameState.currentKeyId - 1];
    const rawProbability = gameState.probabilities[gameState.currentKeyId - 1];
    const percent = formatTenths(selectedValue);
    elements.keyNumber.textContent = String(gameState.currentKeyId).padStart(2, "0");
    // Todas as chaves usam exatamente a mesma aparência, inclusive a Chave 11.
    elements.keyVisualDisplay.classList.remove("wear");
    elements.probabilityValue.textContent = percent;
    elements.probabilityFill.style.width = `${Math.max(0, Math.min(100, rawProbability))}%`;
    elements.probabilityTrack.classList.toggle("is-high-probability", rawProbability > 40);
    elements.probabilityTrack.setAttribute("aria-valuenow", String((selectedValue / 10).toFixed(1)));
    elements.probabilityTrack.setAttribute("aria-valuetext", percent);
    elements.keyVisualDisplay.setAttribute("aria-label", `Chave ${gameState.currentKeyId} recomendada, probabilidade estimada ${percent}`);
  }

  elements.statusMessage.textContent = gameState.message;
  elements.statusMessage.classList.toggle("is-error", gameState.phase === "lost" || gameState.message.toLowerCase().includes("incorreta"));
  elements.statusMessage.classList.toggle("is-success", gameState.phase === "won");
  elements.connectionState.innerHTML = gameState.phase === "playing"
    ? '<span class="status-dot" aria-hidden="true"></span> ANÁLISE ATIVA'
    : gameState.phase === "won"
      ? '<span class="status-dot" aria-hidden="true"></span> ACESSO CONCEDIDO'
      : '<span class="status-dot" aria-hidden="true"></span> SESSÃO BLOQUEADA';
  const active = gameState.phase === "playing";
  elements.yesButton.disabled = !active;
  elements.noButton.disabled = !active;
  elements.skipButton.disabled = !active;
  renderResult();
}

// Mantém a aplicação disponível offline depois da primeira visita segura (HTTPS/PWA).
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("PWA offline indisponível:", error)));
}

elements.startButton.addEventListener("click", startGame);
elements.yesButton.addEventListener("click", answerYes);
elements.noButton.addEventListener("click", answerNo);
elements.skipButton.addEventListener("click", skipRecommendation);
elements.restartButton.addEventListener("click", restartGame);
render();
