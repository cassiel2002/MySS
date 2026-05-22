import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatrixRow } from '../simulation/types';

interface Props {
  matrix: MatrixRow[];
  problemId: number;
  numServers?: number;
}

/**
 * Renders a visual schema of the system state (servers + queue clients)
 * Mimics the "ESQUEMAS DE ESTADOS DEL SISTEMA" column from the manual matrix.
 * - Filled circle (●) = server busy
 * - Empty circle (○) = server free or client in queue
 * - Square brackets around circle = server (puesto de servicio)
 */
function SystemSchema({ row, problemId }: { row: MatrixRow; problemId: number }) {
  const isParallel = problemId === 7;
  const isSingleServer = [9, 10, 11, 13, 14, 15].includes(problemId);

  // Server icon: [●] if busy, [○] if free
  const ServerIcon = ({ busy }: { busy: boolean }) => (
    <span className="inline-flex items-center justify-center w-[18px] h-[18px] border border-zinc-400 rounded-sm text-[10px] leading-none">
      {busy ? '●' : '○'}
    </span>
  );

  // Queue dot: ○ for each client waiting
  const QueueDot = () => (
    <span className="text-[11px] text-zinc-400">○</span>
  );

  if (isSingleServer) {
    // Single server: [PS] ○○○ (queue)
    const queueLen = problemId === 14 ? row.queueLenS1 + row.queueLenS2 : row.queueLenS1;
    const dots = Math.min(queueLen, 6);
    return (
      <div className="flex items-center gap-[2px] whitespace-nowrap">
        <ServerIcon busy={!!row.serverStateS1} />
        {Array.from({ length: dots }).map((_, i) => <QueueDot key={i} />)}
        {queueLen > 6 && <span className="text-[8px] text-zinc-500">+{queueLen - 6}</span>}
      </div>
    );
  }

  if (isParallel) {
    // Problema 2: 3 servers in parallel, single queue
    // Layout: [PS1][PS2][PS3] ○○○○ (queue)
    const queueLen = Math.min(row.queueLenS1, 8);
    return (
      <div className="flex items-center gap-[2px] whitespace-nowrap">
        <div className="flex flex-col gap-[1px]">
          <ServerIcon busy={!!row.serverStateS1} />
          <ServerIcon busy={!!row.serverStateS2} />
          <ServerIcon busy={!!row.serverStateS3} />
        </div>
        <div className="flex items-center gap-[1px] ml-1">
          {Array.from({ length: queueLen }).map((_, i) => (
            <QueueDot key={i} />
          ))}
          {row.queueLenS1 > 8 && <span className="text-[8px] text-zinc-500 ml-0.5">+{row.queueLenS1 - 8}</span>}
        </div>
      </div>
    );
  }

  // Problema 1 y 3: servers in series with their own queues
  // Layout: [PS1]○○○ [PS2]○○ [PS3]○
  const q1 = Math.min(row.queueLenS1, 5);
  const q2 = Math.min(row.queueLenS2, 5);
  const q3 = Math.min(row.queueLenS3, 5);

  return (
    <div className="flex items-center gap-[2px] whitespace-nowrap">
      <ServerIcon busy={!!row.serverStateS1} />
      {Array.from({ length: q1 }).map((_, i) => <QueueDot key={`a${i}`} />)}
      {row.queueLenS1 > 5 && <span className="text-[8px] text-zinc-500">+{row.queueLenS1 - 5}</span>}
      <ServerIcon busy={!!row.serverStateS2} />
      {Array.from({ length: q2 }).map((_, i) => <QueueDot key={`b${i}`} />)}
      {row.queueLenS2 > 5 && <span className="text-[8px] text-zinc-500">+{row.queueLenS2 - 5}</span>}
      <ServerIcon busy={!!row.serverStateS3} />
      {Array.from({ length: q3 }).map((_, i) => <QueueDot key={`c${i}`} />)}
      {row.queueLenS3 > 5 && <span className="text-[8px] text-zinc-500">+{row.queueLenS3 - 5}</span>}
    </div>
  );
}

