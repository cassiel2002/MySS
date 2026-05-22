/**
 * PROBLEMA 8: Servicios Sucesivos (variante del Problema 1)
 * ──────────────────────────────────────────────────────────
 * Igual que el problema 1 (serie), pero con una sola fuente de llegadas.
 * Los clientes llegan al sistema y deben recibir 3 servicios en orden sucesivo.
 * Cada puesto tiene su propia cola.
 * 
 * Diferencia con Problema 1:
 * - Problema 1: cada subsistema puede tener su propio intervalo de llegadas
 * - Problema 3: una sola llegada al sistema, el cliente recorre PS1 → PS2 → PS3
 *
 * Eventos:
 *   1) Llegada de un cliente al sistema
 *   2) Fin de servicio DEL SERVICIO UNO (y llegada al servicio dos)
 *   3) Fin de servicio DEL SERVICIO DOS (y llegada al servicio tres)
 *   4) Fin de servicio DEL SERVICIO TRES (sale del sistema)
 *
 * Variables de estado:
 *   1) Estado de ocupado o libre del puesto de servicio 1
 *   2) Estado de ocupado o libre del puesto de servicio 2
 *   3) Estado de ocupado o libre del puesto de servicio 3
 *   4) Cantidad de clientes en cola 1
 *   5) Cantidad de clientes en cola 2
 *   6) Cantidad de clientes en cola 3
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { genArrivalTime, genServiceTime } from '../timeGen';
import { createBaseState, addLog } from '../baseState';

/**
 * Construye una fila de la matriz de simulación.
 * En este problema, la "llegada a S2" es el fin de S1, y la "llegada a S3" es el fin de S2.
 */
function buildMatrixRow(
  state: SimulationState,
  fel: SimEvent[],
  eventDesc: string
): MatrixRow {
  const nextArrival = fel.find(e => e.type === 'arrival');
  const nextDepS1 = fel.find(e => e.type === 'departure_s1');
  const nextDepS2 = fel.find(e => e.type === 'departure_s2');
  const nextDepS3 = fel.find(e => e.type === 'departure_s3');

  return {
    clock: state.clock,
    eventDescription: eventDesc,
    // Llegada al sistema (única fuente externa)
    nextArrivalS1: nextArrival?.time ?? null,
    // Llegada a S2 = fin de S1 (transferencia interna)
    nextArrivalS2: nextDepS1?.time ?? null,
    // Llegada a S3 = fin de S2 (transferencia interna)
    nextArrivalS3: nextDepS2?.time ?? null,
    nextDepartureS1: nextDepS1?.time ?? null,
    nextDepartureS2: nextDepS2?.time ?? null,
    nextDepartureS3: nextDepS3?.time ?? null,
    queueLenS1: state.queue1.length,
    queueLenS2: state.queue2.length,
    queueLenS3: state.queue3.length,
    serverStateS1: state.server1Busy ? 1 : 0,
    serverStateS2: state.server2Busy ? 1 : 0,
    serverStateS3: state.server3Busy ? 1 : 0,
  };
}

