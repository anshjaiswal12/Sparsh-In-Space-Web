/** Entry point — canvas sizing, boot, game loop */

import { preloadGameAssets } from "./assets.js";
import { BASE_HEIGHT, BASE_WIDTH, CUTSCENE_LINES, GameState } from "./config.js";
import { Game } from "./game.js";
import { InputManager } from "./input.js";
import { PilotNameInput } from "./pilot-name-input.js";
import { pointInRect } from "./render.js";
import { isMobileDevice } from "./ui.js";

const MOBILE_BAR_HEIGHT = 80;

const app = document.getElementById("app");
const canvas = document.getElementById("game");
const loader = document.getElementById("loader");
const controlBar = document.getElementById("control-bar");
const playControls = document.getElementById("play-controls");
const dialogueControls = document.getElementById("dialogue-controls");
const endControls = document.getElementById("end-controls");
const storyMenuControls = document.getElementById("story-menu-controls");
const dialogueProgress = document.getElementById("dialogue-progress");
const pilotNameEl = document.getElementById("pilot-name-input");
const ctx = canvas.getContext("2d");

let scale = 1;
let mobileUiEnabled = false;
let lastPilotMenuKey = "";
let lastControlBarHeight = -1;
let lastCanvasTouchTime = 0;

const pilotNameInput = new PilotNameInput(pilotNameEl, canvas, () => scale);

function controlBarHeightForState(state, showStoryPanel = false) {
  if (!state) return 0;
  const endGame = state === GameState.GAME_OVER || state === GameState.VICTORY;
  if (endGame) return MOBILE_BAR_HEIGHT;
  const storyOpen = state === GameState.MENU && showStoryPanel;
  if (storyOpen && mobileUiEnabled) return MOBILE_BAR_HEIGHT;
  if (!mobileUiEnabled) return 0;
  return state === GameState.PLAYING || state === GameState.STORY_CUTSCENE
    ? MOBILE_BAR_HEIGHT
    : 0;
}

function syncControlBar(state, showStoryPanel = false) {
  const playing = state === GameState.PLAYING;
  const dialogue = state === GameState.STORY_CUTSCENE;
  const endGame = state === GameState.GAME_OVER || state === GameState.VICTORY;
  const storyOpen = state === GameState.MENU && showStoryPanel;
  const showBar = (mobileUiEnabled && (playing || dialogue || storyOpen)) || endGame;

  controlBar.classList.toggle("visible", showBar);
  controlBar.setAttribute("aria-hidden", showBar ? "false" : "true");
  playControls.classList.toggle("hidden", !playing);
  dialogueControls.classList.toggle("hidden", !dialogue);
  endControls.classList.toggle("hidden", !endGame);
  storyMenuControls.classList.toggle("hidden", !storyOpen);
  app.classList.toggle("end-game", endGame);
  app.classList.toggle("story-open", storyOpen);
}

export function updateMobileUiForState(state, cutsceneLineIndex = 0, showStoryPanel = false) {
  syncControlBar(state, showStoryPanel);

  const barH = controlBarHeightForState(state, showStoryPanel);
  if (barH !== lastControlBarHeight) {
    lastControlBarHeight = barH;
    resize(state, showStoryPanel);
  }

  if (state === GameState.STORY_CUTSCENE) {
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
    pilotNameInput.position();
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

function resize(gameState = null, showStoryPanel = null) {
  const mobile = isMobileDevice();
  mobileUiEnabled = mobile;
  app.classList.toggle("mobile", mobile);

  const state = gameState ?? game?.state ?? null;
  const storyOpen = showStoryPanel ?? game?.menu?.showStoryPanel ?? false;
  const barH = controlBarHeightForState(state, storyOpen);

  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const fullVh = vv?.height ?? window.innerHeight;
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

  const matchCanvasWidth = mobile
    || state === GameState.GAME_OVER
    || state === GameState.VICTORY
    || (state === GameState.MENU && storyOpen);
  if (matchCanvasWidth) {
    controlBar.style.width = `${w}px`;
  } else {
    controlBar.style.width = "";
  }

  if (pilotNameInput.isVisible()) {
    pilotNameInput.position();
  }
}

function layoutRefresh() {
  if (!game) {
    resize();
    return;
  }
  resize(game.state, game.menu.showStoryPanel);
}

const input = new InputManager();
let game;

function pointerFromEvent(e) {
  const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  input.setPointerFromEvent(clientX, clientY, canvas, scale);
  return input.pointer;
}

function handleCanvasPointer(ptr) {
  if (
    game?.state === GameState.MENU
    && !game.menu.showStoryPanel
    && pointInRect(ptr, game.menu.nameBox)
  ) {
    pilotNameInput.focus();
    game.menu.nameInputActive = true;
    return;
  }
  game?.handleClick(ptr);
}

canvas.addEventListener("click", (e) => {
  if (performance.now() - lastCanvasTouchTime < 500) return;
  handleCanvasPointer(pointerFromEvent(e));
});

canvas.addEventListener("touchstart", (e) => {
  if (game?.state !== GameState.MENU) return;
  e.preventDefault();
  lastCanvasTouchTime = performance.now();
  handleCanvasPointer(pointerFromEvent(e));
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (pilotNameInput.isFocused()) return;
  game?.handleKeyDown(e.key);
});

window.addEventListener("resize", layoutRefresh);
window.addEventListener("orientationchange", () => {
  requestAnimationFrame(layoutRefresh);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", layoutRefresh);
  window.visualViewport.addEventListener("scroll", () => {
    if (pilotNameInput.isVisible()) pilotNameInput.position();
  });
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
  updateMobileUiForState(game.state, game.cutsceneLineIndex, game.menu.showStoryPanel);
  updatePilotNameInput();
  requestAnimationFrame(loop);
}

async function boot() {
  layoutRefresh();
  try {
    await preloadGameAssets();
    game = new Game(canvas, input);
    game.setPilotNameInput(pilotNameInput);
    await game.init();

    input.setEndGameHandlers({
      onRetry: () => {
        if (game.state === GameState.GAME_OVER || game.state === GameState.VICTORY) {
          game.resetRun();
        }
      },
      onMainMenu: () => {
        if (game.state === GameState.GAME_OVER || game.state === GameState.VICTORY) {
          game.goToMenu();
        }
      },
    });

    input.setStoryMenuHandlers({
      onStoryClose: () => {
        if (game.state === GameState.MENU && game.menu.showStoryPanel) {
          game.closeStoryPanel();
        }
      },
    });

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
