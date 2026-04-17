import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationState, Client } from '../simulation/types';

interface Props {
  state: SimulationState;
  problemId: number;
}

function QueueRow({ label, clients, icon }: {
  label: string; clients: Client[]; icon: string;
}) {
  const MAX = 30;
  const visible = clients.slice(0, MAX);
  const hidden = clients.length - MAX;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className={`${icon} text-xs text-zinc-500`} />
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">{label}</span>
        </div>
        <motion.span
          key={clients.length}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-xs font-mono text-zinc-400 tabular-nums bg-zinc-800 px-2 py-0.5 rounded-md"
        >
          {clients.length}
        </motion.span>
      </div>
      <div className="flex items-center gap-1.5 min-h-[36px] flex-wrap">
        {clients.length === 0 ? (
          <span className="text-[10px] text-zinc-700 italic">Cola vacía</span>
        ) : (
          <>
            <AnimatePresence>
              {visible.map((c, i) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ delay: i * 0.008, type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-[10px] text-zinc-400 font-mono font-medium flex items-center justify-center border border-zinc-700/40 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-default"
                  title={`#${c.id} — llegó t=${c.arrivalTime.toFixed(2)}`}
                >
                  {c.id}
                </motion.div>
              ))}
            </AnimatePresence>
            {hidden > 0 && (
              <span className="text-[10px] text-zinc-600 ml-1 font-medium">+{hidden}</span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function QueueDisplay({ state, problemId }: Props) {
  return (
    <div className="space-y-3">
      {problemId === 4 ? (
        <>
          <QueueRow label="Cola A — Prioridad" clients={state.queueA} icon="fi fi-rr-star" />
          <QueueRow label="Cola B" clients={state.queueB} icon="fi fi-rr-users" />
        </>
      ) : (
        <QueueRow label="Cola de Espera" clients={state.queue} icon="fi fi-rr-queue-line" />
      )}
    </div>
  );
}
