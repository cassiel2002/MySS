import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProblemConfig } from './simulation/types';
import { useSimulation } from './hooks/useSimulation';
import ConfigPanel from './components/ConfigPanel';
import Controls from './components/Controls';
import ClockDisplay from './components/ClockDisplay';
import ServerStatus from './components/ServerStatus';
import QueueDisplay from './components/QueueDisplay';
import FutureEventList from './components/FutureEventList';
import EventLog from './components/EventLog';
import MetricsPanel from './components/MetricsPanel';
import SimulationMatrix from './components/SimulationMatrix';
import SystemDiagram from './components/SystemDiagram';

const defaultConfigs: Record<number, ProblemConfig> = {
  6: {
    maxTime: 50,
    problemId: 6,
    numServers: 3,
    arrivalMode: 'manual',
    arrivalInterval: 45,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 45,
    arrivalIntervalS2: 25,
    arrivalIntervalS3: 15,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'manual',
    serviceTimeS1: 40,
    serviceTimeS2: 20,
    serviceTimeS3: 10,
    serviceDistribution: 'exponential',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    timeMode: 'manual',
    distribution: 'exponential',
  },
  7: {
    maxTime: 50,
    problemId: 7,
    numServers: 3,
    arrivalMode: 'list',
    arrivalInterval: 20,
    arrivalList: [60, 6, 15, 2, 13],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 20,
    arrivalIntervalS2: 20,
    arrivalIntervalS3: 20,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'manual',
    serviceTimeS1: 11,
    serviceTimeS2: 12,
    serviceTimeS3: 14,
    serviceDistribution: 'uniform',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    serviceMinS1: 3,
    serviceMaxS1: 5,
    serviceMinS2: 3,
    serviceMaxS2: 5,
    serviceMinS3: 3,
    serviceMaxS3: 5,
    timeMode: 'random',
    distribution: 'uniform',
  },
  8: {
    maxTime: 50,
    problemId: 8,
    numServers: 3,
    arrivalMode: 'list',
    arrivalInterval: 35,
    arrivalList: [35, 16, 41, 69],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 35,
    arrivalIntervalS2: 35,
    arrivalIntervalS3: 35,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'manual',
    serviceTimeS1: 20,
    serviceTimeS2: 11,
    serviceTimeS3: 7,
    serviceDistribution: 'exponential',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    timeMode: 'manual',
    distribution: 'exponential',
  },
  9: {
    maxTime: 60,
    problemId: 9,
    numServers: 1,
    arrivalMode: 'manual',
    arrivalInterval: 1,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 1,
    arrivalIntervalS2: 1,
    arrivalIntervalS3: 1,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'manual',
    serviceTime: 1,
    serviceTimeS1: 1,
    serviceTimeS2: 1,
    serviceTimeS3: 1,
    serviceDistribution: 'exponential',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    abandonTime: 10,
    serverOnTime: 5,
    serverOffTime: 2,
    initialQueue: 0,
    initialWaitTime: 0,
    timeMode: 'manual',
    distribution: 'exponential',
  },
  10: {
    maxTime: 120,
    problemId: 10,
    numServers: 1,
    arrivalMode: 'manual',
    arrivalInterval: 1,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 1,
    arrivalIntervalS2: 1,
    arrivalIntervalS3: 1,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'random',
    serviceTime: 0.833,
    serviceTimeS1: 0.833,
    serviceTimeS2: 0.833,
    serviceTimeS3: 0.833,
    serviceMin: 0.667,
    serviceMax: 1,
    serviceDistribution: 'uniform',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    abandonTime: 3,
    serverOnTime: 5,
    serverOffTime: 0.5,
    timeMode: 'random',
    distribution: 'uniform',
  },
  11: {
    maxTime: 60,
    problemId: 11,
    numServers: 1,
    arrivalMode: 'random',
    arrivalInterval: 3,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 3,
    arrivalIntervalS2: 3,
    arrivalIntervalS3: 3,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'random',
    serviceTime: 4,
    serviceTimeS1: 4,
    serviceTimeS2: 4,
    serviceTimeS3: 4,
    serviceDistribution: 'exponential',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    timeMode: 'random',
    distribution: 'exponential',
  },
  12: {
    maxTime: 360,
    problemId: 12,
    numServers: 3,
    arrivalMode: 'manual',
    arrivalInterval: 0,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 0,
    arrivalIntervalS2: 0,
    arrivalIntervalS3: 0,
    arrivalListS1: [],
    arrivalListS2: [],
    arrivalListS3: [],
    serviceMode: 'random',
    serviceTimeS1: 35,
    serviceTimeS2: 15,
    serviceTimeS3: 17.5,
    serviceDistribution: 'uniform',
    serviceListS1: [],
    serviceListS2: [],
    serviceListS3: [],
    serviceMinS1: 30,
    serviceMaxS1: 40,
    serviceMinS2: 10,
    serviceMaxS2: 20,
    serviceMinS3: 5,
    serviceMaxS3: 30,
    initialQueue: 6,
    timeMode: 'random',
    distribution: 'uniform',
  },
  13: {
    maxTime: 300,
    problemId: 13,
    numServers: 1,
    arrivalMode: 'manual',
    arrivalInterval: 45,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 45, arrivalIntervalS2: 45, arrivalIntervalS3: 45,
    arrivalListS1: [], arrivalListS2: [], arrivalListS3: [],
    serviceMode: 'manual',
    serviceTime: 40,
    serviceTimeS1: 40, serviceTimeS2: 40, serviceTimeS3: 40,
    serviceDistribution: 'exponential',
    serviceListS1: [], serviceListS2: [], serviceListS3: [],
    initialQueue: 3,
    timeMode: 'manual',
    distribution: 'exponential',
  },
  14: {
    maxTime: 300,
    problemId: 14,
    numServers: 1,
    arrivalMode: 'random',
    arrivalInterval: 5,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 5, arrivalIntervalS2: 3, arrivalIntervalS3: 5,
    arrivalListS1: [], arrivalListS2: [], arrivalListS3: [],
    serviceMode: 'random',
    serviceTime: 4,
    serviceTimeS1: 4, serviceTimeS2: 4, serviceTimeS3: 4,
    serviceDistribution: 'exponential',
    serviceListS1: [], serviceListS2: [], serviceListS3: [],
    timeMode: 'random',
    distribution: 'exponential',
  },
  15: {
    maxTime: 300,
    problemId: 15,
    numServers: 1,
    arrivalMode: 'random',
    arrivalInterval: 5,
    arrivalList: [],
    arrivalDistribution: 'exponential',
    arrivalIntervalS1: 5, arrivalIntervalS2: 5, arrivalIntervalS3: 5,
    arrivalListS1: [], arrivalListS2: [], arrivalListS3: [],
    serviceMode: 'random',
    serviceTime: 4,
    serviceTimeS1: 4, serviceTimeS2: 4, serviceTimeS3: 4,
    serviceDistribution: 'exponential',
    serviceListS1: [], serviceListS2: [], serviceListS3: [],
    serverOffTime: 2,
    timeMode: 'random',
    distribution: 'exponential',
  },
};

