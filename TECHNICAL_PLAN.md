# Technical Plan: Drone Defense

## 1. Core Concept & Vision

**Game:** Drone Defense
**Concept:** A modern, Contra 3-style side-scrolling shooter. The player, a soldier, battles waves of autonomous drones in an urban environment.
**Core Loop:** Run, jump, shoot, evade enemy fire, and defeat drone bosses.
**Target Platform:** Modern Web Browsers.
**Key Technologies:** Bun, TypeScript, Effect, HTML Canvas, Gamepad API, Web Audio API.

## 2. Technical Stack

*   **Runtime/Bundler:** **Bun** will be used for its speed in dependency management, running scripts, and bundling the final assets.
*   **Language:** **TypeScript** for static typing, improving code quality and maintainability.
*   **Core Framework:** **Effect** will be used to manage the application's structure, asynchronicity, and state. Its compositional and resource-safe nature is ideal for managing the game loop, I/O (input/audio), and state.
*   **Rendering:** **HTML Canvas API** (2D Context) for rendering all game visuals.
*   **Input:** **Gamepad API** for primary player control, with a keyboard fallback.
*   **Audio:** **Web Audio API** for sound effects and background music.

## 3. Project Setup & Structure

1.  **Initialization:**
    ```bash
    bun init -y
    bun add effect
    bun add -d @types/bun
    ```

2.  **`tsconfig.json`:** Configure for modern TypeScript with decorators and module paths.

3.  **File Structure:**
    ```
    /
    ├── dist/                 # Bundled output for deployment
    ├── public/               # Static assets (sprites, audio, index.html)
    │   ├── assets/
    │   │   ├── images/
    │   │   └── sounds/
    │   └── index.html
    ├── src/                  # TypeScript source code
    │   ├── main.ts           # Application entry point
    │   ├── core/             # Core game engine components
    │   │   ├── GameLoop.ts
    │   │   ├── Renderer.ts
    │   │   ├── State.ts
    │   │   └── AssetLoader.ts
    │   ├── services/         # Effect layers for external APIs
    │   │   ├── Gamepad.ts
    │   │   ├── Audio.ts
    │   │   └── Keyboard.ts
    │   ├── game/             # Game-specific logic
    │   │   ├── Player.ts
    │   │   ├── Drone.ts
    │   │   ├── Level.ts
    │   │   └── Collision.ts
    │   └── domain.ts         # Core data types and models
    ├── package.json
    └── tsconfig.json
    ```

