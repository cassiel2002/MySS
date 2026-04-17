import { motion } from 'framer-motion';

interface Props {
  clock: number;
  stepCount: number;
  maxTime: number;
}

export default function ClockDisplay({ clock, stepCount, maxTime }: Props) {
  const progress = Math.min((clock / maxTime) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800/60"
    >
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <i className="fi fi-rr-clock-three text-blue-400 text-xs" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Reloj</span>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={Math.floor(clock)}
              initial={{ opacity: 0.6, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-mono font-extralight text-zinc-100 tabular-nums tracking-tighter"
            >
              {clock.toFixed(2)}
            </motion.span>
            <span className="text-[11px] text-zinc-600 font-medium">/ {maxTime} u.t.</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <i className="fi fi-rr-layers text-[10px] text-zinc-600" />
            <span className="text-lg font-mono font-light text-zinc-300 tabular-nums">{stepCount}</span>
          </div>
          <span className="text-[10px] text-zinc-600">eventos procesados</span>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[9px] text-zinc-700 font-mono">0</span>
        <span className="text-[9px] text-blue-400/60 font-mono font-medium">{progress.toFixed(1)}%</span>
        <span className="text-[9px] text-zinc-700 font-mono">{maxTime}</span>
      </div>
    </motion.div>
  );
}
