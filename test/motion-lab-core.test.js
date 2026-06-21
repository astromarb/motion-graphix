const assert = require("node:assert/strict");
const test = require("node:test");
const core = require("../motion-lab-core");

test("padFrame formats rounded frame numbers as five digits", () => {
  assert.equal(core.padFrame(0), "00000");
  assert.equal(core.padFrame(214.6), "00215");
  assert.equal(core.padFrame(480), "00480");
});

test("normalizeFrame clamps and snaps frame values", () => {
  assert.equal(core.normalizeFrame(-10, { maxFrame: 480, snap: true }), 0);
  assert.equal(core.normalizeFrame(217, { maxFrame: 480, snap: true }), 215);
  assert.equal(core.normalizeFrame(218, { maxFrame: 480, snap: true }), 220);
  assert.equal(core.normalizeFrame(999, { maxFrame: 480, snap: true }), 480);
});

test("framePercent maps an unsnapped frame into timeline position", () => {
  assert.equal(core.framePercent(240, 480), 50);
  assert.equal(core.framePercent(600, 480), 100);
});

test("nextPlaybackFrame advances with capped delta and wraps at the end", () => {
  assert.equal(core.nextPlaybackFrame(215, 90, { maxFrame: 480, frameMs: 20 }), 219);
  assert.equal(core.nextPlaybackFrame(479, 80, { maxFrame: 480, frameMs: 20 }), 0);
});

test("nextZoom cycles through zoom options", () => {
  const zooms = [
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1 },
    { label: "125%", value: 1.12 },
  ];

  assert.deepEqual(core.nextZoom(1, zooms), { index: 2, zoom: zooms[2] });
  assert.deepEqual(core.nextZoom(2, zooms), { index: 0, zoom: zooms[0] });
});

test("normalizeOpacity clamps the visible label and CSS value", () => {
  assert.deepEqual(core.normalizeOpacity(70), { label: "70%", cssValue: "0.7" });
  assert.deepEqual(core.normalizeOpacity(10), { label: "35%", cssValue: "0.35" });
  assert.deepEqual(core.normalizeOpacity("nope"), { label: "100%", cssValue: "1" });
});
