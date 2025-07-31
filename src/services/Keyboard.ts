import { Context, Effect, Layer } from "effect";
import type { InputState } from "../domain";

export interface KeyboardService {
  readonly getInputState: () => Effect.Effect<InputState>;
}

export const KeyboardService = Context.GenericTag<KeyboardService>("KeyboardService");

const createKeyboardState = () => {
  const keys = new Set<string>();

  const handleKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return {
    isPressed: (code: string) => keys.has(code),
    cleanup: () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    },
  };
};

export const KeyboardLive = Layer.effect(
  KeyboardService,
  Effect.gen(function* () {
    const keyboard = createKeyboardState();

    return KeyboardService.of({
      getInputState: () =>
        Effect.sync(() => {
          const movement = { x: 0, y: 0 };

          if (keyboard.isPressed("ArrowLeft") || keyboard.isPressed("KeyA")) {
            movement.x = -1;
          }
          if (keyboard.isPressed("ArrowRight") || keyboard.isPressed("KeyD")) {
            movement.x = 1;
          }
          if (keyboard.isPressed("ArrowUp") || keyboard.isPressed("KeyW")) {
            movement.y = -1;
          }
          if (keyboard.isPressed("ArrowDown") || keyboard.isPressed("KeyS")) {
            movement.y = 1;
          }

          return {
            movement,
            buttons: {
              shoot: keyboard.isPressed("Space") || keyboard.isPressed("KeyX"),
              jump: keyboard.isPressed("KeyZ") || keyboard.isPressed("ShiftLeft"),
            },
          };
        }),
    });
  })
);