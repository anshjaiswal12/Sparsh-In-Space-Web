# Sparsh in Space — Web Version

Browser-playable port of the Python/Pygame game. Plain HTML, CSS, and JavaScript — no frameworks, no backend.

## Quick start (local)

```bash
cd "Sparsh in space/web-version"
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

> **Note:** ES modules require a local server — opening `index.html` directly from the filesystem will not work.

## Deploy to Render (static site)

1. Create a **Static Site** on Render.
2. Set **Publish directory** to `Sparsh in space/web-version` (or copy `web-version/` to your repo root).
3. Ensure the `assets/` symlink resolves, or run before deploy:

```bash
# If symlinks are not preserved, copy assets for standalone deploy:
cp -r ../assets ./assets
```

4. No build command needed — Render serves `index.html` and static files as-is.

## Folder structure

```
web-version/
├── index.html          # Entry page
├── css/style.css       # Layout, mobile touch controls
├── js/
│   ├── main.js         # Boot, resize, game loop
│   ├── game.js         # State machine + gameplay
│   ├── config.js       # Levels, story, constants
│   ├── storage.js      # localStorage (player + leaderboard)
│   ├── assets.js       # Image/audio loading
│   ├── input.js        # Keyboard + touch
│   └── render.js       # Canvas UI drawing
├── assets/             # Symlink → ../assets (sprites, backgrounds, audio)
└── README.md
```

## Controls

| Input | Action |
|-------|--------|
| **Desktop** | |
| Arrow keys | Move |
| Space | Fire |
| Enter | Start / advance cutscene |
| R / M | Restart / menu (after game over or victory) |
| **Mobile** | |
| ◀ / ▶ buttons | Move |
| FIRE button | Shoot |
| Tap menu buttons | Play, Story, name entry |

## Returning players (localStorage)

Scores and pilot names persist per browser/device using `localStorage`:

| Key | Purpose |
|-----|---------|
| `sparsh_player_name` | Last pilot name (pre-filled on menu) |
| `sparsh_leaderboard` | Top 10 scores JSON array |

This is the standard approach for static sites — no server or IP tracking required.

## Rendering & mobile scaling

- Internal resolution: **1280×960** (matches the desktop game).
- Canvas scales to fit any viewport while preserving aspect ratio.
- `devicePixelRatio` (capped at 2) keeps sprites sharp on retina displays.
- Touch overlay buttons appear on coarse pointers and screens under 900px wide.

## Assets

Images and audio are bundled in `assets/` (sprites, backgrounds, audio, portraits) — the repo is self-contained for static hosting.
