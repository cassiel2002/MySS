/**
 * PROBLEMA 7: Servidores Paralelos (Servicio Único)
 * ──────────────────────────────────────────────────
 * Los clientes llegan a una COLA ÚNICA para recibir un servicio único.
 * Hay 3 (o más) puestos de servicio que prestan el MISMO servicio.
 * Para el cliente es indistinto en qué puesto será atendido.
 * Al llegar, si hay un puesto libre, va al primero disponible.
 * Si todos están ocupados, espera en la cola única.
 *
 * Eventos:
 *   1) Llegada de un cliente al sistema PARA RECIBIR EL SERVICIO ÚNICO
 *   2) Fin de servicio PS1
 *   3) Fin de servicio PS2
 *   4) Fin de servicio PS3
 *
 * Variables de estado:
 *   1) Estado de ocupado o libre del PS1
 *   2) Estado de ocupado o libre del PS2
 *   3) Estado de ocupado o libre del PS3
 *   4) Cantidad de clientes en cola
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { genArrivalTime, genServiceTime } from '../timeGen';
import { createBaseState, addLog } from '../baseState';

/**
 * Construye una fila de la matriz de simulación para el problema 7.
 */
function buildMatrixRow(
  state: SimulationState,
  fel: SimEvent[],
  eventDesc: string
): MatrixRow {
  const nextArrival = fel.find(e => e.type === 'arrival');
  const nextDepS1 = fel.find(e => e.type === 'departure_s1');
  const nextDepS2 = fel.find(e => e.type === 'departure_s2');
  const nextDepS3 = fel.find(e => e.type === 'departure_s3');

  return {
    clock: state.clock,
    eventDescription: eventDesc,
    // En problema 7, solo hay una llegada (al sistema para servicio único)
    nextArrivalS1: nextArrival?.time ?? null,
    nextArrivalS2: null,
    nextArrivalS3: null,
    nextDepartureS1: nextDepS1?.time ?? null,
    nextDepartureS2: nextDepS2?.time ?? null,
    nextDepartureS3: nextDepS3?.time ?? null,
    // Cola única
    queueLenS1: state.queue.length,
    queueLenS2: 0,
    queueLenS3: 0,
    serverStateS1: state.server1Busy ? 1 : 0,
    serverStateS2: state.server2Busy ? 1 : 0,
    serverStateS3: state.server3Busy ? 1 : 0,
  };
}

/**
 * Encuentra el primer servidor libre considerando solo los activos (numServers).
 * Retorna null si todos están ocupados.
 */
function findFreeServer(state: SimulationState, config: ProblemConfig): 1 | 2 | 3 | null {
  const num = config.numServers ?? 3;
  if (num >= 1 && !state.server1Busy) return 1;
  if (num >= 2 && !state.server2Busy) return 2;
  if (num >= 3 && !state.server3Busy) return 3;
  return null;
}

/**
 * Asigna un cliente a un servidor específico.
 */
function assignToServer(
  s: SimulationState,
  client: Client,
  server: 1 | 2 | 3,
  config: ProblemConfig,
  newEvents: SimEvent[]
): void {
  const serviceTime = genServiceTime(config, server);
  const eventType: SimEvent['type'] = server === 1 ? 'departure_s1' : server === 2 ? 'departure_s2' : 'departure_s3';

  const clientInService = { ...client, serviceStartTime: s.clock };

  if (server === 1) {
    s.server1Busy = true;
    s.currentClientS1 = clientInService;
  } else if (server === 2) {
    s.server2Busy = true;
    s.currentClientS2 = clientInService;
  } else {
    s.server3Busy = true;
    s.currentClientS3 = clientInService;
  }

  newEvents.push({
    time: s.clock + serviceTime,
    type: eventType,
    clientId: client.id,
  });
}

import type { Client } from '../types';

