/**
 * Estado base para inicializar cualquier simulación.
 * Cada problema parte de este estado y lo personaliza según sus necesidades.
 */

import type { SimulationState } from './types';

export const createBaseState = (): SimulationState => ({
  clock: 0,
  serverBusy: false,
  serverOn: true,        // Por defecto el servidor está disponible
  queue: [],
  queueA: [],
  queueB: [],
  securityQueue: [],
  currentClient: null,
  currentSecurityClient: null,
  securityBusy: false,
  clientIdCounter: 0,
  finished: false,
  stats: {
    totalArrivals: 0,
    totalDepartures: 0,
    totalWaitTime: 0,
    totalSystemTime: 0,
    serverBusyTime: 0,
    totalQueueArea: 0,
    lastEventTime: 0,
    lastQueueLength: 0,
    abandonedClients: 0,
  },
  log: [],
});

/**
 * Agrega una entrada al log de la simulación.
 * Limita el log a 200 entradas para evitar consumo excesivo de memoria.
 */
export const addLog = (
  state: SimulationState,
  message: string,
  type: SimulationState['log'][0]['type']
): SimulationState['log'] => {
  const entry = { time: state.clock, message, type };
  const newLog = [entry, ...state.log];
  return newLog.slice(0, 200); // máximo 200 entradas
};

/**
 * Actualiza el área bajo la curva de longitud de cola.
 * Esto nos permite calcular el promedio de clientes en cola con:
 *   L_q = totalQueueArea / clock
 */
export const updateQueueArea = (
  state: SimulationState,
  currentQueueLength: number
): Partial<SimulationState['stats']> => {
  const dt = state.clock - state.stats.lastEventTime;
  const newArea = state.stats.totalQueueArea + state.stats.lastQueueLength * dt;
  return {
    totalQueueArea: newArea,
    lastEventTime: state.clock,
    lastQueueLength: currentQueueLength,
  };
};
