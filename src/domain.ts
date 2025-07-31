export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  health: number;
}

export interface Drone {
  id: string;
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  health: number;
}

export interface Projectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  damage: number;
  owner: "player" | "drone";
}

export interface Level {
  width: number;
  height: number;
  scrollSpeed: number;
  scrollOffset: number;
}

export interface GameState {
  player: Player;
  drones: Drone[];
  projectiles: Projectile[];
  level: Level;
  score: number;
  gameTime: number;
  isPaused: boolean;
  playerShootingState: {
    canShoot: boolean;
    timeSinceLastShot: number;
  };
}

export interface InputState {
  movement: Vector2;
  buttons: {
    shoot: boolean;
    jump: boolean;
  };
}