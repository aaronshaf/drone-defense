import { Effect, Schedule, Clock, Ref } from "effect";
import type { GameState, InputState, Projectile } from "../domain";
import { RendererService } from "./Renderer";
import { createProjectile, updatePlayerShooting } from "../game/Player";

const updateProjectiles = (projectiles: Projectile[], deltaTime: number): Projectile[] => {
  return projectiles
    .map(p => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * deltaTime,
        y: p.position.y + p.velocity.y * deltaTime,
      },
    }))
    .filter(p => p.position.x < 850 && p.position.x > -50); // Remove off-screen projectiles
};

export const updateGameState = (
  currentState: GameState,
  input: InputState,
  deltaTime: number
): GameState => {
  const playerSpeed = 300; // pixels per second
  
  // Update player position based on input
  const newPlayer = {
    ...currentState.player,
    position: {
      x: currentState.player.position.x + input.movement.x * playerSpeed * deltaTime,
      y: currentState.player.position.y + input.movement.y * playerSpeed * deltaTime,
    },
  };

  // Keep player within bounds
  newPlayer.position.x = Math.max(0, Math.min(800 - newPlayer.size.x, newPlayer.position.x));
  newPlayer.position.y = Math.max(0, Math.min(600 - newPlayer.size.y, newPlayer.position.y));

  // Handle shooting
  const shootingResult = updatePlayerShooting(
    currentState.playerShootingState,
    deltaTime,
    input.buttons.shoot
  );

  const newProjectiles = shootingResult.shouldShoot
    ? [...currentState.projectiles, createProjectile(newPlayer)]
    : currentState.projectiles;

  return {
    ...currentState,
    player: newPlayer,
    projectiles: updateProjectiles(newProjectiles, deltaTime),
    playerShootingState: shootingResult.state,
    gameTime: currentState.gameTime + deltaTime,
  };
};

export const renderGameState = (
  renderer: RendererService,
  gameState: GameState
) =>
  Effect.gen(function* () {
    yield* renderer.clear();
    
    yield* renderer.draw((ctx) => {
      // Draw background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, 800, 600);

      // Draw player as a red rectangle
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(
        gameState.player.position.x,
        gameState.player.position.y,
        gameState.player.size.x,
        gameState.player.size.y
      );

      // Draw projectiles
      ctx.fillStyle = "#ffff00";
      gameState.projectiles.forEach(p => {
        ctx.fillRect(p.position.x, p.position.y, p.size.x, p.size.y);
      });

      // Draw UI
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${gameState.score}`, 10, 30);
      ctx.fillText(`Health: ${gameState.player.health}`, 10, 50);
    });
  });

interface GameLoopDeps {
  renderer: RendererService;
  stateRef: Ref.Ref<GameState>;
  getInput: () => Effect.Effect<InputState>;
}

export const createGameLoop = ({ renderer, stateRef, getInput }: GameLoopDeps) => {
  let lastTime = 0;

  const tick = Effect.gen(function* () {
    const currentTime = yield* Clock.currentTimeMillis;
    const deltaTime = lastTime === 0 ? 16 : Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;

    const input = yield* getInput();
    const currentState = yield* Ref.get(stateRef);

    if (!currentState.isPaused) {
      const newState = updateGameState(currentState, input, deltaTime / 1000);
      yield* Ref.set(stateRef, newState);
      yield* renderGameState(renderer, newState);
    }
  });

  return Effect.repeat(tick, Schedule.spaced(16));
};