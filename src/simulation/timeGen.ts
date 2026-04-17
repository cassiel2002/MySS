/**
 * Generador de tiempos según el modo configurado.
 * Centraliza la lógica para que los problemas no se preocupen
 * por el modo (manual/aleatorio/rango uniforme) ni la distribución.
 */

import type { ProblemConfig } from './types';
import { exponential, uniform, normal } from './random';

/**
 * Genera un tiempo de inter-llegada según la configuración.
 */
export function genArrivalTime(config: ProblemConfig): number {
  return genTime(config, config.arrivalInterval, config.arrivalMin, config.arrivalMax);
}

/**
 * Genera un tiempo de servicio según la configuración.
 */
export function genServiceTime(config: ProblemConfig): number {
  return genTime(config, config.serviceTime, config.serviceMin, config.serviceMax);
}

/**
 * Genera un tiempo genérico (para serverOn, serverOff, abandon, security, etc.)
 * Estos siempre usan exponencial con el valor como media, salvo en modo manual.
 */
export function genExtraTime(config: ProblemConfig, value: number): number {
  if (config.timeMode === 'manual') return value;
  return exponential(value);
}

/**
 * Función interna que genera un tiempo según modo y distribución.
 */
function genTime(
  config: ProblemConfig,
  fixedValue: number,
  rangeMin?: number,
  rangeMax?: number
): number {
  const { timeMode, distribution } = config;

  if (timeMode === 'manual') {
    // Modo manual: valor constante
    return fixedValue;
  }

  if (timeMode === 'uniform_range') {
    // Modo rango uniforme: entre min y max
    const min = rangeMin ?? fixedValue * 0.8;
    const max = rangeMax ?? fixedValue * 1.2;
    return uniform(min, max);
  }

  // Modo aleatorio: según distribución elegida
  switch (distribution) {
    case 'uniform':
      // Uniforme centrada en el valor ± 50%
      return uniform(fixedValue * 0.5, fixedValue * 1.5);
    case 'normal':
      return normal(fixedValue, fixedValue * 0.3);
    case 'exponential':
    default:
      return exponential(fixedValue);
  }
}
