import { motion, AnimatePresence } from 'framer-motion';
import type { ProblemConfig, TimeMode, Distribution } from '../simulation/types';

interface Props {
  problemId: number;
  config: ProblemConfig;
  onChange: (config: ProblemConfig) => void;
  disabled: boolean;
}

const arrivalModes: { value: TimeMode; label: string; desc: string }[] = [
  { value: 'manual', label: 'Constante', desc: 'Valor fijo' },
  { value: 'random', label: 'Aleatorio', desc: 'Distribución' },
  { value: 'list', label: 'Lista', desc: 'Valores definidos' },
];

const distributions: { value: Distribution; label: string }[] = [
  { value: 'exponential', label: 'Exponencial' },
  { value: 'uniform', label: 'Uniforme' },
  { value: 'normal', label: 'Normal' },
];

function Label({ icon, text }: { icon: string; text: string }) {
  return (
    <label className="flex items-center gap-2 mb-1.5">
      <i className={`${icon} text-xs text-zinc-600`} />
      <span className="text-xs text-zinc-500">{text}</span>
    </label>
  );
}

function NumInput({ value, onChange, disabled, min = 0, step = 0.5, placeholder }: {
  value: number; onChange: (v: number) => void; disabled: boolean; min?: number; step?: number; placeholder?: string;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={e => onChange(parseFloat(e.target.value) || min)}
      className={`
        w-full px-3 py-2.5 text-sm rounded-xl border font-mono tabular-nums transition-all bg-zinc-800 appearance-none
        ${disabled
          ? 'border-zinc-800/40 text-zinc-600 cursor-not-allowed'
          : 'border-zinc-700/50 text-zinc-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20'
        }
      `}
    />
  );
}

function ListInput({ value, onChange, disabled, placeholder }: {
  value: number[]; onChange: (v: number[]) => void; disabled: boolean; placeholder?: string;
}) {
  const text = value.length > 0 ? value.join(', ') : '';
  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder || 'Ej: 5, 3, 8, 2, 6'}
      disabled={disabled}
      onChange={e => {
        const nums = e.target.value
          .split(/[,;\s]+/)
          .map(s => parseFloat(s.trim()))
          .filter(n => !isNaN(n) && n > 0);
        onChange(nums);
      }}
      className={`
        w-full px-3 py-2.5 text-sm rounded-xl border font-mono tabular-nums transition-all bg-zinc-800 appearance-none
        ${disabled
          ? 'border-zinc-800/40 text-zinc-600 cursor-not-allowed'
          : 'border-zinc-700/50 text-zinc-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20'
        }
      `}
    />
  );
}

function SectionTitle({ text }: { text: string }) {
  return <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-2">{text}</p>;
}

