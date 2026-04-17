/**
 * Generadores de números aleatorios para distribuciones estadísticas.
 * Usados para modelar tiempos de llegada y servicio en las simulaciones.
 */

/**
 * Distribución Exponencial
 * Usada para modelar tiempos entre llegadas y tiempos de servicio en colas M/M/1.
 * @param mean - Valor promedio deseado (ej: 5 min entre llegadas)
 * @returns Un número aleatorio con distribución exponencial
 */
export const exponential = (mean: number): number => {
  // Fórmula de transformación inversa: -mean * ln(U)  donde U ~ Uniforme(0,1)
  return -mean * Math.log(1 - Math.random());
};

/**
 * Distribución Uniforme
 * Para cuando todos los valores en un rango son igualmente probables.
 * @param min - Límite inferior
 * @param max - Límite superior
 * @returns Un número aleatorio entre min y max
 */
export const uniform = (min: number, max: number): number => {
  return min + (max - min) * Math.random();
};

/**
 * Distribución Normal aproximada (Box-Muller)
 * Para tiempos de servicio con variabilidad moderada.
 * @param mean - Media
 * @param std - Desviación estándar
 * @returns Un número aleatorio con distribución normal (puede ser negativo)
 */
export const normal = (mean: number, std: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0.1, mean + std * z); // mínimo 0.1 para evitar tiempos negativos
};
