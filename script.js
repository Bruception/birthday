const defaults = {
  to: "Birthday Legend",
  from: "Someone who planned ahead",
  headline: "It's your birthday today!",
  subheadline: "Open this card for chaos, cake, and a properly silly gift reveal.",
  message: "I hid your gift behind a tiny click-through performance because handing it over normally felt too boring.",
  redeem: {
    title: "Your gift is ready",
    intro: "You made it through the chaos. Here is the gift.",
    steps: [
      "Use the gift.",
      "Enjoy the very dramatic delivery."
    ],
    code: "AMZN-CAKE-YAY-2026",
    phone: "",
    smsText: "Gift Pls",
    ctaLabel: "Text for the gift"
  },
  theme: {
    accent: "bubblegum"
  }
};

const accentThemes = {
  bubblegum: {
    accent: "#ea0d95",
    accentDeep: "#e353da",
    accentSoft: "rgba(227, 83, 218, 0.14)",
    accentAlt: "#37dfbc"
  },
  gold: {
    accent: "#d5e661",
    accentDeep: "#37dfbc",
    accentSoft: "rgba(213, 230, 97, 0.2)",
    accentAlt: "#4fb0f2"
  },
  mint: {
    accent: "#37dfbc",
    accentDeep: "#4fb0f2",
    accentSoft: "rgba(55, 223, 188, 0.18)",
    accentAlt: "#d5e661"
  },
  cherry: {
    accent: "#e353da",
    accentDeep: "#ea0d95",
    accentSoft: "rgba(234, 13, 149, 0.14)",
    accentAlt: "#4fb0f2"
  }
};

const stickerSources = [
  "assets/stickers/sticker-excited-happy.gif",
  "assets/stickers/sticker-frog-bike.gif",
  "assets/stickers/sticker-spongebob-dance.gif",
  "assets/stickers/sticker-birthday-dance-1.gif",
  "assets/stickers/sticker-birthday-dance-2.gif",
  "assets/stickers/sticker-banana-dance.gif",
  "assets/stickers/sticker-rainbow-frog.gif"
];

const lyricMoments = [
  { line: "It's your birthday today", hint: "Tap to kick this off." },
  { line: "Rock 'n' roll, let's celebrate", hint: "Okay, now it is officially happening." },
  { line: "You lose control and you cut the cake", hint: "Cut the cake.", requires: "cake", resolvedHint: "Cake handled." },
  { line: "The night is yours, destiny awaits", hint: "One more ridiculous task is coming." },
  { line: "Blow out your candles", hint: "Blow out the candles.", requires: "candles", resolvedHint: "Candles handled." },
  { line: "Share a toast with your closest mates", hint: "The gift is almost unlocked." },
  { line: "Open your gifts", hint: "Open your gift.", requires: "gift", resolvedHint: "Gift opened." }
];

const state = {
  mode: "custom",
  opened: false,
  audioStarted: false,
  lyricIndex: -1,
  cakeCut: false,
  candlesBlown: false,
  giftOpened: false,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  rainTimers: [],
  rainInterval: null,
  rainLevel: 0,
  stickerLayout: []
};

const nodes = {
  body: document.body,
  configHeader: document.getElementById("configHeader"),
  modePill: document.getElementById("modePill"),
  modeCopy: document.getElementById("modeCopy"),
  builderSection: document.getElementById("builderSection"),
  builderForm: document.getElementById("builderForm"),
  copyLinkButton: document.getElementById("copyLinkButton"),
  generatedLinkOutput: document.getElementById("generatedLinkOutput"),
  builderStatus: document.getElementById("builderStatus"),
  partyLayer: document.getElementById("partyLayer"),
  birthdayCard: document.getElementById("birthdayCard"),
  cardInside: document.getElementById("cardInside"),
  openCardButton: document.getElementById("openCardButton"),
  coverToName: document.getElementById("coverToName"),
  recipientName: document.getElementById("recipientName"),
  insideHeadline: document.getElementById("insideHeadline"),
  insideMessage: document.getElementById("insideMessage"),
  senderName: document.getElementById("senderName"),
  progressDots: document.getElementById("progressDots"),
  lyricLine: document.getElementById("lyricLine"),
  lyricHint: document.getElementById("lyricHint"),
  nextButton: document.getElementById("nextButton"),
  songPlayer: document.getElementById("songPlayer"),
  lootPanel: document.getElementById("lootPanel"),
  lootTitle: document.getElementById("lootTitle"),
  lootIntro: document.getElementById("lootIntro"),
  codeCard: document.getElementById("codeCard"),
  lootCode: document.getElementById("lootCode"),
  copyCodeButton: document.getElementById("copyCodeButton"),
  smsLink: document.getElementById("smsLink"),
  liveStatus: document.getElementById("liveStatus"),
  stickers: [...document.querySelectorAll(".sticker")]
};

