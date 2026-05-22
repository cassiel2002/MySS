import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  problemId: number;
  numServers?: number;
  initialPS1?: number;
  initialPS2?: number;
  initialPS3?: number;
}

/**
 * Diagrama visual del modelo del sistema para cada problema.
 * Se muestra como un menú desplegable.
 */
export default function SystemDiagram({ problemId, numServers = 3, initialPS1 = 0, initialPS2 = 0, initialPS3 = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const psStates = [!!initialPS1, !!initialPS2, !!initialPS3];

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800/60 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <i className="fi fi-rr-picture text-sm text-violet-400/60" />
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold">
            Diagrama del Sistema
          </span>
        </div>
        <motion.i
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="fi fi-rr-angle-down text-xs text-zinc-500"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {problemId === 6 && <SeriesDiagram numServers={numServers} psStates={psStates} />}
              {problemId === 7 && <ParallelDiagram numServers={numServers} psStates={psStates} />}
              {problemId === 8 && <SuccessiveDiagram numServers={numServers} psStates={psStates} />}
              {problemId === 9 && <AbandonServerDiagram />}
              {problemId === 10 && <ProductionDiagram />}
              {problemId === 11 && <DivertDiagram />}
              {problemId === 12 && <CarpenterDiagram />}
              {problemId === 13 && <SimpleDiagram />}
              {problemId === 14 && <PriorityDiagram />}
              {problemId === 15 && <SecurityZoneDiagram />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

/**
 * Puesto de Servicio (PS): Cuadrado con semicírculo (servidor) adosado.
 * - Cuadrado = puesto de trabajo
 * - Semicírculo (panza) = servidor (condiciones para prestar servicio)
 * - Círculo dentro del cuadrado = cliente siendo atendido (si busy)
 */
function Server({ x, y, busy = false, label }: { x: number; y: number; busy?: boolean; label?: string }) {
  return (
    <g>
      {/* Cuadrado: puesto de servicio */}
      <rect x={x} y={y} width={32} height={32} fill="none" stroke="#a1a1aa" strokeWidth={1.5} />
      {/* Semicírculo (panza): servidor adosado a la izquierda */}
      <path
        d={`M ${x} ${y + 4} A 14 14 0 0 0 ${x} ${y + 28}`}
        fill="none" stroke="#a1a1aa" strokeWidth={1.5}
      />
      {/* Cliente dentro del PS (si ocupado) */}
      {busy && (
        <circle cx={x + 18} cy={y + 16} r={8} fill="#a1a1aa" stroke="#d4d4d8" strokeWidth={1} />
      )}
      {/* Label debajo */}
      {label && <text x={x + 16} y={y + 46} textAnchor="middle" className="text-[9px] fill-zinc-500">{label}</text>}
    </g>
  );
}

/**
 * Clientes en cola: círculos llenos representando personas/piezas esperando.
 */
function QueueDots({ x, y, count }: { x: number; y: number; count: number }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} cx={x + i * 20} cy={y} r={8} fill="#71717a" stroke="#a1a1aa" strokeWidth={1} />
      ))}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#71717a" strokeWidth={1.5} markerEnd="url(#arrowhead)" />
  );
}

function ArrowDefs() {
  return (
    <defs>
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#71717a" />
      </marker>
    </defs>
  );
}

function DiagramLabel({ text }: { text: string }) {
  return <p className="text-[10px] text-zinc-500 mt-3 text-center italic">{text}</p>;
}

function Legend() {
  return (
    <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
      <div className="flex items-center gap-1.5">
        <svg width="20" height="20"><rect x={2} y={2} width={16} height={16} fill="none" stroke="#a1a1aa" strokeWidth={1.2} /></svg>
        <span className="text-[9px] text-zinc-500">= Puesto de servicio</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="16" height="20"><path d="M 14 2 A 10 10 0 0 0 14 18" fill="none" stroke="#a1a1aa" strokeWidth={1.2} /></svg>
        <span className="text-[9px] text-zinc-500">= Servidor</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="16" height="16"><circle cx={8} cy={8} r={6} fill="#71717a" stroke="#a1a1aa" strokeWidth={1} /></svg>
        <span className="text-[9px] text-zinc-500">= Cliente/pieza</span>
      </div>
    </div>
  );
}

