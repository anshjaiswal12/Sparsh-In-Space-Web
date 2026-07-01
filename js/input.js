/** Keyboard and touch input */

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.touchLeft = false;
    this.touchRight = false;
    this.touchFire = false;
    this.pointer = { x: 0, y: 0 };

    window.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", " ", "Enter", "Escape", "Backspace", "Delete"].includes(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));

    this._bindTouchButtons();
  }

  _bindTouchButtons() {
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

  /** Map screen coords to internal game coords */
  setPointerFromEvent(clientX, clientY, canvas, scale) {
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = (clientX - rect.left) / scale;
    this.pointer.y = (clientY - rect.top) / scale;
  }
}
