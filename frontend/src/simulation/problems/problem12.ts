/**
 * PROBLEMA 12: Carpintero — Proceso secuencial con recurso único
 * ───────────────────────────────────────────────────────────────
 * - N sillas (piezas) esperan ser procesadas
 * - Un solo carpintero (servidor) las procesa una por una
 * - Cada silla pasa por 3 etapas: Armar → Lijar → Lustrar
 * - Tiempos de cada etapa son uniformes entre min y max
 * - Se quiere saber: ¿cuántas sillas terminó en X horas?
 *
 * Modelado: Es un sistema en serie con un solo servidor que hace todo.
 * Cola inicial = N piezas. No hay nuevas llegadas.
 * Eventos: departure_s1 (fin armar), departure_s2 (fin lijar), departure_s3 (fin lustrar)
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { createBaseState, addLog } from '../baseState';
import { uniform } from '../random';

function genServiceForStage(config: ProblemConfig, stage: 1 | 2 | 3): number {
  const mins = { 1: config.serviceMinS1 ?? 30, 2: config.serviceMinS2 ?? 10, 3: config.serviceMinS3 ?? 5 };
  const maxs = { 1: config.serviceMaxS1 ?? 40, 2: config.serviceMaxS2 ?? 20, 3: config.serviceMaxS3 ?? 30 };
  return uniform(mins[stage], maxs[stage]);
}

function buildMatrixRow(state: SimulationState, fel: SimEvent[], desc: string): MatrixRow {
  const nextDepS1 = fel.find(e => e.type === 'departure_s1');
  const nextDepS2 = fel.find(e => e.type === 'departure_s2');
  const nextDepS3 = fel.find(e => e.type === 'departure_s3');

  return {
    clock: state.clock,
    eventDescription: desc,
    nextArrivalS1: null,
    nextArrivalS2: null,
    nextArrivalS3: null,
    nextDepartureS1: nextDepS1?.time ?? null,
    nextDepartureS2: nextDepS2?.time ?? null,
    nextDepartureS3: nextDepS3?.time ?? null,
    queueLenS1: state.queue1.length,  // Pendientes de armar
    queueLenS2: state.queue2.length,  // Pendientes de lijar
    queueLenS3: state.queue3.length,  // Pendientes de lustrar
    serverStateS1: state.server1Busy ? 1 : 0,
    serverStateS2: state.server2Busy ? 1 : 0,
    serverStateS3: state.server3Busy ? 1 : 0,
  };
}

const problem12: ProblemDefinition = {
  id: 12,
  name: 'Carpintero (Proceso Secuencial)',
  description: 'Un carpintero procesa N sillas: Armar → Lijar → Lustrar. ¿Cuántas termina en X horas?',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    // Crear las N piezas en cola 1 (pendientes de armar)
    const numPieces = config.initialQueue ?? 6;
    const pieces = [];
    for (let i = 1; i <= numPieces; i++) {
      pieces.push({ id: i, arrivalTime: 0 });
    }

    // El carpintero empieza a armar la primera silla
    const [first, ...rest] = pieces;
    const serviceTime = genServiceForStage(config, 1);
    initialEvents.push({ time: serviceTime, type: 'departure_s1', clientId: first.id });

    const initialRow = buildMatrixRow(
      { ...state, queue1: rest, server1Busy: true, currentClientS1: { ...first, serviceStartTime: 0 }, clientIdCounter: numPieces },
      initialEvents,
      'Inicio — armando silla #1'
    );

    return {
      state: {
        ...state,
        queue1: rest,
        server1Busy: true,
        currentClientS1: { ...first, serviceStartTime: 0 },
        clientIdCounter: numPieces,
        simulationMatrix: [initialRow],
      },
      initialEvents,
    };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    switch (event.type) {
      case 'departure_s1': {
        // Terminó de ARMAR → pasa a cola de lijar
        const piece = s.currentClientS1;
        if (piece) {
          s.stats.departuresS1++;
          s.queue2 = [...s.queue2, { ...piece, serviceStartTime: undefined }];
          s.log = addLog(s, `Silla #${piece.id} armada ✓ → cola lijar`, 'departure');
        }

        // Si hay más sillas por armar, empezar la siguiente
        if (s.queue1.length > 0) {
          const [next, ...rest] = s.queue1;
          s.queue1 = rest;
          s.currentClientS1 = { ...next, serviceStartTime: s.clock };
          s.server1Busy = true;
          newEvents.push({ time: s.clock + genServiceForStage(config, 1), type: 'departure_s1', clientId: next.id });
          s.log = addLog(s, `Armando silla #${next.id}...`, 'info');
        } else {
          s.server1Busy = false;
          s.currentClientS1 = null;
        }

        // Si no está lijando, empezar a lijar
        if (!s.server2Busy && s.queue2.length > 0) {
          const [next, ...rest] = s.queue2;
          s.queue2 = rest;
          s.currentClientS2 = { ...next, serviceStartTime: s.clock };
          s.server2Busy = true;
          newEvents.push({ time: s.clock + genServiceForStage(config, 2), type: 'departure_s2', clientId: next.id });
          s.log = addLog(s, `Lijando silla #${next.id}...`, 'info');
        }
        break;
      }

      case 'departure_s2': {
        // Terminó de LIJAR → pasa a cola de lustrar
        const piece = s.currentClientS2;
        if (piece) {
          s.stats.departuresS2++;
          s.queue3 = [...s.queue3, { ...piece, serviceStartTime: undefined }];
          s.log = addLog(s, `Silla #${piece.id} lijada ✓ → cola lustrar`, 'departure');
        }

        // Siguiente a lijar
        if (s.queue2.length > 0) {
          const [next, ...rest] = s.queue2;
          s.queue2 = rest;
          s.currentClientS2 = { ...next, serviceStartTime: s.clock };
          s.server2Busy = true;
          newEvents.push({ time: s.clock + genServiceForStage(config, 2), type: 'departure_s2', clientId: next.id });
          s.log = addLog(s, `Lijando silla #${next.id}...`, 'info');
        } else {
          s.server2Busy = false;
          s.currentClientS2 = null;
        }

        // Si no está lustrando, empezar
        if (!s.server3Busy && s.queue3.length > 0) {
          const [next, ...rest] = s.queue3;
          s.queue3 = rest;
          s.currentClientS3 = { ...next, serviceStartTime: s.clock };
          s.server3Busy = true;
          newEvents.push({ time: s.clock + genServiceForStage(config, 3), type: 'departure_s3', clientId: next.id });
          s.log = addLog(s, `Lustrando silla #${next.id}...`, 'info');
        }
        break;
      }

      case 'departure_s3': {
        // Terminó de LUSTRAR → silla TERMINADA
        const piece = s.currentClientS3;
        if (piece) {
          s.stats.departuresS3++;
          s.stats.totalDepartures++;
          s.servedClients++;
          const totalTime = s.clock - piece.arrivalTime;
          s.stats.totalSystemTime += totalTime;
          s.log = addLog(s, `🪑 Silla #${piece.id} TERMINADA (${totalTime.toFixed(1)} min)`, 'departure');
        }

        // Siguiente a lustrar
        if (s.queue3.length > 0) {
          const [next, ...rest] = s.queue3;
          s.queue3 = rest;
          s.currentClientS3 = { ...next, serviceStartTime: s.clock };
          s.server3Busy = true;
          newEvents.push({ time: s.clock + genServiceForStage(config, 3), type: 'departure_s3', clientId: next.id });
          s.log = addLog(s, `Lustrando silla #${next.id}...`, 'info');
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
export default problem12;
