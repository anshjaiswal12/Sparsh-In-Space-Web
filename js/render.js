/** Canvas drawing helpers */

import {
  BASE_HEIGHT,
  BASE_WIDTH,
  CUTSCENE_LINES,
  LEVELS,
  MAX_LEADERBOARD_ENTRIES,
  MAX_NAME_LENGTH,
  MENU_LAYOUT,
  MENU_STORY_LINES,
  PORTRAIT_SIZE,
  VICTORY_EMAIL,
  sc,
} from "./config.js";
import { loadLeaderboard } from "./storage.js";

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  clear() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }

  blit(source, x, y) {
    if (source) this.ctx.drawImage(source, x, y);
  }

  overlay(alpha = 0.63) {
    this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    this.ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }

  panel(x, y, w, h, alpha = 0.75) {
    this.ctx.fillStyle = `rgba(10,15,40,${alpha})`;
    this.ctx.strokeStyle = "rgb(135,206,250)";
    this.ctx.lineWidth = 2;
    this._roundRect(x, y, w, h, 8);
    this.ctx.fill();
    this.ctx.stroke();
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  centeredText(lines, startY, options = {}) {
    const {
      font = "60px sans-serif",
      color = "#fff",
      lineGap = 50,
      maxWidth = BASE_WIDTH - sc(80),
    } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = "center";
    let y = startY;
    for (const line of lines) {
      for (const wrapped of wrapTextLines(this.ctx, line, maxWidth, font)) {
        this.ctx.fillText(wrapped, BASE_WIDTH / 2, y);
        y += lineGap;
      }
    }
    this.ctx.textAlign = "left";
  }

  centeredWrapped(text, startY, options = {}) {
    const {
      font = "32px sans-serif",
      color = "#fff",
      lineGap = 28,
      maxWidth = BASE_WIDTH - sc(80),
    } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = "center";
    let y = startY;
    for (const line of wrapTextLines(this.ctx, text, maxWidth, font)) {
      this.ctx.fillText(line, BASE_WIDTH / 2, y);
      y += lineGap;
    }
    this.ctx.textAlign = "left";
    return y - startY;
  }

  wrappedText(text, x, y, options = {}) {
    const {
      font = "32px sans-serif",
      color = "#fff",
      maxWidth = BASE_WIDTH - sc(80),
      lineGap = 26,
    } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    let dy = 0;
    for (const line of wrapTextLines(this.ctx, text, maxWidth, font)) {
      this.ctx.fillText(line, x, y + dy);
      dy += lineGap;
    }
    return dy;
  }

  fitText(str, x, y, options = {}) {
    const { font = "32px sans-serif", color = "#fff", maxWidth = BASE_WIDTH } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    let display = str;
    if (this.ctx.measureText(display).width > maxWidth) {
      while (display.length > 0 && this.ctx.measureText(display + "…").width > maxWidth) {
        display = display.slice(0, -1);
      }
      display += "…";
    }
    this.ctx.fillText(display, x, y);
  }

  text(str, x, y, options = {}) {
    const { font = "32px sans-serif", color = "#fff" } = options;
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(str, x, y);
  }

  button(rect, label, hovered, active = false) {
    const [x, y, w, h] = rect;
    let color = hovered ? "rgb(70,140,220)" : "rgb(40,90,170)";
    if (active) color = "rgb(90,160,240)";
    this.ctx.fillStyle = color;
    this._roundRect(x, y, w, h, 10);
    this.ctx.fill();
    this.ctx.strokeStyle = "rgb(255,215,0)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "36px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(label, x + w / 2, y + h / 2);
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "alphabetic";
  }

  drawHud({ score, levelIndex, kills, killsNeeded, shipName, playerName, highScore }) {
    this.fitText(`score:${score}`, sc(10), sc(35), { font: "42px sans-serif", maxWidth: sc(400) });
    this.fitText(`Level: ${levelIndex + 1}/${LEVELS.length}`, sc(10), sc(70), { maxWidth: sc(420) });
    this.fitText(`Kills: ${kills}/${killsNeeded}`, sc(10), sc(95), { maxWidth: sc(420) });
    this.fitText(`Ship: ${shipName}`, sc(10), sc(120), { color: "rgb(135,206,250)", maxWidth: sc(420) });
    this.fitText(`Pilot: ${playerName}`, sc(10), sc(145), { color: "rgb(200,220,255)", maxWidth: sc(420) });
    this.fitText(`High: ${highScore}`, sc(650), sc(35), { color: "rgb(255,215,0)", maxWidth: sc(600) });
  }

  drawLeaderboard() {
    const panelRect = MENU_LAYOUT.SCORES_PANEL;
    this.panel(...panelRect);
    this.text("TOP SCORES", panelRect[0] + 20, panelRect[1] + 38, {
      font: "36px sans-serif",
      color: "rgb(255,215,0)",
    });
    const board = loadLeaderboard();
    if (!board.length) {
      this.text("No scores yet!", panelRect[0] + 20, panelRect[1] + 80, { color: "#ccc" });
      return;
    }
    board.slice(0, MAX_LEADERBOARD_ENTRIES).forEach((entry, i) => {
      const line = `${i + 1}. ${entry.name.slice(0, 10).padEnd(10)} ${entry.score}`;
      this.fitText(line, panelRect[0] + 20, panelRect[1] + 72 + i * 28, {
        color: i === 0 ? "rgb(255,215,0)" : "rgb(220,220,220)",
        maxWidth: panelRect[2] - 40,
      });
    });
  }

  drawMenuFooter(isMobile) {
    const { FOOTER_Y, FOOTER_H } = MENU_LAYOUT;
    this.ctx.fillStyle = "rgba(5,8,22,0.82)";
    this.ctx.fillRect(0, FOOTER_Y, BASE_WIDTH, FOOTER_H);
    const controls = isMobile
      ? "Enter: Start  |  Touch controls on mobile"
      : "Enter: Start (when name done)  |  F11: Fullscreen";
    this.centeredWrapped(controls, FOOTER_Y + 14, {
      font: "32px sans-serif",
      color: "#ccc",
      lineGap: sc(24),
      maxWidth: BASE_WIDTH - sc(48),
    });
    this.centeredWrapped("An Ansh Jaiswal production", FOOTER_Y + 46, {
      font: "28px sans-serif",
      color: "rgb(160,175,200)",
      lineGap: sc(24),
      maxWidth: BASE_WIDTH - sc(48),
    });
  }

  drawMenu(menu, bg, pointer, isMobile = false) {
    this.blit(bg, 0, 0);
    this.overlay(0.78);

    // Darken header so background title art doesn't clash
    this.ctx.fillStyle = "rgba(0,0,0,0.55)";
    this.ctx.fillRect(0, 0, BASE_WIDTH, sc(155));

    this.centeredText(["SPARSH IN SPACE"], sc(35), {
      font: "bold 72px sans-serif",
    });
    this.centeredWrapped(
      "Arthur Tesla vs. Sparsh Akuma — the Chunking Express ends here.",
      sc(92),
      { font: "32px sans-serif", color: "rgb(180,210,255)", lineGap: sc(28) },
    );

    const namePanel = MENU_LAYOUT.NAME_PANEL;
    this.panel(...namePanel);
    this.text("PILOT NAME", namePanel[0] + 20, namePanel[1] + 35, {
      font: "36px sans-serif",
      color: "rgb(135,206,250)",
    });

    const box = MENU_LAYOUT.NAME_BOX;
    this.ctx.fillStyle = "rgb(20,25,50)";
    this._roundRect(...box, sc(6));
    this.ctx.fill();
    this.ctx.strokeStyle = menu.nameInputActive ? "#fff" : "#a0a0a0";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    let displayName = menu.playerName;
    if (menu.nameInputActive) {
      if (!displayName && Math.floor(performance.now() / 500) % 2 === 0) displayName = "|";
      else if (displayName && Math.floor(performance.now() / 500) % 2 === 0) displayName += "|";
    } else if (!displayName) {
      displayName = "Enter name...";
    }
    this.text(displayName.slice(0, MAX_NAME_LENGTH), box[0] + sc(12), box[1] + sc(32), {
      font: "42px sans-serif",
      color: menu.nameInputActive ? "#fff" : "#b4b4b4",
    });

    this.wrappedText(
      "Click box to type · Backspace / Delete to edit",
      namePanel[0] + 20,
      namePanel[1] + namePanel[3] - sc(52),
      {
        font: "32px sans-serif",
        color: "#aaa",
        maxWidth: namePanel[2] - 40,
        lineGap: sc(22),
      },
    );

    if (!menu.showStoryPanel) this.drawLeaderboard();

    const playRect = menu.playButton;
    const storyRect = menu.storyButton;
    this.button(playRect, "PLAY", pointInRect(pointer, playRect));
    this.button(storyRect, "STORY", pointInRect(pointer, storyRect), menu.showStoryPanel);

    if (menu.showStoryPanel) this.drawStoryPanel();

    this.drawMenuFooter(isMobile);
  }

  drawStoryPanel() {
    this.ctx.fillStyle = "rgba(0,0,0,0.82)";
    this.ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    const panel = [sc(80), sc(60), sc(640), sc(480)];
    this.panel(...panel, 0.9);
    this.text("STORY", panel[0] + sc(20), panel[1] + sc(40), {
      font: "36px sans-serif",
      color: "rgb(255,215,0)",
    });
    const innerW = panel[2] - sc(40);
    let y = panel[1] + sc(80);
    MENU_STORY_LINES.forEach((line, i) => {
      if (!line) {
        y += sc(12);
        return;
      }
      y += this.wrappedText(line, panel[0] + sc(20), y, {
        font: i === 0 ? "36px sans-serif" : "32px sans-serif",
        color: i === 0 ? "rgb(255,215,0)" : "rgb(210,220,240)",
        maxWidth: innerW,
        lineGap: sc(26),
      });
    });
    this.centeredWrapped("Press Esc or tap STORY to close", panel[1] + panel[3] - sc(36), {
      font: "32px sans-serif",
      color: "#aaa",
      maxWidth: innerW,
      lineGap: sc(24),
    });
  }

  drawCutscene(lineIndex, portraits, bg) {
    this.blit(bg, 0, 0);
    this.overlay(0.63);
    this.centeredText(["FINAL CONFRONTATION"], sc(50), {
      font: "60px sans-serif",
      color: "rgb(255,215,0)",
    });

    const villainRect = [sc(40), sc(90), PORTRAIT_SIZE + sc(20), PORTRAIT_SIZE + sc(20)];
    const heroRect = [sc(440), sc(90), PORTRAIT_SIZE + sc(20), PORTRAIT_SIZE + sc(20)];
    this.panel(...villainRect);
    this.panel(...heroRect);

    const line = CUTSCENE_LINES[lineIndex];
    const dim = (img) => {
      const c = document.createElement("canvas");
      c.width = PORTRAIT_SIZE;
      c.height = PORTRAIT_SIZE;
      const cx = c.getContext("2d");
      cx.drawImage(img, 0, 0);
      cx.fillStyle = "rgba(110,110,110,0.55)";
      cx.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
      return c;
    };

    const villainImg = line.portrait === "villain" ? portraits.villain : dim(portraits.villain);
    const heroImg = line.portrait === "hero" ? portraits.hero : dim(portraits.hero);
    this.blit(villainImg, villainRect[0] + sc(10), villainRect[1] + sc(10));
    this.blit(heroImg, heroRect[0] + sc(10), heroRect[1] + sc(10));

    this.text("Sparsh Akuma", villainRect[0] + sc(10), villainRect[1] + villainRect[3] - sc(15), {
      color: "rgb(255,120,120)",
    });
    this.text("Arthur Tesla", heroRect[0] + sc(10), heroRect[1] + heroRect[3] - sc(15), {
      color: "rgb(135,206,250)",
    });

    const dialogRect = [sc(40), sc(430), sc(720), sc(130)];
    this.panel(...dialogRect);
    const speakerColor = line.portrait === "villain" ? "rgb(255,120,120)" : "rgb(135,206,250)";
    this.text(`${line.speaker}:`, dialogRect[0] + sc(15), dialogRect[1] + sc(35), {
      font: "36px sans-serif",
      color: speakerColor,
    });

    wrapText(this.ctx, line.text, dialogRect[0] + sc(15), dialogRect[1] + sc(65), dialogRect[2] - sc(30), 28);

    const prompt =
      lineIndex >= CUTSCENE_LINES.length - 1
        ? "Press Enter / Space / Fire to begin Level 6"
        : "Press Enter / Space / Fire to continue";
    this.centeredWrapped(prompt, sc(565), {
      font: "32px sans-serif",
      color: "rgb(255,215,0)",
      lineGap: sc(26),
      maxWidth: BASE_WIDTH - sc(80),
    });
  }

  drawLevelComplete(levelIndex, score, highScore) {
    this.overlay();
    this.centeredText([`LEVEL ${levelIndex + 1} COMPLETE!`], sc(230), { font: "80px sans-serif" });
    const lines = [`Score: ${score}`, `High Score: ${highScore}`];
    if (levelIndex < LEVELS.length - 1) {
      lines.push(`Next ship: ${LEVELS[levelIndex + 1].shipName}`);
    } else {
      lines.push("Final level cleared!");
    }
    this.centeredText(lines, sc(320), { font: "42px sans-serif", lineGap: 38 });
  }

  drawLevelSplash(level, levelIndex) {
    this.overlay();
    this.centeredText([`LEVEL ${levelIndex + 1}`], sc(240), { font: "80px sans-serif" });
    this.centeredText(
      [
        `Ship: ${level.shipName}`,
        `Guns: ${level.bulletCount}  |  Speed: ${level.playerSpeed}`,
        `Enemies: ${level.numEnemies}  |  Kills needed: ${level.killsNeeded}`,
      ],
      sc(340),
      { font: "42px sans-serif", lineGap: 36 },
    );
  }

  drawGameOver({ playerName, score, highScore, isNewHighScore }) {
    this.overlay();
    this.centeredText(["Game Over"], sc(220), { font: "80px sans-serif" });
    this.centeredText(
      [`Pilot: ${playerName}`, `Score: ${score}`, `Top Score: ${highScore}`],
      sc(310),
      { font: "42px sans-serif", lineGap: 38 },
    );
    if (isNewHighScore) {
      this.centeredText(["NEW HIGH SCORE!"], sc(410), {
        font: "42px sans-serif",
        color: "rgb(255,215,0)",
      });
    }
    this.centeredText(["R: Play Again   |   M: Main Menu"], sc(490), {
      font: "32px sans-serif",
      lineGap: 40,
    });
  }

  drawVictory({ score, highScore, isNewHighScore }) {
    this.overlay();
    this.centeredText(["YOU WIN!"], sc(190), {
      font: "80px sans-serif",
      color: "rgb(255,215,0)",
    });
    this.centeredText(
      ["All 6 levels cleared!", `Final Score: ${score}`, `High Score: ${highScore}`],
      sc(280),
      { font: "42px sans-serif", lineGap: 38 },
    );
    if (isNewHighScore) {
      this.centeredText(["NEW HIGH SCORE!"], sc(400), {
        font: "42px sans-serif",
        color: "rgb(255,215,0)",
      });
    }
    this.centeredText(
      ["Contact the creator:", VICTORY_EMAIL],
      sc(450),
      { font: "42px sans-serif", color: "rgb(135,206,250)", lineGap: 35 },
    );
    this.centeredText(["Press R to Restart   |   M: Main Menu"], sc(550), {
      font: "32px sans-serif",
      lineGap: 40,
    });
  }
}

function pointInRect(p, rect) {
  return p.x >= rect[0] && p.x <= rect[0] + rect[2] && p.y >= rect[1] && p.y <= rect[1] + rect[3];
}

function wrapTextLines(ctx, text, maxWidth, font = "32px sans-serif") {
  ctx.font = font;
  const words = text.split(" ");
  if (!words.length) return [];
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = (line + " " + word).trim();
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, font = "32px sans-serif") {
  ctx.fillStyle = "#fff";
  ctx.font = font;
  let dy = 0;
  for (const wrapped of wrapTextLines(ctx, text, maxWidth, font)) {
    ctx.fillText(wrapped, x, y + dy);
    dy += lineHeight;
  }
}

export { pointInRect };
