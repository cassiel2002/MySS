import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  count: number;
}

export default function AbandonCounter({ count }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-red-500/[0.06] rounded-2xl border border-red-500/15 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <i className="fi fi-rr-running text-sm text-red-400/60" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">Abandonos</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-mono font-light text-red-400 tabular-nums block"
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <p className="text-[9px] text-zinc-600 mt-1">clientes que abandonaron la cola</p>
    </motion.div>
  );
}