4.  **`public/index.html`:**
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Drone Defense</title>
        <style>
            body, html { margin: 0; padding: 0; overflow: hidden; background: #000; }
            canvas { display: block; margin: auto; }
        </style>
    </head>
    <body>
        <canvas id="game-canvas"></canvas>
        <script type="module" src="../src/main.ts"></script>
    </body>
    </html>
    ```

## 4. Architecture with Effect

The entire game will be modeled as a single, long-running `Effect` program. We will use `Layer` to define and compose the game's dependencies (services), and `Schedule` to drive the main game loop.

### Services (Effect Layers)

We will define services for each major I/O-bound or stateful component.

*   **`RendererLive`**:
    *   **Context:** Holds the `CanvasRenderingContext2D`.
    *   **API:** `draw(gameState: GameState)`. Clears the canvas and draws all entities (player, drones, projectiles, UI) based on the current state.
    *   **Implementation:** An Effect `Layer` that acquires the canvas element from the DOM upon creation.

*   **`GamepadLive`**:
    *   **Context:** Manages the connection and state of gamepads.
    *   **API:** `getInputState(): Effect<never, never, GamepadInputState>`.
    *   **Implementation:** Polls `navigator.getGamepads()` on each request. The state will be a structured object like `{ dpad: { x, y }, buttons: { a, b, ... } }`.

*   **`AudioLive`**:
    *   **Context:** Manages the `AudioContext` and loaded `AudioBuffer`s.
    *   **API:** `playSound(soundId: string)`, `playMusic(musicId: string)`.
    *   **Implementation:** Pre-loads audio files into buffers. The `playSound` function creates and plays an `AudioBufferSourceNode`.

*   **`AssetLoaderLive`**:
    *   **Context:** Manages loading of images and audio files.
    *   **API:** `loadAssets(): Effect<never, Error, Assets>`.
    *   **Implementation:** Uses `fetch` and browser APIs (`createImageBitmap`, `audioContext.decodeAudioData`) wrapped in Effect's asynchronous capabilities.

### Game State Management

*   A central `Ref<GameState>` will hold the entire game state.
*   **`GameState`**: A TypeScript interface defining everything:
    ```typescript
    interface GameState {
        player: Player;
        drones: Drone[];
        projectiles: Projectile[];
        level: Level;
        score: number;
        // ... and other state
    }
    ```
*   Game logic functions will be pure transformations: `(currentState: GameState, input: InputState, delta: number) => GameState`.

### The Game Loop

The main game loop will be an Effect program driven by `Schedule`.

```typescript
import { Effect, Schedule, Clock } from "effect";

const gameLoop = (
    // Dependencies provided by Effect's context
    gamepad: GamepadService,
    renderer: RendererService,
    stateRef: Ref<GameState>
) => {
    const tick = Effect.gen(function*(_) {
        const delta = yield* _(Clock.currentTimeMillis); // Simplified delta
        const input = yield* _(gamepad.getInputState());
        const currentState = yield* _(Ref.get(stateRef));

        // Pure-logic update function
        const newState = updateGameState(currentState, input, delta);

        yield* _(Ref.set(stateRef, newState));
        yield* _(renderer.draw(newState));
    });

    // Run at ~60 FPS
    return Effect.repeat(tick, Schedule.spaced("16ms"));
};
```

## 5. Implementation Milestones

### Milestone 1: Core Engine Setup
1.  **Goal:** Render a player character on screen that can be moved with keyboard input.
2.  **Tasks:**
    *   Set up the project structure and build process with Bun.
    *   Implement the `RendererLive` service to draw a simple rectangle to the canvas.
    *   Create a basic `GameState` `Ref`.
    *   Implement the main `gameLoop` driven by `Schedule`.
    *   Implement a `KeyboardService` and move the rectangle based on input.

### Milestone 2: Gameplay - Shooting & Drones
1.  **Goal:** The player can shoot projectiles, and a basic drone enemy is introduced.
2.  **Tasks:**
    *   Add `projectiles` to `GameState`.
    *   Update player logic to create projectiles on a button press.
    *   Implement a `Drone` entity with simple horizontal movement.
    *   Implement basic Axis-Aligned Bounding Box (AABB) collision detection between projectiles and drones.
    *   Remove drone and projectile on collision.

### Milestone 3: API Integration - Gamepad & Audio
1.  **Goal:** Integrate the core browser APIs for the intended experience.
2.  **Tasks:**
    *   Implement the `GamepadLive` service and replace keyboard input with it.
    *   Implement the `AssetLoaderLive` and `AudioLive` services.
    *   Load sound effects for shooting and explosions.
    *   Trigger sound effects on corresponding game events (e.g., via a `Queue` in the game state).

### Milestone 4: Polish & "Urban Gauntlet"
1.  **Goal:** Create a complete, playable game slice.
2.  **Tasks:**
    *   Implement the "Urban Gauntlet" mode: a single, flat, side-scrolling level.
    *   Add level scrolling logic.
    *   Introduce 2-3 different drone types with varied movement patterns.
    *   Add a simple UI for score and player health.
    *   Load and play background music.

## 6. Build & Deployment

*   **Build Command:** `bun build ./src/main.ts --outdir ./dist --target browser`
*   **Deployment:** The `dist/` directory and the `public/` directory will contain all the necessary files to be served by any static web server.
