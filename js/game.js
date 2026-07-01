/**
 * Core game loop and state machine — mirrors src/game.py
 */

import {
  BASE_WIDTH,
  BASE_HEIGHT,
  COLLISION_RADIUS_SQ,
  ENEMY_DEATH_Y,
  GameState,
  LEVELS,
  MENU_LAYOUT,
  PLAYER_Y,
  SPRITE_SIZE,
  bulletOffsets,
  sc,
} from "./config.js";
import {
  getTopScore,
  loadPlayerName,
  qualifiesForLeaderboard,
  recordScore,
  savePlayerName,
} from "./storage.js";
import {
  loadBackground,
  loadPortrait,
  loadSprite,
  playSound,
  startMusic,
} from "./assets.js";
import { Renderer, pointInRect } from "./render.js";

function randomEnemyX() {
  return Math.floor(Math.random() * (BASE_WIDTH - SPRITE_SIZE));
}

function randomEnemyY() {
  return sc(50) + Math.floor(Math.random() * (sc(150) - sc(50)));
}

export class Game {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = input;
    this.renderer = new Renderer(this.ctx);

    this.state = GameState.MENU;
    this.stateTimer = 0;
    this.levelIndex = 0;
    this.killsThisLevel = 0;
    this.score = 0;
    this.playerName = loadPlayerName();
    this.highScore = getTopScore();
    this.isNewHighScore = false;
    this.cutsceneLineIndex = 0;

    this.player = { x: sc(370), y: PLAYER_Y, xChange: 0 };
    this.bullets = [];
    this.lastFireTime = -9999;
    this.enemies = [];

    this.sprites = {};
    this.backgrounds = {};
    this.portraits = {};
    this.menuBg = null;

    this.menu = {
      playerName: this.playerName,
      nameInputActive: true,
      showStoryPanel: false,
      playButton: [...MENU_LAYOUT.PLAY_BUTTON],
      storyButton: [...MENU_LAYOUT.STORY_BUTTON],
      nameBox: [...MENU_LAYOUT.NAME_BOX],
    };

