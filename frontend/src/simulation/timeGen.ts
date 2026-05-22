/**
 * Generador de tiempos según el modo configurado.
 */

import type { ProblemConfig, SimulationState } from './types';
import { exponential, uniform, normal } from './random';

/**
 * Genera un tiempo según distribución y valor base.
 */
function genFromDistribution(value: number, distribution: string): number {
  switch (distribution) {
    case 'uniform':
      return uniform(value * 0.5, value * 1.5);
    case 'normal':
      return Math.max(0.1, normal(value, value * 0.3));
    case 'exponential':
    default:
      return exponential(value);
  }
}

/**
 * Genera un tiempo uniforme entre min y max.
 */
export function genUniformRange(min: number, max: number): number {
  return uniform(min, max);
}

/**
 * Genera tiempo entre llegadas.
 * - Si arrivalMode es 'list', consume el siguiente valor de la lista.
 * - Si es 'manual', retorna el valor constante.
 * - Si es 'random', genera según distribución.
 */
export function genArrivalTime(config: ProblemConfig, station: 1 | 2 | 3, state?: SimulationState): number {
  // Para problema 6, cada subsistema puede tener su propia config
  if (config.problemId === 6) {
    const intervals = [config.arrivalIntervalS1, config.arrivalIntervalS2, config.arrivalIntervalS3];
    const lists = [config.arrivalListS1, config.arrivalListS2, config.arrivalListS3];
    const value = intervals[station - 1];
    const list = lists[station - 1];

    if (config.arrivalMode === 'list' && list && list.length > 0 && state) {
      const idx = state.arrivalIndex % list.length;
      return list[idx];
    }
    if (config.arrivalMode === 'manual') return value;
    return genFromDistribution(value, config.arrivalDistribution);
  }

  // Para problemas 7 y 8: una sola fuente de llegadas
  if (config.arrivalMode === 'list' && config.arrivalList.length > 0 && state) {
    const idx = state.arrivalIndex % config.arrivalList.length;
    return config.arrivalList[idx];
  }
  if (config.arrivalMode === 'manual') return config.arrivalInterval;
  return genFromDistribution(config.arrivalInterval, config.arrivalDistribution);
}

/**
 * Genera tiempo de servicio para el puesto indicado.
 */
export function genServiceTime(config: ProblemConfig, station: 1 | 2 | 3): number {
  // Si hay rango uniforme definido, usarlo
  const mins = { 1: config.serviceMinS1, 2: config.serviceMinS2, 3: config.serviceMinS3 };
  const maxs = { 1: config.serviceMaxS1, 2: config.serviceMaxS2, 3: config.serviceMaxS3 };
  const min = mins[station];
  const max = maxs[station];
  if (min !== undefined && max !== undefined && min > 0 && max > 0) {
    return genUniformRange(min, max);
  }

  // Si hay lista de tiempos de servicio
  if (config.serviceMode === 'list') {
    const lists = [config.serviceListS1, config.serviceListS2, config.serviceListS3];
    const list = lists[station - 1];
    if (list && list.length > 0) {
      // Usar round-robin (basado en departures del puesto)
      const idx = Math.floor(Math.random() * list.length); // simplificado
      return list[idx];
    }
  }

  const values = { 1: config.serviceTimeS1, 2: config.serviceTimeS2, 3: config.serviceTimeS3 };
  const value = values[station];

  if (config.serviceMode === 'manual' || config.timeMode === 'manual') return value;
  return genFromDistribution(value, config.serviceDistribution || config.distribution);
}
