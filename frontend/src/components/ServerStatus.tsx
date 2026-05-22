import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationState } from '../simulation/types';

interface Props {
  state: SimulationState;
  problemId: number;
  numServers?: number;
}

function ServerBox({ label, busy, clientId, icon }: {
  label: string; busy: boolean; clientId?: number | null; icon: string;
}) {
  const status = busy ? 'OCUPADO' : 'LIBRE';
  const dotCls = busy ? 'bg-red-400 animate-pulse' : 'bg-emerald-400';
  const borderCls = busy ? 'border-red-500/20' : 'border-emerald-500/20';
  const bgCls = busy ? 'bg-red-500/[0.05]' : 'bg-emerald-500/[0.05]';
  const textCls = busy ? 'text-red-300' : 'text-emerald-300';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex-1 rounded-2xl border ${borderCls} ${bgCls} p-4 transition-all duration-500`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className={`${icon} text-sm ${textCls}`} />
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">{label}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${textCls}`}>
          <span className={`w-2 h-2 rounded-full ${dotCls}`} />
          <span className="text-[10px] font-semibold tracking-wide">{status}</span>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {busy && clientId != null ? (
          <motion.div
            key={`c-${clientId}`}
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 120, damping: 12, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-mono font-semibold flex items-center justify-center border border-zinc-700/50">
              #{clientId}
            </div>
            <span className="text-[10px] text-zinc-500">en servicio</span>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-10 flex items-center"
          >
            <span className="text-[10px] text-zinc-700 italic">Esperando...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ServerStatus({ state, problemId, numServers = 3 }: Props) {
  const isSingleServer = [9, 10, 11, 13, 14, 15].includes(problemId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      {problemId === 7 && (
        <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Servicio único — {numServers} puestos paralelos</p>
      )}
      {(problemId === 6 || problemId === 8) && (
        <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-semibold">
          {problemId === 6 ? `${numServers} servicios en secuencia` : `${numServers} servicios sucesivos`}
        </p>
      )}
      {isSingleServer ? (
        <div className="flex gap-3">
          <ServerBox label="PS" busy={state.serverBusy} clientId={state.currentClient?.id ?? null} icon="fi fi-rr-server" />
        </div>
      ) : (
        <div className="flex gap-3">
          <ServerBox label="PS1" busy={state.server1Busy} clientId={state.currentClientS1?.id ?? null} icon="fi fi-rr-server" />
          {numServers >= 2 && <ServerBox label="PS2" busy={state.server2Busy} clientId={state.currentClientS2?.id ?? null} icon="fi fi-rr-server" />}
          {numServers >= 3 && <ServerBox label="PS3" busy={state.server3Busy} clientId={state.currentClientS3?.id ?? null} icon="fi fi-rr-server" />}
        </div>
      )}
    </motion.div>
  );
}
