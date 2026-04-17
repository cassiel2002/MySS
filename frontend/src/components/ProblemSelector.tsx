import { motion } from 'framer-motion';
import { problems } from '../simulation/problems';

interface Props {
  selectedId: number;
  onSelect: (id: number) => void;
}

const icons = [
  'fi fi-rr-queue-line',
  'fi fi-rr-bolt',
  'fi fi-rr-running',
  'fi fi-rr-users-alt',
  'fi fi-rr-shield-check',
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ProblemSelector({ selectedId, onSelect }: Props) {
  return (
    <motion.div
      className="grid grid-cols-5 gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {problems.map((problem, i) => {
        const sel = problem.id === selectedId;
        return (
          <motion.button
            key={problem.id}
            variants={item}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(problem.id)}
            className={`
              group relative p-4 rounded-2xl text-left transition-colors duration-200 border
              ${sel
                ? 'bg-blue-500/10 border-blue-500/25'
                : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700'
              }
            `}
          >
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-sm transition-colors
              ${sel ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'}
            `}>
              <i className={icons[i]} />
            </div>
            <p className={`text-xs font-medium leading-snug ${sel ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
              {problem.name}
            </p>
            <span className={`text-[10px] mt-1 block ${sel ? 'text-blue-400/50' : 'text-zinc-600'}`}>
              Problema {problem.id}
            </span>
            {sel && (
              <motion.div
                layoutId="sel-dot"
                className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-400"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
