/**
 * Tipos centrales para el motor de simulación de eventos discretos.
 * Todos los módulos importan desde aquí para mantener consistencia.
 */

// ─── Tipos de eventos posibles ───────────────────────────────────────────────

export type EventType =
  | 'arrival'        // Cliente llega al sistema
  | 'departure'      // Cliente termina servicio y se va
  | 'server_on'      // Servidor se activa (problema 2)
  | 'server_off'     // Servidor se apaga (problema 2)
  | 'abandon'        // Cliente abandona la cola (problema 3)
  | 'move_to_server' // Cliente pasa de seguridad al servidor (problema 5)
  | 'arrival_a'      // Llega cliente tipo A (problema 4)
  | 'arrival_b';     // Llega cliente tipo B (problema 4)

// ─── Evento en la lista de eventos futuros (FEL) ─────────────────────────────

export interface SimEvent {
  time: number;         // Tiempo en que ocurrirá el evento
  type: EventType;      // Tipo de evento
  clientId?: number;    // ID del cliente asociado (si aplica)
  data?: unknown;       // Datos extra (libre para cada problema)
}

// ─── Cliente en el sistema ────────────────────────────────────────────────────

export interface Client {
  id: number;
  arrivalTime: number;          // Cuando llegó al sistema
  serviceStartTime?: number;    // Cuando empezó a ser atendido
  clientType?: 'A' | 'B';       // Para problema 4 (prioridad)
  abandonTime?: number;         // Tiempo límite de paciencia (problema 3)
  securityArrivalTime?: number; // Para problema 5
}

// ─── Estadísticas acumuladas ──────────────────────────────────────────────────

export interface SimulationStats {
  totalArrivals: number;
  totalDepartures: number;
  totalWaitTime: number;       // Suma de tiempos de espera en cola
  totalSystemTime: number;     // Suma de tiempos en el sistema (cola + servicio)
  serverBusyTime: number;      // Tiempo total que el servidor estuvo ocupado
  totalQueueArea: number;      // Área bajo la curva de longitud de cola (para W_q promedio)
  lastEventTime: number;       // Tiempo del último evento (para calcular áreas)
  lastQueueLength: number;     // Longitud de cola en el último evento
  abandonedClients: number;    // Clientes que abandonaron (problema 3)
}

// ─── Estado completo de la simulación ────────────────────────────────────────

export interface SimulationState {
  clock: number;
  serverBusy: boolean;
  serverOn: boolean;          // ¿El servidor está disponible? (problema 2)

  // Cola(s) de espera
  queue: Client[];            // Cola general (problemas 1, 2, 3, 5 - cola principal)
  queueA: Client[];           // Cola tipo A - alta prioridad (problema 4)
  queueB: Client[];           // Cola tipo B - baja prioridad (problema 4)
  securityQueue: Client[];    // Cola de seguridad (problema 5)

  // Clientes en servicio
  currentClient: Client | null;         // Cliente siendo atendido por servidor principal
  currentSecurityClient: Client | null; // Cliente en seguridad (problema 5)

  // Estado del servidor de seguridad (problema 5)
  securityBusy: boolean;

  stats: SimulationStats;
  log: LogEntry[];
  clientIdCounter: number;    // Contador para generar IDs únicos
  finished: boolean;          // Simulación terminada
}

// ─── Entrada del log de eventos ───────────────────────────────────────────────

export interface LogEntry {
  time: number;
  message: string;
  type: 'arrival' | 'departure' | 'server' | 'abandon' | 'info' | 'security';
}

// ─── Modo de generación de tiempos ────────────────────────────────────────────

export type TimeMode = 'random' | 'manual' | 'uniform_range';
export type Distribution = 'exponential' | 'uniform' | 'normal';

// ─── Configuración del problema ───────────────────────────────────────────────

export interface ProblemConfig {
  maxTime: number;
  arrivalInterval: number;   // Tiempo entre llegadas (promedio o fijo según modo)
  serviceTime: number;       // Tiempo de servicio (promedio o fijo según modo)
  abandonTime?: number;      // Tiempo antes de abandonar (problema 3)
  serverOnTime?: number;     // Tiempo que servidor está encendido (problema 2)
  serverOffTime?: number;    // Tiempo que servidor está apagado (problema 2)
  securityTime?: number;     // Tiempo de revisión en seguridad (problema 5)
  arrivalIntervalB?: number; // Tiempo entre llegadas tipo B (problema 4)

  // Modo de tiempos y distribución
  timeMode: TimeMode;
  distribution: Distribution;

  // Rangos para modo uniform_range (a-b)
  arrivalMin?: number;
  arrivalMax?: number;
  serviceMin?: number;
  serviceMax?: number;

  // Estado inicial configurable
  initialQueue: number;       // Clientes en cola al inicio
  initialServerBusy: boolean; // Servidor ocupado al inicio
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
  avgWaitTime: number;         // W_q: tiempo promedio en cola
  avgSystemTime: number;       // W: tiempo promedio en sistema
  serverUtilization: number;   // ρ: fracción del tiempo que el servidor estuvo ocupado
  avgQueueLength: number;      // L_q: promedio de clientes en cola
  throughput: number;          // λ_eff: tasa de salida efectiva
  abandonRate: number;         // Tasa de abandono (problema 3)
}
