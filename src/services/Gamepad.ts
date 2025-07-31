import { Context, Effect, Layer } from "effect";
import type { InputState } from "../domain";

export interface GamepadService {
  readonly getInputState: () => Effect.Effect<InputState>;
}

export const GamepadService = Context.GenericTag<GamepadService>("GamepadService");

const DEADZONE = 0.2; // Ignore small stick movements

const applyDeadzone = (value: number): number => {
  if (Math.abs(value) < DEADZONE) return 0;
  // Scale the value to use full range after deadzone
  const sign = value > 0 ? 1 : -1;
  return sign * ((Math.abs(value) - DEADZONE) / (1 - DEADZONE));
};

export const GamepadLive = Layer.effect(
  GamepadService,
  Effect.gen(function* () {
    // Track button states to detect press/release
    const previousButtons = new Map<number, boolean>();

    return GamepadService.of({
      getInputState: () =>
        Effect.sync(() => {
          const gamepads = navigator.getGamepads();
          const gamepad = gamepads[0]; // Use first connected gamepad

          if (!gamepad) {
            // No gamepad connected, return neutral state
            return {
              movement: { x: 0, y: 0 },
              buttons: {
                shoot: false,
                jump: false,
              },
            };
          }

          // Standard gamepad mapping (Xbox/PlayStation style)
          // Left stick for movement
          const movement = {
            x: applyDeadzone(gamepad.axes[0] || 0), // Left stick horizontal
            y: applyDeadzone(gamepad.axes[1] || 0), // Left stick vertical
          };

          // D-pad as alternative movement (buttons 12-15)
          if (gamepad.buttons[14]?.pressed) movement.x = -1; // D-pad left
          if (gamepad.buttons[15]?.pressed) movement.x = 1;  // D-pad right
          if (gamepad.buttons[12]?.pressed) movement.y = -1; // D-pad up
          if (gamepad.buttons[13]?.pressed) movement.y = 1;  // D-pad down

          // Button mapping:
          // A/X button (0) or Right Trigger (7) = shoot
          // B/Circle button (1) or Left Trigger (6) = jump
          // X/Square button (2) = also shoot (alternative)
          const buttons = {
            shoot: 
              gamepad.buttons[0]?.pressed || // A/X button
              gamepad.buttons[2]?.pressed || // X/Square button  
              gamepad.buttons[7]?.pressed || // Right trigger
              false,
            jump: 
              gamepad.buttons[1]?.pressed || // B/Circle button
              gamepad.buttons[6]?.pressed || // Left trigger
              false,
          };

          return {
            movement,
            buttons,
          };
        }),
    });
  })
);