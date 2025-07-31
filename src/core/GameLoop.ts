import { Effect, Schedule, Clock, Ref } from "effect";
import type { GameState, InputState, Projectile, Drone } from "../domain";
import { RendererService } from "./Renderer";
import { createProjectile, updatePlayerShooting } from "../game/Player";
import { 
  updateDrones, 
  spawnDrones, 
  checkFormationComplete, 
  calculateDroneScore 
} from "../game/Drone";

const updateProjectiles = (projectiles: Projectile[], deltaTime: number): Projectile[] => {
  return projectiles
    .map(p => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * deltaTime,
        y: p.position.y + p.velocity.y * deltaTime,
      },
    }))
    .filter(p => p.position.x < 850 && p.position.x > -50 && p.position.y < 650 && p.position.y > -50); // Remove off-screen projectiles
};

// Simple AABB collision detection
const checkCollision = (obj1: { position: { x: number; y: number }; size: { x: number; y: number } }, 
                       obj2: { position: { x: number; y: number }; size: { x: number; y: number } }): boolean => {
  return obj1.position.x < obj2.position.x + obj2.size.x &&
         obj1.position.x + obj1.size.x > obj2.position.x &&
         obj1.position.y < obj2.position.y + obj2.size.y &&
         obj1.position.y + obj1.size.y > obj2.position.y;
};

// Handle collisions between projectiles and drones
const handleProjectileDroneCollisions = (
  projectiles: Projectile[], 
  drones: Drone[]
): { projectiles: Projectile[]; drones: Drone[]; destroyedDrones: Drone[] } => {
  const remainingProjectiles: Projectile[] = [];
  const remainingDrones: Drone[] = [];
  const destroyedDrones: Drone[] = [];
  const hitProjectileIds = new Set<string>();
  
  for (const drone of drones) {
    let droneHit = false;
    let hitDrone = drone;
    
    for (const projectile of projectiles) {
      if (projectile.owner === "player" && !hitProjectileIds.has(projectile.id) && 
          checkCollision(projectile, drone)) {
        hitProjectileIds.add(projectile.id);
        hitDrone = { ...drone, health: drone.health - projectile.damage };
        droneHit = true;
        break;
      }
    }
    
    if (hitDrone.health <= 0) {
      destroyedDrones.push(hitDrone);
    } else {
      remainingDrones.push(hitDrone);
    }
  }
  
  // Keep projectiles that didn't hit anything
  for (const projectile of projectiles) {
    if (!hitProjectileIds.has(projectile.id)) {
      remainingProjectiles.push(projectile);
    }
  }
  
  return { projectiles: remainingProjectiles, drones: remainingDrones, destroyedDrones };
};

export const updateGameState = (
  currentState: GameState,
  input: InputState,
  deltaTime: number
): GameState => {
  const playerSpeed = 300; // pixels per second
  const gameTimeMs = currentState.gameTime * 1000; // Convert to milliseconds
  
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

  // Handle player shooting
  const shootingResult = updatePlayerShooting(
    currentState.playerShootingState,
    deltaTime,
    input.buttons.shoot
  );

  let allProjectiles = shootingResult.shouldShoot
    ? [...currentState.projectiles, createProjectile(newPlayer)]
    : currentState.projectiles;

  // Update drones and get new drone projectiles
  const droneUpdateResult = updateDrones(currentState.drones, newPlayer, deltaTime);
  allProjectiles = [...allProjectiles, ...droneUpdateResult.newProjectiles];

  // Update all projectiles
  const updatedProjectiles = updateProjectiles(allProjectiles, deltaTime);

  // Handle collisions
  const collisionResult = handleProjectileDroneCollisions(updatedProjectiles, droneUpdateResult.drones);

  // Calculate score from destroyed drones
  let scoreIncrease = 0;
  let updatedFormations = [...currentState.droneSpawning.activeFormations];
  
  for (const destroyedDrone of collisionResult.destroyedDrones) {
    scoreIncrease += calculateDroneScore(destroyedDrone, updatedFormations, collisionResult.drones);
  }

  // Update formations - mark complete formations
  updatedFormations = updatedFormations.map(formation => ({
    ...formation,
    isComplete: checkFormationComplete(formation, collisionResult.drones),
  }));

  // Remove completed formations after a delay
  updatedFormations = updatedFormations.filter(formation => 
    !formation.isComplete || gameTimeMs - (formation as any).completedTime < 1000
  );

  // Spawn new drone formations
  const newFormation = spawnDrones(gameTimeMs, currentState.droneSpawning.nextSpawnTime);
  let newDrones = collisionResult.drones;
  let nextSpawnTime = currentState.droneSpawning.nextSpawnTime;
  
  if (newFormation) {
    updatedFormations.push(newFormation);
    newDrones = [...newDrones, ...newFormation.drones];
    nextSpawnTime = gameTimeMs;
  }

  return {
    ...currentState,
    player: newPlayer,
    drones: newDrones,
    projectiles: collisionResult.projectiles,
    playerShootingState: shootingResult.state,
    gameTime: currentState.gameTime + deltaTime,
    score: currentState.score + scoreIncrease,
    droneSpawning: {
      ...currentState.droneSpawning,
      nextSpawnTime,
      activeFormations: updatedFormations,
    },
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

      // Draw drones
      gameState.drones.forEach(drone => {
        if (drone.type === "scout") {
          // Draw scout drone as a small triangular shape
          ctx.fillStyle = "#66ccff";
          ctx.strokeStyle = "#4499cc";
          ctx.lineWidth = 1;
          
          const centerX = drone.position.x + drone.size.x / 2;
          const centerY = drone.position.y + drone.size.y / 2;
          const halfWidth = drone.size.x / 2;
          const halfHeight = drone.size.y / 2;
          
          // Draw triangle pointing left (towards player)
          ctx.beginPath();
          ctx.moveTo(drone.position.x, centerY); // Left point
          ctx.lineTo(drone.position.x + drone.size.x, drone.position.y); // Top right
          ctx.lineTo(drone.position.x + drone.size.x, drone.position.y + drone.size.y); // Bottom right
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // Draw health indicator if damaged
          if (drone.health < drone.maxHealth) {
            const healthBarWidth = drone.size.x;
            const healthBarHeight = 3;
            const healthPercent = drone.health / drone.maxHealth;
            
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(drone.position.x, drone.position.y - 8, healthBarWidth, healthBarHeight);
            ctx.fillStyle = "#00ff00";
            ctx.fillRect(drone.position.x, drone.position.y - 8, healthBarWidth * healthPercent, healthBarHeight);
          }
        }
      });

      // Draw projectiles
      gameState.projectiles.forEach(p => {
        if (p.owner === "player") {
          ctx.fillStyle = "#ffff00"; // Yellow for player projectiles
        } else {
          ctx.fillStyle = "#ff8800"; // Orange for drone projectiles
        }
        ctx.fillRect(p.position.x, p.position.y, p.size.x, p.size.y);
      });

      // Draw UI
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${gameState.score}`, 10, 30);
      ctx.fillText(`Health: ${gameState.player.health}`, 10, 50);
      ctx.fillText(`Drones: ${gameState.drones.length}`, 10, 70);
      ctx.fillText(`Formations: ${gameState.droneSpawning.activeFormations.length}`, 10, 90);
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