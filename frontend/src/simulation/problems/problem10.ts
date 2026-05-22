/**
 * PROBLEMA 10: Máquina productora + Máquina procesadora con descarte
 * ────────────────────────────────────────────────────────────────────
 * - Máquina 1 produce piezas cada X tiempo (llegadas)
 * - Máquina 2 procesa piezas (servicio) con tiempo uniforme
 * - Máquina 2 sale de servicio cada Y minutos durante Z segundos
 * - Si una pieza espera más de W minutos, se descarta
 *
 * Es equivalente al problema 9 pero con contexto industrial.
 * Usa la misma lógica: arrival, departure, abandon, server_off, server_on
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { createBaseState, addLog } from '../baseState';
import { uniform } from '../random';

function genServiceTime(config: ProblemConfig): number {
  if (config.serviceMin !== undefined && config.serviceMax !== undefined) {
    return uniform(config.serviceMin, config.serviceMax);
  }
  return config.serviceTime ?? config.serviceTimeS1;
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
    nextArrivalS2: nextOff?.time ?? nextOn?.time ?? null,
    nextArrivalS3: null,
    nextDepartureS1: nextDep?.time ?? null,
    nextDepartureS2: null,
    nextDepartureS3: null,
    queueLenS1: state.queue.length,
    queueLenS2: 0,
    queueLenS3: 0,
    serverStateS1: state.serverBusy ? 1 : 0,
    serverStateS2: state.serverOn ? 1 : 0,
    serverStateS3: 0,
  };
}

const problem10: ProblemDefinition = {
  id: 10,
  name: 'Producción con Descarte',
  description: 'Máquina produce piezas → procesadora con descansos. Piezas se descartan si esperan demasiado.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    // Primera pieza producida
    initialEvents.push({ time: config.arrivalInterval, type: 'arrival', clientId: 1 });

    // Primer descanso de la máquina procesadora
    if (config.serverOnTime && config.serverOnTime > 0) {
      initialEvents.push({ time: config.serverOnTime, type: 'server_off' });
    }

    const initialRow = buildMatrixRow(state, initialEvents, 'Inicio');

    return {
      state: { ...state, clientIdCounter: 1, serverOn: true, simulationMatrix: [initialRow] },
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
        const piece = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

        // Siguiente pieza producida (constante)
        newEvents.push({ time: s.clock + config.arrivalInterval, type: 'arrival', clientId: newClientId });

        if (!s.serverBusy && s.serverOn) {
          s.serverBusy = true;
          s.currentClient = { ...piece, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: piece.id });
          s.log = addLog(s, `Pieza #${piece.id} → procesando`, 'arrival');
        } else {
          s.queue = [...s.queue, piece];
          if (config.abandonTime && config.abandonTime > 0) {
            newEvents.push({ time: s.clock + config.abandonTime, type: 'abandon', clientId: piece.id });
          }
          s.log = addLog(s, `Pieza #${piece.id} → espera (${s.queue.length})`, 'arrival');
        }
        break;
      }

      case 'departure': {
        if (s.currentClient) {
          s.stats.totalDepartures++;
          s.servedClients++;
          s.log = addLog(s, `Pieza #${s.currentClient.id} procesada ✓`, 'departure');
        }
        if (s.queue.length > 0 && s.serverOn) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          s.serverBusy = true;
          newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: next.id });
          cancelEvents.push({ clientId: next.id, type: 'abandon' });
          s.log = addLog(s, `Pieza #${next.id} → procesando`, 'info');
        } else {
          s.serverBusy = false;
          s.currentClient = null;
        }
        break;
      }

      case 'abandon': {
        const id = event.clientId;
        const inQueue = s.queue.find(c => c.id === id);
        if (inQueue) {
          s.queue = s.queue.filter(c => c.id !== id);
          s.abandonedClients++;
          s.log = addLog(s, `Pieza #${id} DESCARTADA (espera excedida)`, 'abandon');
        }
        break;
      }

      case 'server_off': {
        s.serverOn = false;
        s.serverBreaks++;
        s.log = addLog(s, `Máquina → MANTENIMIENTO`, 'server');
        if (config.serverOffTime) {
          newEvents.push({ time: s.clock + config.serverOffTime, type: 'server_on' });
        }
        break;
      }

      case 'server_on': {
        s.serverOn = true;
        s.log = addLog(s, `Máquina → ACTIVA`, 'server');
        if (!s.serverBusy && s.queue.length > 0) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          s.currentClient = { ...next, serviceStartTime: s.clock };
          s.serverBusy = true;
          newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: next.id });
          cancelEvents.push({ clientId: next.id, type: 'abandon' });
        }
        if (config.serverOnTime) {
          newEvents.push({ time: s.clock + config.serverOnTime, type: 'server_off' });
        }
        break;
      }
    }

    return { newState: s, newEvents, cancelEvents };
  },
};

export { buildMatrixRow };
export default problem10;
