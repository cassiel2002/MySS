/**
 * PROBLEMA 15: Zona de Seguridad
 * ────────────────────────────────
 * El PS está alejado de la cola. Existe una zona de seguridad intermedia.
 * El primer cliente de cola solo puede ingresar a la zona cuando sale
 * el cliente del PS. Mientras recorre la zona y es atendido, nadie más entra.
 * Excepción: ingreso directo si llega un cliente con cola vacía, zona libre y PS libre.
 *
 * Eventos: arrival, departure (fin servicio = sale del PS), departure_s1 (llega al PS desde zona)
 * Variables: Estado PS, Cola, Estado zona de seguridad
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult, MatrixRow } from '../types';
import { createBaseState, addLog } from '../baseState';
import { exponential, uniform } from '../random';

function genArrival(config: ProblemConfig, state: SimulationState): number {
  if (config.arrivalMode === 'list' && config.arrivalList.length > 0) {
    return config.arrivalList[state.arrivalIndex % config.arrivalList.length];
  }
  if (config.arrivalMode === 'manual') return config.arrivalInterval;
  return exponential(config.arrivalInterval);
}

function genService(config: ProblemConfig): number {
  if (config.serviceMin !== undefined && config.serviceMax !== undefined) {
    return uniform(config.serviceMin, config.serviceMax);
  }
  const value = config.serviceTime ?? config.serviceTimeS1;
  if (config.serviceMode === 'manual') return value;
  return exponential(value);
}

function genSecurityTime(config: ProblemConfig): number {
  const value = config.serverOffTime ?? 2; // Reusamos serverOffTime como tiempo de zona
  if (config.serviceMode === 'manual') return value;
  return exponential(value);
}

function buildMatrixRow(state: SimulationState, fel: SimEvent[], desc: string): MatrixRow {
  const nextArr = fel.find(e => e.type === 'arrival');
  const nextArrPS = fel.find(e => e.type === 'departure_s1'); // Llegada al PS (fin zona)
  const nextDep = fel.find(e => e.type === 'departure');
  return {
    clock: state.clock, eventDescription: desc,
    nextArrivalS1: nextArr?.time ?? null,
    nextArrivalS2: nextArrPS?.time ?? null, // Hora llegada al PS
    nextArrivalS3: null,
    nextDepartureS1: nextDep?.time ?? null,
    nextDepartureS2: null, nextDepartureS3: null,
    queueLenS1: state.queue.length,
    queueLenS2: 0, queueLenS3: 0,
    serverStateS1: state.serverBusy ? 1 : 0,
    serverStateS2: state.server1Busy ? 1 : 0, // Zona seguridad ocupada
    serverStateS3: 0,
  };
}

const problem15: ProblemDefinition = {
  id: 15,
  name: 'Zona de Seguridad',
  description: 'PS alejado de la cola. Zona de seguridad intermedia bloquea ingreso.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [];

    initialEvents.push({ time: genArrival(config, state), type: 'arrival', clientId: 1 });

    const s = { ...state, clientIdCounter: 1 };
    const row = buildMatrixRow(s, initialEvents, 'Inicio');
    return { state: { ...s, simulationMatrix: [row] }, initialEvents };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    switch (event.type) {
      case 'arrival': {
        s.stats.totalArrivals++;
        s.arrivalIndex++;
        const newId = s.clientIdCounter + 1;
        s.clientIdCounter = newId;
        const client = { id: event.clientId ?? newId, arrivalTime: s.clock };

        newEvents.push({ time: s.clock + genArrival(config, s), type: 'arrival', clientId: newId });

        // Caso especial: ingreso directo si cola vacía, zona libre, PS libre
        if (!s.serverBusy && !s.server1Busy && s.queue.length === 0) {
          // Entra directo a zona de seguridad y luego al PS
          s.server1Busy = true; // Zona ocupada
          s.currentClientS1 = { ...client, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genSecurityTime(config), type: 'departure_s1', clientId: client.id });
          s.log = addLog(s, `Cliente #${client.id} llegó → ingreso directo a zona seguridad`, 'arrival');
        } else {
          s.queue = [...s.queue, client];
          s.log = addLog(s, `Cliente #${client.id} llegó → cola (${s.queue.length})`, 'arrival');
        }
        break;
      }

      case 'departure_s1': {
        // Cliente llega al PS desde la zona de seguridad
        const client = s.currentClientS1;
        s.server1Busy = false; // Zona libre
        s.currentClientS1 = null;

        if (client) {
          s.serverBusy = true;
          s.currentClient = { ...client, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genService(config), type: 'departure', clientId: client.id });
          s.log = addLog(s, `Cliente #${client.id} llegó al PS → en servicio`, 'info');
        }
        break;
      }

      case 'departure': {
        // Cliente sale del PS
        if (s.currentClient) {
          s.stats.totalDepartures++;
          s.servedClients++;
          s.stats.totalSystemTime += s.clock - s.currentClient.arrivalTime;
          s.log = addLog(s, `Cliente #${s.currentClient.id} atendido → sale del PS`, 'departure');
        }
        s.serverBusy = false;
        s.currentClient = null;

        // Al salir del PS, el primero de la cola puede entrar a la zona
        if (s.queue.length > 0 && !s.server1Busy) {
          const [next, ...rest] = s.queue;
          s.queue = rest;
          s.server1Busy = true;
          s.currentClientS1 = { ...next, serviceStartTime: s.clock };
          newEvents.push({ time: s.clock + genSecurityTime(config), type: 'departure_s1', clientId: next.id });
          s.log = addLog(s, `Cliente #${next.id} entra a zona de seguridad`, 'info');
        }
        break;
      }
    }
    return { newState: s, newEvents };
  },
};

export { buildMatrixRow };
export default problem15;