const problemInfo: Record<number, { name: string; desc: string; section: string }> = {
  6: { name: 'Servicios en Serie', desc: 'PS1→PS2→PS3, llegadas independientes', section: 'multi' },
  7: { name: 'Servidores Paralelos', desc: 'Cola única, mismo servicio', section: 'multi' },
  8: { name: 'Servicios Sucesivos', desc: 'Una llegada, PS1→PS2→PS3', section: 'multi' },
  9: { name: 'Abandono + Servidor Intermitente', desc: 'Cola con paciencia, servidor descansa', section: 'single' },
  10: { name: 'Producción con Descarte', desc: 'Máquina produce, procesadora descarta', section: 'single' },
  11: { name: 'Desvío sin Espera', desc: 'Si ocupada, pieza se desvía', section: 'single' },
  12: { name: 'Carpintero (Secuencial)', desc: 'N sillas: armar→lijar→lustrar', section: 'single' },
  13: { name: 'Cola Simple M/M/1', desc: 'Un servidor, cola FIFO', section: 'classic' },
  14: { name: 'Prioridad A sobre B', desc: 'Dos tipos, A tiene prioridad', section: 'classic' },
  15: { name: 'Zona de Seguridad', desc: 'PS alejado, zona intermedia', section: 'classic' },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } },
};

