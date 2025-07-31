import { Context, Effect, Layer } from "effect";
import type { InputState } from "../domain";
import { KeyboardService } from "./Keyboard";
import { GamepadService } from "./Gamepad";

export interface InputService {
  readonly getInputState: () => Effect.Effect<InputState>;
}

export const InputService = Context.GenericTag<InputService>("InputService");

export const InputLive = Layer.effect(
  InputService,
  Effect.gen(function* () {
    const keyboard = yield* KeyboardService;
    const gamepad = yield* GamepadService;

    return InputService.of({
      getInputState: () =>
        Effect.gen(function* () {
          // Get input from both sources
          const keyboardInput = yield* keyboard.getInputState();
          const gamepadInput = yield* gamepad.getInputState();

          // Combine inputs - if either source has input, use it
          const movement = {
            x: keyboardInput.movement.x || gamepadInput.movement.x,
            y: keyboardInput.movement.y || gamepadInput.movement.y,
          };

          // Normalize diagonal movement to prevent speed boost
          const magnitude = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
          if (magnitude > 1) {
            movement.x /= magnitude;
            movement.y /= magnitude;
          }

          const buttons = {
            shoot: keyboardInput.buttons.shoot || gamepadInput.buttons.shoot,
            jump: keyboardInput.buttons.jump || gamepadInput.buttons.jump,
          };

          return {
            movement,
            buttons,
          };
        }),
    });
  })
);