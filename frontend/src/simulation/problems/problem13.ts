/**
 * PROBLEMA 13: Cola Simple M/M/1
 * ────────────────────────────────
 * Un servidor, cola FIFO. Tiempos configurables.
 * El servidor no abandona nunca el puesto.
 *
 * Eventos: arrival, departure
 * Variables: Estado PS, Cantidad en cola
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { createBaseState, addLog } from '../baseState';
import { exponential, uniform } from '../random';

function genArrival(config: ProblemConfig, state: SimulationState): number {
  if (config.arrivalMode === 'list' && config.arrivalList.length > 0) {
    return config.arrivalList[state.arrivalIndex % config.arrivalList.length];
  }
  if (config.arrivalMode === 'manual') return config.arrivalInterval;
  return exponential(config.arrivalInterval);
}

function genService(config: ProblemConfig): number {
  if (config.serviceMin !== undefined && config.serviceMax !== undefined) {
    return uniform(config.serviceMin, config.serviceMax);
  }
  if (config.serviceMode === 'list' && config.serviceListS1.length > 0) {
    return config.serviceListS1[Math.floor(Math.random() * config.serviceListS1.length)];
  }
  const value = config.serviceTime ?? config.serviceTimeS1;
  if (config.serviceMode === 'manual') return value;
  return exponential(value);
}

function buildMatrixRow(state: SimulationState, fel: SimEvent[], desc: string): MatrixRow {
  const nextArr = fel.find(e => e.type === 'arrival');
  const nextDep = fel.find(e => e.type === 'departure');
  return {
    clock: state.clock, eventDescription: desc,
    nextArrivalS1: nextArr?.time ?? null, nextArrivalS2: null, nextArrivalS3: null,
    nextDepartureS1: nextDep?.time ?? null, nextDepartureS2: null, nextDepartureS3: null,
    queueLenS1: state.queue.length, queueLenS2: 0, queueLenS3: 0,
    serverStateS1: state.serverBusy ? 1 : 0, serverStateS2: 0, serverStateS3: 0,
  };
}

const problem13: ProblemDefinition = {
  id: 13,
  name: 'Cola Simple M/M/1',
  description: 'Un servidor, cola FIFO. El servidor nunca abandona.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];
    const initialQueue = config.initialQueue ?? 0;

    // Crear clientes iniciales
    const queueClients = [];
    for (let i = 0; i < initialQueue; i++) {
      queueClients.push({ id: i + 1, arrivalTime: 0 });
    }
    let clientId = initialQueue;

    // Si hay cola, atender al primero
    let serverBusy = false;
    let currentClient = null;
    if (queueClients.length > 0) {
      const first = queueClients.shift()!;
      currentClient = { ...first, serviceStartTime: 0 };
      serverBusy = true;
      initialEvents.push({ time: genService(config), type: 'departure', clientId: first.id });
    }

    // Primera llegada
    clientId++;
    initialEvents.push({ time: genArrival(config, state), type: 'arrival', clientId });

    const s = { ...state, queue: queueClients, serverBusy, currentClient, clientIdCounter: clientId };
    const row = buildMatrixRow(s, initialEvents, 'Inicio');

    return { state: { ...s, simulationMatrix: [row] }, initialEvents };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    switch (event.type) {
      case 'arrival': {
        s.stats.totalArrivals++;
        s.arrivalIndex++;
        const newId = s.clientIdCounter + 1;
        s.clientIdCounter = newId;
        const client = { id: event.clientId ?? newId, arrivalTime: s.clock };

        newEvents.push({ time: s.clock + genArrival(config, s), type: 'arrival', clientId: newId });

        if (!s.serverBusy) {
          s.serverBusy = true;
          s.currentClient = { ...client, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genService(config), type: 'departure', clientId: client.id });
          s.log = addLog(s, `Cliente #${client.id} llegó → atendido`, 'arrival');
        } else {
          s.queue = [...s.queue, client];
          s.log = addLog(s, `Cliente #${client.id} llegó → cola (${s.queue.length})`, 'arrival');
        }
        break;
      }
      case 'departure': {
        if (s.currentClient) {
          s.stats.totalDepartures++;
          s.servedClients++;
          s.stats.totalSystemTime += s.clock - s.currentClient.arrivalTime;
          s.log = addLog(s, `Cliente #${s.currentClient.id} atendido → sale`, 'departure');
        }
        if (s.queue.length > 0) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genService(config), type: 'departure', clientId: next.id });
        } else {
          s.serverBusy = false;
          s.currentClient = null;
        }
        break;
      }
    }
    return { newState: s, newEvents };
  },
};

export { buildMatrixRow };
export default problem13;
