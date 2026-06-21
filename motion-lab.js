const root = document.querySelector(".app-shell");
const playButton = document.getElementById("playButton");
const previewButton = document.getElementById("previewButton");
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
    state.lastTime = performance.now();
    state.raf = requestAnimationFrame(tick);
  } else if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }
};

function tick(time) {
  const delta = time - state.lastTime;
  state.lastTime = time;
  setFrame(core.nextPlaybackFrame(state.frame, delta, { maxFrame: state.maxFrame, frameMs: 18 }));
  if (state.playing) state.raf = requestAnimationFrame(tick);
}

const seekFromEvent = (event) => {
  const rect = trackArea.getBoundingClientRect();
  const pct = (event.clientX - rect.left) / rect.width;
  setFrame(pct * state.maxFrame);
};

playButton.addEventListener("click", () => setPlaying(!state.playing));
previewButton.addEventListener("click", () => setPlaying(!state.playing));

trackArea.addEventListener("pointerdown", (event) => {
  seekFromEvent(event);
  trackArea.setPointerCapture(event.pointerId);
});

trackArea.addEventListener("pointermove", (event) => {
  if (event.buttons !== 1) return;
  seekFromEvent(event);
});

snapButton.addEventListener("click", () => {
  state.snap = !state.snap;
  snapButton.classList.toggle("is-on", state.snap);
  snapButton.textContent = state.snap ? "Snap: ON" : "Snap: OFF";
  setFrame(state.frame);
});

zoomButton.addEventListener("click", () => {
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
  row.addEventListener("click", () => {
    layerRows.forEach((item) => item.classList.remove("is-selected"));
    row.classList.add("is-selected");
  });
});

presetCards.forEach((card) => {
  card.addEventListener("click", () => {
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