    this.fireHeld = false;
    this.lastFrame = 0;
    this.accumulator = 0;
    this.frameMs = 1000 / 60;
  }

  async init() {
    this.menuBg = await loadBackground("bg1.png");
    this.backgrounds.menu = this.menuBg;
    for (let i = 1; i <= 6; i++) {
      this.backgrounds[`bg${i}`] = await loadBackground(`bg${i}.png`);
    }
    for (let i = 1; i <= 6; i++) {
      this.sprites[`player${i}`] = await loadSprite(`player${i}.png`);
    }
    this.sprites.enemy = await loadSprite("enemy.png");
    this.sprites.enemy2 = await loadSprite("enemy2.png");
    this.sprites.enemy3 = await loadSprite("enemy3.png");
    this.sprites.bullet = await loadSprite("bullets.png", sc(32));
    this.portraits.hero = await loadPortrait("arthur_tesla.png");
    this.portraits.villain = await loadPortrait("sparsh_akuma.png");
  }

  currentLevel() {
    return LEVELS[this.levelIndex];
  }

  currentBg() {
    const bg = this.currentLevel().background.replace(".png", "");
    return this.backgrounds[bg];
  }

  applyLevel(index) {
    this.levelIndex = index;
    const level = this.currentLevel();
    this.killsThisLevel = 0;
    this.bullets = [];
    this.lastFireTime = -9999;
    this.player.x = sc(370);
    this.player.y = PLAYER_Y;
    this.player.xChange = 0;

    this.enemies = [];
    const spriteKey = level.enemySprite.replace(".png", "").replace("enemy", "enemy");
    const enemySprite = this.sprites[level.enemySprite.replace(".png", "")] || this.sprites.enemy;

    for (let i = 0; i < level.numEnemies; i++) {
      this.enemies.push({
        x: randomEnemyX(),
        y: randomEnemyY(),
        xChange: level.enemySpeed,
        yDrop: level.enemyDrop,
        active: true,
        sprite: enemySprite,
      });
    }
  }

  resolvedName() {
    const name = (this.menu.playerName.trim() || "Pilot").slice(0, 12);
    savePlayerName(name);
    return name;
  }

  startFromMenu() {
    this.playerName = this.resolvedName();
    this.score = 0;
    this.isNewHighScore = false;
    this.applyLevel(0);
    this.state = GameState.PLAYING;
    this.stateTimer = performance.now();
    startMusic();
  }

  resetRun() {
    this.score = 0;
    this.isNewHighScore = false;
    this.applyLevel(0);
    this.state = GameState.PLAYING;
    this.stateTimer = performance.now();
  }

  goToMenu() {
    this.menu.nameInputActive = true;
    this.menu.showStoryPanel = false;
    this.menu.playerName = this.playerName;
    this.highScore = getTopScore();
    this.isNewHighScore = false;
    this.state = GameState.MENU;
  }

  maybeRecordScore() {
    if (this.score <= 0) return;
    const oldTop = this.highScore;
    if (qualifiesForLeaderboard(this.score)) {
      recordScore(this.playerName, this.score);
      this.highScore = getTopScore();
      this.isNewHighScore = this.score > oldTop;
    }
  }

  tryFire(now) {
    const level = this.currentLevel();
    if (now - this.lastFireTime < level.fireCooldown) return;
    if (this.bullets.length >= level.maxBullets) return;
    playSound("laser.wav");
    this.lastFireTime = now;
    for (const offset of bulletOffsets(level.bulletCount)) {
      this.bullets.push({ x: this.player.x + offset - sc(16), y: this.player.y });
    }
  }

  updatePlaying(now) {
    const level = this.currentLevel();

    if (this.input.wantsLeft()) this.player.xChange = -level.playerSpeed;
    else if (this.input.wantsRight()) this.player.xChange = level.playerSpeed;
    else this.player.xChange = 0;

    if (this.input.wantsFire() && !this.fireHeld) {
      this.tryFire(now);
      this.fireHeld = true;
    }
    if (!this.input.wantsFire()) this.fireHeld = false;

    this.player.x += this.player.xChange;
    this.player.x = Math.max(0, Math.min(this.player.x, BASE_WIDTH - SPRITE_SIZE));

    const maxX = BASE_WIDTH - SPRITE_SIZE;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (enemy.y > ENEMY_DEATH_Y) {
        this.maybeRecordScore();
        this.state = GameState.GAME_OVER;
        return;
      }
      enemy.x += enemy.xChange;
      if (enemy.x <= 0) {
        enemy.xChange = level.enemySpeed;
        enemy.y += enemy.yDrop;
      } else if (enemy.x >= maxX) {
        enemy.xChange = -level.enemySpeed;
        enemy.y += enemy.yDrop;
      }
    }

    const speed = level.bulletSpeed;
    this.bullets = this.bullets
      .map((b) => ({ x: b.x, y: b.y - speed }))
      .filter((b) => b.y > 0);

    if (this.handleBulletHits()) {
      this.state = GameState.LEVEL_COMPLETE;
      this.stateTimer = now;
    }
  }

  handleBulletHits() {
    const level = this.currentLevel();
    const toRemove = new Set();
    let levelCleared = false;

    this.bullets.forEach((bullet, bi) => {
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - bullet.x;
        const dy = enemy.y - bullet.y;
        if (dx * dx + dy * dy < COLLISION_RADIUS_SQ) {
          playSound("explosion.wav");
          toRemove.add(bi);
          this.score += level.scoreMultiplier;
          this.killsThisLevel++;
          if (this.killsThisLevel >= level.killsNeeded) {
            levelCleared = true;
            return;
          }
          enemy.x = randomEnemyX();
          enemy.y = randomEnemyY();
          break;
        }
      }
    });

    if (toRemove.size) {
      this.bullets = this.bullets.filter((_, i) => !toRemove.has(i));
    }
    return levelCleared;
  }

  handleMenuInput(pointer) {
    const m = this.menu;
    if (m.showStoryPanel) return;

    if (pointInRect(pointer, m.nameBox)) m.nameInputActive = true;
    else if (pointInRect(pointer, m.playButton)) this.startFromMenu();
    else if (pointInRect(pointer, m.storyButton)) m.showStoryPanel = true;
    else m.nameInputActive = false;
  }

  handleMenuKey(key) {
    const m = this.menu;
    if (key === "Escape" && m.showStoryPanel) {
      m.showStoryPanel = false;
      return;
    }
    if (m.showStoryPanel) return;

    if ((key === "Enter" || key === " ") && !m.nameInputActive) {
      this.startFromMenu();
      return;
    }
    if (!m.nameInputActive) return;

    if (key === "Backspace") m.playerName = m.playerName.slice(0, -1);
    else if (key === "Delete") m.playerName = "";
    else if (key.length === 1 && key !== " " && m.playerName.length < 12) {
      if (key.charCodeAt(0) >= 32) m.playerName += key;
    } else if (key === "Enter") {
      m.nameInputActive = false;
      this.startFromMenu();
    }
  }

  advanceCutscene() {
    if (this.cutsceneLineIndex < 5) {
      this.cutsceneLineIndex++;
    } else {
      this.applyLevel(5);
      this.state = GameState.LEVEL_SPLASH;
      this.stateTimer = performance.now();
      this.cutsceneLineIndex = 0;
    }
  }

  tickTransition(now) {
    if (this.state === GameState.LEVEL_COMPLETE) {
      if (now - this.stateTimer > 2500) {
        if (this.levelIndex >= LEVELS.length - 1) {
          this.maybeRecordScore();
          this.state = GameState.VICTORY;
        } else if (this.levelIndex === 4) {
          this.cutsceneLineIndex = 0;
          this.state = GameState.STORY_CUTSCENE;
        } else {
          this.applyLevel(this.levelIndex + 1);
          this.state = GameState.LEVEL_SPLASH;
          this.stateTimer = now;
        }
      }
    } else if (this.state === GameState.LEVEL_SPLASH) {
      if (now - this.stateTimer > 2000) {
        this.state = GameState.PLAYING;
      }
    }
  }

  drawPlaying() {
    const r = this.renderer;
    const level = this.currentLevel();
    r.clear();
    r.blit(this.currentBg(), 0, 0);

    const playerSprite = this.sprites[level.playerSprite.replace(".png", "")];
    for (const enemy of this.enemies) {
      if (enemy.active) r.blit(enemy.sprite, enemy.x, enemy.y);
    }
    for (const b of this.bullets) r.blit(this.sprites.bullet, b.x, b.y);
    r.blit(playerSprite, this.player.x, this.player.y);

    r.drawHud({
      score: this.score,
      levelIndex: this.levelIndex,
      kills: this.killsThisLevel,
      killsNeeded: level.killsNeeded,
      shipName: level.shipName,
      playerName: this.playerName,
      highScore: this.highScore,
    });
  }

  draw(now) {
    const r = this.renderer;
    const pointer = this.input.pointer;

    if (this.state === GameState.MENU) {
      r.clear();
      const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
      r.drawMenu(this.menu, this.menuBg, pointer, isMobile);
      return;
    }

    if (this.state === GameState.STORY_CUTSCENE) {
      r.clear();
      r.drawCutscene(this.cutsceneLineIndex, this.portraits, this.backgrounds.bg6);
      return;
    }

    r.clear();
    r.blit(this.currentBg(), 0, 0);

    const level = this.currentLevel();
    const playerSprite = this.sprites[level.playerSprite.replace(".png", "")];

    if (this.state === GameState.PLAYING) {
      for (const enemy of this.enemies) {
        if (enemy.active) r.blit(enemy.sprite, enemy.x, enemy.y);
      }
      for (const b of this.bullets) r.blit(this.sprites.bullet, b.x, b.y);
      r.blit(playerSprite, this.player.x, this.player.y);
      r.drawHud({
        score: this.score,
        levelIndex: this.levelIndex,
        kills: this.killsThisLevel,
        killsNeeded: level.killsNeeded,
        shipName: level.shipName,
        playerName: this.playerName,
        highScore: this.highScore,
      });
      return;
    }

    if (this.state === GameState.LEVEL_COMPLETE) {
      r.drawLevelComplete(this.levelIndex, this.score, this.highScore);
      r.blit(playerSprite, this.player.x, this.player.y);
      return;
    }

    if (this.state === GameState.LEVEL_SPLASH) {
      r.drawLevelSplash(level, this.levelIndex);
      r.blit(playerSprite, this.player.x, this.player.y);
      return;
    }

    if (this.state === GameState.GAME_OVER) {
      r.drawGameOver({
        playerName: this.playerName,
        score: this.score,
        highScore: this.highScore,
        isNewHighScore: this.isNewHighScore,
      });
      r.blit(playerSprite, this.player.x, this.player.y);
      return;
    }

    if (this.state === GameState.VICTORY) {
      r.drawVictory({
        score: this.score,
        highScore: this.highScore,
        isNewHighScore: this.isNewHighScore,
      });
      r.blit(playerSprite, this.player.x, this.player.y);
    }
  }

  update(now) {
    if (this.state === GameState.PLAYING) {
      this.updatePlaying(now);
    } else if (this.state === GameState.STORY_CUTSCENE) {
      if (this.input.wantsFire() && !this.fireHeld) {
        this.advanceCutscene();
        this.fireHeld = true;
      }
      if (!this.input.wantsFire()) this.fireHeld = false;
      this.tickTransition(now);
    } else {
      this.tickTransition(now);
    }
  }

  handleKeyDown(key) {
    if (key === "r" || key === "R") {
      if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
        this.resetRun();
      }
      return;
    }
    if (key === "m" || key === "M") {
      if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
        this.goToMenu();
      }
      return;
    }

    if (this.state === GameState.MENU) {
      this.handleMenuKey(key);
      return;
    }

    if (this.state === GameState.STORY_CUTSCENE) {
      if (key === "Enter" || key === " ") this.advanceCutscene();
    }
  }

  handleClick(pointer) {
    if (this.state === GameState.MENU) {
      if (this.menu.showStoryPanel && pointInRect(pointer, this.menu.storyButton)) {
        this.menu.showStoryPanel = false;
        return;
      }
      this.handleMenuInput(pointer);
    }
  }
}
