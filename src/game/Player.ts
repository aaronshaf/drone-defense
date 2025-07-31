import type { Player, Projectile, InputState } from "../domain";

let projectileIdCounter = 0;

export const createProjectile = (player: Player): Projectile => {
  projectileIdCounter++;
  return {
    id: `projectile-${projectileIdCounter}`,
    position: {
      x: player.position.x + player.size.x,
      y: player.position.y + player.size.y / 2 - 2,
    },
    velocity: { x: 500, y: 0 }, // bullets move right at 500 px/s
    size: { x: 8, y: 4 },
    damage: 10,
    owner: "player",
  };
};

export interface PlayerShootingState {
  canShoot: boolean;
  timeSinceLastShot: number;
}

export const updatePlayerShooting = (
  state: PlayerShootingState,
  deltaTime: number,
  isShooting: boolean
): { state: PlayerShootingState; shouldShoot: boolean } => {
  const shootCooldown = 0.2; // 200ms between shots
  const newTimeSinceLastShot = state.timeSinceLastShot + deltaTime;
  const canShoot = newTimeSinceLastShot >= shootCooldown;

  if (isShooting && canShoot) {
    return {
      state: { canShoot: false, timeSinceLastShot: 0 },
      shouldShoot: true,
    };
  }

  return {
    state: { canShoot, timeSinceLastShot: newTimeSinceLastShot },
    shouldShoot: false,
  };
};