const problem8: ProblemDefinition = {
  id: 8,
  name: 'Servicios Sucesivos',
  description: 'Los clientes llegan al sistema y reciben 3 servicios en orden (PS1 → PS2 → PS3). Cada puesto tiene su cola. Una sola fuente de llegadas.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    // Programar primera llegada al sistema (usa arrivalIntervalS1 como único intervalo)
    const firstArrivalTime = genArrivalTime(config, 1);
    initialEvents.push({
      time: firstArrivalTime,
      type: 'arrival',
      clientId: 1,
    });

    const initialRow = buildMatrixRow(state, initialEvents, 'Inicio de simulación');

    return {
      state: {
        ...state,
        clientIdCounter: 1,
        simulationMatrix: [initialRow],
      },
      initialEvents,
    };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    switch (event.type) {
      case 'arrival': {
        // Cliente llega al sistema → va a PS1
        s.stats.totalArrivals++;
        s.arrivalIndex++;
        const newClientId = s.clientIdCounter + 1;
        s.clientIdCounter = newClientId;
        const newClient = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

        // Programar siguiente llegada al sistema
        newEvents.push({
          time: s.clock + genArrivalTime(config, 1, s),
          type: 'arrival',
          clientId: newClientId,
        });

        // Intentar entrar al puesto 1
        if (!s.server1Busy) {
          s.server1Busy = true;
          s.currentClientS1 = { ...newClient, serviceStartTime: s.clock };
          newEvents.push({
            time: s.clock + genServiceTime(config, 1),
            type: 'departure_s1',
            clientId: newClient.id,
          });
          s.log = addLog(s, `Cliente #${newClient.id} llegó → PS1 libre, atendido`, 'arrival');
        } else {
          s.queue1 = [...s.queue1, newClient];
          s.log = addLog(s, `Cliente #${newClient.id} llegó → cola 1 (${s.queue1.length})`, 'arrival');
        }
        break;
      }

      case 'departure_s1': {
        // Fin servicio 1 → cliente pasa a PS2
        const clientFromS1 = s.currentClientS1;
        if (clientFromS1) {
          const serviceStart = clientFromS1.serviceStartTime ?? s.clock;
          s.stats.server1BusyTime += s.clock - serviceStart;
          s.stats.departuresS1++;

          // Intentar entrar al puesto 2
          if (!s.server2Busy) {
            s.server2Busy = true;
            s.currentClientS2 = { ...clientFromS1, serviceStartTime: s.clock };
            newEvents.push({
              time: s.clock + genServiceTime(config, 2),
              type: 'departure_s2',
              clientId: clientFromS1.id,
            });
            s.log = addLog(s, `Cliente #${clientFromS1.id} fin S1 → PS2 libre, atendido`, 'departure');
          } else {
            s.queue2 = [...s.queue2, { ...clientFromS1, serviceStartTime: undefined }];
            s.log = addLog(s, `Cliente #${clientFromS1.id} fin S1 → cola 2 (${s.queue2.length + 1})`, 'departure');
          }
        }

        // Atender siguiente en cola 1
        if (s.queue1.length > 0) {
          const [next, ...rest] = s.queue1;
          s.queue1 = rest;
          s.currentClientS1 = { ...next, serviceStartTime: s.clock };
          newEvents.push({
            time: s.clock + genServiceTime(config, 1),
            type: 'departure_s1',
            clientId: next.id,
          });
          s.log = addLog(s, `Cliente #${next.id} pasa al PS1`, 'info');
        } else {
          s.server1Busy = false;
          s.currentClientS1 = null;
        }
        break;
      }

      case 'departure_s2': {
        // Fin servicio 2 → cliente pasa a PS3
        const clientFromS2 = s.currentClientS2;
        if (clientFromS2) {
          const serviceStart = clientFromS2.serviceStartTime ?? s.clock;
          s.stats.server2BusyTime += s.clock - serviceStart;
          s.stats.departuresS2++;

          // Intentar entrar al puesto 3
          if (!s.server3Busy) {
            s.server3Busy = true;
            s.currentClientS3 = { ...clientFromS2, serviceStartTime: s.clock };
            newEvents.push({
              time: s.clock + genServiceTime(config, 3),
              type: 'departure_s3',
              clientId: clientFromS2.id,
            });
            s.log = addLog(s, `Cliente #${clientFromS2.id} fin S2 → PS3 libre, atendido`, 'departure');
          } else {
            s.queue3 = [...s.queue3, { ...clientFromS2, serviceStartTime: undefined }];
            s.log = addLog(s, `Cliente #${clientFromS2.id} fin S2 → cola 3 (${s.queue3.length + 1})`, 'departure');
          }
        }

        // Atender siguiente en cola 2
        if (s.queue2.length > 0) {
          const [next, ...rest] = s.queue2;
          s.queue2 = rest;
          s.currentClientS2 = { ...next, serviceStartTime: s.clock };
          newEvents.push({
            time: s.clock + genServiceTime(config, 2),
            type: 'departure_s2',
            clientId: next.id,
          });
          s.log = addLog(s, `Cliente #${next.id} pasa al PS2`, 'info');
        } else {
          s.server2Busy = false;
          s.currentClientS2 = null;
        }
        break;
      }

      case 'departure_s3': {
        // Fin servicio 3 → cliente SALE del sistema
        const clientFromS3 = s.currentClientS3;
        if (clientFromS3) {
          const serviceStart = clientFromS3.serviceStartTime ?? s.clock;
          s.stats.server3BusyTime += s.clock - serviceStart;
          s.stats.departuresS3++;
          s.stats.totalDepartures++;

          const systemTime = s.clock - clientFromS3.arrivalTime;
          s.stats.totalSystemTime += systemTime;

          s.log = addLog(s, `Cliente #${clientFromS3.id} fin S3 → SALE (W=${systemTime.toFixed(2)})`, 'departure');
        }

        // Atender siguiente en cola 3
        if (s.queue3.length > 0) {
          const [next, ...rest] = s.queue3;
          s.queue3 = rest;
          s.currentClientS3 = { ...next, serviceStartTime: s.clock };
          newEvents.push({
            time: s.clock + genServiceTime(config, 3),
            type: 'departure_s3',
            clientId: next.id,
          });
          s.log = addLog(s, `Cliente #${next.id} pasa al PS3`, 'info');
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
export default problem8;
