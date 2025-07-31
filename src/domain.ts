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
  type: "scout" | "heavy" | "bomber";
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  health: number;
  maxHealth: number;
  lastPlayerPosition: Vector2;
  shootingState: {
    canShoot: boolean;
    timeSinceLastShot: number;
  };
  movementState: {
    baseY: number;
    oscillationTime: number;
    amplitude: number;
    frequency: number;
  };
  formationId?: string;
  formationIndex?: number;
  pointValue: number;
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

export interface DroneFormation {
  id: string;
  type: "scout" | "heavy" | "bomber";
  spawnPosition: Vector2;
  drones: Drone[];
  isComplete: boolean;
  bonusAwarded: boolean;
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
  droneSpawning: {
    nextSpawnTime: number;
    formationCounter: number;
    activeFormations: DroneFormation[];
  };
}

export interface InputState {
  movement: Vector2;
  buttons: {
    shoot: boolean;
    jump: boolean;
  };
}