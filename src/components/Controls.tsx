import { motion } from 'framer-motion';

interface Props {
  isInitialized: boolean;
  isRunning: boolean;
  isFinished: boolean;
  onInit: () => void;
  onStep: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export default function Controls({
  isInitialized, isRunning, isFinished,
  onInit, onStep, onStart, onStop, onReset
}: Props) {
  const handlePlayPause = () => {
    if (!isInitialized) { onInit(); onStart(); }
    else if (isRunning) onStop();
    else onStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-2 py-4 border-y border-zinc-800/50 flex-wrap"
    >
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePlayPause}
        disabled={isFinished}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all
          ${isFinished
            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
            : isRunning
            ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            : 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
          }
        `}
      >
        <i className={`fi ${isRunning ? 'fi-rr-pause' : 'fi-rr-play'} text-[11px]`} />
        {isRunning ? 'Pausar' : isInitialized ? 'Continuar' : 'Iniciar'}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { if (!isInitialized) onInit(); else onStep(); }}
        disabled={isRunning || isFinished}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all
          ${(isRunning || isFinished)
            ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
            : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
          }
        `}
      >
        <i className="fi fi-rr-forward text-[10px]" /> Paso
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-zinc-800/80 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <i className="fi fi-rr-refresh text-[10px]" /> Reset
      </motion.button>

      {isFinished && (
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium ml-2"
        >
          <i className="fi fi-sr-check-circle text-[10px]" /> Simulación completada
        </motion.span>
      )}
    </motion.div>
  );
}
