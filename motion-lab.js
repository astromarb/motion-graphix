const root = document.querySelector(".app-shell");
const playButton = document.getElementById("playButton");
const previewButton = document.getElementById("previewButton");
const themeToggle = document.getElementById("themeToggle");
const trackArea = document.getElementById("trackArea");
const timelineGrid = document.getElementById("timelineGrid");
const playhead = document.getElementById("playhead");
const timecode = document.getElementById("timecode");
const snapButton = document.getElementById("snapButton");
const zoomButton = document.getElementById("zoomButton");
const opacitySlider = document.getElementById("opacitySlider");
const opacityValue = document.getElementById("opacityValue");
const stage = document.getElementById("stage");
const presetTitle = document.getElementById("presetTitle");
const layerRows = [...document.querySelectorAll(".layer-row")];
const presetCards = [...document.querySelectorAll(".preset-card")];
const core = window.MotionLabCore;

const supportsPerformanceNow = typeof performance !== "undefined" && typeof performance.now === "function";
const nowMs = () => (supportsPerformanceNow ? performance.now() : Date.now());
const requestFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => setTimeout(() => fn(nowMs()), 16);
const cancelFrame = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : clearTimeout;
const canUsePointer = typeof window.PointerEvent !== "undefined";
const THEME_KEY = "motionLab.theme";
const systemThemeLightMedia = window.matchMedia?.("(prefers-color-scheme: light)");

const getStoredTheme = () => {
  if (!window.localStorage) return null;
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
};

const setStoredTheme = (theme) => {
  if (!window.localStorage) return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    // localStorage can be unavailable in restricted or private contexts.
  }
};

const resolveInitialTheme = () => {
  const stored = getStoredTheme();
  if (stored === "light" || stored === "dark") return stored;
  return systemThemeLightMedia?.matches ? "light" : "dark";
};

const syncThemeToggle = (theme) => {
  if (!themeToggle) return;
  if (theme === "light") {
    themeToggle.textContent = "Dark";
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
  } else {
    themeToggle.textContent = "Light";
    themeToggle.setAttribute("aria-label", "Switch to light mode");
  }
};

const setTheme = (theme) => {
  if (!root) return;
  const nextTheme = theme === "light" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  syncThemeToggle(nextTheme);
  setStoredTheme(nextTheme);
};

const bindControl = (button, handler) => {
  if (!button) return;

  let lastTrigger = 0;
  const trigger = (event) => {
    const now = nowMs();
    if (now - lastTrigger < 75) return;
    lastTrigger = now;

    if (event && event.cancelable) event.preventDefault();
    handler(event);
  };

  button.addEventListener("click", trigger);
  button.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    trigger(event);
  });

  if (canUsePointer) {
    button.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") trigger(event);
    });
  } else if ("ontouchstart" in window) {
    button.addEventListener("touchend", (event) => {
      if (event.cancelable) event.preventDefault();
      trigger(event);
    }, { passive: false });
  }
};

const state = {
  playing: false,
  frame: 215,
  maxFrame: 480,
  snap: true,
  zoomIndex: 1,
  zooms: [
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1 },
    { label: "125%", value: 1.12 },
  ],
  raf: null,
  lastTime: 0,
};

const setFrame = (frame) => {
  state.frame = core.normalizeFrame(frame, { maxFrame: state.maxFrame, snap: state.snap });
  const pct = core.framePercent(state.frame, state.maxFrame);
  document.documentElement.style.setProperty("--playhead", `${pct}%`);
  playhead.querySelector("span").textContent = core.padFrame(state.frame);
  timecode.textContent = core.padFrame(state.frame);
};

const setPlaying = (playing) => {
  state.playing = playing;
  root.dataset.playing = String(playing);
  playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
  if (playing) {
    state.lastTime = nowMs();
    state.raf = requestFrame(tick);
  } else if (state.raf) {
    cancelFrame(state.raf);
    state.raf = null;
  }
};