const problem7: ProblemDefinition = {
  id: 7,
  name: 'Servidores Paralelos',
  description: 'Cola única con 3 puestos de servicio paralelos que prestan el mismo servicio. El cliente va al primer puesto libre.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];
    const numServers = config.numServers ?? 3;

    // Aplicar estado inicial de cada PS
    let clientId = 0;

    if (config.initialPS1 && numServers >= 1) {
      clientId++;
      state.server1Busy = true;
      state.currentClientS1 = { id: clientId, arrivalTime: 0, serviceStartTime: 0 };
      initialEvents.push({ time: genServiceTime(config, 1), type: 'departure_s1', clientId });
    }
    if (config.initialPS2 && numServers >= 2) {
      clientId++;
      state.server2Busy = true;
      state.currentClientS2 = { id: clientId, arrivalTime: 0, serviceStartTime: 0 };
      initialEvents.push({ time: genServiceTime(config, 2), type: 'departure_s2', clientId });
    }
    if (config.initialPS3 && numServers >= 3) {
      clientId++;
      state.server3Busy = true;
      state.currentClientS3 = { id: clientId, arrivalTime: 0, serviceStartTime: 0 };
      initialEvents.push({ time: genServiceTime(config, 3), type: 'departure_s3', clientId });
    }

    // Clientes iniciales en cola
    const initialQueue = config.initialQueue ?? 0;
    for (let i = 0; i < initialQueue; i++) {
      clientId++;
      state.queue.push({ id: clientId, arrivalTime: 0 });
    }

    // Programar primera llegada al sistema
    clientId++;
    const firstArrivalTime = genArrivalTime(config, 1);
    initialEvents.push({ time: firstArrivalTime, type: 'arrival', clientId });

    state.clientIdCounter = clientId;
    const initialRow = buildMatrixRow(state, initialEvents, 'Inicio de simulación');
    state.simulationMatrix = [initialRow];

    return { state, initialEvents };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    switch (event.type) {
      case 'arrival': {
        s.stats.totalArrivals++;
        s.arrivalIndex++;
        const newClientId = s.clientIdCounter + 1;
        s.clientIdCounter = newClientId;
        const newClient: Client = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

        // Programar siguiente llegada
        newEvents.push({
          time: s.clock + genArrivalTime(config, 1, s),
          type: 'arrival',
          clientId: newClientId,
        });

        // Buscar servidor libre
        const freeServer = findFreeServer(s, config);
        if (freeServer !== null) {
          assignToServer(s, newClient, freeServer, config, newEvents);
          s.stats.totalWaitTime += 0; // No esperó
          s.log = addLog(s, `Cliente #${newClient.id} llegó → PS${freeServer} libre, atendido`, 'arrival');
        } else {
          // Todos ocupados, encolar
          s.queue = [...s.queue, newClient];
          s.log = addLog(s, `Cliente #${newClient.id} llegó → cola (${s.queue.length})`, 'arrival');
        }
        break;
      }

      case 'departure_s1': {
        const client = s.currentClientS1;
        if (client) {
          const serviceStart = client.serviceStartTime ?? s.clock;
          s.stats.server1BusyTime += s.clock - serviceStart;
          s.stats.departuresS1++;
          s.stats.totalDepartures++;
          const systemTime = s.clock - client.arrivalTime;
          s.stats.totalSystemTime += systemTime;
          const waitTime = (client.serviceStartTime ?? s.clock) - client.arrivalTime;
          s.stats.totalWaitTime += waitTime;
          s.log = addLog(s, `Cliente #${client.id} terminó PS1 → SALE (W=${systemTime.toFixed(2)})`, 'departure');
        }

        // Atender siguiente de la cola
        if (s.queue.length > 0) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          assignToServer(s, next, 1, config, newEvents);
          s.log = addLog(s, `Cliente #${next.id} pasa al PS1`, 'info');
        } else {
          s.server1Busy = false;
          s.currentClientS1 = null;
        }
        break;
      }

      case 'departure_s2': {
        const client = s.currentClientS2;
        if (client) {
          const serviceStart = client.serviceStartTime ?? s.clock;
          s.stats.server2BusyTime += s.clock - serviceStart;
          s.stats.departuresS2++;
          s.stats.totalDepartures++;
          const systemTime = s.clock - client.arrivalTime;
          s.stats.totalSystemTime += systemTime;
          const waitTime = (client.serviceStartTime ?? s.clock) - client.arrivalTime;
          s.stats.totalWaitTime += waitTime;
          s.log = addLog(s, `Cliente #${client.id} terminó PS2 → SALE (W=${systemTime.toFixed(2)})`, 'departure');
        }

        if (s.queue.length > 0) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          assignToServer(s, next, 2, config, newEvents);
          s.log = addLog(s, `Cliente #${next.id} pasa al PS2`, 'info');
        } else {
          s.server2Busy = false;
          s.currentClientS2 = null;
        }
        break;
      }

      case 'departure_s3': {
        const client = s.currentClientS3;
        if (client) {
          const serviceStart = client.serviceStartTime ?? s.clock;
          s.stats.server3BusyTime += s.clock - serviceStart;
          s.stats.departuresS3++;
          s.stats.totalDepartures++;
          const systemTime = s.clock - client.arrivalTime;
          s.stats.totalSystemTime += systemTime;
          const waitTime = (client.serviceStartTime ?? s.clock) - client.arrivalTime;
          s.stats.totalWaitTime += waitTime;
          s.log = addLog(s, `Cliente #${client.id} terminó PS3 → SALE (W=${systemTime.toFixed(2)})`, 'departure');
        }

        if (s.queue.length > 0) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          assignToServer(s, next, 3, config, newEvents);
          s.log = addLog(s, `Cliente #${next.id} pasa al PS3`, 'info');
        } else {
          s.server3Busy = false;
          s.currentClientS3 = null;
        }
        break;
      }
    }

    return { newState: s, newEvents };
  },
};

export { buildMatrixRow };
export default problem7;
