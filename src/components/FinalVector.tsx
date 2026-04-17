import { motion } from 'framer-motion';
import type { SimulationState } from '../simulation/types';

interface Props {
  state: SimulationState;
  problemId: number;
}

export default function FinalVector({ state, problemId }: Props) {
  if (!state.finished) return null;

  const items = [
    { label: 'Reloj', value: state.clock.toFixed(2), unit: 'u.t.' },
    { label: 'PS', value: state.serverBusy ? '1 (ocupado)' : '0 (libre)' },
    { label: 'Cola', value: String(state.queue.length) },
    { label: 'Atendidos', value: String(state.stats.totalDepartures) },
    { label: 'Llegadas', value: String(state.stats.totalArrivals) },
  ];

  if (problemId === 2) {
    items.push({ label: 'Servidor', value: state.serverOn ? '1 (ON)' : '0 (OFF)' });
  }
  if (problemId === 3) {
    items.push({ label: 'Abandonos', value: String(state.stats.abandonedClients) });
  }
  if (problemId === 4) {
    items.splice(2, 1,
      { label: 'Cola A', value: String(state.queueA.length) },
      { label: 'Cola B', value: String(state.queueB.length) },
    );
  }
  if (problemId === 5) {
    items.push({ label: 'Zona Seg.', value: state.securityBusy ? '1 (ocupada)' : '0 (libre)' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-emerald-500/[0.06] rounded-2xl border border-emerald-500/15 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <i className="fi fi-rr-flag-checkered text-sm text-emerald-400/60" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Vector Final</span>
        <span className="ml-auto text-xs text-emerald-400 font-medium">{state.stats.totalDepartures} clientes atendidos</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map(item => (
          <div key={item.label} className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/40">
            <span className="text-[9px] text-zinc-500 block mb-1">{item.label}</span>
            <span className="text-sm font-mono text-zinc-200">{item.value}</span>
            {item.unit && <span className="text-[9px] text-zinc-600 ml-1">{item.unit}</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