let payload = cloneValue(defaults);
let progressDots = [];

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (isPlainObject(value)) {
    const next = {};
    Object.keys(value).forEach((key) => {
      next[key] = cloneValue(value[key]);
    });
    return next;
  }

  return value;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming.map(cloneValue) : base.map(cloneValue);
  }

  if (!isPlainObject(base)) {
    return incoming === undefined ? cloneValue(base) : incoming;
  }

  const merged = {};
  Object.keys(base).forEach((key) => {
    const baseValue = base[key];
    const nextValue = incoming && Object.prototype.hasOwnProperty.call(incoming, key) ? incoming[key] : undefined;

    if (isPlainObject(baseValue)) {
      merged[key] = deepMerge(baseValue, isPlainObject(nextValue) ? nextValue : undefined);
      return;
    }

    if (Array.isArray(baseValue)) {
      merged[key] = Array.isArray(nextValue) ? nextValue.map(cloneValue) : baseValue.map(cloneValue);
      return;
    }

    merged[key] = nextValue === undefined || nextValue === null ? cloneValue(baseValue) : nextValue;
  });

  return merged;
}

function cleanString(value, fallback, maxLength) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function cleanOptionalString(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : "";
}

function cleanSteps(value, fallback) {
  if (Array.isArray(value)) {
    const steps = value
      .map((item) => cleanOptionalString(item, 180))
      .filter(Boolean)
      .slice(0, 6);
    return steps.length ? steps : fallback.slice();
  }

  if (typeof value === "string") {
    const steps = value
      .split(/\n|\|/)
      .map((item) => cleanOptionalString(item, 180))
      .filter(Boolean)
      .slice(0, 6);
    return steps.length ? steps : fallback.slice();
  }

  return fallback.slice();
}

function normalizePayload(input) {
  const merged = deepMerge(defaults, isPlainObject(input) ? input : {});
  const accentName = cleanString(merged.theme && merged.theme.accent, defaults.theme.accent, 32).toLowerCase();
  const redeemIntro = cleanString(merged.redeem && merged.redeem.intro, defaults.redeem.intro, 220)
    .replace(/through the lyrics/gi, "through the chaos")
    .replace(/through the song/gi, "through the chaos");

  return {
    to: cleanString(merged.to, defaults.to, 80),
    from: cleanString(merged.from, defaults.from, 80),
    headline: cleanString(merged.headline, defaults.headline, 120),
    subheadline: cleanString(merged.subheadline, defaults.subheadline, 200),
    message: cleanString(merged.message, defaults.message, 320),
    redeem: {
      title: cleanString(merged.redeem && merged.redeem.title, defaults.redeem.title, 120),
      intro: redeemIntro,
      steps: cleanSteps(merged.redeem && merged.redeem.steps, defaults.redeem.steps),
      code: cleanOptionalString(merged.redeem && merged.redeem.code, 120),
      phone: cleanOptionalString(merged.redeem && merged.redeem.phone, 32),
      smsText: cleanOptionalString(merged.redeem && merged.redeem.smsText, 160),
      ctaLabel: cleanString(merged.redeem && merged.redeem.ctaLabel, defaults.redeem.ctaLabel, 48)
    },
    theme: {
      accent: Object.prototype.hasOwnProperty.call(accentThemes, accentName) ? accentName : defaults.theme.accent
    }
  };
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function loadPayload() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("data");

  if (!raw) {
    return {
      mode: "config",
      data: cloneValue(defaults)
    };
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(raw));
    return {
      mode: "custom",
      data: normalizePayload(parsed)
    };
  } catch (error) {
    return {
      mode: "invalid",
      data: cloneValue(defaults)
    };
  }
}