export default function App() {
  const [problemId, setProblemId] = useState<number>(6);
  const [config, setConfig] = useState<ProblemConfig>(defaultConfigs[6]);
  const sim = useSimulation(config);

  const handleProblemChange = useCallback((id: number) => {
    sim.reset();
    setProblemId(id);
    setConfig(defaultConfigs[id]);
  }, [sim]);

  const handleReset = useCallback(() => {
    sim.reset();
    setConfig(defaultConfigs[problemId]);
  }, [sim, problemId]);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-zinc-800/50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <i className="fi fi-rr-chart-network text-blue-400 text-lg" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Simulador de Colas — Múltiples Puestos</h1>
            <p className="text-xs text-zinc-600">Simulación de eventos discretos con más de un puesto de servicio</p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Selector de problema con indicador animado */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Múltiples Puestos de Servicio</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([6, 7, 8] as const).map(id => (
              <motion.button
                key={id}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleProblemChange(id)}
                className={`
                  relative flex-1 min-w-[140px] p-3 rounded-2xl text-left transition-colors duration-300 border
                  ${problemId === id
                    ? 'bg-blue-500/10 border-blue-500/25'
                    : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700'
                  }
                `}
              >
                {problemId === id && (
                  <motion.div
                    layoutId="problem-indicator"
                    className="absolute inset-0 rounded-2xl bg-blue-500/10 border border-blue-500/25"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <p className={`text-xs font-medium ${problemId === id ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    {problemInfo[id].name}
                  </p>
                  <p className={`text-[9px] mt-0.5 ${problemId === id ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    {problemInfo[id].desc}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold pt-2">Un Puesto de Servicio + Variantes</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([9, 10, 11, 12] as const).map(id => (
              <motion.button
                key={id}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleProblemChange(id)}
                className={`
                  relative flex-1 min-w-[140px] p-3 rounded-2xl text-left transition-colors duration-300 border
                  ${problemId === id
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700'
                  }
                `}
              >
                {problemId === id && (
                  <motion.div
                    layoutId="problem-indicator"
                    className="absolute inset-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <p className={`text-xs font-medium ${problemId === id ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    {problemInfo[id].name}
                  </p>
                  <p className={`text-[9px] mt-0.5 ${problemId === id ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    {problemInfo[id].desc}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold pt-2">5 Problemas Clásicos (1 Servidor)</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([13, 9, 14, 15] as const).map(id => (
              <motion.button
                key={id}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleProblemChange(id)}
                className={`
                  relative flex-1 min-w-[130px] p-3 rounded-2xl text-left transition-colors duration-300 border
                  ${problemId === id
                    ? 'bg-violet-500/10 border-violet-500/25'
                    : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700'
                  }
                `}
              >
                {problemId === id && (
                  <motion.div
                    layoutId="problem-indicator"
                    className="absolute inset-0 rounded-2xl bg-violet-500/10 border border-violet-500/25"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <p className={`text-xs font-medium ${problemId === id ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    {problemInfo[id].name}
                  </p>
                  <p className={`text-[9px] mt-0.5 ${problemId === id ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    {problemInfo[id].desc}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <Controls
          isInitialized={sim.isInitialized}
          isRunning={sim.isRunning}
          isFinished={sim.state?.finished ?? false}
          onInit={sim.init}
          onStep={() => { if (!sim.isInitialized) sim.init(); else sim.step(); }}
          onStart={sim.start}
          onStop={sim.stop}
          onReset={handleReset}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={problemId}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col xl:flex-row gap-5"
          >
            {/* Left side: config + simulation state */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 xl:w-[480px] xl:flex-shrink-0">
              {/* Sidebar */}
              <div className="lg:col-span-5 xl:col-span-12 space-y-4">
                <ConfigPanel
                  problemId={problemId}
                  config={config}
                  onChange={setConfig}
                  disabled={sim.isInitialized}
                />
                <SystemDiagram
                  problemId={problemId}
                  numServers={config.numServers}
                  initialPS1={config.initialPS1}
                  initialPS2={config.initialPS2}
                  initialPS3={config.initialPS3}
                />
                {sim.state && sim.fel.length > 0 && <FutureEventList fel={sim.fel} />}
              </div>

              {/* Simulation visuals */}
              <div className="lg:col-span-7 xl:col-span-12 space-y-4">
                {sim.state ? (
                  <>
                    <ClockDisplay clock={sim.state.clock} stepCount={sim.stepCount} maxTime={config.maxTime} />
                    <ServerStatus state={sim.state} problemId={problemId} numServers={config.numServers} />
                    <QueueDisplay state={sim.state} problemId={problemId} />
                    {sim.metrics && <MetricsPanel metrics={sim.metrics} state={sim.state} problemId={problemId} />}
                    <EventLog log={sim.state.log} />
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-16 sm:py-24 bg-zinc-900 rounded-2xl border border-zinc-800/60"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5"
                    >
                      <i className="fi fi-rr-play text-blue-400/60 text-xl" />
                    </motion.div>
                    <p className="text-sm text-zinc-400 mb-1">Presiona Iniciar para comenzar</p>
                    <p className="text-xs text-zinc-600">O usa Paso para avanzar evento por evento</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right side: Simulation Matrix */}
            {sim.state && (
              <div className="xl:flex-1 xl:min-w-0">
                <SimulationMatrix matrix={sim.state.simulationMatrix} problemId={problemId} numServers={config.numServers} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="border-t border-zinc-800/40 pt-5 pb-8 text-center">
          <p className="text-xs text-zinc-700">Simulador de Colas — Múltiples Puestos de Servicio</p>
        </footer>
      </main>
    </div>
  );
}
