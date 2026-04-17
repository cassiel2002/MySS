/**
 * Hook principal de simulación.
 * Gestiona el estado, la FEL, y las acciones (iniciar, paso, reset).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SimulationState, SimEvent, ProblemConfig, ComputedMetrics } from '../simulation/types';
import { insertEvent, getNextEvent } from '../simulation/eventQueue';
import { getProblem } from '../simulation/problems';

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
  problemId: number,
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
      // Simulación terminada
      setState(prev => prev ? { ...prev, finished: true } : prev);
      setFel([]);
      setIsRunning(false);
      return;
    }

    const problem = getProblem(problemId);
    if (!problem) return;

    const stateAtEvent = { ...currentState, clock: nextEvent.time };
    const { newState, newEvents, cancelEvents } = problem.handleEvent(nextEvent, stateAtEvent, config);

    // Primero, remover eventos cancelados de la FEL existente
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

    // Si la FEL queda vacía después de filtrar, la simulación termina
    if (newFel.length === 0) {
      newState.finished = true;
    }

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
      avgWaitTime: stats.totalWaitTime / departures,
      avgSystemTime: stats.totalSystemTime / departures,
      serverUtilization: stats.serverBusyTime / clock,
      avgQueueLength: stats.totalQueueArea / clock,
      throughput: stats.totalDepartures / clock,
      abandonRate: stats.totalArrivals > 0
        ? stats.abandonedClients / stats.totalArrivals
        : 0,
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
