/**
 * Manejo de la Lista de Eventos Futuros (FEL - Future Event List).
 * La FEL es el corazón de la simulación: contiene todos los eventos pendientes
 * ordenados por tiempo, de modo que siempre procesamos el más próximo primero.
 */

import type { SimEvent } from './types';

/**
 * Inserta un nuevo evento en la FEL manteniendo el orden cronológico.
 * @param fel - Lista actual de eventos futuros
 * @param event - Nuevo evento a insertar
 * @returns Nueva FEL con el evento insertado en posición correcta
 */
export const insertEvent = (fel: SimEvent[], event: SimEvent): SimEvent[] => {
  // Creamos copia para no mutar el array original (principio de inmutabilidad)
  const newFel = [...fel, event];
  // Ordenamos por tiempo; si hay empate, respetamos el orden de inserción
  return newFel.sort((a, b) => a.time - b.time);
};

/**
 * Obtiene y remueve el próximo evento (el de menor tiempo) de la FEL.
 * @param fel - Lista actual de eventos futuros
 * @returns Tupla: [evento extraído, FEL restante] o [null, []] si vacía
 */
export const getNextEvent = (fel: SimEvent[]): [SimEvent | null, SimEvent[]] => {
  if (fel.length === 0) return [null, []];
  const [next, ...rest] = fel;
  return [next, rest];
};

/**
 * Remueve un evento específico de la FEL por clientId y tipo.
 * Útil para cancelar eventos de abandono cuando un cliente es atendido.
 * @param fel - Lista actual de eventos futuros
 * @param clientId - ID del cliente cuyo evento se quiere cancelar
 * @param type - Tipo de evento a cancelar
 * @returns Nueva FEL sin ese evento
 */
export const removeEventByClientId = (
  fel: SimEvent[],
  clientId: number,
  type: string
): SimEvent[] => {
  return fel.filter(e => !(e.clientId === clientId && e.type === type));
};