function announce(message) {
  nodes.liveStatus.textContent = message;
}

function shuffleValues(values) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function randomizeStickers() {
  const total = nodes.stickers.length;
  const angleStep = 360 / total;
  const baseAngle = Math.random() * 360;
  const shuffledSources = shuffleValues(stickerSources).slice(0, total);

  state.stickerLayout = Array.from({ length: total }, (_, index) => ({
    angle: baseAngle + index * angleStep + (Math.random() * 18 - 9),
    rotation: Math.round(-14 + Math.random() * 28),
    src: shuffledSources[index]
  }));

  applyStickerLayout();
}

function applyStickerLayout() {
  if (!state.stickerLayout.length) {
    return;
  }

  const cardWidth = nodes.birthdayCard.clientWidth;
  const cardHeight = nodes.birthdayCard.clientHeight;

  if (!cardWidth || !cardHeight) {
    return;
  }

  const stickerSize = window.innerWidth <= 720 ? 76 : 86;
  const centerX = cardWidth / 2;
  const centerY = cardHeight / 2;
  const radiusX = Math.max(cardWidth / 2 - stickerSize * 0.38, stickerSize);
  const radiusY = Math.max(cardHeight / 2 - stickerSize * 0.34, stickerSize);

  nodes.stickers.forEach((sticker, index) => {
    const layout = state.stickerLayout[index];
    const radians = layout.angle * (Math.PI / 180);
    const x = centerX + Math.cos(radians) * radiusX - stickerSize / 2;
    const y = centerY + Math.sin(radians) * radiusY - stickerSize / 2;

    if (sticker.getAttribute("src") !== layout.src) {
      sticker.setAttribute("src", layout.src);
    }

    sticker.style.removeProperty("--right");
    sticker.style.removeProperty("--bottom");
    sticker.style.setProperty("--left", `${Math.round(x)}px`);
    sticker.style.setProperty("--top", `${Math.round(y)}px`);
    sticker.style.setProperty("--rotation", `${layout.rotation}deg`);
  });
}

function buildProgressDots() {
  const fragment = document.createDocumentFragment();

  lyricMoments.forEach(() => {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    fragment.appendChild(dot);
  });

  nodes.progressDots.innerHTML = "";
  nodes.progressDots.appendChild(fragment);
  progressDots = [...nodes.progressDots.querySelectorAll(".progress-dot")];
}

function renderModeUi() {
  const showBuilder = state.mode !== "custom";
  nodes.body.classList.toggle("has-builder", showBuilder);
  nodes.builderSection.hidden = !showBuilder;
  nodes.configHeader.hidden = state.mode === "custom";

  if (state.mode === "custom") {
    return;
  }

  nodes.modePill.textContent = "Config mode";
  nodes.modeCopy.textContent = state.mode === "invalid"
    ? "That link data did not decode cleanly. The builder is live so you can make a fresh share link."
    : "No data param found. The builder is live, and the card preview updates while you edit.";
}

function applyTheme() {
  const theme = accentThemes[payload.theme.accent] || accentThemes[defaults.theme.accent];
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-deep", theme.accentDeep);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--accent-alt", theme.accentAlt);
}

function renderPayload() {
  applyTheme();
  document.title = `${payload.to}'s Birthday Card`;
  nodes.coverToName.textContent = payload.to;
  nodes.recipientName.textContent = payload.to;
  nodes.insideHeadline.textContent = payload.headline;
  nodes.insideMessage.textContent = payload.message;
  nodes.senderName.textContent = payload.from;
  nodes.lootTitle.textContent = payload.redeem.title;
  nodes.lootIntro.textContent = payload.redeem.intro;

  const hasCode = Boolean(payload.redeem.code);
  const hasPhone = !hasCode && Boolean(payload.redeem.phone);

  nodes.codeCard.hidden = !hasCode;
  nodes.smsLink.hidden = !hasPhone;
  nodes.lootCode.textContent = payload.redeem.code || "";

  if (hasPhone) {
    const smsTarget = new URL(`sms:${payload.redeem.phone}`);
    if (payload.redeem.smsText) {
      smsTarget.searchParams.set("body", payload.redeem.smsText);
    }
    nodes.smsLink.href = smsTarget.toString();
    nodes.smsLink.textContent = payload.redeem.ctaLabel;
  } else {
    nodes.smsLink.removeAttribute("href");
  }
}

