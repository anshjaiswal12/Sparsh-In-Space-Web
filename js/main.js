/** Entry point — canvas sizing, boot, game loop */

import { preloadGameAssets } from "./assets.js";
import { BASE_HEIGHT, BASE_WIDTH, CUTSCENE_LINES, GameState } from "./config.js";
import { Game } from "./game.js";
import { InputManager } from "./input.js";

const MOBILE_BAR_HEIGHT = 80;

const app = document.getElementById("app");
const canvas = document.getElementById("game");
const loader = document.getElementById("loader");
const controlBar = document.getElementById("control-bar");
const playControls = document.getElementById("play-controls");
const dialogueControls = document.getElementById("dialogue-controls");
const dialogueProgress = document.getElementById("dialogue-progress");
const ctx = canvas.getContext("2d");

let scale = 1;
let mobileUiEnabled = false;

function isMobileDevice() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
}

function syncMobileUiVisible(playing, dialogue) {
  controlBar.classList.toggle("visible", mobileUiEnabled && (playing || dialogue));
  playControls.classList.toggle("hidden", !playing);
  dialogueControls.classList.toggle("hidden", !dialogue);
}

export function updateMobileUiForState(state, cutsceneLineIndex = 0) {
  const playing = state === GameState.PLAYING;
  const dialogue = state === GameState.STORY_CUTSCENE;
  syncMobileUiVisible(playing, dialogue);

  if (dialogue) {
    const line = cutsceneLineIndex + 1;
    const total = CUTSCENE_LINES.length;
    const isLast = cutsceneLineIndex >= total - 1;
    dialogueProgress.textContent = `${line} / ${total}`;
    document.getElementById("btn-advance").textContent = isLast
      ? "Begin Level 6 ▶"
      : "Continue ▶";
  }
}

function resize() {
  const mobile = isMobileDevice();
  mobileUiEnabled = mobile;
  app.classList.toggle("mobile", mobile);

  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const fullVh = vv?.height ?? window.innerHeight;
  const barH = mobile ? MOBILE_BAR_HEIGHT : 0;
  const vh = Math.max(fullVh - barH, 120);

  const aspect = BASE_WIDTH / BASE_HEIGHT;
  let w, h;
  if (vw / vh > aspect) {
    h = vh;
    w = h * aspect;
  } else {
    w = vw;
    h = w / aspect;
  }

  scale = w / BASE_WIDTH;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = BASE_WIDTH * dpr;
  canvas.height = BASE_HEIGHT * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (mobile) {
    controlBar.style.width = `${w}px`;
  } else {
    controlBar.style.width = "";
  }
}

const input = new InputManager();
let game;

function pointerFromEvent(e) {
  const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  input.setPointerFromEvent(clientX, clientY, canvas, scale);
  return input.pointer;
}

canvas.addEventListener("click", (e) => {
  game.handleClick(pointerFromEvent(e));
});

canvas.addEventListener("touchstart", (e) => {
  if (game.state === GameState.MENU) {
    e.preventDefault();
    game.handleClick(pointerFromEvent(e));
  }
}, { passive: false });

window.addEventListener("keydown", (e) => {
  game?.handleKeyDown(e.key);
});

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => {
  requestAnimationFrame(resize);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resize);
}

function loop(timestamp) {
  if (!game.lastFrame) game.lastFrame = timestamp;
  const elapsed = timestamp - game.lastFrame;
  game.lastFrame = timestamp;
  game.accumulator += elapsed;

  while (game.accumulator >= game.frameMs) {
    game.update(performance.now());
    game.accumulator -= game.frameMs;
  }

  game.draw(performance.now());
  updateMobileUiForState(game.state, game.cutsceneLineIndex);
  requestAnimationFrame(loop);
}

async function boot() {
  resize();
  try {
    await preloadGameAssets();
    game = new Game(canvas, input);
    await game.init();
    loader.classList.add("hidden");
    requestAnimationFrame(loop);
  } catch (err) {
    loader.textContent = `Failed to load game: ${err.message}`;
    console.error(err);
  }
}

boot();
