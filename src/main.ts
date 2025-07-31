import { Effect, Layer } from "effect";
import { RendererLive, RendererService } from "./core/Renderer";
import { KeyboardLive } from "./services/Keyboard";
import { GamepadLive } from "./services/Gamepad";
import { InputLive, InputService } from "./services/Input";
import { createGameStateRef } from "./core/State";
import { createGameLoop } from "./core/GameLoop";

console.log("Drone Defense - Starting...");

const main = Effect.gen(function* () {
  console.log("Getting services...");
  const renderer = yield* RendererService;
  const input = yield* InputService;
  const stateRef = yield* createGameStateRef();

  console.log("Game initialized");
  console.log("Gamepad support enabled - connect a controller to play!");
  
  // Test render to make sure canvas is working
  const canvas = yield* renderer.getCanvas();
  console.log("Canvas size:", canvas.width, "x", canvas.height);

  // Start the game loop
  console.log("Starting game loop...");
  yield* createGameLoop({
    renderer,
    stateRef,
    getInput: input.getInputState,
  });
});

// InputLive depends on KeyboardLive and GamepadLive
const MainLive = Layer.merge(
  RendererLive,
  Layer.provide(
    InputLive,
    Layer.merge(KeyboardLive, GamepadLive)
  )
);

// Run the game
console.log("About to run main effect...");
Effect.runPromise(main.pipe(Effect.provide(MainLive)))
  .then(() => console.log("Game loop started successfully"))
  .catch(error => {
    console.error("Failed to start game:", error);
  });