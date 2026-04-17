import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ProblemConfig } from './simulation/types';
import { useSimulation } from './hooks/useSimulation';
import ProblemSelector from './components/ProblemSelector';
import ConfigPanel from './components/ConfigPanel';
import Controls from './components/Controls';
import ClockDisplay from './components/ClockDisplay';
import ServerStatus from './components/ServerStatus';
import QueueDisplay from './components/QueueDisplay';
import FutureEventList from './components/FutureEventList';
import EventLog from './components/EventLog';
import MetricsPanel from './components/MetricsPanel';
import ProblemExplanation from './components/ProblemExplanation';

import AbandonCounter from './components/AbandonCounter';
import FinalVector from './components/FinalVector';

const defaultConfigs: Record<number, ProblemConfig> = {
  1: { maxTime: 50, arrivalInterval: 5, serviceTime: 4, timeMode: 'random', distribution: 'exponential', initialQueue: 0, initialServerBusy: false },
  2: { maxTime: 50, arrivalInterval: 5, serviceTime: 4, serverOnTime: 10, serverOffTime: 5, timeMode: 'random', distribution: 'exponential', initialQueue: 0, initialServerBusy: false },
  3: { maxTime: 50, arrivalInterval: 5, serviceTime: 4, abandonTime: 10, timeMode: 'random', distribution: 'exponential', initialQueue: 0, initialServerBusy: false },
  4: { maxTime: 50, arrivalInterval: 7, serviceTime: 4, arrivalIntervalB: 3, timeMode: 'random', distribution: 'exponential', initialQueue: 0, initialServerBusy: false },
  5: { maxTime: 50, arrivalInterval: 5, serviceTime: 4, securityTime: 2, timeMode: 'random', distribution: 'exponential', initialQueue: 0, initialServerBusy: false },
};

export default function App() {
  const [problemId, setProblemId] = useState(1);
  const [config, setConfig] = useState<ProblemConfig>(defaultConfigs[1]);
  const sim = useSimulation(problemId, config);

  const handleProblemChange = useCallback((id: number) => {
    sim.reset();
    setProblemId(id);
    setConfig(defaultConfigs[id]);
  }, [sim]);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-zinc-800/50"
      >
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <i className="fi fi-rr-chart-network text-blue-400 text-base" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">Simulador de Colas</h1>
            <p className="text-[10px] text-zinc-600">Simulación de eventos discretos</p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-[1200px] mx-auto px-6 py-7 space-y-6">
        <ProblemSelector selectedId={problemId} onSelect={handleProblemChange} />

        <Controls
          isInitialized={sim.isInitialized}
          isRunning={sim.isRunning}
          isFinished={sim.state?.finished ?? false}
          onInit={sim.init}
          onStep={() => { if (!sim.isInitialized) sim.init(); else sim.step(); }}
          onStart={sim.start}
          onStop={sim.stop}
          onReset={() => { sim.reset(); setConfig(defaultConfigs[problemId]); }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <ConfigPanel
              problemId={problemId}
              config={config}
              onChange={setConfig}
              disabled={sim.isInitialized}
            />
            {sim.state && sim.fel.length > 0 && <FutureEventList fel={sim.fel} />}
          </div>

          <div className="lg:col-span-9 space-y-4">
            {sim.state ? (
              <>
                <ClockDisplay clock={sim.state.clock} stepCount={sim.stepCount} maxTime={config.maxTime} />
                <ServerStatus state={sim.state} problemId={problemId} />
                {problemId === 3 && (
                  <AbandonCounter count={sim.state.stats.abandonedClients} />
                )}
                <QueueDisplay state={sim.state} problemId={problemId} />
                {sim.metrics && <MetricsPanel metrics={sim.metrics} state={sim.state} problemId={problemId} />}
                <EventLog log={sim.state.log} />
                {sim.state.finished && <FinalVector state={sim.state} problemId={problemId} />}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center justify-center py-24 bg-zinc-900 rounded-2xl border border-zinc-800/60"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5"
                >
                  <i className="fi fi-rr-play text-blue-400/60 text-xl" />
                </motion.div>
                <p className="text-sm text-zinc-400 mb-1">Presiona Iniciar para comenzar</p>
                <p className="text-[11px] text-zinc-600">O usa Paso para avanzar evento por evento</p>
              </motion.div>
            )}
          </div>
        </div>

        <ProblemExplanation problemId={problemId} />

        <footer className="border-t border-zinc-800/40 pt-5 pb-8 text-center">
          <p className="text-[10px] text-zinc-700">Simulador de Colas — Eventos Discretos</p>
        </footer>
      </main>
    </div>
  );
}
