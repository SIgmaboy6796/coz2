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
- **C:** Toggle between first-person and third-person camera
- **Escape or Mouse Leave Window:** Open Pause Menu

## Pause Menu

Press **ESC** or move your mouse out of the window to open the pause menu where you can:
- Adjust **Mouse Sensitivity** (0.001 - 0.2) with fine-grained control
- **Rebind Controls** - Click any keybind field and press a key to rebind
- **Host a Game** - Create a P2P multiplayer session and share a link with friends
- **Resume** gameplay with pointer lock re-enabled
- **Reset to Defaults** if needed

## Current Features

- First-person and third-person camera modes (toggle with C)
- Physics-based movement and jumping with improved collision detection
- Dynamic object picking and throwing mechanics with kinematic bodies
- 50+ test cubes spawned throughout the level for interaction
- Invisible boundary walls preventing falling off the map
- Real-time shadow mapping for better visual feedback
- Ambient and directional lighting
- Customizable mouse sensitivity with slider (0.001 - 0.2)
- Fully rebindable keybinds with immediate effect
- Player capsule model with physics integration
- Pause menu with settings and multiplayer options
- Pointer lock for immersive gameplay
- Multiplayer foundation with P2P host/join system
- WebRTC-ready infrastructure for peer-to-peer connections

## Recent Improvements (Current Session)

- **Lower Sensitivity Default** - Default sensitivity reduced from 0.05 to 0.015 for better control
- **Fixed Jump Mechanic** - Improved jump detection using velocity-based collision checking
- **Keybind Persistence** - Pause menu changes now properly apply to input handlers
- **Better Object Picking** - Reduced constraint distance from 5 to 1.5 units for more natural object handling
- **Improved Throwing Physics** - Objects thrown with better velocity application and no clipping
- **3rd Person Camera** - New camera mode with view from behind and above the player
- **Player Model** - Added visible capsule mesh representing the player character
- **Multiplayer Foundation** - Created Multiplayer.ts module with P2P signaling support
- **Host Button** - Added "HOST GAME" button in pause menu with shareable link generation

## How to Play

1. Start the application and click to lock cursor
2. Use WASD to move, Space to jump
3. Look around with mouse in first/third person (press C to switch)
4. Click on objects with E to pick them up
5. Press F to throw held objects
6. Press ESC to open pause menu
7. Adjust sensitivity and rebind keys as needed
8. Click "HOST GAME" to create a multiplayer session

## Features to be added in the future

- Full P2P multiplayer networking (WebRTC DataChannel)
- Player state synchronization across peers
- Object state replication in multiplayer games
- Destructible environments
- Explosive mechanics and effects
- More interactive objects
- Weapon system with attachments
- Player abilities and power-ups
- Optimization for many physics objects
- Advanced audio integration
- Particle effects and explosions
- Spectator mode
- Advanced matchmaking system

