import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '../simulation/types';

interface Props {
  log: LogEntry[];
}

const colors: Record<string, string> = {
  arrival: 'text-blue-400/70',
  departure: 'text-emerald-400/70',
  server: 'text-amber-400/70',
  abandon: 'text-red-400/70',
  info: 'text-zinc-400',
  security: 'text-violet-400/70',
};

const icons: Record<string, string> = {
  arrival: 'fi fi-rr-sign-in-alt',
  departure: 'fi fi-rr-sign-out-alt',
  server: 'fi fi-rr-server',
  abandon: 'fi fi-rr-running',
  info: 'fi fi-rr-info',
  security: 'fi fi-rr-shield',
};

export default function EventLog({ log }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/50">
        <i className="fi fi-rr-terminal text-sm text-zinc-500" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Log</span>
        <span className="ml-auto text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-md">{log.length}</span>
      </div>
      <div className="max-h-56 overflow-y-auto p-3 space-y-0.5">
        {log.length === 0 ? (
          <p className="text-[10px] text-zinc-700 italic px-2 py-3">Esperando eventos...</p>
        ) : (
          <AnimatePresence initial={false}>
            {log.slice(0, 60).map((entry, i) => (
              <motion.div
                key={`${entry.time}-${entry.message}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors group"
              >
                <i className={`${icons[entry.type] ?? 'fi fi-rr-circle'} text-[8px] mt-1 ${colors[entry.type] ?? 'text-zinc-600'} opacity-50 group-hover:opacity-100 transition-opacity`} />
                <span className="font-mono text-zinc-600 w-14 text-right tabular-nums flex-shrink-0 text-[10px]">
                  {entry.time.toFixed(2)}
                </span>
                <span className={`text-[10px] leading-relaxed ${colors[entry.type] ?? 'text-zinc-500'}`}>
                  {entry.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
