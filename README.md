# DArk: Echo Sector

DArk: Echo Sector is a tactical top-down combat game built from scratch using the HTML Canvas API and vanilla JavaScript. It features a hand-crafted game architecture that manages physics, AI state machines, and dynamic rendering without the use of external game engines or frameworks


## Live Demo

https://hibanitt.github.io/Delta-Task-2/

---

## How to Play

- **Move:** `W` (up), `A` (left), `S` (down), `D` (right)
- **Aim:** Move Mouse Cursor
- **Shoot:** Left Mouse Click
- **Pause / Resume:** `P` key (or click the HUD button)
- **Restart:** `R` key on Game Over / Win (or click the HUD button)

---

## Key Features

1.  **Pure HTML5 Canvas Engine:** Built without external game frameworks (like Phaser, Unity, or Pixi.js) to leverage low-level browser rendering loops.
2.  **Custom Collision Engine (SAT):** Implements the **Separating Axis Theorem (SAT)** for robust circle-to-box collision resolution, ensuring the player slides smoothly around room corners and doors without clipping.
3.  **FSM-Driven Enemy AI:** Features a Finite State Machine (`patrol` ➔ `alert` ➔ `chase` ➔ `attack` ➔ `death`) supporting unique enemy variants:
    - **Standard Bot (Green):** Basic patrol and shoot behavior.
    - **Roamer (Dark Blue):** Actively breaks room boundaries to pursue you.
    - **Phase Bot (Light Blue):** Blinks in and out of visibility on a cooldown.
    - **Teleporter Bot (Light Purple):** Warps to other empty rooms to flank you.
    - **Explosive Bot (Red):** Detonates upon death, dealing high splash damage.
    - **Tank Bot (Pink):** Slower, heavy unit boasting 10 health points.
4.  **Field of View Visibility Cone:** Simulates radar navigation by masking the screen and rendering the game map only within a $120^\circ$ visibility cone centered on the player's aim.
5.  **Bouncing Projectiles:** Bullets interact dynamically with walls, bouncing realistically off room borders using vector reflections.
6.  **O(1) Bullet Management:** Uses a custom **Doubly Linked List** to handle bullet nodes, avoiding performance hiccups caused by JavaScript array resizing (`splice()`) during chaotic firefights.

---

## Requirements & Tech Stack

This project is lightweight and runs directly in modern web browsers without any build steps, bundlers, or package installations.

- **HTML5 & Canvas API** for structure and graphics rendering.
- **Vanilla CSS** for retro-futuristic arcade aesthetics.
- **Vanilla JavaScript (ES6)** for physics, mathematical updates, and AI state machines.
- **Web Audio API (or basic HTML5 Audio)** for sound effects.

### Supported Browsers

- Google Chrome (Recommended)
- Mozilla Firefox
- Safari
- Microsoft Edge

---

## File Structure

- `index.html` - Game entry point and HUD layout.
- `styles.css` - UI layout styling, CRT/arcade visual palette.
- `constants.js` - Global configurations, speeds, ranges, and game timers.
- `state.js` - Centralized mutable variables and room coordinate generation (`single_global_state_object`).
- `input.js` - Real-time listeners for mouse aiming, pointer touches, and key holds.
- `enemy_manager.js` - State transitions, variants, and AI updates.
- `game.js` - Core rendering loop (`requestAnimationFrame`) and bullet linked list management.
- `other_helpers.js` - Math library containing SAT projection, vector normalization, and segment raycasting.
- `sound_manager.js` - Custom loader and player for audio assets.


## Enemy AI

Each bot operates on a finite state machine (FSM) consisting of IDLE/PATROL, ALERT, CHASE, ATTACK, and DEATH. The game includes several specialized enemy types:

* Normal (Green): Standard patrol and attack behavior[cite: 3].
* Roamer (Dark Blue): Actively pursues the player even outside its home room 
* Tank (Pink): High-durability unit with 10 HP 
* Phase (Light Blue): Periodically disappears and reappears 
* Teleporter (Light Purple): Can jump between different empty rooms 
* Explosive (Red): Detonates upon death, dealing area-of-effect damage 

## Technical Implementation

* Game Loop: The main_game_loop() function handles entity updates and rendering 60 times per second, ensuring smooth animation
* Collision Detection: Uses the Separating Axis Theorem (SAT) for high-precision circle-to-box collision, preventing clipping during high-speed movement
* Data Architecture: Employs a single_global_state_object to maintain game state, with bullets managed as nodes to optimize memory performance
* Map System: The sector consists of 20 generated rooms, each defined by unique collision boundaries and door configurations

  ## Built for delta inductions 26 -  task 2
  ### Thank youuu team!!!