function populateBuilderForm(nextPayload) {
  const form = nodes.builderForm;
  form.to.value = nextPayload.to;
  form.from.value = nextPayload.from;
  form.message.value = nextPayload.message;
  form.redeemCode.value = nextPayload.redeem.code;
  form.redeemPhone.value = nextPayload.redeem.phone;
  form.redeemSmsText.value = nextPayload.redeem.smsText;
  form.redeemCtaLabel.value = nextPayload.redeem.ctaLabel;
  form.accent.value = nextPayload.theme.accent;
}

function payloadFromBuilder() {
  const form = nodes.builderForm;
  return normalizePayload({
    to: form.to.value,
    from: form.from.value,
    message: form.message.value,
    redeem: {
      code: form.redeemCode.value,
      phone: form.redeemPhone.value,
      smsText: form.redeemSmsText.value,
      ctaLabel: form.redeemCtaLabel.value
    },
    theme: {
      accent: form.accent.value
    }
  });
}

function shareLinkForCurrentPayload() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("data", encodeBase64Url(payload));
  return url.toString();
}

function updateGeneratedLink() {
  if (state.mode === "custom") {
    return;
  }

  nodes.generatedLinkOutput.value = shareLinkForCurrentPayload();
}

function clearRain() {
  if (state.rainInterval) {
    window.clearInterval(state.rainInterval);
    state.rainInterval = null;
  }

  while (state.rainTimers.length) {
    window.clearTimeout(state.rainTimers.pop());
  }

  nodes.partyLayer.innerHTML = "";
}

function getRainLevel() {
  if (!state.opened) {
    return 0;
  }

  if (state.giftOpened || state.lyricIndex >= lyricMoments.length - 2) {
    return 4;
  }

  if (state.candlesBlown || state.lyricIndex >= 4) {
    return 3;
  }

  if (state.cakeCut || state.lyricIndex >= 2) {
    return 2;
  }

  return 1;
}

function spawnConfettiRain(level) {
  if (state.reducedMotion || !state.opened || level <= 0) {
    return;
  }

  const profile = {
    1: { amount: 4, minSize: 10, maxSize: 16, durationMin: 2600, durationMax: 3600, sway: 3.8 },
    2: { amount: 6, minSize: 10, maxSize: 18, durationMin: 2200, durationMax: 3200, sway: 5.4 },
    3: { amount: 9, minSize: 12, maxSize: 20, durationMin: 1800, durationMax: 2800, sway: 7.5 },
    4: { amount: 12, minSize: 12, maxSize: 22, durationMin: 1500, durationMax: 2400, sway: 9.8 }
  }[level];

  const colors = [
    "var(--confetti-one)",
    "var(--confetti-two)",
    "var(--confetti-three)",
    "var(--confetti-four)",
    "var(--accent)"
  ];

  for (let index = 0; index < profile.amount; index += 1) {
    const piece = document.createElement("span");
    const size = profile.minSize + Math.random() * (profile.maxSize - profile.minSize);
    piece.className = "rain-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--size", `${size}px`);
    piece.style.setProperty("--drift-x", `${(Math.random() * profile.sway * 2 - profile.sway).toFixed(2)}rem`);
    piece.style.setProperty("--spin", `${Math.random() * 360}deg`);
    piece.style.setProperty("--duration", `${profile.durationMin + Math.random() * (profile.durationMax - profile.durationMin)}ms`);
    piece.style.setProperty("--delay", `${Math.random() * 160}ms`);
      piece.style.setProperty("--opacity", `${0.18 + Math.random() * 0.14}`);
    piece.style.setProperty("--color", colors[Math.floor(Math.random() * colors.length)]);
    piece.style.setProperty("--rounding", Math.random() > 0.5 ? "999px" : "4px");
    nodes.partyLayer.appendChild(piece);

    const timer = window.setTimeout(() => {
      piece.remove();
    }, profile.durationMax + 500);

    state.rainTimers.push(timer);
  }
}

