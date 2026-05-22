/**
 * PROBLEMA 9: Cola M/M/1 con Abandono + Servidor Intermitente
 * ─────────────────────────────────────────────────────────────
 * - Clientes llegan uno a uno a intervalos aleatorios
 * - Servidor trabaja intervalos aleatorios y descansa intervalos aleatorios
 * - Si un cliente espera más de X minutos en cola, abandona
 * - Estado inicial configurable (q, ps, S)
 *
 * Eventos: arrival, departure, abandon, server_off, server_on
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { createBaseState, addLog } from '../baseState';
import { exponential, uniform } from '../random';

function genTime(config: ProblemConfig, value: number): number {
  if (config.arrivalMode === 'manual' || config.timeMode === 'manual') return value;
  if (config.distribution === 'uniform' || config.arrivalDistribution === 'uniform') {
    const min = value * 0.5;
    const max = value * 1.5;
    return uniform(min, max);
  }
  return exponential(value);
}

function genServiceTimeSingle(config: ProblemConfig): number {
  const value = config.serviceTime ?? config.serviceTimeS1;
  if (config.serviceMin !== undefined && config.serviceMax !== undefined) {
    return uniform(config.serviceMin, config.serviceMax);
  }
  if (config.serviceMode === 'manual') return value;
  return genTime(config, value);
}

function genArrivalTimeSingle(config: ProblemConfig, state: SimulationState): number {
  if (config.arrivalMode === 'list' && config.arrivalList.length > 0) {
    const idx = state.arrivalIndex % config.arrivalList.length;
    return config.arrivalList[idx];
  }
  if (config.arrivalMode === 'manual') return config.arrivalInterval;
  return genTime(config, config.arrivalInterval);
}

function buildMatrixRow(state: SimulationState, fel: SimEvent[], desc: string): MatrixRow {
  const nextArr = fel.find(e => e.type === 'arrival');
  const nextDep = fel.find(e => e.type === 'departure');
  const nextOff = fel.find(e => e.type === 'server_off');
  const nextOn = fel.find(e => e.type === 'server_on');

  return {
    clock: state.clock,
    eventDescription: desc,
    nextArrivalS1: nextArr?.time ?? null,
    nextArrivalS2: nextOff?.time ?? nextOn?.time ?? null, // Mostrar próx evento servidor
    nextArrivalS3: null,
    nextDepartureS1: nextDep?.time ?? null,
    nextDepartureS2: null,
    nextDepartureS3: null,
    queueLenS1: state.queue.length,
    queueLenS2: 0,
    queueLenS3: 0,
    serverStateS1: state.serverBusy ? 1 : 0,
    serverStateS2: state.serverOn ? 1 : 0, // 1=ON, 0=OFF (descanso)
    serverStateS3: 0,
  };
}

const problem9: ProblemDefinition = {
  id: 9,
  name: 'Cola con Abandono + Servidor Intermitente',
  description: 'Un servidor que descansa periódicamente. Clientes abandonan si esperan demasiado.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    // Estado inicial configurable
    const initialQueue = config.initialQueue ?? 0;
    const initialWait = config.initialWaitTime ?? 0;

    // Crear clientes iniciales en cola con su tiempo de espera
    const queueClients = [];
    for (let i = 0; i < initialQueue; i++) {
      const client = { id: i + 1, arrivalTime: -initialWait }; // llegaron hace initialWait
      queueClients.push(client);
      // Programar abandono para cada cliente en cola
      if (config.abandonTime && config.abandonTime > 0) {
        const abandonAt = (config.abandonTime - initialWait);
        if (abandonAt > 0) {
          initialEvents.push({ time: abandonAt, type: 'abandon', clientId: i + 1 });
        } else {
          // Ya deberían haber abandonado — abandonan en t=0
          initialEvents.push({ time: 0.001 * (i + 1), type: 'abandon', clientId: i + 1 });
        }
      }
    }

    let clientId = initialQueue;

    // Primera llegada
    clientId++;
    const firstArrival = config.arrivalMode === 'manual' ? config.arrivalInterval : genTime(config, config.arrivalInterval);
    initialEvents.push({ time: firstArrival, type: 'arrival', clientId });

    // Programar primer descanso del servidor
    if (config.serverOnTime && config.serverOnTime > 0) {
      initialEvents.push({ time: config.serverOnTime, type: 'server_off' });
    }

    const initialRow = buildMatrixRow(
      { ...state, queue: queueClients, serverOn: true, clientIdCounter: clientId },
      initialEvents,
      'Inicio'
    );

    return {
      state: {
        ...state,
        clientIdCounter: clientId,
        queue: queueClients,
        serverOn: true,
        simulationMatrix: [initialRow],
      },
      initialEvents,
    };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    const cancelEvents: { clientId: number; type: string }[] = [];
    let s = { ...state, stats: { ...state.stats } };

    switch (event.type) {
      case 'arrival': {
        s.stats.totalArrivals++;
        s.arrivalIndex++;
        const newClientId = s.clientIdCounter + 1;
        s.clientIdCounter = newClientId;
        const newClient = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

        // Programar siguiente llegada
        newEvents.push({
          time: s.clock + genArrivalTimeSingle(config, s),
          type: 'arrival',
          clientId: newClientId,
        });

        if (!s.serverBusy && s.serverOn) {
          // Servidor libre y disponible
          s.serverBusy = true;
          s.currentClient = { ...newClient, serviceStartTime: s.clock };
          newEvents.push({
            time: s.clock + genServiceTimeSingle(config),
            type: 'departure',
            clientId: newClient.id,
          });
          s.log = addLog(s, `Cliente #${newClient.id} llegó → atendido`, 'arrival');
        } else {
          // Encolar
          s.queue = [...s.queue, newClient];
          // Programar abandono
          if (config.abandonTime && config.abandonTime > 0) {
            newEvents.push({
              time: s.clock + config.abandonTime,
              type: 'abandon',
              clientId: newClient.id,
            });
          }
          s.log = addLog(s, `Cliente #${newClient.id} llegó → cola (${s.queue.length})`, 'arrival');
        }
        break;
      }

      case 'departure': {
        if (s.currentClient) {
          s.stats.totalDepartures++;
          s.servedClients++;
          const systemTime = s.clock - s.currentClient.arrivalTime;
          s.stats.totalSystemTime += systemTime;
          s.log = addLog(s, `Cliente #${s.currentClient.id} atendido → sale`, 'departure');
        }

        // Atender siguiente si servidor ON
        if (s.queue.length > 0 && s.serverOn) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          s.serverBusy = true;
          newEvents.push({
            time: s.clock + genServiceTimeSingle(config),
            type: 'departure',
            clientId: next.id,
          });
          // Cancelar abandono del cliente que pasa a servicio
          cancelEvents.push({ clientId: next.id, type: 'abandon' });
          s.log = addLog(s, `Cliente #${next.id} pasa al servidor`, 'info');
        } else {
          s.serverBusy = false;
          s.currentClient = null;
        }
        break;
      }

      case 'abandon': {
        // Cliente abandona la cola
        const clientId = event.clientId;
        const inQueue = s.queue.find(c => c.id === clientId);
        if (inQueue) {
          s.queue = s.queue.filter(c => c.id !== clientId);
          s.abandonedClients++;
          s.log = addLog(s, `Cliente #${clientId} ABANDONÓ la cola`, 'abandon');
        }
        break;
      }

      case 'server_off': {
        // Servidor sale a descanso
        s.serverOn = false;
        s.serverBreaks++;
        s.log = addLog(s, `Servidor → DESCANSO (break #${s.serverBreaks})`, 'server');
        // Programar regreso
        if (config.serverOffTime && config.serverOffTime > 0) {
          newEvents.push({
            time: s.clock + config.serverOffTime,
            type: 'server_on',
          });
        }
        break;
      }

      case 'server_on': {
        // Servidor vuelve de descanso
        s.serverOn = true;
        s.log = addLog(s, `Servidor → ACTIVO`, 'server');

        // Si hay clientes esperando y servidor no está ocupado, atender
        if (!s.serverBusy && s.queue.length > 0) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          s.serverBusy = true;
          newEvents.push({
            time: s.clock + genServiceTimeSingle(config),
            type: 'departure',
            clientId: next.id,
          });
          cancelEvents.push({ clientId: next.id, type: 'abandon' });
          s.log = addLog(s, `Cliente #${next.id} pasa al servidor`, 'info');
        }

        // Programar próximo descanso
        if (config.serverOnTime && config.serverOnTime > 0) {
          newEvents.push({
            time: s.clock + config.serverOnTime,
            type: 'server_off',
          });
        }
        break;
      }
    }

    return { newState: s, newEvents, cancelEvents };
  },
};

export { buildMatrixRow };
export default problem9;
