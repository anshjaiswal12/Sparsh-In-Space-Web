/** Entry point — canvas sizing, boot, game loop */

import { preloadGameAssets } from "./assets.js";
import { BASE_HEIGHT, BASE_WIDTH, GameState } from "./config.js";
import { Game } from "./game.js";
import { InputManager } from "./input.js";

const canvas = document.getElementById("game");
const loader = document.getElementById("loader");
const touchControls = document.getElementById("touch-controls");
const ctx = canvas.getContext("2d");

let scale = 1;
let displayWidth = 0;
let displayHeight = 0;
let touchControlsEnabled = false;
let touchControlsActive = false;

function isMobileDevice() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
}

function syncTouchControlsVisible() {
  touchControls.classList.toggle("visible", touchControlsEnabled && touchControlsActive);
}

export function updateTouchControlsForState(state) {
  touchControlsActive = state === GameState.PLAYING || state === GameState.STORY_CUTSCENE;
  syncTouchControlsVisible();
}

function positionTouchOverlay() {
  const rect = canvas.getBoundingClientRect();
  touchControls.style.left = `${rect.left}px`;
  touchControls.style.top = `${rect.top}px`;
  touchControls.style.width = `${rect.width}px`;
  touchControls.style.height = `${rect.height}px`;
}

function resize() {
  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const vh = vv?.height ?? window.innerHeight;
  const aspect = BASE_WIDTH / BASE_HEIGHT;
  let w, h;
  if (vw / vh > aspect) {
    h = vh;
    w = h * aspect;
  } else {
    w = vw;
    h = w / aspect;
  }
  displayWidth = w;
  displayHeight = h;
  scale = w / BASE_WIDTH;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = BASE_WIDTH * dpr;
  canvas.height = BASE_HEIGHT * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  touchControlsEnabled = isMobileDevice();
  requestAnimationFrame(positionTouchOverlay);
  syncTouchControlsVisible();
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
  window.visualViewport.addEventListener("scroll", positionTouchOverlay);
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
  updateTouchControlsForState(game.state);
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
