import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationState } from '../simulation/types';

interface Props {
  state: SimulationState;
  problemId: number;
}

function ServerBox({ label, busy, on = true, clientId, icon }: {
  label: string; busy: boolean; on?: boolean; clientId?: number | null; icon: string;
}) {
  const isOff = !on;
  const status = isOff ? 'OFF' : busy ? 'OCUPADO' : 'LIBRE';
  const dotCls = isOff ? 'bg-zinc-600' : busy ? 'bg-red-400 animate-pulse' : 'bg-emerald-400';
  const borderCls = isOff ? 'border-zinc-800/60' : busy ? 'border-red-500/20' : 'border-emerald-500/20';
  const bgCls = isOff ? 'bg-zinc-900' : busy ? 'bg-red-500/[0.05]' : 'bg-emerald-500/[0.05]';
  const textCls = isOff ? 'text-zinc-600' : busy ? 'text-red-300' : 'text-emerald-300';

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
        {busy && on && clientId != null ? (
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
            <span className="text-[10px] text-zinc-700 italic">{isOff ? 'Servidor inactivo' : 'Esperando...'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ServerStatus({ state, problemId }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="flex gap-3"
    >
      {problemId === 5 ? (
        <>
          <ServerBox label="Zona Seguridad" busy={state.securityBusy} clientId={state.currentSecurityClient?.id ?? null} icon="fi fi-rr-shield" />
          <ServerBox label="Servidor" busy={state.serverBusy} clientId={state.currentClient?.id ?? null} icon="fi fi-rr-server" />
        </>
      ) : (
        <ServerBox
          label="Servidor Principal"
          busy={state.serverBusy}
          on={problemId === 2 ? state.serverOn : true}
          clientId={state.currentClient?.id ?? null}
          icon={problemId === 2 ? (state.serverOn ? 'fi fi-rr-bolt' : 'fi fi-rr-power') : 'fi fi-rr-server'}
        />
      )}
    </motion.div>
  );
}
