import { motion } from 'framer-motion';
import type { ProblemConfig, TimeMode, Distribution } from '../simulation/types';

interface Props {
  problemId: number;
  config: ProblemConfig;
  onChange: (config: ProblemConfig) => void;
  disabled: boolean;
}

const timeModes: { value: TimeMode; label: string }[] = [
  { value: 'random', label: 'Aleatorio' },
  { value: 'manual', label: 'Manual (fijo)' },
  { value: 'uniform_range', label: 'Rango (a-b)' },
];

const distributions: { value: Distribution; label: string }[] = [
  { value: 'exponential', label: 'Exponencial' },
  { value: 'uniform', label: 'Uniforme' },
  { value: 'normal', label: 'Normal' },
];

function Label({ icon, text }: { icon: string; text: string }) {
  return (
    <label className="flex items-center gap-2 mb-1">
      <i className={`${icon} text-[10px] text-zinc-600`} />
      <span className="text-[11px] text-zinc-500">{text}</span>
    </label>
  );
}

function NumInput({ value, onChange, disabled, min = 0, step = 0.5 }: {
  value: number; onChange: (v: number) => void; disabled: boolean; min?: number; step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      disabled={disabled}
      onChange={e => onChange(parseFloat(e.target.value) || min)}
      className={`
        w-full px-3 py-2 text-sm rounded-xl border font-mono tabular-nums transition-all bg-zinc-800 appearance-none
        ${disabled
          ? 'border-zinc-800/40 text-zinc-600 cursor-not-allowed'
          : 'border-zinc-700/50 text-zinc-200 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20'
        }
      `}
    />
  );
}

function RangeInputs({ label, icon, min, max, onMinChange, onMaxChange, disabled }: {
  label: string; icon: string; min: number; max: number;
  onMinChange: (v: number) => void; onMaxChange: (v: number) => void; disabled: boolean;
}) {
  return (
    <div>
      <Label icon={icon} text={label} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[9px] text-zinc-600 mb-0.5 block">Min</span>
          <NumInput value={min} onChange={onMinChange} disabled={disabled} />
        </div>
        <div>
          <span className="text-[9px] text-zinc-600 mb-0.5 block">Max</span>
          <NumInput value={max} onChange={onMaxChange} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

export default function ConfigPanel({ config, onChange, disabled }: Props) {
  const set = (partial: Partial<ProblemConfig>) => onChange({ ...config, ...partial });
  const isRange = config.timeMode === 'uniform_range';
  const isManual = config.timeMode === 'manual';
  const isRandom = config.timeMode === 'random';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <i className="fi fi-rr-settings-sliders text-sm text-zinc-500" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Configuración</span>
        {disabled && (
          <span className="ml-auto text-[9px] text-amber-400/60 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
            <i className="fi fi-rr-lock text-[7px]" /> Bloqueado
          </span>
        )}
      </div>

      {/* Tiempo máximo */}
      <div>
        <Label icon="fi fi-rr-hourglass-end" text="Tiempo máximo" />
        <NumInput value={config.maxTime} onChange={v => set({ maxTime: v })} disabled={disabled} min={10} step={10} />
      </div>

      {/* Modo de tiempos */}
      <div>
        <Label icon="fi fi-rr-dice-alt" text="Modo de tiempos" />
        <div className="flex gap-1">
          {timeModes.map(m => (
            <button
              key={m.value}
              disabled={disabled}
              onClick={() => set({ timeMode: m.value })}
              className={`
                flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all
                ${config.timeMode === m.value
                  ? 'bg-blue-500/15 text-blue-300'
                  : disabled ? 'bg-zinc-800/40 text-zinc-700 cursor-not-allowed' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distribución (solo en modo aleatorio) */}
      {isRandom && (
        <div>
          <Label icon="fi fi-rr-chart-histogram" text="Distribución" />
          <div className="flex gap-1">
            {distributions.map(d => (
              <button
                key={d.value}
                disabled={disabled}
                onClick={() => set({ distribution: d.value })}
                className={`
                  flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all
                  ${config.distribution === d.value
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

      {/* Tiempos de llegada y servicio */}
      {isRange ? (
        <>
          <RangeInputs
            label="Intervalo llegada" icon="fi fi-rr-sign-in-alt"
            min={config.arrivalMin ?? 3} max={config.arrivalMax ?? 7}
            onMinChange={v => set({ arrivalMin: v })} onMaxChange={v => set({ arrivalMax: v })}
            disabled={disabled}
          />
          <RangeInputs
            label="Tiempo servicio" icon="fi fi-rr-time-forward"
            min={config.serviceMin ?? 2} max={config.serviceMax ?? 6}
            onMinChange={v => set({ serviceMin: v })} onMaxChange={v => set({ serviceMax: v })}
            disabled={disabled}
          />
        </>
      ) : (
        <>
          <div>
            <Label icon="fi fi-rr-sign-in-alt" text={isManual ? 'Intervalo llegada (fijo)' : 'Intervalo llegada (media)'} />
            <NumInput value={config.arrivalInterval} onChange={v => set({ arrivalInterval: v })} disabled={disabled} />
          </div>
          <div>
            <Label icon="fi fi-rr-time-forward" text={isManual ? 'Tiempo servicio (fijo)' : 'Tiempo servicio (media)'} />
            <NumInput value={config.serviceTime} onChange={v => set({ serviceTime: v })} disabled={disabled} />
          </div>
        </>
      )}

      {/* Estado inicial */}
      <div className="border-t border-zinc-800/50 pt-3">
        <Label icon="fi fi-rr-vector-alt" text="Estado inicial (vector)" />
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-[9px] text-zinc-600 mb-0.5 block">Cola (q)</span>
            <NumInput value={config.initialQueue} onChange={v => set({ initialQueue: Math.max(0, Math.floor(v)) })} disabled={disabled} min={0} step={1} />
          </div>
          <div>
            <span className="text-[9px] text-zinc-600 mb-0.5 block">Servidor (PS)</span>
            <button
              disabled={disabled}
              onClick={() => set({ initialServerBusy: !config.initialServerBusy })}
              className={`
                w-full py-2 rounded-xl text-sm font-medium transition-all border
                ${config.initialServerBusy
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {config.initialServerBusy ? 'Ocupado (1)' : 'Libre (0)'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
