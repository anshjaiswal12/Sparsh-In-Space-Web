/** localStorage persistence for pilot name and leaderboard */

import {
  DEFAULT_PLAYER_NAME,
  MAX_LEADERBOARD_ENTRIES,
  MAX_NAME_LENGTH,
} from "./config.js";

const PLAYER_KEY = "sparsh_player_name";
const LEADERBOARD_KEY = "sparsh_leaderboard";

function validateEntries(raw) {
  if (!Array.isArray(raw)) return [];
  const valid = [];
  for (const item of raw) {
    if (item && typeof item.name === "string" && typeof item.score === "number") {
      valid.push({
        name: item.name.slice(0, MAX_NAME_LENGTH),
        score: Math.floor(item.score),
      });
    }
  }
  return valid
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEADERBOARD_ENTRIES);
}

export function loadPlayerName() {
  try {
    const name = localStorage.getItem(PLAYER_KEY);
    return name ? name.slice(0, MAX_NAME_LENGTH) : "";
  } catch {
    return "";
  }
}

export function savePlayerName(name) {
  try {
    const cleaned = (name.trim() || DEFAULT_PLAYER_NAME).slice(0, MAX_NAME_LENGTH);
    localStorage.setItem(PLAYER_KEY, cleaned);
    return cleaned;
  } catch {
    return name.slice(0, MAX_NAME_LENGTH);
  }
}

export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return validateEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(validateEntries(entries)));
  } catch {
    /* storage full or disabled */
  }
}

export function getTopScore() {
  const board = loadLeaderboard();
  return board.length ? board[0].score : 0;
}

export function qualifiesForLeaderboard(score) {
  if (score <= 0) return false;
  const board = loadLeaderboard();
  if (board.length < MAX_LEADERBOARD_ENTRIES) return true;
  return score > board[board.length - 1].score;
}

export function recordScore(name, score) {
  if (!qualifiesForLeaderboard(score)) return false;
  const board = loadLeaderboard();
  board.push({ name: name.slice(0, MAX_NAME_LENGTH), score });
  saveLeaderboard(board);
  return true;
}
