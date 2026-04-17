/**
 * PROBLEMA 1: Cola Simple M/M/1
 * ─────────────────────────────
 * Modelo base de teoría de colas. Soporta:
 * - Tiempos aleatorios (exponencial/uniforme/normal)
 * - Tiempos manuales (constantes)
 * - Tiempos en rango uniforme (a-b)
 * - Estado inicial configurable (q, PS)
 *
 * Eventos: arrival, departure
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult } from '../types';
import { genArrivalTime, genServiceTime } from '../timeGen';
import { createBaseState, addLog, updateQueueArea } from '../baseState';

const problem1: ProblemDefinition = {
  id: 1,
  name: 'Cola Simple M/M/1',
  description: 'Un servidor, cola FIFO. Tiempos configurables: aleatorios, manuales o rango uniforme.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();

    // Aplicar estado inicial configurable
    const initialQueue = config.initialQueue ?? 0;
    const initialBusy = config.initialServerBusy ?? false;

    // Crear clientes iniciales en cola
    let clientId = 0;
    const queueClients = [];
    for (let i = 0; i < initialQueue; i++) {
      clientId++;
      queueClients.push({ id: clientId, arrivalTime: 0 });
    }

    // Si el servidor empieza ocupado, crear cliente en servicio
    let currentClient = null;
    if (initialBusy) {
      clientId++;
      currentClient = { id: clientId, arrivalTime: 0, serviceStartTime: 0 };
    }

    const initialEvents: SimEvent[] = [];

    // Programar primera llegada
    clientId++;
    initialEvents.push({
      time: genArrivalTime(config),
      type: 'arrival',
      clientId,
    });

    // Si servidor ocupado, programar su departure
    if (initialBusy && currentClient) {
      initialEvents.push({
        time: genServiceTime(config),
        type: 'departure',
        clientId: currentClient.id,
      });
    }

    // Si hay cola y servidor libre, atender al primero
    if (!initialBusy && queueClients.length > 0) {
      const first = queueClients.shift()!;
      currentClient = { ...first, serviceStartTime: 0 };
      initialEvents.push({
        time: genServiceTime(config),
        type: 'departure',
        clientId: first.id,
      });
      return {
        state: {
          ...state,
          clientIdCounter: clientId,
          serverBusy: true,
          currentClient,
          queue: queueClients,
        },
        initialEvents,
      };
    }

    return {
      state: {
        ...state,
        clientIdCounter: clientId,
        serverBusy: initialBusy,
        currentClient,
        queue: queueClients,
      },
      initialEvents,
    };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    const queueAreaUpdate = updateQueueArea(s, s.queue.length);
    s.stats = { ...s.stats, ...queueAreaUpdate };

    if (event.type === 'arrival') {
      s.stats.totalArrivals++;
      const newClientId = s.clientIdCounter + 1;
      s.clientIdCounter = newClientId;
      const newClient = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

      // Programar siguiente llegada
      newEvents.push({
        time: s.clock + genArrivalTime(config),
        type: 'arrival',
        clientId: newClientId,
      });

      if (!s.serverBusy) {
        s.serverBusy = true;
        s.currentClient = { ...newClient, serviceStartTime: s.clock };
        newEvents.push({
          time: s.clock + genServiceTime(config),
          type: 'departure',
          clientId: newClient.id,
        });
        s.log = addLog(s, `Cliente #${newClient.id} llegó → servidor libre, atendido`, 'arrival');
      } else {
        s.queue = [...s.queue, newClient];
        s.log = addLog(s, `Cliente #${newClient.id} llegó → cola (${s.queue.length})`, 'arrival');
      }

    } else if (event.type === 'departure') {
      if (s.currentClient) {
        const waitTime = (s.currentClient.serviceStartTime ?? s.currentClient.arrivalTime) - s.currentClient.arrivalTime;
        const systemTime = s.clock - s.currentClient.arrivalTime;
        s.stats.totalWaitTime += waitTime;
        s.stats.totalSystemTime += systemTime;
        s.stats.totalDepartures++;
        const serviceStarted = s.currentClient.serviceStartTime ?? s.clock;
        s.stats.serverBusyTime += s.clock - serviceStarted;
        s.log = addLog(s, `Cliente #${s.currentClient.id} terminó servicio`, 'departure');
      }

      if (s.queue.length > 0) {
        const [nextClient, ...remainingQueue] = s.queue;
        s.queue = remainingQueue;
        s.currentClient = { ...nextClient, serviceStartTime: s.clock };
        newEvents.push({
          time: s.clock + genServiceTime(config),
          type: 'departure',
          clientId: nextClient.id,
        });
        s.log = addLog(s, `Cliente #${nextClient.id} pasó al servidor`, 'info');
      } else {
        s.serverBusy = false;
        s.currentClient = null;
      }
    }

    return { newState: s, newEvents };
  },
};

export default problem1;
