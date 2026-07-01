/** Game constants — mirrors src/config/constants.py */
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 960;
export const GAME_FPS = 60;
export const SPRITE_SIZE = 96;
export const PLAYER_Y = 768;
export const ENEMY_DEATH_Y = 704;
export const COLLISION_RADIUS_SQ = 43 * 43;
export const PORTRAIT_SIZE = 300;
export const MAX_NAME_LENGTH = 12;
export const DEFAULT_PLAYER_NAME = "Pilot";
export const VICTORY_EMAIL = "contactarthj@gmail.com";
export const MAX_LEADERBOARD_ENTRIES = 10;
export const LEVEL_COMPLETE_MS = 2500;
export const LEVEL_SPLASH_MS = 2000;

export const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  LEVEL_COMPLETE: "level_complete",
  LEVEL_SPLASH: "level_splash",
  STORY_CUTSCENE: "story_cutscene",
  GAME_OVER: "game_over",
  VICTORY: "victory",
};

/** Scale coords designed for 800×600 up to 1280×960 */
export function sc(value) {
  return Math.floor(value * BASE_WIDTH / 800);
}

export const LEVELS = [
  {
    killsNeeded: 10, numEnemies: 6, enemySpeed: 2, enemyDrop: 28, scoreMultiplier: 1,
    enemySprite: "enemy.png", background: "bg1.png", playerSprite: "player1.png",
    shipName: "Scout Fighter", playerSpeed: 4, bulletSpeed: 8, bulletCount: 1,
    fireCooldown: 450, maxBullets: 1,
  },
  {
    killsNeeded: 15, numEnemies: 7, enemySpeed: 4, enemyDrop: 40, scoreMultiplier: 2,
    enemySprite: "enemy.png", background: "bg2.png", playerSprite: "player2.png",
    shipName: "Interceptor", playerSpeed: 5, bulletSpeed: 11, bulletCount: 1,
    fireCooldown: 300, maxBullets: 2,
  },
  {
    killsNeeded: 20, numEnemies: 8, enemySpeed: 5, enemyDrop: 50, scoreMultiplier: 3,
    enemySprite: "enemy2.png", background: "bg3.png", playerSprite: "player3.png",
    shipName: "Twin Cannon", playerSpeed: 6, bulletSpeed: 11, bulletCount: 2,
    fireCooldown: 260, maxBullets: 2,
  },
  {
    killsNeeded: 25, numEnemies: 9, enemySpeed: 6, enemyDrop: 55, scoreMultiplier: 4,
    enemySprite: "enemy2.png", background: "bg4.png", playerSprite: "player4.png",
    shipName: "Blaze Striker", playerSpeed: 6, bulletSpeed: 12, bulletCount: 2,
    fireCooldown: 220, maxBullets: 3,
  },
  {
    killsNeeded: 30, numEnemies: 10, enemySpeed: 6, enemyDrop: 60, scoreMultiplier: 5,
    enemySprite: "enemy3.png", background: "bg5.png", playerSprite: "player5.png",
    shipName: "Plasma Cruiser", playerSpeed: 7, bulletSpeed: 13, bulletCount: 3,
    fireCooldown: 180, maxBullets: 3,
  },
  {
    killsNeeded: 35, numEnemies: 12, enemySpeed: 7, enemyDrop: 65, scoreMultiplier: 6,
    enemySprite: "enemy3.png", background: "bg6.png", playerSprite: "player6.png",
    shipName: "Golden Ace", playerSpeed: 7, bulletSpeed: 14, bulletCount: 3,
    fireCooldown: 140, maxBullets: 4,
  },
];

export const CUTSCENE_LINES = [
  { speaker: "Sparsh Akuma", portrait: "villain", text: "Foolish mortal! My Chunking Express chip army will conquer every galaxy — no star escapes my command!" },
  { speaker: "Arthur Tesla", portrait: "hero", text: "Your chips crunch data, Sparsh — but they can't crunch destiny." },
  { speaker: "Sparsh Akuma", portrait: "villain", text: "Destiny? I'll rewrite the universe in binary! Bow before the Akuma Protocol!" },
  { speaker: "Arthur Tesla", portrait: "hero", text: "I won't destroy you. I'm going to humble you — show you what real greatness looks like." },
  { speaker: "Sparsh Akuma", portrait: "villain", text: "Humble ME?! I am the architect of—" },
  { speaker: "Arthur Tesla", portrait: "hero", text: "Pack your bags. We're going to 2001. Your own space odyssey awaits." },
];

export const MENU_STORY_LINES = [
  "THE CHUNKING EXPRESS WAR",
  "",
  "The villain Sparsh Akuma commands an ultra-powerful chip army",
  "called Chunking Express, bent on conquering the universe.",
  "",
  "Arthur Tesla — the Hero of the Grid — must push back wave after",
  "wave of Akuma's forces. Upgrade your ship, survive six levels,",
  "and face the final confrontation before Sparsh's grand design",
  "comes online. The fate of every galaxy is in your hands, Pilot.",
];

export function bulletOffsets(count) {
  const spreads = {
    1: [sc(32)],
    2: [sc(20), sc(44)],
    3: [sc(12), sc(32), sc(52)],
  };
  return spreads[count] || [sc(32)];
}

/** Main menu layout — 1280×960 pixel coords, panels must not overlap */
const NAME_PANEL_Y = 175;
const NAME_PANEL_H = 168;

export const MENU_LAYOUT = {
  MARGIN: 64,
  PANEL_W: 400,
  BTN_W: 240,
  BTN_H: 52,
  get BTN_X() { return (BASE_WIDTH - this.BTN_W) / 2; },
  NAME_PANEL: [64, NAME_PANEL_Y, 400, NAME_PANEL_H],
  NAME_LABEL_Y: NAME_PANEL_Y + 20,
  NAME_HINT_Y: NAME_PANEL_Y + 56,
  NAME_BOX: [84, NAME_PANEL_Y + 88, 360, 52],
  SCORES_PANEL: [BASE_WIDTH - 64 - 400, 175, 400, 360],
  PLAY_BUTTON: null,
  STORY_BUTTON: null,
  FOOTER_Y: 884,
  FOOTER_H: 72,
};
MENU_LAYOUT.PLAY_BUTTON = [MENU_LAYOUT.BTN_X, 580, MENU_LAYOUT.BTN_W, MENU_LAYOUT.BTN_H];
MENU_LAYOUT.STORY_BUTTON = [MENU_LAYOUT.BTN_X, 655, MENU_LAYOUT.BTN_W, MENU_LAYOUT.BTN_H];
