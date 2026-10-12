import React, { useState, useEffect, useMemo } from 'react';
import {
  CalculationMode,
  CalculationResult,
  DistanceInputType,
  MeasurementSystem,
  SavedCalculation,
} from '../types/clino';
import {
  solveFromElevationAndDistance,
  solveFromSlopeAndDistance,
  solveFromElevationAndSlope,
  calculateNaismithHikingTime,
  calculateCyclingEstimates,
} from '../utils/calculations';
import { InteractiveProfileVisualizer } from './InteractiveProfileVisualizer';
import {
  Calculator,
  ArrowRightLeft,
  Ruler,
  TrendingUp,
  Clock,
  Bike,
  Footprints,
  Copy,
  Check,
  BookmarkPlus,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SlopeCalculatorProps {
  system: MeasurementSystem;
  onSaveCalculation: (calc: SavedCalculation) => void;
  presetToLoad?: {
    slopePercent?: number;
    slopeDegrees?: number;
    distance?: number;
    elevationDiff?: number;
    title?: string;
  } | null;
  onClearPreset?: () => void;
}

export const SlopeCalculator: React.FC<SlopeCalculatorProps> = ({
  system,
  onSaveCalculation,
  presetToLoad,
  onClearPreset,
}) => {
  // Mode selection
  const [mode, setMode] = useState<CalculationMode>('from_elevation_distance');

  // Input states
  const [elevationDiff, setElevationDiff] = useState<number>(150);
  const [useAbsoluteElevations, setUseAbsoluteElevations] = useState<boolean>(false);
  const [startElevation, setStartElevation] = useState<number>(300);
  const [endElevation, setEndElevation] = useState<number>(450);

  const [distance, setDistance] = useState<number>(1800);
  const [distanceType, setDistanceType] = useState<DistanceInputType>('hypotenuse'); // Most outdoor people measure the path length

  const [slopeValue, setSlopeValue] = useState<number>(8.33);
  const [slopeUnit, setSlopeUnit] = useState<'percent' | 'degrees'>('percent');

  // Interactive Live Triangle states
  const [liveSlopeDegrees, setLiveSlopeDegrees] = useState<number>(7.5);
  const [liveHypotenuse, setLiveHypotenuse] = useState<number>(2000);

  // UI helpers
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const unitLength = system === 'metric' ? 'm' : 'ft';
  const unitKm = system === 'metric' ? 'km' : 'mi';

  // React to preset loaded from standards
  useEffect(() => {
    if (presetToLoad) {
      if (presetToLoad.slopePercent !== undefined) {
        setSlopeValue(presetToLoad.slopePercent);
        setSlopeUnit('percent');
        setMode('from_slope_distance');
      } else if (presetToLoad.slopeDegrees !== undefined) {
        setSlopeValue(presetToLoad.slopeDegrees);
        setSlopeUnit('degrees');
        setMode('from_slope_distance');
      }
      if (presetToLoad.distance !== undefined) {
        setDistance(presetToLoad.distance);
      }
      if (presetToLoad.elevationDiff !== undefined) {
        setElevationDiff(presetToLoad.elevationDiff);
      }
      if (onClearPreset) onClearPreset();
    }
  }, [presetToLoad, onClearPreset]);

  // Synchronize absolute elevations with delta h
  useEffect(() => {
    if (useAbsoluteElevations) {
      setElevationDiff(endElevation - startElevation);
    }
  }, [useAbsoluteElevations, startElevation, endElevation]);

  // Main calculation result
  const result: CalculationResult = useMemo(() => {
    if (mode === 'from_elevation_distance') {
      const effectiveElevation = useAbsoluteElevations ? endElevation - startElevation : elevationDiff;
      return solveFromElevationAndDistance({
        elevationDiff: effectiveElevation,
        distance: Math.max(0.1, distance),
        distanceType,
        startElevation: useAbsoluteElevations ? startElevation : undefined,
      });
    }

    if (mode === 'from_slope_distance') {
      return solveFromSlopeAndDistance({
        slopeValue,
        slopeUnit,
        distance: Math.max(0.1, distance),
        distanceType,
        startElevation: useAbsoluteElevations ? startElevation : undefined,
      });
    }

    if (mode === 'from_elevation_slope') {
      const effectiveElevation = useAbsoluteElevations ? endElevation - startElevation : elevationDiff;
      return solveFromElevationAndSlope({
        elevationDiff: effectiveElevation,
        slopeValue: Math.max(0.01, slopeValue),
        slopeUnit,
        startElevation: useAbsoluteElevations ? startElevation : undefined,
      });
    }

    // Live Triangle Mode
    return solveFromSlopeAndDistance({
      slopeValue: liveSlopeDegrees,
      slopeUnit: 'degrees',
      distance: liveHypotenuse,
      distanceType: 'hypotenuse',
      startElevation: useAbsoluteElevations ? startElevation : undefined,
    });
  }, [
    mode,
    elevationDiff,
    useAbsoluteElevations,
    startElevation,
    endElevation,
    distance,
    distanceType,
    slopeValue,
    slopeUnit,
    liveSlopeDegrees,
    liveHypotenuse,
  ]);

  // Effort estimates
  const hikingEstimate = useMemo(() => {
    const distMeters = system === 'metric' ? result.slopeDistance : result.slopeDistance * 0.3048;
    const elevMeters = system === 'metric' ? result.elevationDiff : result.elevationDiff * 0.3048;
    return calculateNaismithHikingTime(distMeters, elevMeters);
  }, [result.slopeDistance, result.elevationDiff, system]);

  const cyclingEstimate = useMemo(() => {
    const distMeters = system === 'metric' ? result.slopeDistance : result.slopeDistance * 0.3048;
    const elevMeters = system === 'metric' ? result.elevationDiff : result.elevationDiff * 0.3048;
    return calculateCyclingEstimates(distMeters, elevMeters);
  }, [result.slopeDistance, result.elevationDiff, system]);

  // Copy to clipboard formatted report
  const handleCopySummary = () => {
    const text = `=== CLOMETRIX - REPORT PENDENZA ===
Pendenza Reale: ${result.slopePercent.toFixed(2)}% (${result.slopePermille.toFixed(1)} ‰)
Angolo Inclinazione: ${result.slopeDegrees.toFixed(2)}° (${result.slopeRadians.toFixed(3)} rad)
Rapporto: 1 : ${result.slopeRatioDenominator.toFixed(1)}
Dislivello (Δh): ${result.elevationDiff.toFixed(2)} ${unitLength}
Distanza Orizzontale (in pianta): ${result.horizontalDistance.toFixed(2)} ${unitLength}
Distanza Reale (percorsa in salita): ${result.slopeDistance.toFixed(2)} ${unitLength}
Classificazione: ${result.classification.label} - ${result.classification.description}
Tempo a piedi stimato (Naismith): ${hikingEstimate.hoursAndMinutes}
Categoria ciclistica stimata: ${cyclingEstimate.cyclingCategory}
===================================`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Save to persistent history
  const handleSave = () => {
    const newCalc: SavedCalculation = {
      id: `calc-${Date.now()}`,
      timestamp: Date.now(),
      title: `Pendenza ${result.slopePercent.toFixed(1)}% (${result.elevationDiff.toFixed(0)}${unitLength} su ${result.slopeDistance.toFixed(0)}${unitLength})`,
      mode,
      system,
      result,
      notes: `${result.classification.label} · Dislivello: ${result.elevationDiff.toFixed(1)}${unitLength}`,
    };
    onSaveCalculation(newCalc);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  return (
    <div className="space-y-8">
      {/* Mode Switcher Segmented Control */}
      <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-1.5">
        <button
          onClick={() => setMode('from_elevation_distance')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[42px] ${
            mode === 'from_elevation_distance'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span>Dislivello + Distanza ➔ Pendenza (% e °)</span>
        </button>

        <button
          onClick={() => setMode('from_slope_distance')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[42px] ${
            mode === 'from_slope_distance'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Pendenza (% o °) + Distanza ➔ Dislivello</span>
        </button>

        <button
          onClick={() => setMode('from_elevation_slope')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[42px] ${
            mode === 'from_elevation_slope'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Ruler className="w-3.5 h-3.5 shrink-0" />
          <span>Dislivello + Pendenza ➔ Distanza Necessaria</span>
        </button>

        <button
          onClick={() => setMode('live_triangle')}
          className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[42px] ${
            mode === 'live_triangle'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Risolutore Continuo</span>
        </button>
      </div>

      {/* Main Grid: Input Form (Left) & Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Parameters Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Parametri di Calcolo
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'from_elevation_distance' && 'Inserisci il dislivello e la lunghezza del tratto'}
                {mode === 'from_slope_distance' && 'Inserisci la pendenza (gradi o %) e la distanza'}
                {mode === 'from_elevation_slope' && 'Calcola la lunghezza necessaria per superare un dislivello'}
                {mode === 'live_triangle' && 'Regola con i cursori continui per esplorare la trigonometria'}
              </p>
            </div>
            <Calculator className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Quick presets shortcut bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Scorciatoie Rapide:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSlopeValue(5);
                  setSlopeUnit('percent');
                  setDistance(20);
                  if (mode === 'from_elevation_distance') setElevationDiff(1);
                }}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                Rampa 5%
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlopeValue(8);
                  setSlopeUnit('percent');
                  setDistance(50);
                  if (mode === 'from_elevation_distance') setElevationDiff(4);
                }}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                Max Disabili 8%
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlopeValue(7.4);
                  setSlopeUnit('percent');
                  setDistance(24800);
                  if (mode === 'from_elevation_distance') setElevationDiff(1848);
                }}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                Stelvio 7.4%
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlopeValue(20);
                  setSlopeUnit('percent');
                  setDistance(15);
                  if (mode === 'from_elevation_distance') setElevationDiff(3);
                }}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                Garage 20%
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlopeValue(30);
                  setSlopeUnit('degrees');
                  setDistance(500);
                  if (mode === 'from_elevation_distance') setElevationDiff(250);
                }}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                Valanghe 30°
              </button>
            </div>
          </div>

          {/* MODE 1: From Elevation and Distance */}
          {mode === 'from_elevation_distance' && (
            <div className="space-y-4">
              {/* Optional: Quote assolute vs Dislivello diretto */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-300">Modalità inserimento quote:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setUseAbsoluteElevations(false)}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      !useAbsoluteElevations
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dislivello (Δh)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseAbsoluteElevations(true)}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      useAbsoluteElevations
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Quote A e B
                  </button>
                </div>
              </div>

              {useAbsoluteElevations ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Quota Partenza (A)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={startElevation}
                        onChange={(e) => setStartElevation(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                        {unitLength}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Quota Arrivo (B)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={endElevation}
                        onChange={(e) => setEndElevation(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                        {unitLength}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dislivello (Δh)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={elevationDiff}
                      onChange={(e) => setElevationDiff(Number(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                      {unitLength}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[10, 50, 100, 250, 500, 1000].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setElevationDiff(step)}
                        className="text-[11px] font-mono px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded cursor-pointer min-h-[30px]"
                      >
                        {step}{unitLength}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Distance Input with Type selector */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Distanza tra i due punti
                  </label>
                  <span className="text-[11px] text-cyan-400 font-medium">
                    {distanceType === 'hypotenuse' ? 'Lungo la salita (reale)' : 'In pianta (orizzontale)'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0.1"
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value) || 0.1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                    {unitLength}
                  </span>
                </div>

                {/* Distance type toggle */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setDistanceType('hypotenuse')}
                    className={`p-2 rounded-lg text-xs font-mono text-left border cursor-pointer ${
                      distanceType === 'hypotenuse'
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Distanza Effettiva (L)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Misurata sul percorso (odometro/GPS)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistanceType('horizontal')}
                    className={`p-2 rounded-lg text-xs font-mono text-left border cursor-pointer ${
                      distanceType === 'horizontal'
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Distanza Orizzontale (dh)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Misurata su cartografia / mappa</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: From Slope and Distance -> Calculate Elevation Diff */}
          {mode === 'from_slope_distance' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Pendenza nota
                  </label>
                  <div className="flex gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSlopeUnit('percent')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        slopeUnit === 'percent'
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Percentuale (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlopeUnit('degrees')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        slopeUnit === 'degrees'
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Gradi (°)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={slopeValue}
                    onChange={(e) => setSlopeValue(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                    {slopeUnit === 'percent' ? '%' : '°'}
                  </span>
                </div>

                {/* Quick slope buttons */}
                <div className="flex gap-2 mt-2">
                  {[2, 5, 8, 10, 15, 20, 30].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSlopeValue(val)}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded cursor-pointer"
                    >
                      {val}{slopeUnit === 'percent' ? '%' : '°'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Lunghezza / Distanza
                  </label>
                  <span className="text-[11px] text-cyan-400 font-medium">
                    {distanceType === 'hypotenuse' ? 'Distanza reale salita' : 'Distanza orizzontale'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value) || 0.1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                    {unitLength}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setDistanceType('hypotenuse')}
                    className={`p-2 rounded-lg text-xs font-mono text-left border cursor-pointer ${
                      distanceType === 'hypotenuse'
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Distanza Effettiva (L)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Percorso su strada o sentiero</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistanceType('horizontal')}
                    className={`p-2 rounded-lg text-xs font-mono text-left border cursor-pointer ${
                      distanceType === 'horizontal'
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">Distanza Orizzontale (dh)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Base cartografica / planimetria</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: From Elevation and Slope -> Calculate Required Distance */}
          {mode === 'from_elevation_slope' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Dislivello da superare (Δh)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={elevationDiff}
                    onChange={(e) => setElevationDiff(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                    {unitLength}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Pendenza desiderata / limite
                  </label>
                  <div className="flex gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSlopeUnit('percent')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        slopeUnit === 'percent'
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Percentuale (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlopeUnit('degrees')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        slopeUnit === 'degrees'
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Gradi (°)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={slopeValue}
                    onChange={(e) => setSlopeValue(Number(e.target.value) || 0.1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                    {slopeUnit === 'percent' ? '%' : '°'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ad es. per rampa disabili inserisci 8% (o 5% ideale) per sapere quanti metri di rampa servono.
                </p>
              </div>
            </div>
          )}

          {/* MODE 4: Live Triangle Scrubber Controls */}
          {mode === 'live_triangle' && (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Angolo di inclinazione (θ)</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {liveSlopeDegrees.toFixed(1)}° ({Math.tan((liveSlopeDegrees * Math.PI) / 180) * 100 > 0 ? (Math.tan((liveSlopeDegrees * Math.PI) / 180) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="0.1"
                  value={liveSlopeDegrees}
                  onChange={(e) => setLiveSlopeDegrees(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>0° (Piano)</span>
                  <span>15° (Ripido)</span>
                  <span>30° (Valanghe)</span>
                  <span>45° (100%)</span>
                  <span>60° (Muro)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Lunghezza Ipotenusa (L)</span>
                  <span className="font-mono text-white font-bold">{liveHypotenuse} {unitLength}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={liveHypotenuse}
                  onChange={(e) => setLiveHypotenuse(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>50{unitLength}</span>
                  <span>1000{unitLength}</span>
                  <span>2500{unitLength}</span>
                  <span>5000{unitLength}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Save & Copy */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{savedSuccess ? 'Salvato!' : 'Salva nei Preferiti'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Copia negli appunti"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiato' : 'Copia'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visualizer Stage + Effort Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visualizer SVG Stage */}
          <InteractiveProfileVisualizer
            result={result}
            system={system}
            onSave={handleSave}
          />

          {/* Effort & Practical Estimates Card (Trekking & Cycling) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Trekking Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  Stima Escursionismo (Trekking)
                </span>
                <span className="font-mono text-[10px] text-slate-500">Regola Naismith</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-mono font-bold text-white tracking-tight">
                  {hikingEstimate.hoursAndMinutes}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Tempo stimato di progressione a piedi
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-2 mt-1">
                {hikingEstimate.notes}
              </div>
            </div>

            {/* Cycling Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-cyan-400" />
                  Stima Ciclismo & Difficoltà
                </span>
                <span className="font-mono text-[10px] text-slate-500">VAM 850 m/h</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-mono font-bold text-white tracking-tight">
                  {cyclingEstimate.climbTimeFormatted}
                </div>
                <div className="text-xs text-amber-400 font-medium mt-1">
                  {cyclingEstimate.cyclingCategory}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-2 mt-1">
                Scala pendenza su {result.slopeDistance > 1000 ? `${(result.slopeDistance / 1000).toFixed(2)} km` : `${result.slopeDistance.toFixed(0)} m`}
              </div>
            </div>
          </div>

          {/* Mathematical Proof Box */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-1.5">
            <div className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              Passaggi Matematici Esatti:
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300">
              <div>
                <span className="text-slate-500">Pendenza (%):</span>{' '}
                <span className="text-cyan-300 font-bold">
                  {result.slopeDegrees >= 89.9 || Math.abs(result.slopePercent) >= 9999
                    ? `(${result.elevationDiff.toFixed(1)} / 0) ➔ Parete Verticale 90° (∞)`
                    : `(${result.elevationDiff.toFixed(2)} / ${result.horizontalDistance.toFixed(2)}) × 100 = ${result.slopePercent.toFixed(2)}%`}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Angolo (θ):</span>{' '}
                <span className="text-cyan-300 font-bold">
                  {result.slopeDegrees >= 89.9
                    ? `90.00° (perpendicolare)`
                    : `arctan(${(result.slopePercent / 100).toFixed(4)}) = ${result.slopeDegrees.toFixed(2)}°`}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Ipotenusa (L):</span>{' '}
                <span className="text-cyan-300 font-bold">
                  √({result.horizontalDistance.toFixed(1)}² + {result.elevationDiff.toFixed(1)}²) ={' '}
                  {result.slopeDistance.toFixed(2)} {unitLength}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