export default function SimulationMatrix({ matrix, problemId, numServers = 3 }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new rows are added
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [matrix.length, isOpen]);

  if (matrix.length === 0) return null;

  const fmt = (t: number | null): string => {
    if (t === null) return '';
    return t.toFixed(2);
  };

  const isParallel = problemId === 7;
  const isSeries = problemId === 6;
  // problemId === 8 is "sucesivos" (single arrival, 3 queues)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 overflow-hidden"
    >
      {/* Header desplegable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <i className="fi fi-rr-table text-sm text-blue-400/60" />
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold">
            Matriz de Simulación
          </span>
          <span className="text-[11px] text-zinc-600 font-mono ml-2">
            ({matrix.length} filas)
          </span>
        </div>
        <motion.i
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="fi fi-rr-angle-down text-xs text-zinc-500"
        />
      </button>

      {/* Tabla */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div ref={containerRef} className="overflow-x-auto px-2 pb-3 max-h-[520px] overflow-y-auto scroll-smooth">

              {/* ═══════════════════════════════════════════════════════════
                  PROBLEMA 7 (Paralelo): Hora actual | H. próx. Llegada | H. próx. Fin Servicio (PS1,PS2,PS3) | Cant. en cola | Estado PS (PS1,PS2,PS3) | Esquema
                 ═══════════════════════════════════════════════════════════ */}
              {isParallel && (
                <table className="w-full text-[11px] border-collapse border border-zinc-700/50">
                  <thead className="sticky top-0 z-20 bg-zinc-800">
                    <tr className="border-b border-zinc-600">
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora<br/>actual</th>
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora de<br/>próx.<br/>Llegada</th>
                      <th colSpan={numServers} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Hora de próx.<br/>Fin de Servicio</th>
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Cant. de<br/>clientes<br/>en cola</th>
                      <th colSpan={numServers} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Estado del PS</th>
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Esquema</th>
                    </tr>
                    <tr className="border-b border-zinc-600">
                      {numServers >= 1 && <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>}
                      {numServers >= 2 && <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>}
                      {numServers >= 3 && <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>}
                      {numServers >= 1 && <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>}
                      {numServers >= 2 && <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>}
                      {numServers >= 3 && <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, backgroundColor: 'rgba(59,130,246,0.1)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                        transition={{ duration: 0.5 }}
                        className="border-b border-zinc-700/40 hover:bg-zinc-800/50"
                      >
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.clock)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.nextArrivalS1)}</td>
                        {numServers >= 1 && <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS1)}</td>}
                        {numServers >= 2 && <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS2)}</td>}
                        {numServers >= 3 && <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS3)}</td>}
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS1}</td>
                        {numServers >= 1 && <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS1}</td>}
                        {numServers >= 2 && <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS2}</td>}
                        {numServers >= 3 && <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS3}</td>}
                        <td className="border border-zinc-700/40 px-2 py-2"><SystemSchema row={row} problemId={problemId} /></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PROBLEMA 6 (Serie): Hora actual | H. próx. Lleg. (S1,S2,S3) | H. próx. Fin Servicio (PS1,PS2,PS3) | Cant. en cola (PS1,PS2,PS3) | Estado PS (PS1,PS2,PS3) | Esquema
                 ═══════════════════════════════════════════════════════════ */}
              {isSeries && (
                <table className="w-full text-[11px] border-collapse border border-zinc-700/50 min-w-[950px]">
                  <thead className="sticky top-0 z-20 bg-zinc-800">
                    <tr className="border-b border-zinc-600">
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora<br/>actual</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">H. de prox. Lleg. de un<br/>cl. al sist p/recibir el serv:</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Hora de próx. Fin de<br/>Servicio</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Cant. de clientes<br/>en cola de:</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Estado del PS</th>
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">ESQUEMAS DE<br/>ESTADOS DEL<br/>SISTEMA</th>
                    </tr>
                    <tr className="border-b border-zinc-600">
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">S1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">S2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">S3</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, backgroundColor: 'rgba(59,130,246,0.1)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                        transition={{ duration: 0.5 }}
                        className="border-b border-zinc-700/40 hover:bg-zinc-800/50"
                      >
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.clock)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextArrivalS1)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextArrivalS2)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextArrivalS3)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS1)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS2)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS3)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS1}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS2}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS3}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS1}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS2}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS3}</td>
                        <td className="border border-zinc-700/40 px-2 py-2"><SystemSchema row={row} problemId={problemId} /></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PROBLEMA 8 (Sucesivos): Hora actual | H. próx. Llegada | H. próx. Fin Servicio (PS1,PS2,PS3) | Cant. en Cola (C1,C2,C3) | Estado PS (PS1,PS2,PS3) | Gráficamente
                 ═══════════════════════════════════════════════════════════ */}
              {(problemId === 8 || problemId === 12) && (
                <table className="w-full text-[11px] border-collapse border border-zinc-700/50 min-w-[900px]">
                  <thead className="sticky top-0 z-20 bg-zinc-800">
                    <tr className="border-b border-zinc-600">
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora<br/>actual</th>
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora de<br/>próx.<br/>Llegada</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Hora de próx. Fin de Servicio</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Cantidad de<br/>Clientes en Cola</th>
                      <th colSpan={3} className="border border-zinc-700/50 px-2 py-1 text-zinc-300 font-semibold text-center">Estado del PS</th>
                      <th rowSpan={2} className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Gráficamente</th>
                    </tr>
                    <tr className="border-b border-zinc-600">
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">C1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">C2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">C3</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS1</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS2</th>
                      <th className="border border-zinc-700/50 px-2 py-1 text-zinc-400 font-medium text-center">PS3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, backgroundColor: 'rgba(59,130,246,0.1)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                        transition={{ duration: 0.5 }}
                        className="border-b border-zinc-700/40 hover:bg-zinc-800/50"
                      >
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.clock)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.nextArrivalS1)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS1)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS2)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS3)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS1}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS2}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{row.queueLenS3}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS1}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS2}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS3}</td>
                        <td className="border border-zinc-700/40 px-2 py-2"><SystemSchema row={row} problemId={problemId} /></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PROBLEMAS DE UN SOLO SERVIDOR (9, 10, 11, 13, 14, 15)
                  Hora actual | H. próx. Llegada | H. próx. Fin Servicio | Cant. en cola | Estado PS | Gráficamente
                 ═══════════════════════════════════════════════════════════ */}
              {![6, 7, 8, 12].includes(problemId) && (
                <table className="w-full text-[11px] border-collapse border border-zinc-700/50">
                  <thead className="sticky top-0 z-20 bg-zinc-800">
                    <tr className="border-b border-zinc-600">
                      <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora<br/>actual</th>
                      <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora de<br/>próx.<br/>Llegada</th>
                      <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Hora de<br/>próx. Fin<br/>de servicio</th>
                      <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Cant. de<br/>clientes<br/>en cola</th>
                      <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Estado<br/>del P.S.</th>
                      {(problemId === 9 || problemId === 10) && (
                        <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Est.<br/>Servidor</th>
                      )}
                      {problemId === 14 && (
                        <>
                          <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Cola A</th>
                          <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Cola B</th>
                        </>
                      )}
                      {problemId === 15 && (
                        <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Zona<br/>Seg.</th>
                      )}
                      <th className="border border-zinc-700/50 px-2 py-1.5 text-zinc-300 font-semibold text-center">Gráficamente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, backgroundColor: 'rgba(59,130,246,0.1)' }}
                        animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                        transition={{ duration: 0.5 }}
                        className="border-b border-zinc-700/40 hover:bg-zinc-800/50"
                      >
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.clock)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">{fmt(row.nextArrivalS1)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-300 text-center">{fmt(row.nextDepartureS1)}</td>
                        <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center font-semibold">
                          {problemId === 14 ? row.queueLenS1 + row.queueLenS2 : row.queueLenS1}
                        </td>
                        <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS1}</td>
                        {(problemId === 9 || problemId === 10) && (
                          <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS2 ? '1' : '0'}</td>
                        )}
                        {problemId === 14 && (
                          <>
                            <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center">{row.queueLenS1}</td>
                            <td className="border border-zinc-700/40 px-2 py-2 font-mono text-zinc-200 text-center">{row.queueLenS2}</td>
                          </>
                        )}
                        {problemId === 15 && (
                          <td className="border border-zinc-700/40 px-2 py-2 text-center font-mono text-zinc-300">{row.serverStateS2}</td>
                        )}
                        <td className="border border-zinc-700/40 px-2 py-2">
                          <SystemSchema row={row} problemId={problemId} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
