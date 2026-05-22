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
    { label: 'W', value: metrics.avgSystemTime.toFixed(2), unit: 'u.t.', desc: 'Tiempo prom. en sistema', icon: 'fi fi-rr-time-forward', color: 'text-emerald-400' },
  ];

  if (problemId === 7) {
    items.push({ label: 'Wq', value: metrics.avgWaitTime.toFixed(2), unit: 'u.t.', desc: 'Espera prom. en cola', icon: 'fi fi-rr-clock-three', color: 'text-blue-400' });
  }

  items.push(
    { label: 'ρ₁', value: (metrics.serverUtilizationS1 * 100).toFixed(1), unit: '%', desc: 'Utilización PS1', icon: 'fi fi-rr-chart-pie-alt', color: 'text-orange-400' },
    { label: 'ρ₂', value: (metrics.serverUtilizationS2 * 100).toFixed(1), unit: '%', desc: 'Utilización PS2', icon: 'fi fi-rr-chart-pie-alt', color: 'text-cyan-400' },
    { label: 'ρ₃', value: (metrics.serverUtilizationS3 * 100).toFixed(1), unit: '%', desc: 'Utilización PS3', icon: 'fi fi-rr-chart-pie-alt', color: 'text-pink-400' },
    { label: 'λ', value: metrics.throughput.toFixed(3), unit: '/u.t.', desc: 'Throughput', icon: 'fi fi-rr-chart-line-up', color: 'text-violet-400' },
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <i className="fi fi-rr-chart-histogram text-sm text-zinc-500" />
        <span className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold">Métricas</span>
        <span className="ml-auto text-xs text-zinc-600 font-mono">
          {state.stats.totalArrivals} in · {state.stats.totalDepartures} out
        </span>
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
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
              <i className={`${m.icon} text-xs ${m.color} opacity-60`} />
              <span className="text-xs text-zinc-500 font-semibold">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-light text-zinc-200 tabular-nums">{m.value}</span>
              <span className="text-xs text-zinc-600">{m.unit}</span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5">{m.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
