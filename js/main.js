/** Entry point — canvas sizing, boot, game loop */

import { preloadGameAssets } from "./assets.js";
import { BASE_HEIGHT, BASE_WIDTH, CUTSCENE_LINES, GameState } from "./config.js";
import { Game } from "./game.js";
import { InputManager } from "./input.js";
import { PilotNameInput } from "./pilot-name-input.js";
import { pointInRect } from "./render.js";

const MOBILE_BAR_HEIGHT = 80;

const app = document.getElementById("app");
const canvas = document.getElementById("game");
const loader = document.getElementById("loader");
const controlBar = document.getElementById("control-bar");
const playControls = document.getElementById("play-controls");
const dialogueControls = document.getElementById("dialogue-controls");
const dialogueProgress = document.getElementById("dialogue-progress");
const pilotNameEl = document.getElementById("pilot-name-input");
const ctx = canvas.getContext("2d");

let scale = 1;
let mobileUiEnabled = false;
let lastPilotMenuKey = "";

const pilotNameInput = new PilotNameInput(pilotNameEl, canvas, () => scale);

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

function updatePilotNameInput() {
  if (!game) return;

  const menuKey = `${game.state}:${game.menu.showStoryPanel}`;
  const showInput = game.state === GameState.MENU && !game.menu.showStoryPanel;

  if (showInput) {
    pilotNameInput.show(game.menu.playerName);
    if (menuKey !== lastPilotMenuKey) {
      pilotNameInput.focus();
      game.menu.nameInputActive = true;
    }
  } else {
    pilotNameInput.hide();
    if (game.state === GameState.MENU) {
      game.menu.nameInputActive = false;
    }
  }

  lastPilotMenuKey = menuKey;
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

  if (pilotNameInput.isVisible()) {
    pilotNameInput.position();
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
  const ptr = pointerFromEvent(e);
  if (
    game?.state === GameState.MENU
    && !game.menu.showStoryPanel
    && pointInRect(ptr, game.menu.nameBox)
  ) {
    pilotNameInput.focus();
    game.menu.nameInputActive = true;
    return;
  }
  game.handleClick(ptr);
});

canvas.addEventListener("touchstart", (e) => {
  if (game.state === GameState.MENU) {
    e.preventDefault();
    const ptr = pointerFromEvent(e);
    if (!game.menu.showStoryPanel && pointInRect(ptr, game.menu.nameBox)) {
      pilotNameInput.focus();
      game.menu.nameInputActive = true;
      return;
    }
    game.handleClick(ptr);
  }
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (pilotNameInput.isFocused()) return;
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
  updatePilotNameInput();
  requestAnimationFrame(loop);
}

async function boot() {
  resize();
  try {
    await preloadGameAssets();
    game = new Game(canvas, input);
    game.setPilotNameInput(pilotNameInput);
    await game.init();

    pilotNameInput.bind({
      onChange: (value) => {
        game.menu.playerName = value;
      },
      onFocus: () => {
        game.menu.nameInputActive = true;
      },
      onBlur: () => {
        game.menu.nameInputActive = false;
        game.menu.playerName = pilotNameEl.value.slice(0, 12);
      },
      onConfirm: () => {
        if (game.state === GameState.MENU && !game.menu.showStoryPanel) {
          game.startFromMenu();
        }
      },
    });

    loader.classList.add("hidden");
    requestAnimationFrame(loop);
  } catch (err) {
    loader.textContent = `Failed to load game: ${err.message}`;
    console.error(err);
  }
}

boot();
