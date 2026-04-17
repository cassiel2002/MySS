/**
 * PROBLEMA 5: Zona de Seguridad
 * El PS está alejado de la cola. Zona de seguridad bloqueada hasta departure.
 * Eventos: arrival, move_to_server, departure
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult } from '../types';
import { genArrivalTime, genServiceTime, genExtraTime } from '../timeGen';
import { createBaseState, addLog, updateQueueArea } from '../baseState';

const problem5: ProblemDefinition = {
  id: 5,
  name: 'Zona de Seguridad',
  description: 'Zona de seguridad intermedia bloqueada hasta que el cliente sale del PS.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [
      { time: genArrivalTime(config), type: 'arrival', clientId: 1 }
    ];
    return {
      state: { ...state, clientIdCounter: 1, securityBusy: false, currentSecurityClient: null },
      initialEvents,
    };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    let s = { ...state, stats: { ...state.stats } };

    const queueAreaUpdate = updateQueueArea(s, s.queue.length);
    s.stats = { ...s.stats, ...queueAreaUpdate };

    if (event.type === 'arrival') {
      s.stats.totalArrivals++;
      const newClientId = s.clientIdCounter + 1;
      s.clientIdCounter = newClientId;
      const newClient = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

      newEvents.push({ time: s.clock + genArrivalTime(config), type: 'arrival', clientId: newClientId });

      if (!s.serverBusy && !s.securityBusy && s.queue.length === 0) {
        s.securityBusy = true;
        s.currentSecurityClient = { ...newClient };
        newEvents.push({ time: s.clock + genExtraTime(config, config.securityTime ?? 2), type: 'move_to_server', clientId: newClient.id });
        s.log = addLog(s, `Cliente #${newClient.id} llegó → ingreso directo a zona seguridad`, 'security');
      } else {
        s.queue = [...s.queue, newClient];
        s.log = addLog(s, `Cliente #${newClient.id} llegó → cola (${s.queue.length})`, 'arrival');
      }

    } else if (event.type === 'move_to_server') {
      const arrived = s.currentSecurityClient;
      if (!arrived) return { newState: s, newEvents };

      s.serverBusy = true;
      s.currentClient = { ...arrived, serviceStartTime: s.clock };
      s.currentSecurityClient = null;
      // securityBusy sigue true hasta departure

      newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: arrived.id });
      s.log = addLog(s, `Cliente #${arrived.id} llegó al PS → servicio iniciado (zona bloqueada)`, 'security');

    } else if (event.type === 'departure') {
      if (s.currentClient) {
        const waitTime = (s.currentClient.serviceStartTime ?? s.currentClient.arrivalTime) - s.currentClient.arrivalTime;
        const systemTime = s.clock - s.currentClient.arrivalTime;
        s.stats.totalWaitTime += waitTime;
        s.stats.totalSystemTime += systemTime;
        s.stats.totalDepartures++;
        s.stats.serverBusyTime += s.clock - (s.currentClient.serviceStartTime ?? s.clock);
        s.log = addLog(s, `Cliente #${s.currentClient.id} salió del PS`, 'departure');
      }

      s.serverBusy = false;
      s.currentClient = null;
      s.securityBusy = false;

      if (s.queue.length > 0) {
        const [next, ...rest] = s.queue;
        s.queue = rest;
        s.securityBusy = true;
        s.currentSecurityClient = { ...next };
        newEvents.push({ time: s.clock + genExtraTime(config, config.securityTime ?? 2), type: 'move_to_server', clientId: next.id });
        s.log = addLog(s, `Cliente #${next.id} ingresó a zona de seguridad`, 'security');
      }
    }

    return { newState: s, newEvents };
  },
};

export default problem5;
