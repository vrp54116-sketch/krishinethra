/**
 * simulation-engine.ts
 * Foundation placeholder for the KrishiNethra farm simulation engine.
 * Future: soil, weather, crop-growth, irrigation and sensor simulations.
 */

export interface SimulationTick {
  timestamp: number;
}

export function createInitialSimulation(): SimulationTick {
  return { timestamp: Date.now() };
}

export function stepSimulation(prev: SimulationTick): SimulationTick {
  return { timestamp: prev.timestamp + 1 };
}