function burstParty(level) {
  const burstMap = {
    soft: 1,
    medium: 2,
    big: 3
  };
  spawnConfettiRain(burstMap[level] || 1);
}

function updateConfetti(force) {
  const nextLevel = getRainLevel();
  nodes.partyLayer.dataset.level = String(nextLevel);
  nodes.birthdayCard.dataset.partyLevel = String(nextLevel);

  if (state.reducedMotion) {
    return;
  }

  const intervals = {
    0: 0,
    1: 700,
    2: 470,
    3: 320,
    4: 180
  };

  if (!force && nextLevel === state.rainLevel) {
    return;
  }

  if (state.rainInterval) {
    window.clearInterval(state.rainInterval);
    state.rainInterval = null;
  }

  state.rainLevel = nextLevel;

  if (nextLevel <= 0) {
    return;
  }

  spawnConfettiRain(nextLevel);
  state.rainInterval = window.setInterval(() => {
    spawnConfettiRain(state.rainLevel);
  }, intervals[nextLevel]);
}

function isWaitingForCheckpoint() {
  const moment = lyricMoments[state.lyricIndex];
  if (!moment || !moment.requires) {
    return false;
  }

  if (moment.requires === "cake") {
    return !state.cakeCut;
  }

  if (moment.requires === "candles") {
    return !state.candlesBlown;
  }

  if (moment.requires === "gift") {
    return !state.giftOpened;
  }

  return false;
}

function updateCardClasses() {
  nodes.birthdayCard.classList.toggle("is-open", state.opened);
  nodes.birthdayCard.classList.toggle("show-party", state.lyricIndex >= 1);
  nodes.birthdayCard.classList.toggle("is-cake-cut", state.cakeCut);
  nodes.birthdayCard.classList.toggle("is-candles-out", state.candlesBlown);
  nodes.birthdayCard.classList.toggle("is-gift-open", state.giftOpened);
  nodes.birthdayCard.classList.toggle("show-sticker-one", state.lyricIndex >= 1);
  nodes.birthdayCard.classList.toggle("show-sticker-two", state.lyricIndex >= 3);
  nodes.birthdayCard.classList.toggle("show-sticker-three", state.lyricIndex >= 5);

  const stageName = state.lyricIndex >= 5
    ? "gift"
    : state.lyricIndex >= 4
      ? "candles"
      : state.lyricIndex >= 2
        ? "cake"
        : "intro";

  nodes.birthdayCard.classList.toggle("stage-intro", stageName === "intro");
  nodes.birthdayCard.classList.toggle("stage-cake", stageName === "cake");
  nodes.birthdayCard.classList.toggle("stage-candles", stageName === "candles");
  nodes.birthdayCard.classList.toggle("stage-gift", stageName === "gift");
  updateConfetti();
}

function updateProgressDots() {
  progressDots.forEach((dot, index) => {
    dot.classList.toggle("is-done", state.opened && index < state.lyricIndex);
    dot.classList.toggle("is-current", state.opened && index === state.lyricIndex);
  });
}

function updateStoryUi() {
  updateCardClasses();
  applyStickerLayout();
  nodes.cardInside.hidden = !state.opened;
  nodes.openCardButton.classList.toggle("is-attention", !state.opened);

  if (!state.opened) {
    nodes.nextButton.disabled = true;
    nodes.nextButton.classList.remove("is-attention");
    nodes.lootPanel.hidden = true;
    updateProgressDots();
    return;
  }

  const moment = lyricMoments[state.lyricIndex];
  const waiting = isWaitingForCheckpoint();
  const everythingUnlocked = state.giftOpened;

  nodes.lyricLine.textContent = everythingUnlocked ? "Yay!" : moment.line;
  nodes.lyricHint.textContent = everythingUnlocked
    ? "You are done!"
    : waiting && moment.requires
      ? moment.hint
      : moment.resolvedHint || moment.hint;
  nodes.nextButton.disabled = everythingUnlocked;
  nodes.nextButton.textContent = everythingUnlocked
    ? "Everything unlocked"
    : waiting && moment.requires === "cake"
      ? "Cut the cake"
      : waiting && moment.requires === "candles"
        ? "Blow out the candles"
        : waiting && moment.requires === "gift"
          ? "Open your gift"
          : "Keep going";
  nodes.nextButton.classList.toggle("is-attention", !everythingUnlocked);
  nodes.lootPanel.hidden = !state.giftOpened;

  updateProgressDots();
}