/**
 * Lista de eventos y variables de estado del problema.
 */
function VariablesList({ events, variables, extras }: {
  events: string[];
  variables: { name: string; desc: string }[];
  extras?: string[];
}) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Eventos */}
      <div className="bg-zinc-800/40 rounded-xl p-3">
        <p className="text-[10px] text-blue-400/80 uppercase tracking-wider font-bold mb-2">Eventos</p>
        <ol className="space-y-1">
          {events.map((e, i) => (
            <li key={i} className="text-[10px] text-zinc-400 flex gap-2">
              <span className="text-zinc-600 font-mono w-4 flex-shrink-0">{i + 1})</span>
              {e}
            </li>
          ))}
        </ol>
      </div>
      {/* Variables de estado */}
      <div className="bg-zinc-800/40 rounded-xl p-3">
        <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-bold mb-2">Variables de estado</p>
        <ol className="space-y-1">
          {variables.map((v, i) => (
            <li key={i} className="text-[10px] text-zinc-400 flex gap-2">
              <span className="text-emerald-400/60 font-mono font-bold flex-shrink-0">{v.name}</span>
              <span className="text-zinc-500">→ {v.desc}</span>
            </li>
          ))}
        </ol>
        {extras && extras.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-700/30">
            <p className="text-[9px] text-amber-400/60 uppercase tracking-wider font-bold mb-1">Variables auxiliares</p>
            {extras.map((e, i) => (
              <p key={i} className="text-[10px] text-zinc-500">{e}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Datos de eventos y variables por problema
const problemData: Record<number, { events: string[]; variables: { name: string; desc: string }[]; extras?: string[] }> = {
  6: {
    events: [
      'Llegada de un cliente al sistema para recibir servicio 1',
      'Llegada de un cliente al sistema para recibir servicio 2',
      'Llegada de un cliente al sistema para recibir servicio 3',
      'Fin de servicio del PS1',
      'Fin de servicio del PS2',
      'Fin de servicio del PS3',
    ],
    variables: [
      { name: 'PS1', desc: 'Estado del puesto 1 (1=ocupado, 0=libre)' },
      { name: 'PS2', desc: 'Estado del puesto 2 (1=ocupado, 0=libre)' },
      { name: 'PS3', desc: 'Estado del puesto 3 (1=ocupado, 0=libre)' },
      { name: 'q1', desc: 'Cantidad de clientes en cola del PS1' },
      { name: 'q2', desc: 'Cantidad de clientes en cola del PS2' },
      { name: 'q3', desc: 'Cantidad de clientes en cola del PS3' },
    ],
  },
  7: {
    events: [
      'Llegada de un cliente al sistema para recibir el servicio único',
      'Fin de servicio del PS1',
      'Fin de servicio del PS2',
      'Fin de servicio del PS3',
    ],
    variables: [
      { name: 'PS1', desc: 'Estado del puesto 1 (1=ocupado, 0=libre)' },
      { name: 'PS2', desc: 'Estado del puesto 2 (1=ocupado, 0=libre)' },
      { name: 'PS3', desc: 'Estado del puesto 3 (1=ocupado, 0=libre)' },
      { name: 'q', desc: 'Cantidad de clientes en cola (única)' },
    ],
  },
  8: {
    events: [
      'Llegada de un cliente al sistema',
      'Fin de servicio del servicio UNO (y llegada al servicio dos)',
      'Fin de servicio del servicio DOS (y llegada al servicio tres)',
      'Fin de servicio del servicio TRES',
    ],
    variables: [
      { name: 'PS1', desc: 'Estado del puesto 1 (1=ocupado, 0=libre)' },
      { name: 'PS2', desc: 'Estado del puesto 2 (1=ocupado, 0=libre)' },
      { name: 'PS3', desc: 'Estado del puesto 3 (1=ocupado, 0=libre)' },
      { name: 'q1', desc: 'Cantidad de clientes en cola 1' },
      { name: 'q2', desc: 'Cantidad de clientes en cola 2' },
      { name: 'q3', desc: 'Cantidad de clientes en cola 3' },
    ],
  },
  9: {
    events: [
      'Llegada de un cliente al sistema',
      'Fin de servicio',
      'Abandono de cola',
      'Salida del servidor (descanso)',
      'Llegada del servidor (vuelve)',
    ],
    variables: [
      { name: 'PS', desc: 'Estado del puesto de servicio (1=ocupado, 0=libre)' },
      { name: 'q', desc: 'Cantidad de clientes en cola' },
      { name: 'S', desc: 'Estado del servidor (1=presente, 0=ausente)' },
    ],
    extras: ['Hora de llegada a cola de cada cliente (para calcular abandono)', 'A: cantidad de abandonos'],
  },
  10: {
    events: [
      'Llegada de una pieza (producida por M1)',
      'Fin de procesamiento (M2)',
      'Descarte de pieza (espera excedida)',
      'Salida de servicio de M2 (mantenimiento)',
      'Regreso de M2',
    ],
    variables: [
      { name: 'PS', desc: 'Estado de la máquina procesadora (1=ocupada, 0=libre)' },
      { name: 'q', desc: 'Cantidad de piezas en espera' },
      { name: 'S', desc: 'Estado de M2 (1=activa, 0=mantenimiento)' },
    ],
    extras: ['D: cantidad de piezas descartadas'],
  },
  11: {
    events: [
      'Llegada de una pieza a la máquina',
      'Fin de procesamiento',
    ],
    variables: [
      { name: 'PS', desc: 'Estado de la máquina (1=ocupada, 0=libre)' },
    ],
    extras: ['Procesadas: piezas procesadas', 'Desviadas: piezas desviadas (PS ocupado al llegar)'],
  },
  12: {
    events: [
      'Fin de armado (silla pasa a lijar)',
      'Fin de lijado (silla pasa a lustrar)',
      'Fin de lustrado (silla terminada)',
    ],
    variables: [
      { name: 'PS1', desc: 'Armando (1=sí, 0=no)' },
      { name: 'PS2', desc: 'Lijando (1=sí, 0=no)' },
      { name: 'PS3', desc: 'Lustrando (1=sí, 0=no)' },
      { name: 'q1', desc: 'Sillas pendientes de armar' },
      { name: 'q2', desc: 'Sillas pendientes de lijar' },
      { name: 'q3', desc: 'Sillas pendientes de lustrar' },
    ],
    extras: ['Terminadas: sillas completamente terminadas'],
  },
  13: {
    events: [
      'Llegada de un cliente al sistema',
      'Fin de servicio',
    ],
    variables: [
      { name: 'PS', desc: 'Estado del puesto de servicio (1=ocupado, 0=libre)' },
      { name: 'q', desc: 'Cantidad de clientes en cola' },
    ],
  },
  14: {
    events: [
      'Llegada de un cliente A al sistema',
      'Llegada de un cliente B al sistema',
      'Fin de servicio',
    ],
    variables: [
      { name: 'PS', desc: 'Estado del puesto de servicio (1=ocupado, 0=libre)' },
      { name: 'qA', desc: 'Cantidad de clientes A en cola' },
      { name: 'qB', desc: 'Cantidad de clientes B en cola' },
    ],
  },
  15: {
    events: [
      'Llegada de un cliente al sistema',
      'Llegada de un cliente al PS (fin zona seguridad)',
      'Fin de servicio',
    ],
    variables: [
      { name: 'PS', desc: 'Estado del puesto de servicio (1=ocupado, 0=libre)' },
      { name: 'q', desc: 'Cantidad de clientes en cola' },
      { name: 'ZS', desc: 'Estado zona de seguridad (1=ocupada, 0=libre)' },
    ],
  },
};

// ─── Diagramas por problema ──────────────────────────────────────────────────

function SeriesDiagram({ numServers = 3, psStates = [false, false, false] }: { numServers?: number; psStates?: boolean[] }) {
  const servers = Array.from({ length: numServers }, (_, i) => i);
  const totalHeight = numServers * 65 + 10;

  return (
    <div>
      <svg viewBox={`0 0 500 ${totalHeight}`} className="w-full max-w-[500px] mx-auto">
        <ArrowDefs />
        {servers.map((_, i) => {
          const cy = 40 + i * 65;
          return (
            <g key={i}>
              <ellipse cx={160} cy={cy} rx={140} ry={28} fill="none" stroke="#3f3f46" strokeWidth={1} strokeDasharray="4" />
              <Server x={50} y={cy - 16} busy={psStates[i]} label={`PS${i + 1}`} />
              <QueueDots x={100} y={cy} count={4} />
              <Arrow x1={195} y1={cy} x2={185} y2={cy} />
              <text x={310} y={cy + 4} className="text-[10px] fill-zinc-500">SUBSISTEMA {i + 1}</text>
              {i < numServers - 1 && (
                <Arrow x1={66} y1={cy + 22} x2={66} y2={cy + 42} />
              )}
            </g>
          );
        })}
      </svg>
      <DiagramLabel text={`${numServers} servicios en serie. Cada subsistema tiene su cola y llegadas independientes.`} />
      <Legend />
      <VariablesList {...problemData[6]} />
    </div>
  );
}

function ParallelDiagram({ numServers = 3, psStates = [false, false, false] }: { numServers?: number; psStates?: boolean[] }) {
  const servers = Array.from({ length: numServers }, (_, i) => i);
  const spacing = 60;
  const totalHeight = numServers * spacing;
  const midY = totalHeight / 2;

  return (
    <div>
      <svg viewBox={`0 0 400 ${totalHeight + 20}`} className="w-full max-w-[400px] mx-auto">
        <ArrowDefs />
        {/* Cola única */}
        <QueueDots x={220} y={midY} count={5} />
        <Arrow x1={330} y1={midY} x2={320} y2={midY} />
        {/* Bifurcación */}
        <line x1={200} y1={midY} x2={160} y2={midY} stroke="#71717a" strokeWidth={1.5} />
        {servers.map((_, i) => {
          const sy = 20 + i * spacing;
          return (
            <g key={i}>
              <line x1={160} y1={midY} x2={160} y2={sy + 16} stroke="#71717a" strokeWidth={1.5} />
              <Arrow x1={160} y1={sy + 16} x2={120} y2={sy + 16} />
              <Server x={70} y={sy} busy={psStates[i]} label={`PS${i + 1}`} />
              <Arrow x1={70} y1={sy + 16} x2={40} y2={sy + 16} />
            </g>
          );
        })}
      </svg>
      <DiagramLabel text={`Cola única → ${numServers} puestos paralelos prestan el mismo servicio.`} />
      <Legend />
      <VariablesList {...problemData[7]} />
    </div>
  );
}

function SuccessiveDiagram({ numServers = 3, psStates = [false, false, false] }: { numServers?: number; psStates?: boolean[] }) {
  const servers = Array.from({ length: numServers }, (_, i) => i);
  const width = numServers * 130 + 80;

  return (
    <div>
      <svg viewBox={`0 0 ${width} 100`} className="w-full max-w-[500px] mx-auto">
        <ArrowDefs />
        <Arrow x1={width - 20} y1={50} x2={width - 60} y2={50} />
        {servers.map((_, i) => {
          const baseX = width - 100 - i * 130;
          return (
            <g key={i}>
              <QueueDots x={baseX - 30} y={50} count={2} />
              <Server x={baseX - 80} y={34} busy={psStates[i]} label={`PS${i + 1}`} />
              {i < numServers - 1 && <Arrow x1={baseX - 80} y1={50} x2={baseX - 110} y2={50} />}
            </g>
          );
        })}
        <Arrow x1={40} y1={50} x2={10} y2={50} />
      </svg>
      <DiagramLabel text={`Una llegada al sistema. Cliente recorre ${numServers} servicios sucesivos con cola en cada uno.`} />
      <Legend />
      <VariablesList {...problemData[8]} />
    </div>
  );
}

function SimpleDiagram() {
  return (
    <div>
      <svg viewBox="0 0 350 80" className="w-full max-w-[350px] mx-auto">
        <ArrowDefs />
        <Arrow x1={320} y1={40} x2={270} y2={40} />
        <QueueDots x={160} y={40} count={4} />
        <Arrow x1={150} y1={40} x2={110} y2={40} />
        <Server x={60} y={24} busy label="PS" />
        <Arrow x1={50} y1={40} x2={20} y2={40} />
      </svg>
      <DiagramLabel text="Cola simple M/M/1. Un servidor, cola FIFO. El servidor nunca abandona." />
      <Legend />
      <VariablesList {...problemData[13]} />
    </div>
  );
}

function AbandonServerDiagram() {
  return (
    <div>
      <svg viewBox="0 0 380 120" className="w-full max-w-[380px] mx-auto">
        <ArrowDefs />
        <Arrow x1={350} y1={50} x2={300} y2={50} />
        <QueueDots x={180} y={50} count={4} />
        {/* Abandono (flecha hacia arriba) */}
        <Arrow x1={220} y1={45} x2={220} y2={15} />
        <text x={230} y={12} className="text-[9px] fill-red-400">abandono</text>
        <Arrow x1={170} y1={50} x2={120} y2={50} />
        <Server x={70} y={32} label="PS" />
        <Arrow x1={70} y1={50} x2={30} y2={50} />
        {/* Servidor intermitente */}
        <text x={70} y={90} className="text-[9px] fill-amber-400" textAnchor="middle">ON / OFF</text>
        <Arrow x1={88} y1={70} x2={88} y2={80} />
      </svg>
      <DiagramLabel text="Servidor trabaja/descansa. Clientes abandonan si esperan demasiado." />
      <Legend />
      <VariablesList {...problemData[9]} />
    </div>
  );
}

function ProductionDiagram() {
  return (
    <div>
      <svg viewBox="0 0 420 100" className="w-full max-w-[420px] mx-auto">
        <ArrowDefs />
        {/* Máquina 1 (productora) */}
        <rect x={340} y={30} width={50} height={40} rx={4} fill="none" stroke="#71717a" strokeWidth={1.5} />
        <text x={365} y={55} textAnchor="middle" className="text-[8px] fill-zinc-400">M1</text>
        <Arrow x1={340} y1={50} x2={300} y2={50} />
        {/* Cola */}
        <QueueDots x={200} y={50} count={3} />
        {/* Descarte */}
        <Arrow x1={230} y1={45} x2={230} y2={15} />
        <text x={240} y={12} className="text-[9px] fill-red-400">descarte</text>
        <Arrow x1={190} y1={50} x2={140} y2={50} />
        {/* Máquina 2 (procesadora) */}
        <Server x={90} y={32} label="M2" />
        <Arrow x1={90} y1={50} x2={40} y2={50} />
        <text x={108} y={85} textAnchor="middle" className="text-[8px] fill-amber-400">ON/OFF</text>
      </svg>
      <DiagramLabel text="Máquina produce piezas → procesadora con mantenimiento. Descarte por espera." />
      <Legend />
      <VariablesList {...problemData[10]} />
    </div>
  );
}

function DivertDiagram() {
  return (
    <div>
      <svg viewBox="0 0 350 120" className="w-full max-w-[350px] mx-auto">
        <ArrowDefs />
        <Arrow x1={320} y1={60} x2={200} y2={60} />
        {/* Bifurcación */}
        <line x1={200} y1={60} x2={200} y2={20} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3" />
        <Arrow x1={200} y1={20} x2={160} y2={20} />
        <text x={140} y={18} className="text-[9px] fill-red-400">desvío</text>
        {/* Al servidor */}
        <Arrow x1={200} y1={60} x2={120} y2={60} />
        <Server x={70} y={42} label="PS" />
        <Arrow x1={70} y1={60} x2={30} y2={60} />
        <text x={200} y={80} textAnchor="middle" className="text-[8px] fill-zinc-500">si PS ocupado → desvía</text>
      </svg>
      <DiagramLabel text="Si la máquina está ocupada, la pieza se desvía instantáneamente. No hay cola." />
      <Legend />
      <VariablesList {...problemData[11]} />
    </div>
  );
}

function CarpenterDiagram() {
  return (
    <div>
      <svg viewBox="0 0 450 80" className="w-full max-w-[450px] mx-auto">
        <ArrowDefs />
        <text x={420} y={45} className="text-[9px] fill-zinc-400">N sillas</text>
        <QueueDots x={350} y={40} count={2} />
        <Arrow x1={340} y1={40} x2={310} y2={40} />
        <Server x={260} y={22} label="Armar" />
        <Arrow x1={260} y1={40} x2={230} y2={40} />
        <Server x={170} y={22} label="Lijar" />
        <Arrow x1={170} y1={40} x2={140} y2={40} />
        <Server x={80} y={22} label="Lustrar" />
        <Arrow x1={80} y1={40} x2={40} y2={40} />
        <text x={20} y={44} className="text-[9px] fill-emerald-400">✓</text>
      </svg>
      <DiagramLabel text="Un carpintero procesa N sillas: Armar → Lijar → Lustrar." />
      <Legend />
      <VariablesList {...problemData[12]} />
    </div>
  );
}

function PriorityDiagram() {
  return (
    <div>
      <svg viewBox="0 0 380 130" className="w-full max-w-[380px] mx-auto">
        <ArrowDefs />
        {/* Cola A */}
        <text x={340} y={35} className="text-[9px] fill-blue-400">Tipo A</text>
        <Arrow x1={320} y1={40} x2={270} y2={40} />
        <QueueDots x={200} y={40} count={3} />
        {/* Cola B */}
        <text x={340} y={95} className="text-[9px] fill-amber-400">Tipo B</text>
        <Arrow x1={320} y1={100} x2={270} y2={100} />
        <QueueDots x={200} y={100} count={3} />
        {/* Merge */}
        <line x1={190} y1={40} x2={160} y2={70} stroke="#71717a" strokeWidth={1.5} />
        <line x1={190} y1={100} x2={160} y2={70} stroke="#71717a" strokeWidth={1.5} />
        <Arrow x1={160} y1={70} x2={120} y2={70} />
        <Server x={70} y={52} label="PS" />
        <Arrow x1={70} y1={70} x2={30} y2={70} />
        <text x={160} y={125} textAnchor="middle" className="text-[8px] fill-zinc-500">A tiene prioridad sobre B</text>
      </svg>
      <DiagramLabel text="Dos tipos de clientes. A tiene prioridad. No se interrumpe servicio." />
      <Legend />
      <VariablesList {...problemData[14]} />
    </div>
  );
}

function SecurityZoneDiagram() {
  return (
    <div>
      <svg viewBox="0 0 450 80" className="w-full max-w-[450px] mx-auto">
        <ArrowDefs />
        <Arrow x1={420} y1={40} x2={370} y2={40} />
        <QueueDots x={270} y={40} count={4} />
        <Arrow x1={260} y1={40} x2={220} y2={40} />
        {/* Zona de seguridad */}
        <rect x={140} y={20} width={80} height={40} rx={4} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4" />
        <text x={180} y={44} textAnchor="middle" className="text-[8px] fill-amber-400">ZONA SEG.</text>
        <Arrow x1={140} y1={40} x2={100} y2={40} />
        <Server x={50} y={22} label="PS" />
        <Arrow x1={50} y1={40} x2={10} y2={40} />
      </svg>
      <DiagramLabel text="PS alejado de la cola. Zona de seguridad intermedia bloquea ingreso." />
      <Legend />
      <VariablesList {...problemData[15]} />
    </div>
  );
}
