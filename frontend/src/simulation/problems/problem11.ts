/**
 * PROBLEMA 11: Máquina con Desvío (sin espera)
 * ──────────────────────────────────────────────
 * - Piezas llegan a intervalos aleatorios
 * - Si la máquina está libre, se procesa
 * - Si está ocupada, la pieza se DESVÍA instantáneamente (no espera)
 * - Se quiere saber: relación entre piezas procesadas y desviadas
 *
 * Eventos: arrival, departure
 * (No hay cola, no hay abandono — desvío inmediato)
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { createBaseState, addLog } from '../baseState';
import { exponential, uniform } from '../random';

function genServiceTime(config: ProblemConfig): number {
  if (config.serviceMin !== undefined && config.serviceMax !== undefined) {
    return uniform(config.serviceMin, config.serviceMax);
  }
  const value = config.serviceTime ?? config.serviceTimeS1;
  if (config.serviceMode === 'manual') return value;
  return exponential(value);
}

function genArrivalTime(config: ProblemConfig, state: SimulationState): number {
  if (config.arrivalMode === 'list' && config.arrivalList.length > 0) {
    const idx = state.arrivalIndex % config.arrivalList.length;
    return config.arrivalList[idx];
  }
  if (config.arrivalMode === 'manual') return config.arrivalInterval;
  return exponential(config.arrivalInterval);
}

function buildMatrixRow(state: SimulationState, fel: SimEvent[], desc: string): MatrixRow {
  const nextArr = fel.find(e => e.type === 'arrival');
  const nextDep = fel.find(e => e.type === 'departure');

  return {
    clock: state.clock,
    eventDescription: desc,
    nextArrivalS1: nextArr?.time ?? null,
    nextArrivalS2: null,
    nextArrivalS3: null,
    nextDepartureS1: nextDep?.time ?? null,
    nextDepartureS2: null,
    nextDepartureS3: null,
    queueLenS1: state.divertedClients, // Mostrar desviadas en lugar de cola
    queueLenS2: state.servedClients,   // Mostrar procesadas
    queueLenS3: 0,
    serverStateS1: state.serverBusy ? 1 : 0,
    serverStateS2: 0,
    serverStateS3: 0,
  };
}

const problem11: ProblemDefinition = {
  id: 11,
  name: 'Máquina con Desvío',
  description: 'Si la máquina está ocupada, la pieza se desvía instantáneamente. No hay cola.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    const firstArrival = config.arrivalMode === 'manual' ? config.arrivalInterval : exponential(config.arrivalInterval);
    initialEvents.push({ time: firstArrival, type: 'arrival', clientId: 1 });

    const initialRow = buildMatrixRow(state, initialEvents, 'Inicio');

    return {
      state: { ...state, clientIdCounter: 1, simulationMatrix: [initialRow] },
      initialEvents,
    };
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
        const piece = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

        // Siguiente llegada
        newEvents.push({ time: s.clock + genArrivalTime(config, s), type: 'arrival', clientId: newClientId });

        if (!s.serverBusy) {
          // Máquina libre → procesar
          s.serverBusy = true;
          s.currentClient = { ...piece, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: piece.id });
          s.log = addLog(s, `Pieza #${piece.id} → procesando`, 'arrival');
        } else {
          // Máquina ocupada → DESVIAR
          s.divertedClients++;
          s.log = addLog(s, `Pieza #${piece.id} → DESVIADA (máquina ocupada)`, 'abandon');
        }
        break;
      }

      case 'departure': {
        if (s.currentClient) {
          s.stats.totalDepartures++;
          s.servedClients++;
          s.log = addLog(s, `Pieza #${s.currentClient.id} procesada ✓`, 'departure');
        }
        s.serverBusy = false;
        s.currentClient = null;
        break;
      }
    }

    return { newState: s, newEvents };
  },
};

export { buildMatrixRow };
export default problem11;