export default function ConfigPanel({ problemId, config, onChange, disabled }: Props) {
  const set = (partial: Partial<ProblemConfig>) => onChange({ ...config, ...partial });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <i className="fi fi-rr-settings-sliders text-sm text-zinc-500" />
        <span className="text-xs uppercase tracking-[0.12em] text-zinc-500 font-semibold">Parámetros del Ejercicio</span>
        {disabled && (
          <span className="ml-auto text-[10px] text-amber-400/60 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
            <i className="fi fi-rr-lock text-[8px]" /> En ejecución
          </span>
        )}
      </div>

      {/* ─── Tiempo máximo ─── */}
      <div>
        <Label icon="fi fi-rr-hourglass-end" text="Tiempo máximo de simulación" />
        <NumInput value={config.maxTime} onChange={v => set({ maxTime: v })} disabled={disabled} min={10} step={10} />
      </div>

      {/* ─── Cantidad de puestos de servicio ─── */}
      <div>
        <Label icon="fi fi-rr-server" text="Cantidad de puestos de servicio" />
        <div className="flex gap-1">
          {[1, 2, 3].map(n => (
            <motion.button
              key={n}
              disabled={disabled}
              onClick={() => set({ numServers: n })}
              whileTap={{ scale: 0.95 }}
              className={`
                flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                ${config.numServers === n
                  ? 'bg-blue-500/15 text-blue-300'
                  : disabled ? 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {n} PS
            </motion.button>
          ))}
        </div>

        {/* Estado inicial de cada PS (ocupado/libre) */}
        <div className="mt-3">
          <span className="text-[10px] text-zinc-600 mb-1.5 block">Estado inicial de cada PS (condición para prestar servicio)</span>
          <div className="flex gap-2">
            <AnimatePresence mode="popLayout">
              {Array.from({ length: config.numServers }).map((_, i) => (
                <motion.button
                  key={`ps-${i}`}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  disabled={disabled}
                  onClick={() => {
                    const key = `initialPS${i + 1}` as keyof ProblemConfig;
                    const current = (config[key] as number) ?? 0;
                    set({ [key]: current === 1 ? 0 : 1 } as Partial<ProblemConfig>);
                  }}
                  className={`
                    flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border
                    ${(config[`initialPS${i + 1}` as keyof ProblemConfig] ?? 0) === 1
                      ? 'bg-red-500/10 border-red-500/20 text-red-300'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  PS{i + 1}: {(config[`initialPS${i + 1}` as keyof ProblemConfig] ?? 0) === 1 ? '1 (ocup)' : '0 (libre)'}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TIEMPOS ENTRE LLEGADAS
         ═══════════════════════════════════════════ */}
      <div className="border-t border-zinc-800/50 pt-4 space-y-3">
        <SectionTitle text="Tiempos entre llegadas (ΔLL)" />

        {/* Modo de llegadas */}
        <div className="flex gap-1">
          {arrivalModes.map(m => (
            <button
              key={m.value}
              disabled={disabled}
              onClick={() => set({ arrivalMode: m.value })}
              className={`
                flex-1 py-2 rounded-xl text-[10px] font-semibold transition-all
                ${config.arrivalMode === m.value
                  ? 'bg-blue-500/15 text-blue-300'
                  : disabled ? 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Distribución (solo aleatorio) */}
        {config.arrivalMode === 'random' && (
          <div>
            <span className="text-[10px] text-zinc-600 mb-1 block">Distribución</span>
            <div className="flex gap-1">
              {distributions.map(d => (
                <button
                  key={d.value}
                  disabled={disabled}
                  onClick={() => set({ arrivalDistribution: d.value })}
                  className={`
                    flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all
                    ${config.arrivalDistribution === d.value
                      ? 'bg-violet-500/15 text-violet-300'
                      : disabled ? 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }
                  `}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Valores de llegada */}
        {config.arrivalMode === 'list' ? (
          problemId === 6 ? (
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL1 (lista separada por comas)</span>
                <ListInput value={config.arrivalListS1} onChange={v => set({ arrivalListS1: v })} disabled={disabled} placeholder="45, 50, 40..." />
              </div>
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL2 (lista)</span>
                <ListInput value={config.arrivalListS2} onChange={v => set({ arrivalListS2: v })} disabled={disabled} placeholder="25, 30, 20..." />
              </div>
              {config.numServers >= 3 && (
                <div>
                  <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL3 (lista)</span>
                  <ListInput value={config.arrivalListS3} onChange={v => set({ arrivalListS3: v })} disabled={disabled} placeholder="15, 10, 20..." />
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL (lista separada por comas)</span>
              <ListInput value={config.arrivalList} onChange={v => set({ arrivalList: v })} disabled={disabled} placeholder="60, 6, 15, 2, 13..." />
            </div>
          )
        ) : (
          problemId === 6 ? (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL1</span>
                <NumInput value={config.arrivalIntervalS1} onChange={v => set({ arrivalIntervalS1: v })} disabled={disabled} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL2</span>
                <NumInput value={config.arrivalIntervalS2} onChange={v => set({ arrivalIntervalS2: v })} disabled={disabled} />
              </div>
              {config.numServers >= 3 && (
                <div>
                  <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔLL3</span>
                  <NumInput value={config.arrivalIntervalS3} onChange={v => set({ arrivalIntervalS3: v })} disabled={disabled} />
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-zinc-600 mb-0.5 block">{config.arrivalMode === 'manual' ? 'ΔLL (constante)' : 'ΔLL (media)'}</span>
              <NumInput value={config.arrivalInterval} onChange={v => set({ arrivalInterval: v, arrivalIntervalS1: v })} disabled={disabled} />
            </div>
          )
        )}
      </div>

      {/* ═══════════════════════════════════════════
          TIEMPOS DE SERVICIO
         ═══════════════════════════════════════════ */}
      <div className="border-t border-zinc-800/50 pt-4 space-y-3">
        <SectionTitle text="Tiempos de servicio (ΔFS)" />

        {/* Modo de servicio */}
        <div className="flex gap-1">
          {arrivalModes.map(m => (
            <button
              key={m.value}
              disabled={disabled}
              onClick={() => set({ serviceMode: m.value })}
              className={`
                flex-1 py-2 rounded-xl text-[10px] font-semibold transition-all
                ${config.serviceMode === m.value
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : disabled ? 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Distribución servicio (solo aleatorio) */}
        {config.serviceMode === 'random' && (
          <div>
            <span className="text-[10px] text-zinc-600 mb-1 block">Distribución</span>
            <div className="flex gap-1">
              {distributions.map(d => (
                <button
                  key={d.value}
                  disabled={disabled}
                  onClick={() => set({ serviceDistribution: d.value })}
                  className={`
                    flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all
                    ${config.serviceDistribution === d.value
                      ? 'bg-violet-500/15 text-violet-300'
                      : disabled ? 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }
                  `}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Valores de servicio */}
        {config.serviceMode === 'list' ? (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔFS1 (lista)</span>
              <ListInput value={config.serviceListS1} onChange={v => set({ serviceListS1: v })} disabled={disabled} placeholder="40, 35, 45..." />
            </div>
            {config.numServers >= 2 && (
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔFS2 (lista)</span>
                <ListInput value={config.serviceListS2} onChange={v => set({ serviceListS2: v })} disabled={disabled} placeholder="20, 25, 18..." />
              </div>
            )}
            {config.numServers >= 3 && (
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔFS3 (lista)</span>
                <ListInput value={config.serviceListS3} onChange={v => set({ serviceListS3: v })} disabled={disabled} placeholder="10, 12, 8..." />
              </div>
            )}
          </div>
        ) : config.serviceMode === 'random' && config.serviceDistribution === 'uniform' ? (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 mb-1 block font-medium">PS1: Uniforme entre</span>
              <div className="grid grid-cols-2 gap-2">
                <NumInput value={config.serviceMinS1 ?? 3} onChange={v => set({ serviceMinS1: v })} disabled={disabled} />
                <NumInput value={config.serviceMaxS1 ?? 5} onChange={v => set({ serviceMaxS1: v })} disabled={disabled} />
              </div>
            </div>
            {config.numServers >= 2 && (
              <div>
                <span className="text-[10px] text-zinc-500 mb-1 block font-medium">PS2: Uniforme entre</span>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput value={config.serviceMinS2 ?? 3} onChange={v => set({ serviceMinS2: v })} disabled={disabled} />
                  <NumInput value={config.serviceMaxS2 ?? 5} onChange={v => set({ serviceMaxS2: v })} disabled={disabled} />
                </div>
              </div>
            )}
            {config.numServers >= 3 && (
              <div>
                <span className="text-[10px] text-zinc-500 mb-1 block font-medium">PS3: Uniforme entre</span>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput value={config.serviceMinS3 ?? 3} onChange={v => set({ serviceMinS3: v })} disabled={disabled} />
                  <NumInput value={config.serviceMaxS3 ?? 5} onChange={v => set({ serviceMaxS3: v })} disabled={disabled} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-${Math.min(config.numServers, 3)} gap-2`}>
            <div>
              <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔFS1{config.serviceMode === 'manual' ? ' (cte)' : ' (media)'}</span>
              <NumInput value={config.serviceTimeS1} onChange={v => set({ serviceTimeS1: v })} disabled={disabled} />
            </div>
            {config.numServers >= 2 && (
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔFS2{config.serviceMode === 'manual' ? ' (cte)' : ' (media)'}</span>
                <NumInput value={config.serviceTimeS2} onChange={v => set({ serviceTimeS2: v })} disabled={disabled} />
              </div>
            )}
            {config.numServers >= 3 && (
              <div>
                <span className="text-[10px] text-zinc-600 mb-0.5 block">ΔFS3{config.serviceMode === 'manual' ? ' (cte)' : ' (media)'}</span>
                <NumInput value={config.serviceTimeS3} onChange={v => set({ serviceTimeS3: v })} disabled={disabled} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info del problema */}
      <div className="border-t border-zinc-800/50 pt-4">
        <div className="bg-zinc-800/40 rounded-xl p-3 text-[11px] text-zinc-500 leading-relaxed">
          {problemId === 6 ? (
            <>
              <p className="font-semibold text-zinc-400 mb-1">Prob. 1: Servicios en Serie</p>
              <p>Cada subsistema tiene llegadas independientes. Los clientes pasan por PS1 → PS2 → PS3 en orden.</p>
            </>
          ) : problemId === 7 ? (
            <>
              <p className="font-semibold text-zinc-400 mb-1">Prob. 2: Servidores Paralelos</p>
              <p>Cola única. Los puestos prestan el mismo servicio. El cliente va al primer puesto libre.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-zinc-400 mb-1">Prob. 3: Servicios Sucesivos</p>
              <p>Una sola fuente de llegadas. El cliente recorre PS1 → PS2 → PS3 con cola en cada uno.</p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
