import { Effect, Layer } from "effect";
import { RendererLive } from "./core/Renderer";
import { KeyboardLive, KeyboardService } from "./services/Keyboard";
import { createGameStateRef } from "./core/State";
import { createGameLoop } from "./core/GameLoop";
import { RendererService } from "./core/Renderer";

console.log("Drone Defense - Starting...");

const main = Effect.gen(function* () {
  const renderer = yield* RendererService;
  const keyboard = yield* KeyboardService;
  const stateRef = yield* createGameStateRef();

  console.log("Game initialized");

  // Start the game loop
  yield* createGameLoop({
    renderer,
    stateRef,
    getInput: keyboard.getInputState,
  });
});

const MainLive = Layer.merge(RendererLive, KeyboardLive);

Effect.runPromise(main.pipe(Effect.provide(MainLive))).catch(console.error);