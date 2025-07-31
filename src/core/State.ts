import { Ref, Effect } from "effect";
import type { GameState } from "../domain";

export const createInitialGameState = (): GameState => ({
  player: {
    position: { x: 100, y: 300 },
    velocity: { x: 0, y: 0 },
    size: { x: 32, y: 48 },
    health: 100,
  },
  drones: [],
  projectiles: [],
  level: {
    width: 800,
    height: 600,
    scrollSpeed: 0,
    scrollOffset: 0,
  },
  score: 0,
  gameTime: 0,
  isPaused: false,
  playerShootingState: {
    canShoot: true,
    timeSinceLastShot: 0,
  },
});

export const createGameStateRef = () => 
  Ref.make(createInitialGameState());