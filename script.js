const SUITS = [
  { id: "pixie", name: "Pixie", icon: "🧚", order: 0 },
  { id: "dragon", name: "Dragon", icon: "🐉", order: 1 },
  { id: "sword", name: "Sword", icon: "⚔️", order: 2 },
  { id: "fire", name: "Fire", icon: "🔥", order: 3 },
  { id: "diamond", name: "Diamond", icon: "♦️", order: 4 },
];

const RANKS = [
  { key: "A", label: "A", order: 1, value: 1 },
  { key: "2", label: "2", order: 2, value: 2 },
  { key: "3", label: "3", order: 3, value: 3 },
  { key: "4", label: "4", order: 4, value: 4 },
  { key: "5", label: "5", order: 5, value: 5 },
  { key: "6", label: "6", order: 6, value: 6 },
  { key: "7", label: "7", order: 7, value: 7 },
  { key: "8", label: "8", order: 8, value: 8 },
  { key: "9", label: "9", order: 9, value: 9 },
  { key: "10", label: "10", order: 10, value: 10 },
  { key: "J", label: "J", order: 11, value: 10 },
  { key: "Q", label: "Q", order: 12, value: 10 },
  { key: "K", label: "K", order: 13, value: 10 },
];

const TRACKS = {
  novice: "assets/lofi_nature.mp3",
  intermediate: "assets/lofi_mythical.mp3",
  advanced: "assets/lofi_fantasy.mp3",
};

