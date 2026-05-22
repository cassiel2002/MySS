/**
 * Hook principal de simulación.
 * Gestiona el estado, la FEL, y las acciones (iniciar, paso, reset).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SimulationState, SimEvent, ProblemConfig, ComputedMetrics } from '../simulation/types';
import { insertEvent, getNextEvent } from '../simulation/eventQueue';
import { getProblem } from '../simulation/problems';
import { buildMatrixRow as buildMatrixRow6 } from '../simulation/problems/problem6';
import { buildMatrixRow as buildMatrixRow7 } from '../simulation/problems/problem7';
import { buildMatrixRow as buildMatrixRow8 } from '../simulation/problems/problem8';
import { buildMatrixRow as buildMatrixRow9 } from '../simulation/problems/problem9';
import { buildMatrixRow as buildMatrixRow10 } from '../simulation/problems/problem10';
import { buildMatrixRow as buildMatrixRow11 } from '../simulation/problems/problem11';
import { buildMatrixRow as buildMatrixRow12 } from '../simulation/problems/problem12';
import { buildMatrixRow as buildMatrixRow13 } from '../simulation/problems/problem13';
import { buildMatrixRow as buildMatrixRow14 } from '../simulation/problems/problem14';
import { buildMatrixRow as buildMatrixRow15 } from '../simulation/problems/problem15';

interface UseSimulationReturn {
  state: SimulationState | null;
  fel: SimEvent[];
  isRunning: boolean;
  isInitialized: boolean;
  stepCount: number;
  metrics: ComputedMetrics | null;
  init: () => void;
  step: () => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useSimulation = (
  config: ProblemConfig
): UseSimulationReturn => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [fel, setFel] = useState<SimEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stepCount, setStepCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<SimulationState | null>(null);
  const felRef = useRef<SimEvent[]>([]);

  stateRef.current = state;
  felRef.current = fel;

  const problemId = config.problemId;

  // ── Inicializar ──────────────────────────────────────────────────────────
  const init = useCallback(() => {
    const problem = getProblem(problemId);
    if (!problem) return;

    const { state: initialState, initialEvents } = problem.initialState(config);

    let initialFel: SimEvent[] = [];
    for (const event of initialEvents) {
      initialFel = insertEvent(initialFel, event);
    }

    setState(initialState);
    setFel(initialFel);
    setIsInitialized(true);
    setIsRunning(false);
    setStepCount(0);
  }, [problemId, config]);

  // ── Un paso ──────────────────────────────────────────────────────────────
  const step = useCallback(() => {
    const currentState = stateRef.current;
    const currentFel = felRef.current;

    if (!currentState || currentState.finished) return;

    const [nextEvent, remainingFel] = getNextEvent(currentFel);

    if (!nextEvent || nextEvent.time > config.maxTime) {
      setState(prev => prev ? { ...prev, finished: true } : prev);
      setFel([]);
      setIsRunning(false);
      return;
    }

    const problem = getProblem(problemId);
    if (!problem) return;

    const stateAtEvent = { ...currentState, clock: nextEvent.time };
    const { newState, newEvents, cancelEvents } = problem.handleEvent(nextEvent, stateAtEvent, config);

    // Remover eventos cancelados
    let newFel = [...remainingFel];
    if (cancelEvents && cancelEvents.length > 0) {
      for (const cancel of cancelEvents) {
        newFel = newFel.filter(e => !(e.clientId === cancel.clientId && e.type === cancel.type));
      }
    }

    // Agregar eventos nuevos que no excedan maxTime
    for (const event of newEvents) {
      if (event.time <= config.maxTime) {
        newFel = insertEvent(newFel, event);
      }
    }

    // Si la FEL queda vacía, la simulación termina
    if (newFel.length === 0) {
      newState.finished = true;
    }

    // Generar fila de la matriz de simulación
    const eventDescriptions: Record<string, string> = {
      'arrival': `Llegada #${nextEvent.clientId}`,
      'departure_s1': `Fin PS1 (#${nextEvent.clientId})`,
      'departure_s2': `Fin PS2 (#${nextEvent.clientId})`,
      'departure_s3': `Fin PS3 (#${nextEvent.clientId})`,
      'departure': `Fin servicio (#${nextEvent.clientId})`,
      'abandon': `Abandono (#${nextEvent.clientId})`,
      'server_off': `Servidor → descanso`,
      'server_on': `Servidor → activo`,
    };
    const desc = eventDescriptions[nextEvent.type] ?? nextEvent.type;

    const matrixBuilders: Record<number, typeof buildMatrixRow6> = {
      6: buildMatrixRow6,
      7: buildMatrixRow7,
      8: buildMatrixRow8,
      9: buildMatrixRow9,
      10: buildMatrixRow10,
      11: buildMatrixRow11,
      12: buildMatrixRow12,
      13: buildMatrixRow13,
      14: buildMatrixRow14,
      15: buildMatrixRow15,
    };
    const buildMatrix = matrixBuilders[problemId] ?? buildMatrixRow6;
    const matrixRow = buildMatrix(newState, newFel, desc);
    newState.simulationMatrix = [...newState.simulationMatrix, matrixRow];

    setState(newState);
    setFel(newFel);
    setStepCount(prev => prev + 1);

    if (newState.finished) {
      setIsRunning(false);
    }
  }, [problemId, config]);

  // ── Iniciar automático ───────────────────────────────────────────────────
  const start = useCallback(() => {
    if (!isInitialized) init();
    setIsRunning(true);
  }, [isInitialized, init]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(null);
    setFel([]);
    setIsRunning(false);
    setIsInitialized(false);
    setStepCount(0);
  }, []);

  // ── Auto-avance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const currentState = stateRef.current;
        if (!currentState || currentState.finished) {
          setIsRunning(false);
          return;
        }
        step();
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, step]);

  // ── Métricas ─────────────────────────────────────────────────────────────
  const metrics: ComputedMetrics | null = state && state.clock > 0 ? (() => {
    const { stats, clock } = state;
    const departures = stats.totalDepartures || 1;
    return {
      avgSystemTime: stats.totalSystemTime / departures,
      avgWaitTime: stats.totalWaitTime / departures,
      serverUtilizationS1: stats.server1BusyTime / clock,
      serverUtilizationS2: stats.server2BusyTime / clock,
      serverUtilizationS3: stats.server3BusyTime / clock,
      throughput: stats.totalDepartures / clock,
    };
  })() : null;

  return {
    state,
    fel,
    isRunning,
    isInitialized,
    stepCount,
    metrics,
    init,
    step,
    start,
    stop,
    reset,
  };
};
