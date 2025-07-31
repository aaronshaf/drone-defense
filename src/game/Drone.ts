import type { Drone, DroneFormation, Projectile, Vector2, Player } from "../domain";

let droneIdCounter = 0;
let projectileIdCounter = 1000; // Start higher to avoid conflicts
let formationIdCounter = 0;

// Scout Drone Constants
const SCOUT_DRONE_CONFIG = {
  size: { x: 24, y: 19 }, // 60% of player size (assuming player is 40x32)
  health: 1,
  speed: 150, // pixels per second
  shootCooldown: 1.5, // seconds
  pointValue: 100,
  formationBonus: 500,
  amplitude: 60, // sine wave amplitude
  frequency: 2, // sine wave frequency
  projectileSpeed: 300,
  projectileColor: "#ff8800", // orange
} as const;

/**
 * Creates a new Scout Drone with sine wave movement pattern
 */
export const createScoutDrone = (
  startPosition: Vector2,
  formationId: string,
  formationIndex: number,
  baseY: number
): Drone => {
  droneIdCounter++;
  return {
    id: `scout-${droneIdCounter}`,
    type: "scout",
    position: { ...startPosition },
    velocity: { x: -SCOUT_DRONE_CONFIG.speed, y: 0 },
    size: { ...SCOUT_DRONE_CONFIG.size },
    health: SCOUT_DRONE_CONFIG.health,
    maxHealth: SCOUT_DRONE_CONFIG.health,
    lastPlayerPosition: { x: 0, y: 0 },
    shootingState: {
      canShoot: true,
      timeSinceLastShot: 0,
    },
    movementState: {
      baseY,
      oscillationTime: 0,
      amplitude: SCOUT_DRONE_CONFIG.amplitude,
      frequency: SCOUT_DRONE_CONFIG.frequency,
    },
    formationId,
    formationIndex,
    pointValue: SCOUT_DRONE_CONFIG.pointValue,
  };
};

/**
 * Creates a Scout Drone formation (3-5 drones)
 */
export const createScoutFormation = (gameTime: number): DroneFormation => {
  formationIdCounter++;
  const formationId = `formation-${formationIdCounter}`;
  const formationSize = 3 + Math.floor(Math.random() * 3); // 3-5 drones
  const spawnX = 850; // Start off-screen to the right
  const baseY = 100 + Math.random() * 400; // Random Y between 100-500
  
  const drones: Drone[] = [];
  
  for (let i = 0; i < formationSize; i++) {
    const drone = createScoutDrone(
      { x: spawnX + i * 80, y: baseY }, // Spread drones horizontally
      formationId,
      i,
      baseY
    );
    // Stagger the oscillation phase for visual variety
    drone.movementState.oscillationTime = (i * Math.PI) / 4;
    drones.push(drone);
  }
  
  return {
    id: formationId,
    type: "scout",
    spawnPosition: { x: spawnX, y: baseY },
    drones,
    isComplete: false,
    bonusAwarded: false,
  };
};

/**
 * Updates drone position with sine wave movement pattern
 */
export const updateDroneMovement = (drone: Drone, deltaTime: number): Drone => {
  if (drone.type !== "scout") return drone;
  
  const newOscillationTime = drone.movementState.oscillationTime + deltaTime;
  const sineOffset = Math.sin(newOscillationTime * drone.movementState.frequency) * drone.movementState.amplitude;
  
  return {
    ...drone,
    position: {
      x: drone.position.x + drone.velocity.x * deltaTime,
      y: drone.movementState.baseY + sineOffset,
    },
    movementState: {
      ...drone.movementState,
      oscillationTime: newOscillationTime,
    },
  };
};

/**
 * Updates drone shooting state and creates projectiles
 */
export const updateDroneShooting = (
  drone: Drone,
  player: Player,
  deltaTime: number
): { drone: Drone; projectile?: Projectile } => {
  // Update last known player position
  const updatedDrone = {
    ...drone,
    lastPlayerPosition: { ...player.position },
    shootingState: {
      ...drone.shootingState,
      timeSinceLastShot: drone.shootingState.timeSinceLastShot + deltaTime,
    },
  };
  
  // Check if drone can shoot
  if (updatedDrone.shootingState.timeSinceLastShot >= SCOUT_DRONE_CONFIG.shootCooldown) {
    // Calculate direction to player's last position
    const direction = {
      x: player.position.x - drone.position.x,
      y: player.position.y - drone.position.y,
    };
    const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    
    if (distance > 0) {
      // Normalize direction and apply speed
      const normalizedDirection = {
        x: (direction.x / distance) * SCOUT_DRONE_CONFIG.projectileSpeed,
        y: (direction.y / distance) * SCOUT_DRONE_CONFIG.projectileSpeed,
      };
      
      projectileIdCounter++;
      const projectile: Projectile = {
        id: `drone-projectile-${projectileIdCounter}`,
        position: {
          x: drone.position.x,
          y: drone.position.y + drone.size.y / 2,
        },
        velocity: normalizedDirection,
        size: { x: 6, y: 6 },
        damage: 10,
        owner: "drone",
      };
      
      return {
        drone: {
          ...updatedDrone,
          shootingState: {
            canShoot: false,
            timeSinceLastShot: 0,
          },
        },
        projectile,
      };
    }
  }
  
  return { drone: updatedDrone };
};

/**
 * Updates all drones in the game
 */
export const updateDrones = (
  drones: Drone[],
  player: Player,
  deltaTime: number
): { drones: Drone[]; newProjectiles: Projectile[] } => {
  const newProjectiles: Projectile[] = [];
  const updatedDrones: Drone[] = [];
  
  for (const drone of drones) {
    // Update movement
    let updatedDrone = updateDroneMovement(drone, deltaTime);
    
    // Update shooting
    const shootingResult = updateDroneShooting(updatedDrone, player, deltaTime);
    updatedDrone = shootingResult.drone;
    
    if (shootingResult.projectile) {
      newProjectiles.push(shootingResult.projectile);
    }
    
    // Only keep drones that are still on screen
    if (updatedDrone.position.x > -100) {
      updatedDrones.push(updatedDrone);
    }
  }
  
  return {
    drones: updatedDrones,
    newProjectiles,
  };
};

/**
 * Checks if a formation is complete (all drones destroyed)
 */
export const checkFormationComplete = (formation: DroneFormation, activeDrones: Drone[]): boolean => {
  const formationDronesAlive = activeDrones.filter(drone => drone.formationId === formation.id);
  return formationDronesAlive.length === 0;
};

/**
 * Calculates score for destroying a drone and formation bonuses
 */
export const calculateDroneScore = (
  drone: Drone,
  formations: DroneFormation[],
  activeDrones: Drone[]
): number => {
  let score = drone.pointValue;
  
  // Check if this was the last drone in a formation
  if (drone.formationId) {
    const formation = formations.find(f => f.id === drone.formationId);
    if (formation && !formation.bonusAwarded) {
      const remainingDrones = activeDrones.filter(d => d.formationId === drone.formationId && d.id !== drone.id);
      if (remainingDrones.length === 0) {
        score += SCOUT_DRONE_CONFIG.formationBonus;
        formation.bonusAwarded = true;
      }
    }
  }
  
  return score;
};

/**
 * Spawns new drone formations based on game time
 */
export const spawnDrones = (gameTime: number, lastSpawnTime: number): DroneFormation | null => {
  const spawnInterval = 5000; // 5 seconds between formations
  
  if (gameTime - lastSpawnTime >= spawnInterval) {
    return createScoutFormation(gameTime);
  }
  
  return null;
};