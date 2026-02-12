# CoZ 2 - 3D Physics Shooter

This is the foundational codebase for a 3D shooter game, inspired by games with highly dynamic and destructible environments like "The Finals".

## Tech Stack

- **Rendering:** [Three.js](https://threejs.org/)
- **Physics:** [Ammo.js](https://github.com/kripken/ammo.js/) (via WebAssembly)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## Controls

- **W, A, S, D:** Move (relative to camera direction)
- **Space:** Jump
- **Mouse Movement:** Look around (press any key to lock cursor)
- **E:** Pick up nearby objects
- **F:** Throw held object
- **Escape or Mouse Leave Window:** Open Pause Menu

## Pause Menu

Press **ESC** or move your mouse out of the window to open the pause menu where you can:
- Adjust **Mouse Sensitivity** (0.01 - 0.2)
- View current **Keybinds**
- **Resume** gameplay with pointer lock re-enabled
- **Reset to Defaults** if needed

## Current Features

- First-person camera controller with mouse look
- Physics-based movement and jumping
- Dynamic object picking and throwing mechanics
- 50+ test cubes spawned throughout the level
- Invisible boundary walls preventing falling off the map
- Real-time shadow mapping for better visual feedback
- Ambient and directional lighting
- Customizable mouse sensitivity
- Pause menu with settings
- Pointer lock for immersive gameplay

## Features to be added in the future

- Destructible environments
- Explosive mechanics and effects
- More interactive objects
- Weapon system with attachments
- Player abilities
- Optimisation for many physics objects
- Multiplayer support
- Better audio integration
- Particle effects and explosions

