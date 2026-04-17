# Simulador de Colas — Eventos Discretos

Simulador interactivo de sistemas de colas basado en simulación de eventos discretos. Permite visualizar paso a paso el comportamiento de 5 problemas clásicos de teoría de colas.

## Problemas incluidos

1. **Cola Simple M/M/1** — Un servidor, llegadas y servicios aleatorios, cola FIFO.
2. **Servidor Intermitente** — El servidor alterna entre períodos activos e inactivos.
3. **Clientes Impacientes** — Los clientes abandonan la cola si esperan demasiado.
4. **Prioridad A sobre B** — Dos tipos de clientes, A tiene prioridad. Llegadas con distribución uniforme (A: 5-10 min, B: 1-4 min).
5. **Zona de Seguridad** — Zona intermedia entre la cola y el servidor con restricciones de acceso.

## Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- Flaticon uicons

## Cómo correr

```bash
cd frontend
npm install
npm run dev
```

Se abre en `http://localhost:5173`.

## Funcionalidades

- Selector de problema con 5 opciones
- Controles: Iniciar, Paso a paso, Pausar, Reset
- Configuración de tiempos: aleatorio (exponencial/uniforme/normal), manual (fijo) o rango (a-b)
- Estado inicial configurable (clientes en cola, servidor libre/ocupado)
- Reloj de simulación con barra de progreso
- Visualización del servidor (libre/ocupado/OFF)
- Cola animada con clientes
- Lista de Eventos Futuros (FEL)
- Log de eventos tipo consola
- Métricas: Wq, W, ρ, Lq, throughput, tasa de abandono
- Vector final al completar la simulación
- Explicación de cada problema al pie de la página

## Estructura del código

```
frontend/src/
├── simulation/
│   ├── types.ts          # Tipos centrales
│   ├── baseState.ts      # Estado base y helpers
│   ├── eventQueue.ts     # Manejo de la FEL
│   ├── random.ts         # Distribuciones (exponencial, uniforme, normal)
│   ├── timeGen.ts        # Generador de tiempos según modo configurado
│   └── problems/
│       ├── problem1.ts   # Cola simple M/M/1
│       ├── problem2.ts   # Servidor intermitente
│       ├── problem3.ts   # Clientes impacientes
│       ├── problem4.ts   # Prioridad A sobre B
│       └── problem5.ts   # Zona de seguridad
├── hooks/
│   └── useSimulation.ts  # Hook principal del motor de simulación
├── components/
│   ├── ProblemSelector.tsx
│   ├── ConfigPanel.tsx
│   ├── Controls.tsx
│   ├── ClockDisplay.tsx
│   ├── ServerStatus.tsx
│   ├── QueueDisplay.tsx
│   ├── FutureEventList.tsx
│   ├── EventLog.tsx
│   ├── MetricsPanel.tsx
│   ├── AbandonCounter.tsx
│   ├── FinalVector.tsx
│   └── ProblemExplanation.tsx
├── App.tsx
└── main.tsx
```

## Motor de simulación

El motor funciona con el patrón clásico de simulación de eventos discretos:

1. Se mantiene una Lista de Eventos Futuros (FEL) ordenada por tiempo
2. En cada paso se extrae el evento más próximo
3. Se avanza el reloj al tiempo de ese evento
4. Se procesa el evento, que puede generar nuevos eventos
5. Se repite hasta alcanzar el tiempo máximo o vaciar la FEL

Cada problema implementa `initialState()` y `handleEvent()`, lo que permite agregar nuevos problemas fácilmente.

## Autores

Proyecto universitario — Modelado y Simulación de Sistemas.
