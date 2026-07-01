/** Keyboard and touch input */

import { guardRapidAction } from "./ui.js";

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.touchLeft = false;
    this.touchRight = false;
    this.touchFire = false;
    this.advanceRequested = false;
    this.pointer = { x: 0, y: 0 };

    window.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowLeft", "ArrowRight", " ", "Enter", "Escape", "Backspace", "Delete"].includes(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));

    this._bindPlayButtons();
    this._bindDialogueButton();
    this._bindEndButtons();
    this._bindStoryCloseButton();
    this.onRetry = null;
    this.onMainMenu = null;
    this.onStoryClose = null;
  }

  _bindPlayButtons() {
    const left = document.getElementById("btn-left");
    const right = document.getElementById("btn-right");
    const fire = document.getElementById("btn-fire");

    const hold = (el, setter) => {
      const on = () => setter(true);
      const off = () => setter(false);
      el.addEventListener("touchstart", (e) => { e.preventDefault(); on(); }, { passive: false });
      el.addEventListener("touchend", (e) => { e.preventDefault(); off(); }, { passive: false });
      el.addEventListener("touchcancel", off);
      el.addEventListener("mousedown", on);
      el.addEventListener("mouseup", off);
      el.addEventListener("mouseleave", off);
    };

    hold(left, (v) => { this.touchLeft = v; });
    hold(right, (v) => { this.touchRight = v; });
    hold(fire, (v) => { this.touchFire = v; });
  }

  _bindTapButton(el, handler) {
    const fire = guardRapidAction((e) => {
      e.preventDefault();
      handler?.();
    });
    el.addEventListener("click", fire);
    el.addEventListener("touchstart", fire, { passive: false });
  }

  _bindDialogueButton() {
    this._bindTapButton(document.getElementById("btn-advance"), () => {
      this.advanceRequested = true;
    });
  }

  _bindEndButtons() {
    this._bindTapButton(document.getElementById("btn-retry"), () => this.onRetry?.());
    this._bindTapButton(document.getElementById("btn-menu"), () => this.onMainMenu?.());
  }

  setEndGameHandlers({ onRetry, onMainMenu }) {
    this.onRetry = onRetry;
    this.onMainMenu = onMainMenu;
  }

  _bindStoryCloseButton() {
    this._bindTapButton(document.getElementById("btn-story-close"), () => this.onStoryClose?.());
  }

  setStoryMenuHandlers({ onStoryClose }) {
    this.onStoryClose = onStoryClose;
  }

  isDown(key) {
    return this.keys.has(key);
  }

  wantsLeft() {
    return this.keys.has("ArrowLeft") || this.touchLeft;
  }

  wantsRight() {
    return this.keys.has("ArrowRight") || this.touchRight;
  }

  wantsFire() {
    return this.keys.has(" ") || this.touchFire;
  }

  consumeAdvance() {
    const requested = this.advanceRequested;
    this.advanceRequested = false;
    return requested;
  }

  /** Map screen coords to internal game coords */
  setPointerFromEvent(clientX, clientY, canvas, scale) {
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = (clientX - rect.left) / scale;
    this.pointer.y = (clientY - rect.top) / scale;
  }
}