function resetStoryProgress() {
  state.lyricIndex = 0;
  state.cakeCut = false;
  state.candlesBlown = false;
  state.giftOpened = false;
  state.rainLevel = 0;
  clearRain();
  nodes.copyCodeButton.textContent = "Copy code";
  updateStoryUi();
}

function openCard() {
  state.opened = true;
  resetStoryProgress();
  burstParty("soft");

  if (!state.audioStarted && nodes.songPlayer) {
    nodes.songPlayer.currentTime = 0;
    const playAttempt = nodes.songPlayer.play();
    state.audioStarted = true;
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        state.audioStarted = false;
      });
    }
  }

  announce(`Birthday card opened for ${payload.to}.`);
}

function nextLyric() {
  if (!state.opened || isWaitingForCheckpoint()) {
    return;
  }

  if (state.lyricIndex < lyricMoments.length - 1) {
    state.lyricIndex += 1;
    burstParty(state.lyricIndex >= lyricMoments.length - 2 ? "big" : "soft");
    updateStoryUi();
    announce(lyricMoments[state.lyricIndex].line);
  }
}

function handlePrimaryAction() {
  if (!state.opened) {
    return;
  }

  const moment = lyricMoments[state.lyricIndex];
  if (moment && moment.requires) {
    if (moment.requires === "cake" && !state.cakeCut) {
      cutCake();
      return;
    }

    if (moment.requires === "candles" && !state.candlesBlown) {
      blowCandles();
      return;
    }

    if (moment.requires === "gift" && !state.giftOpened) {
      openGift();
      return;
    }
  }

  nextLyric();
}

function cutCake() {
  if (state.cakeCut) {
    return;
  }

  state.cakeCut = true;
  burstParty("medium");
  updateStoryUi();
  announce("Cake cut.");
}

function blowCandles() {
  if (state.candlesBlown) {
    return;
  }

  state.candlesBlown = true;
  burstParty("medium");
  updateStoryUi();
  announce("Candles blown out.");
}

function openGift() {
  if (state.giftOpened) {
    return;
  }

  state.giftOpened = true;
  burstParty("big");
  updateStoryUi();
  announce("Gift opened.");
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "readonly");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

async function copyLink() {
  const link = nodes.generatedLinkOutput.value;

  try {
    await copyText(link);
    nodes.builderStatus.textContent = "Share link copied. Send that link, not the config-mode URL.";
    announce("Share link copied.");
  } catch (error) {
    nodes.builderStatus.textContent = "Copy failed. The generated link is still in the box above.";
  }
}

async function copyCode() {
  if (!payload.redeem.code) {
    return;
  }

  try {
    await copyText(payload.redeem.code);
    nodes.copyCodeButton.textContent = "Copied";
    announce("Gift code copied.");
  } catch (error) {
    nodes.copyCodeButton.textContent = "Copy failed";
  }
}

function handleBuilderInput() {
  payload = payloadFromBuilder();
  renderPayload();
  updateGeneratedLink();
}

function bindEvents() {
  nodes.openCardButton.addEventListener("click", openCard);
  nodes.nextButton.addEventListener("click", handlePrimaryAction);
  nodes.copyCodeButton.addEventListener("click", copyCode);
  window.addEventListener("resize", applyStickerLayout);

  if (state.mode !== "custom") {
    nodes.builderForm.addEventListener("input", handleBuilderInput);
    nodes.copyLinkButton.addEventListener("click", copyLink);
  }
}

function init() {
  buildProgressDots();
  randomizeStickers();

  const loaded = loadPayload();
  state.mode = loaded.mode;
  payload = normalizePayload(loaded.data);

  if (state.mode !== "custom") {
    populateBuilderForm(payload);
  }

  renderModeUi();
  renderPayload();
  updateGeneratedLink();
  updateStoryUi();
  bindEvents();
  updateConfetti(true);

  if (state.mode === "invalid") {
    announce("Invalid data param detected. Config mode loaded instead.");
  }
}

init();
