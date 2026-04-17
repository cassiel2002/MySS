/**
 * PROBLEMA 4: Dos Tipos de Clientes con Prioridad
 * ─────────────────────────────────────────────────
 * Llegan dos tipos de clientes A y B:
 * - Tipo A: llegan con distribución uniforme entre 5 y 10 minutos
 * - Tipo B: llegan con distribución uniforme entre 1 y 4 minutos
 * - Los de tipo A tienen prioridad sobre los B para entrar al PS
 * - No se discrimina dentro del PS (no se interrumpe servicio en curso)
 *
 * Eventos: arrival_a, arrival_b, departure
 * Variables: estado del PS, cantidad A en cola, cantidad B en cola
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult } from '../types';
import { uniform, exponential } from '../random';
import { createBaseState, addLog, updateQueueArea } from '../baseState';

const problem4: ProblemDefinition = {
  id: 4,
  name: 'Prioridad A sobre B',
  description: 'Dos tipos de clientes. A llega cada 5-10 min (uniforme), B cada 1-4 min (uniforme). A tiene prioridad.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    // Primera llegada de cada tipo con distribución uniforme
    const initialEvents: SimEvent[] = [
      { time: uniform(5, 10), type: 'arrival_a', clientId: 1 },
      { time: uniform(1, 4), type: 'arrival_b', clientId: 2 },
    ];
    return { state: { ...state, clientIdCounter: 2, queueA: [], queueB: [] }, initialEvents };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    const totalQueue = s.queueA.length + s.queueB.length;
    const queueAreaUpdate = updateQueueArea(s, totalQueue);
    s.stats = { ...s.stats, ...queueAreaUpdate };

    if (event.type === 'arrival_a' || event.type === 'arrival_b') {
      s.stats.totalArrivals++;
      const newClientId = s.clientIdCounter + 1;
      s.clientIdCounter = newClientId;
      const clientType = event.type === 'arrival_a' ? 'A' : 'B';
      const newClient = {
        id: event.clientId ?? newClientId,
        arrivalTime: s.clock,
        clientType: clientType as 'A' | 'B',
      };

      // Programar siguiente llegada del mismo tipo con distribución UNIFORME
      if (clientType === 'A') {
        newEvents.push({
          time: s.clock + uniform(5, 10),
          type: 'arrival_a',
          clientId: newClientId,
        });
      } else {
        newEvents.push({
          time: s.clock + uniform(1, 4),
          type: 'arrival_b',
          clientId: newClientId,
        });
      }

      if (!s.serverBusy) {
        // PS libre → atender de inmediato (sin discriminar tipo)
        s.serverBusy = true;
        s.currentClient = { ...newClient, serviceStartTime: s.clock };
        newEvents.push({
          time: s.clock + exponential(config.serviceTime),
          type: 'departure',
          clientId: newClient.id,
        });
        s.log = addLog(s, `Cliente ${clientType}#${newClient.id} llegó → PS libre, atendido`, 'arrival');
      } else {
        // PS ocupado → encolar según tipo
        if (clientType === 'A') {
          s.queueA = [...s.queueA, newClient];
          s.log = addLog(s, `Cliente A#${newClient.id} llegó → cola A (${s.queueA.length})`, 'arrival');
        } else {
          s.queueB = [...s.queueB, newClient];
          s.log = addLog(s, `Cliente B#${newClient.id} llegó → cola B (${s.queueB.length})`, 'arrival');
        }
      }

      s.queue = [...s.queueA, ...s.queueB];

    } else if (event.type === 'departure') {
      if (s.currentClient) {
        const waitTime = (s.currentClient.serviceStartTime ?? s.currentClient.arrivalTime) - s.currentClient.arrivalTime;
        const systemTime = s.clock - s.currentClient.arrivalTime;
        s.stats.totalWaitTime += waitTime;
        s.stats.totalSystemTime += systemTime;
        s.stats.totalDepartures++;
        const serviceStarted = s.currentClient.serviceStartTime ?? s.clock;
        s.stats.serverBusyTime += s.clock - serviceStarted;
        s.log = addLog(s, `Cliente ${s.currentClient.clientType ?? ''}#${s.currentClient.id} terminó servicio`, 'departure');
      }

      // Prioridad: primero A, luego B
      if (s.queueA.length > 0) {
        const [nextClient, ...remainingA] = s.queueA;
        s.queueA = remainingA;
        s.currentClient = { ...nextClient, serviceStartTime: s.clock };
        newEvents.push({
          time: s.clock + exponential(config.serviceTime),
          type: 'departure',
          clientId: nextClient.id,
        });
        s.log = addLog(s, `Cliente A#${nextClient.id} (PRIORIDAD) pasó al PS`, 'info');
      } else if (s.queueB.length > 0) {
        const [nextClient, ...remainingB] = s.queueB;
        s.queueB = remainingB;
        s.currentClient = { ...nextClient, serviceStartTime: s.clock };
        newEvents.push({
          time: s.clock + exponential(config.serviceTime),
          type: 'departure',
          clientId: nextClient.id,
        });
        s.log = addLog(s, `Cliente B#${nextClient.id} pasó al PS (no hay A)`, 'info');
      } else {
        s.serverBusy = false;
        s.currentClient = null;
      }

      s.queue = [...s.queueA, ...s.queueB];
    }

    return { newState: s, newEvents };
  },
};

export default problem4;
