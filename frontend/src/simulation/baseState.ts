/**
 * Estado base para inicializar la simulación.
 */

import type { SimulationState } from './types';

export const createBaseState = (): SimulationState => ({
  clock: 0,
  queue: [],
  queue1: [],
  queue2: [],
  queue3: [],
  currentClientS1: null,
  currentClientS2: null,
  currentClientS3: null,
  server1Busy: false,
  server2Busy: false,
  server3Busy: false,
  serverBusy: false,
  serverOn: true,
  currentClient: null,
  clientIdCounter: 0,
  finished: false,
  stats: {
    totalArrivals: 0,
    totalDepartures: 0,
    totalSystemTime: 0,
    totalWaitTime: 0,
    server1BusyTime: 0,
    server2BusyTime: 0,
    server3BusyTime: 0,
    departuresS1: 0,
    departuresS2: 0,
    departuresS3: 0,
  },
  log: [],
  simulationMatrix: [],
  arrivalIndex: 0,
  abandonedClients: 0,
  servedClients: 0,
  divertedClients: 0,
  serverBreaks: 0,
});

/**
 * Agrega una entrada al log de la simulación.
 */
export const addLog = (
  state: SimulationState,
  message: string,
  type: SimulationState['log'][0]['type']
): SimulationState['log'] => {
  const entry = { time: state.clock, message, type };
  const newLog = [entry, ...state.log];
  return newLog.slice(0, 300);
};