function tick(time) {
  const delta = time - state.lastTime;
  state.lastTime = time;
  setFrame(core.nextPlaybackFrame(state.frame, delta, { maxFrame: state.maxFrame, frameMs: 18 }));
  if (state.playing) state.raf = requestFrame(tick);
}

const seekFromEvent = (event) => {
  const rect = trackArea.getBoundingClientRect();
  const x = event && "clientX" in event ? event.clientX : null;
  if (x === null || Number.isNaN(x)) return;
  const pct = (x - rect.left) / rect.width;
  setFrame(pct * state.maxFrame);
};

const setScrubbing = (active) => {
  trackArea.dataset.scrubbing = String(active);
};

const beginScrub = (event) => {
  seekFromEvent(event);
  setScrubbing(true);
  if (canUsePointer && typeof trackArea.setPointerCapture === "function") {
    trackArea.setPointerCapture(event.pointerId);
  }
};

const moveScrub = (event) => {
  if (trackArea.dataset.scrubbing !== "true") return;
  seekFromEvent(event);
};

const endScrub = (event) => {
  setScrubbing(false);
  if (canUsePointer && event && typeof trackArea.releasePointerCapture === "function") {
    trackArea.releasePointerCapture(event.pointerId);
  }
};

bindControl(playButton, () => setPlaying(!state.playing));
bindControl(previewButton, () => setPlaying(!state.playing));
bindControl(themeToggle, () => setTheme(root.dataset.theme === "light" ? "dark" : "light"));

if (canUsePointer && trackArea) {
  trackArea.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "touch" && event.pointerType !== "pen") return;
    beginScrub(event);
  });
  trackArea.addEventListener("pointermove", moveScrub);
  trackArea.addEventListener("pointerup", endScrub);
  trackArea.addEventListener("pointercancel", endScrub);
  trackArea.addEventListener("pointerleave", endScrub);
}

if (!canUsePointer && trackArea) {
  trackArea.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    event.preventDefault();
    beginScrub({ clientX: touch.clientX });
  });
  trackArea.addEventListener("touchmove", (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    event.preventDefault();
    if (!touch) return;
    moveScrub({ clientX: touch.clientX });
  });
  trackArea.addEventListener("touchend", endScrub);
  trackArea.addEventListener("touchcancel", endScrub);
}

bindControl(snapButton, () => {
  state.snap = !state.snap;
  snapButton.classList.toggle("is-on", state.snap);
  snapButton.textContent = state.snap ? "Snap: ON" : "Snap: OFF";
  setFrame(state.frame);
});

bindControl(zoomButton, () => {
  const next = core.nextZoom(state.zoomIndex, state.zooms);
  state.zoomIndex = next.index;
  const zoom = next.zoom;
  zoomButton.textContent = zoom.label;
  stage.style.setProperty("--stage-zoom", zoom.value);
});

opacitySlider.addEventListener("input", () => {
  const opacity = core.normalizeOpacity(opacitySlider.value);
  opacityValue.textContent = opacity.label;
  stage.style.opacity = opacity.cssValue;
});

layerRows.forEach((row) => {
  bindControl(row, () => {
    layerRows.forEach((item) => item.classList.remove("is-selected"));
    row.classList.add("is-selected");
  });
});

presetCards.forEach((card) => {
  bindControl(card, () => {
    presetCards.forEach((item) => item.classList.remove("is-selected"));
    card.classList.add("is-selected");
    presetTitle.textContent = card.dataset.preset;
  });
});

timelineGrid.addEventListener("wheel", (event) => {
  if (!event.shiftKey) return;
  event.preventDefault();
  setFrame(state.frame + event.deltaY / 8);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !["INPUT", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    setPlaying(!state.playing);
  }

  if (event.key === "ArrowLeft") setFrame(state.frame - (event.shiftKey ? 30 : 5));
  if (event.key === "ArrowRight") setFrame(state.frame + (event.shiftKey ? 30 : 5));
});

setFrame(state.frame);
setTheme(resolveInitialTheme());
