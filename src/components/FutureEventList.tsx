import { motion, AnimatePresence } from 'framer-motion';
import type { SimEvent } from '../simulation/types';

interface Props {
  fel: SimEvent[];
}

const labels: Record<string, { text: string; icon: string; color: string }> = {
  arrival:        { text: 'Llegada',      icon: 'fi fi-rr-sign-in-alt', color: 'text-blue-400' },
  departure:      { text: 'Fin servicio', icon: 'fi fi-rr-sign-out-alt', color: 'text-emerald-400' },
  server_on:      { text: 'Servidor ON',  icon: 'fi fi-rr-bolt', color: 'text-emerald-400' },
  server_off:     { text: 'Servidor OFF', icon: 'fi fi-rr-power', color: 'text-amber-400' },
  abandon:        { text: 'Abandono',     icon: 'fi fi-rr-running', color: 'text-red-400' },
  move_to_server: { text: 'A servidor',   icon: 'fi fi-rr-arrow-right', color: 'text-zinc-400' },
  arrival_a:      { text: 'Llegada A',    icon: 'fi fi-rr-star', color: 'text-blue-400' },
  arrival_b:      { text: 'Llegada B',    icon: 'fi fi-rr-user', color: 'text-amber-400' },
};

export default function FutureEventList({ fel }: Props) {
  const visible = fel.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-5 max-h-80 overflow-hidden flex flex-col"
    >
      <div className="flex items-center gap-2 mb-4">
        <i className="fi fi-rr-list text-sm text-zinc-500" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">FEL</span>
        <span className="ml-auto text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-md">{fel.length}</span>
      </div>
      <div className="space-y-1 overflow-y-auto flex-1">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <p className="text-[10px] text-zinc-700 italic">Sin eventos pendientes</p>
          ) : (
            visible.map((e, i) => {
              const info = labels[e.type] ?? { text: e.type, icon: 'fi fi-rr-circle', color: 'text-zinc-500' };
              return (
                <motion.div
                  key={`${e.type}-${e.time.toFixed(4)}-${e.clientId ?? i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-[10px] transition-colors ${i === 0 ? 'bg-blue-500/[0.08] border border-blue-500/15' : 'bg-zinc-800/40 border border-transparent'}`}
                >
                  <i className={`${info.icon} text-[9px] ${info.color} opacity-60`} />
                  <span className="font-mono text-zinc-500 w-12 text-right tabular-nums">{e.time.toFixed(2)}</span>
                  <span className={`flex-1 font-medium ${i === 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>{info.text}</span>
                  {e.clientId != null && <span className="text-zinc-600 font-mono">#{e.clientId}</span>}
                  {i === 0 && <span className="text-blue-400 text-[8px] font-bold tracking-wider">NEXT</span>}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        {fel.length > 8 && (
          <p className="text-[9px] text-zinc-700 text-center pt-1">+{fel.length - 8} más</p>
        )}
      </div>
    </motion.div>
  );
}
