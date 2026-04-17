import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  problemId: number;
}

const explanations: Record<number, { title: string; desc: string; events: string[]; variables: string[]; how: string }> = {
  1: {
    title: 'Cola Simple M/M/1',
    desc: 'Los clientes llegan uno a uno a intervalos aleatorios. Si el servidor está ocupado, esperan en cola FIFO. Al terminar un servicio, el siguiente cliente pasa instantáneamente.',
    events: ['Llegada de un cliente al sistema', 'Fin de servicio'],
    variables: ['Estado del servidor (libre/ocupado)', 'Cantidad de clientes en cola'],
    how: 'Se genera una llegada con distribución exponencial. Si el servidor está libre, el cliente entra directo. Si está ocupado, se encola. Al terminar un servicio, se atiende al primero de la cola.',
  },
  2: {
    title: 'Servidor Intermitente',
    desc: 'Igual al problema 1, pero el servidor alterna entre períodos activos e inactivos. Trabaja unos minutos, descansa otros, y así sucesivamente.',
    events: ['Llegada de un cliente', 'Fin de servicio', 'Regreso del servidor (ON)', 'Salida del servidor (OFF)'],
    variables: ['Estado del servidor (libre/ocupado)', 'Cantidad en cola', 'Presencia del servidor (ON/OFF)'],
    how: 'Se programan eventos de encendido/apagado del servidor. Cuando está OFF, los clientes se acumulan en cola. Al encenderse, si hay clientes esperando y el servidor está libre, comienza a atender.',
  },
  3: {
    title: 'Clientes Impacientes',
    desc: 'Igual al problema 1, pero cada cliente tiene un límite de paciencia. Si espera demasiado en cola, abandona el sistema sin ser atendido.',
    events: ['Llegada de un cliente', 'Fin de servicio', 'Abandono de cola'],
    variables: ['Estado del servidor', 'Cantidad en cola', 'Hora de llegada de cada cliente en cola'],
    how: 'Al llegar a la cola, se programa un evento de abandono para ese cliente. Si es atendido antes, se cancela el abandono. Si el tiempo expira, el cliente se retira de la cola.',
  },
  4: {
    title: 'Prioridad A sobre B',
    desc: 'Llegan dos tipos de clientes (A y B). Los tipo A tienen prioridad: siempre se atienden antes que los B. No se interrumpe un servicio en curso.',
    events: ['Llegada de cliente A', 'Llegada de cliente B', 'Fin de servicio'],
    variables: ['Estado del servidor', 'Cantidad de clientes A en cola', 'Cantidad de clientes B en cola'],
    how: 'Cada tipo tiene su propia cola y tasa de llegada. Al liberarse el servidor, se revisa primero la cola A. Solo si está vacía se atiende de la cola B.',
  },
  5: {
    title: 'Zona de Seguridad',
    desc: 'El servidor está alejado de la cola. Existe una zona de seguridad intermedia. Solo puede entrar un cliente a la zona cuando el anterior sale del servidor.',
    events: ['Llegada al sistema', 'Llegada al servidor (fin zona seguridad)', 'Fin de servicio'],
    variables: ['Estado del servidor', 'Cantidad en cola', 'Estado de la zona de seguridad (libre/ocupada)'],
    how: 'Al salir un cliente del servidor, el primero de la cola entra a la zona de seguridad. Mientras recorre la zona, nadie más puede entrar. Excepción: si todo está vacío, un cliente nuevo entra directo a la zona.',
  },
};

export default function ProblemExplanation({ problemId }: Props) {
  const e = explanations[problemId];
  if (!e) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={problemId}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="border-t border-zinc-800/50 pt-8 mt-4"
      >
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <i className="fi fi-rr-book-alt text-violet-400 text-sm" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold block">Cómo resolver</span>
              <span className="text-[10px] text-zinc-600">Problema {problemId}</span>
            </div>
          </div>

          <h3 className="text-base text-zinc-200 font-semibold mb-2 tracking-tight">{e.title}</h3>
          <p className="text-[12px] text-zinc-500 leading-relaxed mb-6">{e.desc}</p>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <i className="fi fi-rr-bolt text-[10px] text-blue-400/60" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">Eventos</span>
              </div>
              <ul className="space-y-2">
                {e.events.map((ev, i) => (
                  <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 mt-1.5 flex-shrink-0" />
                    {ev}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <i className="fi fi-rr-database text-[10px] text-emerald-400/60" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">Variables de estado</span>
              </div>
              <ul className="space-y-2">
                {e.variables.map((v, i) => (
                  <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 mt-1.5 flex-shrink-0" />
                    {v}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <i className="fi fi-rr-lightbulb-on text-[10px] text-amber-400/60" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] font-semibold">Lógica de resolución</span>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed">{e.how}</p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
