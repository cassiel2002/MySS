/**
 * PROBLEMA 2: Servidor Intermitente
 * Igual al 1, pero el servidor alterna entre períodos activos e inactivos.
 * Eventos: arrival, departure, server_on, server_off
 */

import type { ProblemDefinition, ProblemConfig, SimulationState, SimEvent, HandleEventResult } from '../types';
import { genArrivalTime, genServiceTime, genExtraTime } from '../timeGen';
import { createBaseState, addLog, updateQueueArea } from '../baseState';

const problem2: ProblemDefinition = {
  id: 2,
  name: 'Servidor Intermitente',
  description: 'El servidor alterna entre períodos activos e inactivos.',

  initialState(config: ProblemConfig) {
    const state = createBaseState();
    const onTime = config.serverOnTime ?? 10;

    const initialEvents: SimEvent[] = [
      { time: genArrivalTime(config), type: 'arrival', clientId: 1 },
      { time: genExtraTime(config, onTime), type: 'server_off' },
    ];

    return { state: { ...state, clientIdCounter: 1, serverOn: true }, initialEvents };
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

      if (!s.serverBusy && s.serverOn) {
        s.serverBusy = true;
        s.currentClient = { ...newClient, serviceStartTime: s.clock };
        newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: newClient.id });
        s.log = addLog(s, `Cliente #${newClient.id} llegó → servidor activo, atendido`, 'arrival');
      } else {
        s.queue = [...s.queue, newClient];
        const reason = !s.serverOn ? 'servidor OFF' : 'servidor ocupado';
        s.log = addLog(s, `Cliente #${newClient.id} llegó → cola (${reason}, ${s.queue.length})`, 'arrival');
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

      if (s.queue.length > 0 && s.serverOn) {
        const [next, ...rest] = s.queue;
        s.queue = rest;
        s.currentClient = { ...next, serviceStartTime: s.clock };
        newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: next.id });
        s.log = addLog(s, `Cliente #${next.id} pasó al servidor`, 'info');
      } else {
        s.serverBusy = false;
        s.currentClient = null;
      }

    } else if (event.type === 'server_off') {
      s.serverOn = false;
      newEvents.push({ time: s.clock + genExtraTime(config, config.serverOffTime ?? 5), type: 'server_on' });
      s.log = addLog(s, `⏸ Servidor OFF (${s.queue.length} esperando)`, 'server');

    } else if (event.type === 'server_on') {
      s.serverOn = true;
      newEvents.push({ time: s.clock + genExtraTime(config, config.serverOnTime ?? 10), type: 'server_off' });
      s.log = addLog(s, `▶ Servidor ON`, 'server');

      if (s.queue.length > 0 && !s.serverBusy) {
        const [next, ...rest] = s.queue;
        s.queue = rest;
        s.serverBusy = true;
        s.currentClient = { ...next, serviceStartTime: s.clock };
        newEvents.push({ time: s.clock + genServiceTime(config), type: 'departure', clientId: next.id });
        s.log = addLog(s, `Cliente #${next.id} atendido tras encendido`, 'info');
      }
    }

    return { newState: s, newEvents };
  },
};

export default problem2;
