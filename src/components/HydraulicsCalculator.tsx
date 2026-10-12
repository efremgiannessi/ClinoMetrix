import React, { useState, useMemo } from 'react';
import { MeasurementSystem } from '../types/clino';
import { Droplets, CheckCircle2, AlertTriangle, ArrowRight, Info, ShieldCheck, Ruler } from 'lucide-react';

interface HydraulicsCalculatorProps {
  system: MeasurementSystem;
}

export const HydraulicsCalculator: React.FC<HydraulicsCalculatorProps> = ({ system }) => {
  // Pipe nominal diameter in millimeters
  const [pipeDiameterMm, setPipeDiameterMm] = useState<number>(110);
  // Pipe length in meters
  const [pipeLengthMeters, setPipeLengthMeters] = useState<number>(12);
  // Slope in percent % (e.g. 1.5%)
  const [slopePercent, setSlopePercent] = useState<number>(1.5);
  // Pipe material (Roughness Manning n)
  const [pipeMaterial, setPipeMaterial] = useState<'pvc' | 'concrete' | 'cast_iron'>('pvc');

  // Manning roughness coefficient
  const manningN = useMemo(() => {
    switch (pipeMaterial) {
      case 'concrete': return 0.014;
      case 'cast_iron': return 0.012;
      case 'pvc':
      default: return 0.010; // Smooth PVC / HDPE
    }
  }, [pipeMaterial]);

  // Hydraulic Calculations (Manning-Strickler)
  const hydraulicData = useMemo(() => {
    const D = Math.max(0.04, pipeDiameterMm / 1000); // meters
    const L = Math.max(0.5, pipeLengthMeters);
    const i = Math.max(0.0001, slopePercent / 100); // hydraulic gradient

    // Drop in elevation delta h
    const totalElevationDropCm = L * (slopePercent / 100) * 100;
    const dropPerMeterCm = slopePercent; // 1% = 1 cm/m

    // Hydraulic radius for full pipe Rh = D / 4
    const Rh = D / 4;
    // Cross-sectional area A = pi * D^2 / 4
    const area = Math.PI * Math.pow(D / 2, 2);

    // Flow velocity v = (1 / n) * Rh^(2/3) * i^(1/2) (m/s)
    const velocity = (1 / manningN) * Math.pow(Rh, 2 / 3) * Math.pow(i, 0.5);

    // Volumetric flow rate Q = v * A (m3/s)
    const flowRateM3s = velocity * area;
    const flowRateLps = flowRateM3s * 1000; // liters per second

    // Self-cleaning velocity check (0.7 m/s to 2.5 m/s)
    let isSelfCleaning = true;
    let statusTone: 'success' | 'warning' | 'error' = 'success';
    let statusMessage = '';

    if (velocity < 0.7) {
      isSelfCleaning = false;
      statusTone = 'warning';
      statusMessage = `Velocità (${velocity.toFixed(2)} m/s) inferiore al limite autopulente di 0.70 m/s. Rischio di deposito e sedimentazione dei corpi solidi nel tempo. Aumenta la pendenza ad almeno 1.5% - 2.0%.`;
    } else if (velocity > 2.5) {
      isSelfCleaning = false;
      statusTone = 'warning';
      statusMessage = `Velocità elevata (${velocity.toFixed(2)} m/s > 2.5 m/s). L'acqua scorre troppo velocemente lasciando indietro i solidi pesanti, con potenziale disinnesco dei sifoni per depressione. Riduci la pendenza.`;
    } else {
      statusMessage = `Velocità ottimale (${velocity.toFixed(2)} m/s). Garantisce l'autopulizia continua della condotta senza deposito di sedimenti o usura abrasiva.`;
    }

    return {
      D,
      L,
      totalElevationDropCm,
      dropPerMeterCm,
      velocity,
      flowRateLps,
      isSelfCleaning,
      statusTone,
      statusMessage,
    };
  }, [pipeDiameterMm, pipeLengthMeters, slopePercent, manningN]);

  // SVG Graphic Dimensions
  const svgW = 680;
  const svgH = 240;
  const padL = 70;
  const padR = 80;
  const padT = 40;
  const padB = 40;

  const drawW = svgW - padL - padR;
  const drawH = svgH - padT - padB;

  // Visual clamped slope for pipe rendering
  const visualDropY = Math.min(Math.max((slopePercent / 5) * drawH, 18), drawH - 20);

  const p1x = padL;
  const p1y = padT + 15;
  const p2x = padL + drawW;
  const p2y = p1y + visualDropY;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            Idraulica: Pendenze Tubazioni & Scarichi Fognari
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verifica la pendenza di posa secondo la formula di Manning-Strickler per garantire la velocità autopulente (0.7 ÷ 2.5 m/s) ed evitare intasamenti.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg font-mono text-xs shrink-0">
          <span className="text-slate-400 block text-[10px] uppercase">Pendenza Ottimale:</span>
          <span className="text-cyan-300 font-bold">1.0% ÷ 2.0% (1 ÷ 2 cm/metro)</span>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) and Results / Trench Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Parametri Condotta
            </h3>
            <Ruler className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Pipe Diameter Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Diametro Nominale Tubo (DN in mm)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                step="5"
                min="40"
                max="1000"
                value={pipeDiameterMm}
                onChange={(e) => setPipeDiameterMm(Number(e.target.value) || 40)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">mm</span>
            </div>

            {/* Standard pipe buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[75, 90, 110, 125, 160, 200].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPipeDiameterMm(d)}
                  className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer min-h-[30px] ${
                    pipeDiameterMm === d
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  DN {d}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              DN 110 è lo standard per scarichi WC e colonne primarie; DN 125/160 per allacci fognari esterni.
            </p>
          </div>

          {/* Trench / Pipe Length */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lunghezza del Tratto (L)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min="1"
                max="500"
                value={pipeLengthMeters}
                onChange={(e) => setPipeLengthMeters(Number(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">metri</span>
            </div>
          </div>

          {/* Slope in percent % */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
              <span>Pendenza di Posa:</span>
              <span className="font-mono text-amber-300 font-bold">
                {slopePercent.toFixed(1)}% ({slopePercent.toFixed(1)} cm/metro)
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={slopePercent}
              onChange={(e) => setSlopePercent(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>0.5% (Minimo)</span>
              <span>1.5% (Ideale)</span>
              <span>2.0%</span>
              <span>5.0% (Ripido)</span>
            </div>
          </div>

          {/* Pipe Material Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Materiale Condotta
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPipeMaterial('pvc')}
                className={`p-2 rounded-lg text-center border cursor-pointer transition-colors ${
                  pipeMaterial === 'pvc'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                PVC / PEAD Liscio
              </button>
              <button
                type="button"
                onClick={() => setPipeMaterial('cast_iron')}
                className={`p-2 rounded-lg text-center border cursor-pointer transition-colors ${
                  pipeMaterial === 'cast_iron'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Ghisa
              </button>
              <button
                type="button"
                onClick={() => setPipeMaterial('concrete')}
                className={`p-2 rounded-lg text-center border cursor-pointer transition-colors ${
                  pipeMaterial === 'concrete'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Calcestruzzo
              </button>
            </div>
          </div>

          {/* Status Validation Alert Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              hydraulicData.isSelfCleaning
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {hydraulicData.isSelfCleaning ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Condotta Autopulente Conforme</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Avviso Velocità di Flusso</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed opacity-90">
              {hydraulicData.statusMessage}
            </p>
          </div>
        </div>

        {/* Right Column: Visual Trench SVG Section & Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 2D Interactive Pipe SVG Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
              <span className="font-semibold text-white uppercase tracking-wider">
                Sezione Longitudinale di Posa della Tubazione
              </span>
              <span className="font-mono text-cyan-400">
                Pendenza: {slopePercent.toFixed(1)} cm/metro
              </span>
            </div>

            <div className="relative bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 overflow-x-auto">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
                {/* Surface Ground Line */}
                <line x1={padL - 30} y1={padT - 15} x2={padL + drawW + 30} y2={padT - 15} stroke="#475569" strokeWidth="2" strokeDasharray="6 3" />
                <text x={padL - 25} y={padT - 22} fill="#64748b" fontSize="10" fontFamily="monospace">Piano di Campagna</text>

                {/* Left Manhole (Pozzetto di Partenza a monte) */}
                <rect x={p1x - 30} y={padT - 15} width="30" height={p1y - padT + 50} fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x={p1x - 15} y={padT + 12} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">MONTE</text>

                {/* Right Manhole (Pozzetto di Arrivo a valle) */}
                <rect x={p2x} y={padT - 15} width="30" height={p2y - padT + 50} fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <text x={p2x + 15} y={padT + 12} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">VALLE</text>

                {/* Inclined Pipe cylinder */}
                <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#0284c7" strokeWidth="22" strokeLinecap="round" opacity="0.4" />
                <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#38bdf8" strokeWidth="16" strokeLinecap="round" />

                {/* Flow direction arrow inside pipe */}
                <g transform={`translate(${(p1x + p2x) / 2}, ${(p1y + p2y) / 2})`}>
                  <rect x="-65" y="-12" width="130" height="24" rx="4" fill="#030712" stroke="#0ea5e9" strokeWidth="1" />
                  <text x="0" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    Flusso ➔ {hydraulicData.velocity.toFixed(2)} m/s
                  </text>
                </g>

                {/* Total Drop Dimension callout at downstream manhole */}
                <g transform={`translate(${p2x + 40}, 0)`}>
                  <line x1="0" y1={p1y} x2="0" y2={p2y} stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1="-5" y1={p1y} x2="5" y2={p1y} stroke="#f59e0b" strokeWidth="1" />
                  <line x1="-5" y1={p2y} x2="5" y2={p2y} stroke="#f59e0b" strokeWidth="1" />
                  <text x="8" y={(p1y + p2y) / 2 + 4} fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    Δh = {hydraulicData.totalElevationDropCm.toFixed(1)} cm
                  </text>
                </g>

                {/* Total Length Dimension Callout */}
                <g transform={`translate(0, ${svgH - 15})`}>
                  <line x1={p1x} y1="0" x2={p2x} y2="0" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1={p1x} y1="-5" x2={p1x} y2="5" stroke="#94a3b8" strokeWidth="1" />
                  <line x1={p2x} y1="-5" x2={p2x} y2="5" stroke="#94a3b8" strokeWidth="1" />
                  <text x={(p1x + p2x) / 2} y="-6" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
                    Lunghezza Condotta: {pipeLengthMeters} m (DN {pipeDiameterMm} mm)
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Key Hydraulic Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Velocità Flusso</span>
              <div className="my-1 text-2xl font-mono font-bold text-cyan-300">
                {hydraulicData.velocity.toFixed(2)} <span className="text-xs text-slate-400">m/s</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {hydraulicData.isSelfCleaning ? '✓ Autopulente' : 'Non ottimale'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Caduta per Metro</span>
              <div className="my-1 text-2xl font-mono font-bold text-amber-400">
                {hydraulicData.dropPerMeterCm.toFixed(1)} <span className="text-xs text-slate-400">cm/m</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                pendenza {slopePercent.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Dislivello Totale</span>
              <div className="my-1 text-2xl font-mono font-bold text-white">
                {hydraulicData.totalElevationDropCm.toFixed(1)} <span className="text-xs text-slate-400">cm</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                su {pipeLengthMeters} metri
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Portata Massima</span>
              <div className="my-1 text-2xl font-mono font-bold text-emerald-400">
                {hydraulicData.flowRateLps.toFixed(1)} <span className="text-xs text-slate-400">l/s</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {(hydraulicData.flowRateLps * 3.6).toFixed(0)} m³/h piena
              </span>
            </div>
          </div>

          {/* Good Practice Guidelines */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Regole di Posa per Scarichi Idraulici (UNI EN 12056):</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>
                <strong className="text-slate-300">Pendenza minima 1% (1 cm/m):</strong> sotto l&apos;1% la velocità scende sotto 0.7 m/s e si formano depositi organici e sabbie che ostruiscono il tubo.
              </li>
              <li>
                <strong className="text-slate-300">Pendenza massima consigliata 2-3%:</strong> se la pendenza è eccessiva, i liquidi corrono veloci lasciando i solidi indietro e creando rumorosità e depressioni nei sifoni.
              </li>
              <li>
                <strong className="text-slate-300">Pozzetti di ispezione:</strong> obbligatori ogni 15-20 metri di tratto rettilineo e ad ogni cambio di direzione o pendenza.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
