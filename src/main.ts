import { Effect, Layer } from "effect";
import { RendererLive, RendererService } from "./core/Renderer";
import { KeyboardLive } from "./services/Keyboard";
import { GamepadLive } from "./services/Gamepad";
import { InputLive, InputService } from "./services/Input";
import { createGameStateRef } from "./core/State";
import { createGameLoop } from "./core/GameLoop";

console.log("Drone Defense - Starting...");

const main = Effect.gen(function* () {
  const renderer = yield* RendererService;
  const input = yield* InputService;
  const stateRef = yield* createGameStateRef();

  console.log("Game initialized");
  console.log("Gamepad support enabled - connect a controller to play!");

  // Start the game loop
  yield* createGameLoop({
    renderer,
    stateRef,
    getInput: input.getInputState,
  });
});

const MainLive = Layer.mergeAll(
  RendererLive,
  KeyboardLive,
  GamepadLive,
  InputLive
);

Effect.runPromise(main.pipe(Effect.provide(MainLive))).catch(console.error);