const LEVEL_NAMES = {
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const els = {
  body: document.body,
  bgMusic: document.querySelector("#bgMusic"),
  trackerTime: document.querySelector("#trackerTime"),
  moveList: document.querySelector("#moveList"),
  timerDisplay: document.querySelector("#timerDisplay"),
  pauseButton: document.querySelector("#pauseButton"),
  restartButton: document.querySelector("#restartButton"),
  newDuelButton: document.querySelector("#newDuelButton"),
  cpuHand: document.querySelector("#cpuHand"),
  cpuCount: document.querySelector("#cpuCount"),
  playerHand: document.querySelector("#playerHand"),
  turnHint: document.querySelector("#turnHint"),
  drawPile: document.querySelector("#drawPile"),
  discardPile: document.querySelector("#discardPile"),
  discardCardPreview: document.querySelector("#discardCardPreview"),
  deadwoodScore: document.querySelector("#deadwoodScore"),
  knockButton: document.querySelector("#knockButton"),
  ginButton: document.querySelector("#ginButton"),
  resultModal: document.querySelector("#resultModal"),
  resultCard: document.querySelector(".result-card"),
  resultTitle: document.querySelector("#resultTitle"),
  resultDetail: document.querySelector("#resultDetail"),
  modalYesButton: document.querySelector("#modalYesButton"),
  modalNoButton: document.querySelector("#modalNoButton"),
  audioSelect: document.querySelector("#audioSelect"),
  levelSelect: document.querySelector("#levelSelect"),
  handSizeSelect: document.querySelector("#handSizeSelect"),
  modeSelect: document.querySelector("#modeSelect"),
};

const state = {
  level: "novice",
  handSize: 7,
  mode: "light",
  sound: true,
  music: true,
  deck: [],
  discard: [],
  playerHand: [],
  cpuHand: [],
  selectedCardId: null,
  needsDiscard: false,
  turn: "player",
  pendingCpu: false,
  gameOver: false,
  paused: false,
  timerStarted: false,
  elapsed: 0,
  timerId: null,
  moves: [],
  cardSequence: 0,
  audioContext: null,
};

function buildDeck() {
  const deck = [];

  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${suit.id}-${rank.key}-${state.cardSequence++}`,
        suitId: suit.id,
        suitName: suit.name,
        suitIcon: suit.icon,
        suitOrder: suit.order,
        rankKey: rank.key,
        rankLabel: rank.label,
        order: rank.order,
        value: rank.value,
      });
    });
  });

  return shuffle(deck);
}

function shuffle(cards) {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function sortCards(cards) {
  return [...cards].sort((a, b) => {
    if (a.suitOrder !== b.suitOrder) return a.suitOrder - b.suitOrder;
    return a.order - b.order;
  });
}

function newDuel() {
  stopTimer();
  state.deck = buildDeck();
  state.discard = [];
  state.playerHand = [];
  state.cpuHand = [];
  state.selectedCardId = null;
  state.needsDiscard = false;
  state.turn = "player";
  state.pendingCpu = false;
  state.gameOver = false;
  state.paused = false;
  state.timerStarted = false;
  state.elapsed = 0;
  state.moves = [];

  for (let i = 0; i < state.handSize; i += 1) {
    state.playerHand.push(state.deck.pop());
    state.cpuHand.push(state.deck.pop());
  }

  state.discard.push(state.deck.pop());
  recordMove(`New duel: ${LEVEL_NAMES[state.level]}, ${state.handSize} cards`, false);
  closeResultModal();
  updateMusic();
  render();
}

function restartDuel() {
  pulse(15);
  playTone("button");
  newDuel();
}

function canPlayerAct() {
  return state.turn === "player" && !state.gameOver && !state.paused;
}

function startTimerForPlayerMove() {
  if (state.timerStarted || state.gameOver) return;
  state.timerStarted = true;
  state.timerId = window.setInterval(() => {
    if (!state.paused && !state.gameOver) {
      state.elapsed += 1;
      syncTimeDisplays();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
  }
  state.timerId = null;
}

function syncTimeDisplays() {
  const time = formatTime(state.elapsed);
  els.timerDisplay.textContent = time;
  els.trackerTime.textContent = `Time ${time}`;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function recordMove(text, playerMove) {
  if (playerMove) {
    startTimerForPlayerMove();
  }

  state.moves.push({
    time: state.elapsed,
    text,
  });
}

function drawFromStock() {
  if (!canPlayerAct() || state.needsDiscard) return;
  const card = drawDeckCard();
  if (!card) {
    endDuel("stock", "empty");
    return;
  }

  state.playerHand.push(card);
  state.needsDiscard = true;
  state.selectedCardId = null;
  recordMove("You drew from the rune deck", true);
  pulse(18);
  playTone("draw");
  render();
}

function drawFromDiscard() {
  if (!canPlayerAct() || state.needsDiscard || state.discard.length === 0) return;
  const card = state.discard.pop();
  state.playerHand.push(card);
  state.needsDiscard = true;
  state.selectedCardId = null;
  recordMove(`You drew ${cardToken(card)} from discard`, true);
  pulse(18);
  playTone("draw");
  render();
}

function drawDeckCard() {
  if (state.deck.length === 0) {
    recycleDiscardIntoDeck();
  }

  return state.deck.pop() || null;
}

function recycleDiscardIntoDeck() {
  if (state.discard.length <= 1) return;
  const topDiscard = state.discard.pop();
  state.deck = shuffle(state.discard);
  state.discard = [topDiscard];
}

function handlePlayerCardClick(cardId) {
  if (!canPlayerAct()) return;

  if (!state.needsDiscard) {
    state.selectedCardId = state.selectedCardId === cardId ? null : cardId;
    playTone("button");
    render();
    return;
  }

  discardPlayerCard(cardId);
}

function discardPlayerCard(cardId) {
  const cardIndex = state.playerHand.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) return;

  const [card] = state.playerHand.splice(cardIndex, 1);
  state.discard.push(card);
  state.needsDiscard = false;
  state.selectedCardId = null;
  recordMove(`You discarded ${cardToken(card)}`, true);
  pulse(22);
  playTone("discard");
  render();
  scheduleCpuTurn();
}

function callKnock() {
  if (!canPlayerAct()) return;
  const analysis = analyzeHand(state.playerHand);
  if (analysis.deadwood > 10) return;
  recordMove("You called Knock", true);
  pulse(35);
  playTone("finish");
  endDuel("player", "knock");
}

function callGin() {
  if (!canPlayerAct()) return;
  const analysis = analyzeHand(state.playerHand);
  if (analysis.deadwood !== 0) return;
  recordMove("You called Gin", true);
  pulse(45);
  playTone("finish");
  endDuel("player", "gin");
}

function scheduleCpuTurn() {
  state.turn = "cpu";
  state.pendingCpu = true;
  render();

  window.setTimeout(() => {
    if (state.pendingCpu && !state.paused && !state.gameOver) {
      runCpuTurn();
    }
  }, 650);
}

function runCpuTurn() {
  if (state.gameOver || state.paused) return;
  state.pendingCpu = false;

  const drawChoice = chooseCpuDraw();
  const drawnCard = drawChoice === "discard" ? state.discard.pop() : drawDeckCard();

  if (!drawnCard) {
    endDuel("stock", "empty");
    return;
  }

  state.cpuHand.push(drawnCard);
  recordMove(
    drawChoice === "discard"
      ? "The Dark Wizard drew from discard"
      : "The Dark Wizard drew from the rune deck",
    false,
  );

  const discardCard = chooseCpuDiscard(drawnCard.id);
  state.cpuHand = state.cpuHand.filter((card) => card.id !== discardCard.id);
  state.discard.push(discardCard);
  recordMove("The Dark Wizard discarded a card", false);

  const analysis = analyzeHand(state.cpuHand);
  if (analysis.deadwood === 0) {
    recordMove("The Dark Wizard called Gin", false);
    endDuel("cpu", "gin");
    return;
  }

  if (analysis.deadwood <= cpuKnockLimit()) {
    recordMove("The Dark Wizard called Knock", false);
    endDuel("cpu", "knock");
    return;
  }

  state.turn = "player";
  state.needsDiscard = false;
  render();
}

function chooseCpuDraw() {
  const topDiscard = state.discard[state.discard.length - 1];
  if (!topDiscard) return "stock";

  const currentDeadwood = analyzeHand(state.cpuHand).deadwood;
  const discardDeadwood = analyzeHand([...state.cpuHand, topDiscard]).deadwood;
  const connected = cardConnects(topDiscard, state.cpuHand);

  if (state.level === "novice") {
    return discardDeadwood < currentDeadwood && Math.random() < 0.36 ? "discard" : "stock";
  }

  if (state.level === "intermediate") {
    return discardDeadwood <= currentDeadwood || connected ? "discard" : "stock";
  }

  return discardDeadwood <= currentDeadwood + 2 || connected ? "discard" : "stock";
}

function cardConnects(card, hand) {
  const rankMatches = hand.filter((held) => held.rankKey === card.rankKey).length;
  const suitNeighbors = hand.filter(
    (held) => held.suitId === card.suitId && Math.abs(held.order - card.order) <= 2,
  ).length;
  return rankMatches >= 2 || suitNeighbors >= 2;
}

function chooseCpuDiscard(drawnCardId) {
  const analysis = analyzeHand(state.cpuHand);
  const meldCardIds = new Set(analysis.melds.flatMap((meld) => meld.cards.map((card) => card.id)));
  const candidates = state.cpuHand.filter((card) => !meldCardIds.has(card.id));
  const pool = candidates.length > 0 ? candidates : state.cpuHand;

  if (state.level === "novice") {
    const weighted = [...pool].sort((a, b) => b.value - a.value);
    return weighted[Math.floor(Math.random() * Math.min(weighted.length, 3))];
  }

  let best = null;
  for (const card of pool) {
    const remaining = state.cpuHand.filter((held) => held.id !== card.id);
    const score = analyzeHand(remaining).deadwood;
    const drawnPenalty = card.id === drawnCardId ? 3 : 0;
    const valueTie = card.value / 100;
    const rating = score + drawnPenalty - valueTie;

    if (!best || rating < best.rating) {
      best = { card, rating };
    }
  }

  return best.card;
}

function cpuKnockLimit() {
  if (state.level === "novice") return 3;
  if (state.level === "intermediate") return 7;
  return 10;
}

function endDuel(initiator, method) {
  if (state.gameOver) return;
  state.gameOver = true;
  state.pendingCpu = false;
  state.needsDiscard = false;
  stopTimer();

  const playerDeadwood = analyzeHand(state.playerHand).deadwood;
  const cpuDeadwood = analyzeHand(state.cpuHand).deadwood;
  let playerWon = false;

  if (initiator === "player" && method === "gin") {
    playerWon = true;
  } else if (initiator === "cpu" && method === "gin") {
    playerWon = false;
  } else if (initiator === "player" && method === "knock") {
    playerWon = playerDeadwood <= cpuDeadwood;
  } else if (initiator === "cpu" && method === "knock") {
    playerWon = playerDeadwood < cpuDeadwood;
  } else {
    playerWon = playerDeadwood <= cpuDeadwood;
    recordMove("The rune deck ran dry", false);
  }

  render();
  showResultModal(playerWon, playerDeadwood, cpuDeadwood);
}

function showResultModal(playerWon, playerDeadwood, cpuDeadwood) {
  els.resultTitle.textContent = playerWon ? "You Win" : "You Lose";
  els.resultDetail.textContent = `New Duel?`;
  els.resultCard.classList.toggle("win", playerWon);
  els.resultCard.classList.toggle("lose", !playerWon);
  els.resultModal.classList.add("is-open");
  els.resultModal.setAttribute("aria-hidden", "false");
  els.modalYesButton.focus();
  playTone(playerWon ? "win" : "lose");
  state.moves.push({
    time: state.elapsed,
    text: playerWon
      ? `You Win: ${playerDeadwood} to ${cpuDeadwood}`
      : `You Lose: ${playerDeadwood} to ${cpuDeadwood}`,
  });
  renderTracker();
}

function closeResultModal() {
  els.resultModal.classList.remove("is-open");
  els.resultModal.setAttribute("aria-hidden", "true");
}

function analyzeHand(hand) {
  const total = hand.reduce((sum, card) => sum + card.value, 0);
  const melds = generateMelds(hand);
  const best = {
    coveredValue: 0,
    coveredCount: 0,
    melds: [],
  };

  function search(index, usedIds, selected, coveredValue, coveredCount) {
    if (index >= melds.length) {
      const isBetter =
        coveredValue > best.coveredValue ||
        (coveredValue === best.coveredValue && coveredCount > best.coveredCount);

      if (isBetter) {
        best.coveredValue = coveredValue;
        best.coveredCount = coveredCount;
        best.melds = selected;
      }
      return;
    }

    search(index + 1, usedIds, selected, coveredValue, coveredCount);

    const meld = melds[index];
    if (meld.cards.every((card) => !usedIds.has(card.id))) {
      const nextUsed = new Set(usedIds);
      meld.cards.forEach((card) => nextUsed.add(card.id));
      search(
        index + 1,
        nextUsed,
        [...selected, meld],
        coveredValue + meld.cards.reduce((sum, card) => sum + card.value, 0),
        coveredCount + meld.cards.length,
      );
    }
  }

  search(0, new Set(), [], 0, 0);

  const cardKinds = new Map();
  best.melds.forEach((meld) => {
    meld.cards.forEach((card) => {
      const previous = cardKinds.get(card.id);
      cardKinds.set(card.id, previous ? `${previous} ${meld.kind}` : meld.kind);
    });
  });

  return {
    deadwood: total - best.coveredValue,
    melds: best.melds,
    cardKinds,
  };
}

function generateMelds(hand) {
  const melds = [];
  const rankGroups = groupBy(hand, (card) => card.rankKey);
  const suitGroups = groupBy(hand, (card) => card.suitId);

  rankGroups.forEach((cards) => {
    if (cards.length < 3) return;
    for (let size = 3; size <= cards.length; size += 1) {
      combinations(cards, size).forEach((combo) => {
        melds.push({ kind: "set", cards: sortCards(combo) });
      });
    }
  });

  suitGroups.forEach((cards) => {
    const sorted = sortCards(cards);
    let block = [];

    sorted.forEach((card, index) => {
      const previous = sorted[index - 1];
      if (!previous || card.order === previous.order + 1) {
        block.push(card);
      } else {
        addRunMelds(block, melds);
        block = [card];
      }
    });

    addRunMelds(block, melds);
  });

  return melds.sort((a, b) => {
    const valueDiff = meldValue(b) - meldValue(a);
    if (valueDiff !== 0) return valueDiff;
    return b.cards.length - a.cards.length;
  });
}

function addRunMelds(block, melds) {
  if (block.length < 3) return;
  for (let start = 0; start <= block.length - 3; start += 1) {
    for (let end = start + 3; end <= block.length; end += 1) {
      melds.push({ kind: "run", cards: block.slice(start, end) });
    }
  }
}

function meldValue(meld) {
  return meld.cards.reduce((sum, card) => sum + card.value, 0);
}

function groupBy(items, getKey) {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  });
  return map;
}

function combinations(items, size) {
  const output = [];

  function pick(start, chosen) {
    if (chosen.length === size) {
      output.push(chosen);
      return;
    }

    for (let index = start; index < items.length; index += 1) {
      pick(index + 1, [...chosen, items[index]]);
    }
  }

  pick(0, []);
  return output;
}

function render() {
  syncTimeDisplays();
  renderTracker();
  renderHands();
  renderDecks();
  renderActions();
}

function renderTracker() {
  els.moveList.replaceChildren(
    ...state.moves.map((move) => {
      const li = document.createElement("li");
      li.textContent = `${formatTime(move.time)} ${move.text}`;
      return li;
    }),
  );
  els.moveList.scrollTop = els.moveList.scrollHeight;
}

function renderHands() {
  const playerAnalysis = analyzeHand(state.playerHand);
  els.playerHand.replaceChildren(
    ...sortCards(state.playerHand).map((card) => {
      const kind = playerAnalysis.cardKinds.get(card.id) || "";
      return createFaceCard(card, {
        selected: state.selectedCardId === card.id,
        kind,
        disabled: state.gameOver || state.paused || state.turn !== "player",
        onClick: () => handlePlayerCardClick(card.id),
      });
    }),
  );

  els.cpuHand.replaceChildren(
    ...sortCards(state.cpuHand).map((card) => {
      if (!state.gameOver) {
        return createWizardBackCard();
      }
      return createFaceCard(card, {
        selected: false,
        kind: "",
        disabled: true,
        onClick: null,
      });
    }),
  );

  els.cpuCount.textContent = `${state.cpuHand.length} card${state.cpuHand.length === 1 ? "" : "s"}`;
  els.deadwoodScore.textContent = `Deadwood ${playerAnalysis.deadwood}`;
}

function renderDecks() {
  const topDiscard = state.discard[state.discard.length - 1];
  els.discardCardPreview.textContent = topDiscard ? cardToken(topDiscard) : "Empty";
  els.drawPile.disabled = !canPlayerAct() || state.needsDiscard;
  els.discardPile.disabled = !canPlayerAct() || state.needsDiscard || !topDiscard;
}

function renderActions() {
  const playerAnalysis = analyzeHand(state.playerHand);
  els.knockButton.disabled = !canPlayerAct() || playerAnalysis.deadwood > 10;
  els.ginButton.disabled = !canPlayerAct() || playerAnalysis.deadwood !== 0;
  els.pauseButton.textContent = state.paused ? "Resume" : "Pause";

  if (state.gameOver) {
    els.turnHint.textContent = "Duel complete.";
  } else if (state.paused) {
    els.turnHint.textContent = "Paused.";
  } else if (state.turn === "cpu") {
    els.turnHint.textContent = "The Dark Wizard is moving.";
  } else if (state.needsDiscard) {
    els.turnHint.textContent = "Choose a card to discard.";
  } else {
    els.turnHint.textContent = state.timerStarted
      ? "Draw from the deck or discard."
      : "Draw a rune card to begin.";
  }
}

function createFaceCard(card, options) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card";
  button.setAttribute("aria-label", `${card.rankLabel} of ${card.suitName}`);

  if (options.kind.includes("set")) button.classList.add("meld-set");
  if (options.kind.includes("run")) button.classList.add("meld-run");
  if (options.selected) button.classList.add("is-selected");
  if (options.disabled) button.disabled = true;
  if (options.onClick) button.addEventListener("click", options.onClick);

  const rank = document.createElement("span");
  rank.className = "card-rank";
  rank.textContent = card.rankLabel;

  const suit = document.createElement("span");
  suit.className = "card-suit";
  suit.textContent = card.suitIcon;

  const suitSmall = document.createElement("span");
  suitSmall.className = "card-suit-small";
  suitSmall.textContent = card.suitIcon;

  button.replaceChildren(rank, suit, suitSmall);
  return button;
}

function createBackCard() {
  const card = document.createElement("div");
  card.className = "card card-back";
  card.setAttribute("aria-label", "Rune card");

  const inner = document.createElement("span");
  inner.className = "back-inner";
  const title = document.createElement("span");
  title.textContent = "R&R";
  const runes = document.createElement("span");
  runes.className = "back-runes";
  runes.textContent = "🧚 🐉 ⚔️ 🔥 ♦️";

  inner.replaceChildren(title, runes);
  card.append(inner);
  return card;
}

function createWizardBackCard() {
  const card = document.createElement("div");
  card.className = "card wizard-card-back";
  card.setAttribute("aria-label", "Dark wizard card");

  const sigil = document.createElement("span");
  sigil.className = "wizard-sigil";
  const moon = document.createElement("span");
  moon.textContent = "☾";
  const stars = document.createElement("span");
  stars.className = "wizard-stars";
  stars.textContent = "✦ ✧ ✦";

  sigil.replaceChildren(moon, stars);
  card.append(sigil);
  return card;
}

function cardToken(card) {
  return `${card.rankLabel}${card.suitIcon}`;
}

function togglePause() {
  if (state.gameOver) return;
  state.paused = !state.paused;
  pulse(14);
  playTone("button");
  render();

  if (!state.paused && state.pendingCpu) {
    window.setTimeout(() => {
      if (state.pendingCpu && !state.paused && !state.gameOver) runCpuTurn();
    }, 360);
  }
}

function applyMode() {
  els.body.classList.toggle("theme-dark", state.mode === "dark");
  els.body.classList.toggle("theme-light", state.mode === "light");
}

function updateMusic() {
  const src = TRACKS[state.level];
  const absoluteSrc = new URL(src, window.location.href).href;

  if (els.bgMusic.src !== absoluteSrc) {
    els.bgMusic.src = src;
    els.bgMusic.load();
  }

  els.bgMusic.loop = true;
  els.bgMusic.muted = false;
  els.bgMusic.preload = "auto";
  els.bgMusic.volume = 0.42;

  if (!state.music) {
    els.bgMusic.pause();
    return;
  }

  els.bgMusic.play().catch(() => {});
}

function unlockMusic() {
  if (!state.music) return;

  if (state.audioContext && state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }

  updateMusic();
}

function playTone(kind) {
  if (!state.sound) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!state.audioContext) state.audioContext = new AudioContext();

    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const toneMap = {
      button: 420,
      draw: 520,
      discard: 330,
      finish: 720,
      win: 880,
      lose: 180,
    };

    oscillator.type = kind === "lose" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(toneMap[kind] || 440, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  } catch {
    // Audio is optional and browsers may block it until user interaction.
  }
}

function pulse(duration) {
  return duration;
}

function bindEvents() {
  els.drawPile.addEventListener("click", drawFromStock);
  els.discardPile.addEventListener("click", drawFromDiscard);
  els.knockButton.addEventListener("click", callKnock);
  els.ginButton.addEventListener("click", callGin);
  els.pauseButton.addEventListener("click", togglePause);
  els.restartButton.addEventListener("click", restartDuel);
  els.newDuelButton.addEventListener("click", restartDuel);

  els.modalYesButton.addEventListener("click", () => {
    pulse(18);
    playTone("button");
    newDuel();
  });

  els.modalNoButton.addEventListener("click", () => {
    pulse(10);
    playTone("button");
    closeResultModal();
  });

  els.audioSelect.addEventListener("change", (event) => {
    state.sound = event.target.value === "on";
    state.music = event.target.value === "on";
    updateMusic();
    playTone("button");
  });

  els.levelSelect.addEventListener("change", (event) => {
    state.level = event.target.value;
    updateMusic();
    pulse(12);
    playTone("button");
  });

  els.handSizeSelect.addEventListener("change", (event) => {
    state.handSize = Number(event.target.value);
    pulse(15);
    playTone("button");
    newDuel();
  });

  els.modeSelect.addEventListener("change", (event) => {
    state.mode = event.target.value;
    applyMode();
    pulse(12);
    playTone("button");
  });

  ["pointerdown", "mousedown", "click", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, unlockMusic, { capture: true, passive: true });
  });
}

function init() {
  bindEvents();
  applyMode();
  newDuel();
  updateMusic();
}

init();
