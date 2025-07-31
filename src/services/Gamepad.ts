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
    let debugLogged = false;

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

          // Debug log gamepad info once
          if (!debugLogged && gamepad.connected) {
            console.log("🎮 Gamepad connected:", gamepad.id);
            console.log("Axes count:", gamepad.axes.length);
            console.log("Buttons count:", gamepad.buttons.length);
            debugLogged = true;
          }

          // Debug axes values for Switch controller
          const axesDebug = gamepad.axes.map((v, i) => `${i}: ${v.toFixed(2)}`).join(", ");
          
          // Standard gamepad mapping (Xbox/PlayStation style)
          // Left stick for movement
          const movement = {
            x: applyDeadzone(gamepad.axes[0] || 0), // Left stick horizontal
            y: applyDeadzone(gamepad.axes[1] || 0), // Left stick vertical
          };

          // Log movement if non-zero (for debugging)
          if (Math.abs(movement.x) > 0.1 || Math.abs(movement.y) > 0.1) {
            console.log("Movement detected:", movement, "Raw axes:", axesDebug);
          }

          // D-pad as alternative movement (buttons 12-15)
          // Note: Switch Pro Controller might use different button indices
          if (gamepad.buttons[14]?.pressed) movement.x = -1; // D-pad left
          if (gamepad.buttons[15]?.pressed) movement.x = 1;  // D-pad right
          if (gamepad.buttons[12]?.pressed) movement.y = -1; // D-pad up
          if (gamepad.buttons[13]?.pressed) movement.y = 1;  // D-pad down

          // Debug button presses
          gamepad.buttons.forEach((button, index) => {
            if (button.pressed && !previousButtons.get(index)) {
              console.log(`Button ${index} pressed`);
            }
            previousButtons.set(index, button.pressed);
          });

          // Button mapping:
          // Switch Pro Controller typically uses:
          // Button 0 = B, Button 1 = A, Button 2 = Y, Button 3 = X
          // Button 6 = L, Button 7 = R
          const buttons = {
            shoot: 
              gamepad.buttons[1]?.pressed || // A button (Switch)
              gamepad.buttons[0]?.pressed || // B button (Switch) / A (Xbox)
              gamepad.buttons[7]?.pressed || // R button
              gamepad.buttons[5]?.pressed || // ZR button (Switch)
              false,
            jump: 
              gamepad.buttons[2]?.pressed || // Y button (Switch)
              gamepad.buttons[3]?.pressed || // X button (Switch)
              gamepad.buttons[6]?.pressed || // L button
              gamepad.buttons[4]?.pressed || // ZL button (Switch)
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