/**
 * PROBLEMA 14: Prioridad A sobre B
 * ──────────────────────────────────
 * Dos tipos de clientes (A y B). Los A tienen prioridad.
 * No se interrumpe servicio en curso.
 * Al liberarse el PS, se atiende primero de cola A, luego de cola B.
 *
 * Eventos: arrival (con tipo A o B), departure
 * Variables: Estado PS, Cola A, Cola B
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow, Client } from '../types';
import { createBaseState, addLog } from '../baseState';
import { exponential, uniform } from '../random';

function genArrival(config: ProblemConfig, state: SimulationState): number {
  if (config.arrivalMode === 'list' && config.arrivalList.length > 0) {
    return config.arrivalList[state.arrivalIndex % config.arrivalList.length];
  }
  if (config.arrivalMode === 'manual') return config.arrivalInterval;
  return exponential(config.arrivalInterval);
}

function genArrivalB(config: ProblemConfig, state: SimulationState): number {
  if (config.arrivalMode === 'list' && config.arrivalListS2.length > 0) {
    return config.arrivalListS2[state.arrivalIndex % config.arrivalListS2.length];
  }
  if (config.arrivalMode === 'manual') return config.arrivalIntervalS2;
  return exponential(config.arrivalIntervalS2);
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
  const nextArrA = fel.find(e => e.type === 'arrival' && e.data === 'A');
  const nextArrB = fel.find(e => e.type === 'arrival' && e.data === 'B');
  const nextDep = fel.find(e => e.type === 'departure');
  return {
    clock: state.clock, eventDescription: desc,
    nextArrivalS1: nextArrA?.time ?? null,  // Próx llegada A
    nextArrivalS2: nextArrB?.time ?? null,  // Próx llegada B
    nextArrivalS3: null,
    nextDepartureS1: nextDep?.time ?? null, nextDepartureS2: null, nextDepartureS3: null,
    queueLenS1: state.queue1.length,  // Cola A
    queueLenS2: state.queue2.length,  // Cola B
    queueLenS3: 0,
    serverStateS1: state.serverBusy ? 1 : 0, serverStateS2: 0, serverStateS3: 0,
  };
}

const problem14: ProblemDefinition = {
  id: 14,
  name: 'Prioridad A sobre B',
  description: 'Dos tipos de clientes. A tiene prioridad. No se interrumpe servicio.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    // Primera llegada tipo A
    initialEvents.push({ time: genArrival(config, state), type: 'arrival', clientId: 1, data: 'A' });
    // Primera llegada tipo B
    initialEvents.push({ time: genArrivalB(config, state), type: 'arrival', clientId: 2, data: 'B' });

    const s = { ...state, clientIdCounter: 2 };
    const row = buildMatrixRow(s, initialEvents, 'Inicio');
    return { state: { ...s, simulationMatrix: [row] }, initialEvents };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };
    const clientType = event.data as 'A' | 'B' | undefined;

    switch (event.type) {
      case 'arrival': {
        s.stats.totalArrivals++;
        s.arrivalIndex++;
        const newId = s.clientIdCounter + 1;
        s.clientIdCounter = newId;
        const client: Client = { id: event.clientId ?? newId, arrivalTime: s.clock };

        // Programar siguiente llegada del mismo tipo
        if (clientType === 'A') {
          newEvents.push({ time: s.clock + genArrival(config, s), type: 'arrival', clientId: newId, data: 'A' });
        } else {
          newEvents.push({ time: s.clock + genArrivalB(config, s), type: 'arrival', clientId: newId, data: 'B' });
        }

        if (!s.serverBusy) {
          s.serverBusy = true;
          s.currentClient = { ...client, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genService(config), type: 'departure', clientId: client.id });
          s.log = addLog(s, `Cliente ${clientType} #${client.id} llegó → atendido`, 'arrival');
        } else {
          if (clientType === 'A') {
            s.queue1 = [...s.queue1, client];
            s.log = addLog(s, `Cliente A #${client.id} llegó → cola A (${s.queue1.length})`, 'arrival');
          } else {
            s.queue2 = [...s.queue2, client];
            s.log = addLog(s, `Cliente B #${client.id} llegó → cola B (${s.queue2.length})`, 'arrival');
          }
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
        // Prioridad: primero cola A, luego cola B
        if (s.queue1.length > 0) {
          const [next, ...rest] = s.queue1;
          s.queue1 = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genService(config), type: 'departure', clientId: next.id });
          s.log = addLog(s, `Cliente A #${next.id} pasa al PS`, 'info');
        } else if (s.queue2.length > 0) {
          const [next, ...rest] = s.queue2;
          s.queue2 = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genService(config), type: 'departure', clientId: next.id });
          s.log = addLog(s, `Cliente B #${next.id} pasa al PS`, 'info');
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
export default problem14;
