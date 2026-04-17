/**
 * PROBLEMA 3: Clientes Impacientes (Abandono)
 * Igual al 1, pero los clientes abandonan la cola tras cierto tiempo.
 * Eventos: arrival, departure, abandon
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult } from '../types';
import { genArrivalTime, genServiceTime, genExtraTime } from '../timeGen';
import { createBaseState, addLog, updateQueueArea } from '../baseState';

const problem3: ProblemDefinition = {
  id: 3,
  name: 'Clientes Impacientes',
  description: 'Los clientes abandonan la cola si esperan demasiado.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const initialEvents: SimEvent[] = [
      { time: genArrivalTime(config), type: 'arrival', clientId: 1 }
    ];
    return { state: { ...state, clientIdCounter: 1 }, initialEvents };
  },

  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult {
    const newEvents: SimEvent[] = [];
    const cancelEvents: { clientId: number; type: string }[] = [];
    let s = { ...state, stats: { ...state.stats } };

    const queueAreaUpdate = updateQueueArea(s, s.queue.length);
    s.stats = { ...s.stats, ...queueAreaUpdate };

    if (event.type === 'arrival') {
      s.stats.totalArrivals++;
      const newClientId = s.clientIdCounter + 1;
      s.clientIdCounter = newClientId;
      const newClient = { id: event.clientId ?? newClientId, arrivalTime: s.clock };

      newEvents.push({ time: s.clock + genArrivalTime(config), type: 'arrival', clientId: newClientId });

      if (!s.serverBusy) {
        s.serverBusy = true;
        s.currentClient = { ...newClient, serviceStartTime: s.clock };
        newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: newClient.id });
        s.log = addLog(s, `Cliente #${newClient.id} llegó → atendido de inmediato`, 'arrival');
      } else {
        const patience = genExtraTime(config, config.abandonTime ?? 10);
        const abandonAt = s.clock + patience;
        s.queue = [...s.queue, { ...newClient, abandonTime: abandonAt }];
        newEvents.push({ time: abandonAt, type: 'abandon', clientId: newClient.id });
        s.log = addLog(s, `Cliente #${newClient.id} llegó → cola (paciencia: ${patience.toFixed(2)}, cola: ${s.queue.length})`, 'arrival');
      }

    } else if (event.type === 'departure') {
      if (s.currentClient) {
        const waitTime = (s.currentClient.serviceStartTime ?? s.currentClient.arrivalTime) - s.currentClient.arrivalTime;
        const systemTime = s.clock - s.currentClient.arrivalTime;
        s.stats.totalWaitTime += waitTime;
        s.stats.totalSystemTime += systemTime;
        s.stats.totalDepartures++;
        s.stats.serverBusyTime += s.clock - (s.currentClient.serviceStartTime ?? s.clock);
        s.log = addLog(s, `Cliente #${s.currentClient.id} terminó servicio`, 'departure');
      }

      if (s.queue.length > 0) {
        const [next, ...rest] = s.queue;
        s.queue = rest;
        s.currentClient = { ...next, serviceStartTime: s.clock };
        cancelEvents.push({ clientId: next.id, type: 'abandon' });
        newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: next.id });
        s.log = addLog(s, `Cliente #${next.id} pasó al servidor (abandono cancelado)`, 'info');
      } else {
        s.serverBusy = false;
        s.currentClient = null;
      }

    } else if (event.type === 'abandon') {
      const clientId = event.clientId;
      const idx = s.queue.findIndex(c => c.id === clientId);
      if (idx !== -1) {
        s.queue = s.queue.filter(c => c.id !== clientId);
        s.stats.abandonedClients++;
        s.log = addLog(s, `Cliente #${clientId} ABANDONÓ la cola (cola: ${s.queue.length})`, 'abandon');
      }
    }

    return { newState: s, newEvents, cancelEvents: cancelEvents.length > 0 ? cancelEvents : undefined };
  },
};

export default problem3;
