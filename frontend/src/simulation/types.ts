/**
 * Tipos centrales para el motor de simulación de eventos discretos.
 * Soporta problemas con múltiples puestos de servicio.
 */

// ─── Tipos de eventos posibles ───────────────────────────────────────────────

export type EventType =
  | 'arrival'        // Cliente llega al sistema
  | 'departure_s1'   // Fin de servicio en puesto 1
  | 'departure_s2'   // Fin de servicio en puesto 2
  | 'departure_s3'   // Fin de servicio en puesto 3
  | 'departure'      // Fin de servicio (puesto único)
  | 'abandon'        // Cliente abandona la cola
  | 'server_off'     // Servidor sale de servicio (descanso)
  | 'server_on';     // Servidor vuelve de descanso

// ─── Evento en la lista de eventos futuros (FEL) ─────────────────────────────

export interface SimEvent {
  time: number;
  type: EventType;
  clientId?: number;
  data?: unknown;
}

// ─── Cliente en el sistema ────────────────────────────────────────────────────

export interface Client {
  id: number;
  arrivalTime: number;
  serviceStartTime?: number;
}

// ─── Estadísticas acumuladas ──────────────────────────────────────────────────

export interface SimulationStats {
  totalArrivals: number;
  totalDepartures: number;
  totalSystemTime: number;
  totalWaitTime: number;
  server1BusyTime: number;
  server2BusyTime: number;
  server3BusyTime: number;
  departuresS1: number;
  departuresS2: number;
  departuresS3: number;
}

// ─── Estado completo de la simulación ────────────────────────────────────────

export interface SimulationState {
  clock: number;
  queue: Client[];
  queue1: Client[];
  queue2: Client[];
  queue3: Client[];
  currentClientS1: Client | null;
  currentClientS2: Client | null;
  currentClientS3: Client | null;
  server1Busy: boolean;
  server2Busy: boolean;
  server3Busy: boolean;

  // Single-server state (problems 9-12)
  serverBusy: boolean;
  serverOn: boolean;           // Servidor disponible (true) o en descanso (false)
  currentClient: Client | null;

  stats: SimulationStats;
  log: LogEntry[];
  clientIdCounter: number;
  finished: boolean;
  simulationMatrix: MatrixRow[];
  arrivalIndex: number;

  // Contadores auxiliares para responder preguntas
  abandonedClients: number;
  servedClients: number;
  divertedClients: number;     // Piezas desviadas (prob 11)
  serverBreaks: number;        // Cantidad de descansos del servidor
}

// ─── Fila de la matriz de simulación ──────────────────────────────────────────

export interface MatrixRow {
  clock: number;
  eventDescription: string;
  nextArrivalS1: number | null;
  nextArrivalS2: number | null;
  nextArrivalS3: number | null;
  nextDepartureS1: number | null;
  nextDepartureS2: number | null;
  nextDepartureS3: number | null;
  queueLenS1: number;
  queueLenS2: number;
  queueLenS3: number;
  serverStateS1: number;
  serverStateS2: number;
  serverStateS3: number;
}

// ─── Entrada del log ──────────────────────────────────────────────────────────

export interface LogEntry {
  time: number;
  message: string;
  type: 'arrival' | 'departure' | 'info' | 'abandon' | 'server';
}

// ─── Modo de generación de tiempos ────────────────────────────────────────────

export type TimeMode = 'random' | 'manual' | 'list';
export type Distribution = 'exponential' | 'uniform' | 'normal';

// ─── Configuración del problema ───────────────────────────────────────────────

export interface ProblemConfig {
  maxTime: number;
  problemId: number;           // 6 = serie, 7 = paralelo, 8 = sucesivos
  numServers: number;          // Cantidad de puestos de servicio (1-3)

  // ─── Tiempos entre llegadas ───
  arrivalMode: TimeMode;       // 'manual' = constante, 'random' = aleatorio, 'list' = lista definida
  arrivalInterval: number;     // Valor constante o media (para manual/random)
  arrivalList: number[];       // Lista de intervalos entre llegadas (para modo 'list')
  arrivalDistribution: Distribution;

  // Para problema 6: llegadas independientes por subsistema
  arrivalIntervalS1: number;
  arrivalIntervalS2: number;
  arrivalIntervalS3: number;
  arrivalListS1: number[];
  arrivalListS2: number[];
  arrivalListS3: number[];

  // ─── Tiempos de servicio por puesto ───
  serviceMode: TimeMode;       // 'manual' = constante, 'random' = aleatorio, 'list' = lista
  serviceTimeS1: number;
  serviceTimeS2: number;
  serviceTimeS3: number;
  serviceDistribution: Distribution;

  // Listas de tiempos de servicio (modo 'list')
  serviceListS1: number[];
  serviceListS2: number[];
  serviceListS3: number[];

  // Rango uniforme (min-max) para servicio
  serviceMinS1?: number;
  serviceMaxS1?: number;
  serviceMinS2?: number;
  serviceMaxS2?: number;
  serviceMinS3?: number;
  serviceMaxS3?: number;

  // ─── Parámetros para problemas de un solo servidor (9-12) ───
  serviceTime?: number;         // Tiempo de servicio (puesto único)
  serviceMin?: number;          // Rango min servicio
  serviceMax?: number;          // Rango max servicio
  abandonTime?: number;         // Tiempo de paciencia antes de abandonar
  serverOnTime?: number;        // Tiempo que el servidor trabaja antes de descansar
  serverOffTime?: number;       // Duración del descanso
  initialQueue?: number;        // Clientes en cola al inicio
  initialWaitTime?: number;     // Tiempo que ya llevan esperando los clientes iniciales

  // Estado inicial de cada puesto de servicio (1=ocupado, 0=libre)
  initialPS1?: number;
  initialPS2?: number;
  initialPS3?: number;

  // Legacy compatibility
  timeMode: TimeMode;
  distribution: Distribution;
}

// ─── Resultado de procesar un evento ─────────────────────────────────────────

export interface HandleEventResult {
  newState: SimulationState;
  newEvents: SimEvent[];
  cancelEvents?: { clientId: number; type: string }[];
}

// ─── Interfaz que cada problema debe implementar ─────────────────────────────

export interface ProblemDefinition {
  id: number;
  name: string;
  description: string;
  initialState(config: ProblemConfig): { state: SimulationState; initialEvents: SimEvent[] };
  handleEvent(event: SimEvent, state: SimulationState, config: ProblemConfig): HandleEventResult;
}

// ─── Métricas calculadas para mostrar en UI ───────────────────────────────────

export interface ComputedMetrics {
  avgSystemTime: number;
  avgWaitTime: number;
  serverUtilizationS1: number;
  serverUtilizationS2: number;
  serverUtilizationS3: number;
  throughput: number;
}
