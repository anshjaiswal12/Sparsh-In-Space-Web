/** Image and audio preloading */

import { BASE_HEIGHT, BASE_WIDTH, sc } from "./config.js";

const imageCache = new Map();
const audioCache = new Map();

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

export function spritePath(filename) {
  return `assets/sprites/${filename}`;
}

export function backgroundPath(filename) {
  return `assets/backgrounds/${filename}`;
}

export function portraitPath(filename) {
  return `assets/portraits/${filename}`;
}

export async function loadSprite(filename, size = 96) {
  const img = await loadImage(spritePath(filename));
  if (img.width === size && img.height === size) return img;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

export async function loadBackground(filename) {
  const img = await loadImage(backgroundPath(filename));
  const canvas = document.createElement("canvas");
  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, BASE_WIDTH, BASE_HEIGHT);
  return canvas;
}

export async function loadPortrait(filename, size = 300) {
  const img = await loadImage(portraitPath(filename));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

export async function preloadGameAssets() {
  const sprites = [
    "player1.png", "player2.png", "player3.png", "player4.png", "player5.png", "player6.png",
    "enemy.png", "enemy2.png", "enemy3.png", "bullets.png",
  ];
  const backgrounds = ["bg1.png", "bg2.png", "bg3.png", "bg4.png", "bg5.png", "bg6.png"];
  const portraits = ["arthur_tesla.png", "sparsh_akuma.png"];

  await Promise.all([
    ...sprites.map((f) => loadSprite(f)),
    loadSprite("bullets.png", sc(32)),
    ...backgrounds.map((f) => loadBackground(f)),
    ...portraits.map((f) => loadPortrait(f)),
    loadImage("assets/icons/icon.png"),
  ]);
}

export function getAudio(name) {
  if (!audioCache.has(name)) {
    const audio = new Audio(`assets/audio/${name}`);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }
  return audioCache.get(name);
}

export function playSound(name) {
  try {
    const audio = getAudio(name);
    const clone = audio.cloneNode();
    clone.volume = 0.6;
    clone.play().catch(() => {});
  } catch {
    /* audio blocked or missing */
  }
}

export function startMusic() {
  try {
    const bg = getAudio("bg.wav");
    bg.loop = true;
    bg.volume = 0.35;
    bg.play().catch(() => {});
  } catch {
    /* autoplay blocked until user gesture */
  }
}
