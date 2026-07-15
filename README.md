# DArk: Echo Sector

## To Play

https://hibanitt.github.io/Delta-Task-2/

DArk: Echo Sector is a tactical top-down combat game built from scratch using the HTML Canvas API and vanilla JavaScript. It features a hand-crafted game architecture that manages physics, AI state machines, and dynamic rendering without the use of external game engines or frameworks

## Core Gameplay

Players navigate a fractured underground sector comprised of interconnected rooms. The objective is to survive and clear the sector of hostile rogue defense units by managing health and utilizing tactical movement

* Controls: Move using W, A, S, D[cite: 3]. Aim and shoot using the mouse
* Combat: Real-time mechanics featuring wall-bouncing projectiles and damage-based combat
* Vision: A dynamic radial visibility cone masks the environment, limiting the player's view based on their movement and aim

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


