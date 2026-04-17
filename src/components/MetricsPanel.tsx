import { motion } from 'framer-motion';
import type { ComputedMetrics, SimulationState } from '../simulation/types';

interface Props {
  metrics: ComputedMetrics;
  state: SimulationState;
  problemId: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const card = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function MetricsPanel({ metrics, state, problemId }: Props) {
  const items = [
    { label: 'Wq', value: metrics.avgWaitTime.toFixed(2), unit: 'u.t.', desc: 'Espera en cola', icon: 'fi fi-rr-clock-three', color: 'text-blue-400' },
    { label: 'W', value: metrics.avgSystemTime.toFixed(2), unit: 'u.t.', desc: 'Tiempo en sistema', icon: 'fi fi-rr-time-forward', color: 'text-emerald-400' },
    { label: 'ρ', value: (metrics.serverUtilization * 100).toFixed(1), unit: '%', desc: 'Utilización', icon: 'fi fi-rr-chart-pie-alt', color: 'text-amber-400' },
    { label: 'Lq', value: metrics.avgQueueLength.toFixed(2), unit: 'prom.', desc: 'Clientes en cola', icon: 'fi fi-rr-users', color: 'text-red-400' },
    { label: 'λ', value: metrics.throughput.toFixed(3), unit: '/u.t.', desc: 'Throughput', icon: 'fi fi-rr-chart-line-up', color: 'text-violet-400' },
  ];

  if (problemId === 3) {
    items.push({ label: '✗', value: (metrics.abandonRate * 100).toFixed(1), unit: '%', desc: 'Abandono', icon: 'fi fi-rr-running', color: 'text-red-400' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <i className="fi fi-rr-chart-histogram text-sm text-zinc-500" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Métricas</span>
        <span className="ml-auto text-[9px] text-zinc-600 font-mono">
          {state.stats.totalArrivals} in · {state.stats.totalDepartures} out
        </span>
      </div>
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {items.map(m => (
          <motion.div
            key={m.label}
            variants={card}
            className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/30 hover:border-zinc-600/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <i className={`${m.icon} text-[10px] ${m.color} opacity-60`} />
              <span className="text-[10px] text-zinc-500 font-semibold">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-light text-zinc-200 tabular-nums">{m.value}</span>
              <span className="text-[9px] text-zinc-600">{m.unit}</span>
            </div>
            <p className="text-[9px] text-zinc-600 mt-1.5">{m.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
