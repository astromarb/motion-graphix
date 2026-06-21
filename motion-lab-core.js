(function (global) {
  "use strict";

  const DEFAULT_MAX_FRAME = 480;
  const DEFAULT_SNAP_STEP = 5;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const padFrame = (frame) => String(Math.round(frame)).padStart(5, "0");

  const normalizeFrame = (frame, options = {}) => {
    const maxFrame = options.maxFrame ?? DEFAULT_MAX_FRAME;
    const snap = options.snap ?? true;
    const snapStep = options.snapStep ?? DEFAULT_SNAP_STEP;
    const clamped = clamp(Number(frame), 0, maxFrame);
    const snapped = snap ? Math.round(clamped / snapStep) * snapStep : clamped;

    return clamp(snapped, 0, maxFrame);
  };

  const framePercent = (frame, maxFrame = DEFAULT_MAX_FRAME) => {
    if (maxFrame <= 0) return 0;
    return (normalizeFrame(frame, { maxFrame, snap: false }) / maxFrame) * 100;
  };

  const nextPlaybackFrame = (frame, deltaMs, options = {}) => {
    const maxFrame = options.maxFrame ?? DEFAULT_MAX_FRAME;
    const frameMs = options.frameMs ?? 18;
    const cappedDelta = Math.min(Math.max(Number(deltaMs), 0), 80);
    const next = Number(frame) + cappedDelta / frameMs;

    return next >= maxFrame ? 0 : next;
  };

  const nextZoom = (index, zooms) => {
    if (!Array.isArray(zooms) || zooms.length === 0) {
      throw new Error("nextZoom requires at least one zoom option");
    }

    const nextIndex = (Number(index) + 1) % zooms.length;

    return {
      index: nextIndex,
      zoom: zooms[nextIndex],
    };
  };

  const normalizeOpacity = (value, min = 35) => {
    const numeric = Number(value);
    const percent = Number.isFinite(numeric) ? clamp(numeric, min, 100) : 100;

    return {
      label: `${Math.round(percent)}%`,
      cssValue: String(percent / 100),
    };
  };

  const api = {
    clamp,
    padFrame,
    normalizeFrame,
    framePercent,
    nextPlaybackFrame,
    nextZoom,
    normalizeOpacity,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.MotionLabCore = api;
})(typeof window !== "undefined" ? window : globalThis);
