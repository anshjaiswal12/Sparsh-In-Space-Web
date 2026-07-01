/** Native HTML pilot name field — overlaid on the menu name box */

import { MAX_NAME_LENGTH, MENU_LAYOUT } from "./config.js";

export class PilotNameInput {
  constructor(element, canvas, getScale) {
    this.el = element;
    this.canvas = canvas;
    this.getScale = getScale;
    this._visible = false;
    this._callbacks = {};

    this.el.maxLength = MAX_NAME_LENGTH;
    this.el.setAttribute("autocomplete", "nickname");
    this.el.setAttribute("enterkeyhint", "done");
    this.el.setAttribute("spellcheck", "false");

    this.el.addEventListener("input", () => {
      this._callbacks.onChange?.(this.el.value.slice(0, MAX_NAME_LENGTH));
    });

    this.el.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        this._callbacks.onConfirm?.();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.el.blur();
      }
    });

    this.el.addEventListener("focus", () => {
      this._callbacks.onFocus?.();
    });

    this.el.addEventListener("blur", () => {
      this._callbacks.onBlur?.();
    });
  }

  bind(callbacks) {
    this._callbacks = callbacks;
  }

  position() {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.getScale();
    const box = MENU_LAYOUT.NAME_BOX;

    this.el.style.left = `${rect.left + box[0] * scale}px`;
    this.el.style.top = `${rect.top + box[1] * scale}px`;
    this.el.style.width = `${box[2] * scale}px`;
    this.el.style.height = `${box[3] * scale}px`;
    this.el.style.fontSize = `${Math.max(18, Math.round(36 * scale))}px`;
    this.el.style.padding = `0 ${Math.max(8, Math.round(14 * scale))}px`;
  }

  show(value = "") {
    this._visible = true;
    this.el.value = value.slice(0, MAX_NAME_LENGTH);
    this.el.classList.add("visible");
    this.position();
  }

  hide() {
    this._visible = false;
    this.el.classList.remove("visible");
    this.el.blur();
  }

  focus() {
    if (!this._visible) return;
    this.position();
    this.el.focus({ preventScroll: true });
  }

  isVisible() {
    return this._visible;
  }

  isFocused() {
    return document.activeElement === this.el;
  }

  getValue() {
    const trimmed = this.el.value.trim();
    return (trimmed || "Pilot").slice(0, MAX_NAME_LENGTH);
  }
}
