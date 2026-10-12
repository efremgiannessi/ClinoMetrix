import React, { useState, useMemo } from 'react';
import { MeasurementSystem } from '../types/clino';
import {
  Footprints,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  Info,
  ShieldCheck,
  Scale,
  ArrowRightLeft,
  BookOpen,
} from 'lucide-react';

interface StairsCalculatorProps {
  system: MeasurementSystem;
}

export const StairsCalculator: React.FC<StairsCalculatorProps> = ({ system }) => {
  // Height to overcome (dislivello) in centimeters
  const [totalHeightCm, setTotalHeightCm] = useState<number>(270);
  // Target usage / building category
  const [usageType, setUsageType] = useState<'private' | 'public' | 'service' | 'outdoor'>('private');
  // Blondel constant (default 63cm, acceptable 62 - 64cm)
  const [blondelConstant, setBlondelConstant] = useState<number>(63);
  // Manual number of steps override (optional, 0 for automatic best fit)
  const [overrideStepCount, setOverrideStepCount] = useState<number>(0);

  // Direct quick solver between Alzata and Pedata
  const [quickCalcMode, setQuickCalcMode] = useState<'riser_to_tread' | 'tread_to_riser'>('riser_to_tread');
  const [inputQuickRiser, setInputQuickRiser] = useState<number>(17.5);
  const [inputQuickTread, setInputQuickTread] = useState<number>(28.0);

  // Suggested riser bounds based on building regulations (D.M. 236/89 and UNI)
  const categoryBounds = useMemo(() => {
    switch (usageType) {
      case 'public':
        return { targetRiser: 15.5, maxRiser: 16.0, minTread: 30.0, label: 'Luogo Pubblico / Scuola (D.M. 236/89)' };
      case 'outdoor':
        return { targetRiser: 15.0, maxRiser: 16.5, minTread: 32.0, label: 'Scala Esterna / Giardino' };
      case 'service':
        return { targetRiser: 19.0, maxRiser: 21.0, minTread: 24.0, label: 'Scala di Servizio / Soppalco / Cantina' };
      case 'private':
      default:
        return { targetRiser: 17.5, maxRiser: 18.5, minTread: 26.0, label: 'Scala Interna Abitazione Privata' };
    }
  }, [usageType]);

  // Compute main stairs geometry
  const stairsData = useMemo(() => {
    const H = Math.max(10, totalHeightCm);

    // Calculate ideal number of risers (gradini)
    let numRisers = overrideStepCount > 0
      ? overrideStepCount
      : Math.round(H / categoryBounds.targetRiser);

    if (numRisers < 1) numRisers = 1;

    // Exact riser height (Alzata A)
    const riserA = H / numRisers;

    // Ideal tread depth (Pedata P) using Blondel's formula: 2A + P = Constant -> P = Constant - 2A
    const treadP = Math.max(15, blondelConstant - 2 * riserA);

    // 1. Regola del Passo di Blondel: 2A + P (ideale: 62 - 64 cm)
    const ruleBlondelSum = 2 * riserA + treadP;

    // 2. Regola della Sicurezza: A + P (ideale: 46 - 48 cm)
    const ruleSafetySum = riserA + treadP;

    // 3. Regola della Comodità di Lapeyre: P - A (ideale: 12 cm)
    const ruleComfortDiff = treadP - riserA;

    // Number of treads (pedate a terra) is typically numRisers - 1 (landing counts as top)
    const numTreads = Math.max(1, numRisers - 1);

    // Total horizontal base footprint on the floor
    const totalBaseLengthCm = numTreads * treadP;

    // Inclined stringer / ramp diagonal length
    const diagonalLengthCm = Math.sqrt(H * H + totalBaseLengthCm * totalBaseLengthCm);

    // Incline angle theta
    const slopeRadians = Math.atan2(H, totalBaseLengthCm);
    const slopeDegrees = (slopeRadians * 180) / Math.PI;
    const slopePercent = totalBaseLengthCm > 0 ? (H / totalBaseLengthCm) * 100 : 0;

    // Ergonomic & compliance assessments
    let isErgonomic = true;
    let warningMessage = '';

    if (riserA > categoryBounds.maxRiser) {
      isErgonomic = false;
      warningMessage = `Alzata di ${riserA.toFixed(1)} cm superiore al limite consentito (${categoryBounds.maxRiser} cm). Aumenta il numero di gradini.`;
    } else if (treadP < categoryBounds.minTread) {
      isErgonomic = false;
      warningMessage = `Pedata di ${treadP.toFixed(1)} cm inferiore alla misura minima consigliata (${categoryBounds.minTread} cm).`;
    } else if (slopeDegrees > 42) {
      isErgonomic = false;
      warningMessage = `Inclinazione ripida (${slopeDegrees.toFixed(1)}°). Consigliata tra 30° e 37° per sicurezza in discesa.`;
    }

    return {
      numRisers,
      numTreads,
      riserA,
      treadP,
      ruleBlondelSum,
      ruleSafetySum,
      ruleComfortDiff,
      totalBaseLengthCm,
      diagonalLengthCm,
      slopeDegrees,
      slopePercent,
      isErgonomic,
      warningMessage,
    };
  }, [totalHeightCm, overrideStepCount, categoryBounds, blondelConstant]);

  // Quick Direct Converter Results (from single Alzata or Pedata)
  const quickResults = useMemo(() => {
    if (quickCalcMode === 'riser_to_tread') {
      const A = Math.max(5, inputQuickRiser);
      // Blondel: P = 63 - 2A
      const pBlondel = Math.max(10, 63 - 2 * A);
      // Sicurezza: P = 47 - A
      const pSafety = Math.max(10, 47 - A);
      // Comodità: P = A + 12
      const pComfort = A + 12;

      const angleDegrees = (Math.atan2(A, pBlondel) * 180) / Math.PI;
      const slopePct = (A / pBlondel) * 100;

      return {
        A,
        pBlondel,
        pSafety,
        pComfort,
        angleDegrees,
        slopePct,
      };
    } else {
      const P = Math.max(10, inputQuickTread);
      // Blondel: A = (63 - P) / 2
      const aBlondel = Math.max(5, (63 - P) / 2);
      // Sicurezza: A = 47 - P
      const aSafety = Math.max(5, 47 - P);
      // Comodità: A = P - 12
      const aComfort = Math.max(5, P - 12);

      const angleDegrees = (Math.atan2(aBlondel, P) * 180) / Math.PI;
      const slopePct = (aBlondel / P) * 100;

      return {
        P,
        aBlondel,
        aSafety,
        aComfort,
        angleDegrees,
        slopePct,
      };
    }
  }, [quickCalcMode, inputQuickRiser, inputQuickTread]);

  // SVG Scaled representation of the actual steps
  const svgW = 680;
  const svgH = 320;
  const padX = 50;
  const padY = 40;
  const drawW = svgW - padX * 2;
  const drawH = svgH - padY * 2;

  // Render step coordinates
  const stepsPoints = useMemo(() => {
    const N = stairsData.numRisers;
    if (N < 1) return [];

    const pts: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const stepDx = drawW / N;
    const stepDy = drawH / N;

    let currentX = padX;
    let currentY = padY + drawH;

    for (let i = 0; i < N; i++) {
      const nextY = currentY - stepDy;
      const nextX = currentX + stepDx;
      pts.push({
        x1: currentX,
        y1: currentY,
        x2: nextX,
        y2: nextY,
      });
      currentX = nextX;
      currentY = nextY;
    }
    return pts;
  }, [stairsData.numRisers, drawW, drawH, padX, padY]);

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Footprints className="w-5 h-5 text-cyan-400" />
            Calcolatore Scale & Regole tra Pedata e Alzata
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Progetta scale ergonomiche applicando le tre formule classiche di architettura (Blondel, Sicurezza e Comodità) e i vincoli normativi D.M. 236/89.
          </p>
        </div>

        {/* Blondel Law Highlight Badge */}
        <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-lg font-mono text-xs shrink-0">
          <span className="text-slate-400 block text-[10px] uppercase">Formula del Passo:</span>
          <span className="text-cyan-300 font-bold">2 × Alzata + Pedata = 62 ÷ 64 cm</span>
        </div>
      </div>

      {/* SECTION 1: THE THREE FUNDAMENTAL RULES BETWEEN TREAD AND RISER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Le 3 Regole di Proporzione tra Pedata (P) e Alzata (A)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Valori calcolati per la scala attuale: <strong className="text-amber-400 font-bold">A = {stairsData.riserA.toFixed(1)} cm</strong> · <strong className="text-cyan-300 font-bold">P = {stairsData.treadP.toFixed(1)} cm</strong>
          </span>
        </div>

        {/* 3 Rules Grid with Live Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rule 1: Blondel (Step / Ergonomics) */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">1. Regola del Passo (Blondel)</span>
                <span className="font-mono text-[10px] text-cyan-400">Ergonomia</span>
              </div>
              <div className="font-mono text-base font-bold text-cyan-300 my-1">
                2A + P = 62 ÷ 64 cm
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Adatta il ritmo del passo umano naturale: sollevare la gamba di 1 cm in verticale richiede l&apos;energia di 2 cm di avanzamento in piano.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Risultato scala:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  stairsData.ruleBlondelSum >= 62 && stairsData.ruleBlondelSum <= 64
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : stairsData.ruleBlondelSum >= 60 && stairsData.ruleBlondelSum <= 66
                    ? 'bg-amber-950 border border-amber-800 text-amber-300'
                    : 'bg-rose-950 border border-rose-800 text-rose-300'
                }`}
              >
                {stairsData.ruleBlondelSum.toFixed(1)} cm {stairsData.ruleBlondelSum >= 62 && stairsData.ruleBlondelSum <= 64 ? '✓ Ottimo' : 'Tollerabile'}
              </span>
            </div>
          </div>

          {/* Rule 2: Safety Rule */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">2. Regola della Sicurezza</span>
                <span className="font-mono text-[10px] text-emerald-400">Discesa</span>
              </div>
              <div className="font-mono text-base font-bold text-emerald-300 my-1">
                A + P = 46 ÷ 48 cm
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Garantisce un appoggio sufficiente al piede nella fase di discesa per scongiurare scivolamenti o perdita di equilibrio.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Risultato scala:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  stairsData.ruleSafetySum >= 45 && stairsData.ruleSafetySum <= 48
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-amber-950 border border-amber-800 text-amber-300'
                }`}
              >
                {stairsData.ruleSafetySum.toFixed(1)} cm {stairsData.ruleSafetySum >= 45 && stairsData.ruleSafetySum <= 48 ? '✓ Conforme' : 'Attenzione'}
              </span>
            </div>
          </div>

          {/* Rule 3: Comfort Rule */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">3. Regola della Comodità</span>
                <span className="font-mono text-[10px] text-amber-400">Lapeyre</span>
              </div>
              <div className="font-mono text-base font-bold text-amber-300 my-1">
                P - A = 12 cm
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Stabilisce il rapporto di minimo affaticamento muscolare durante la salita continuativa di più rampe.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Risultato scala:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  Math.abs(stairsData.ruleComfortDiff - 12) <= 2
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                {stairsData.ruleComfortDiff.toFixed(1)} cm (Δ {(stairsData.ruleComfortDiff - 12).toFixed(1)})
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory summary box (D.M. 236/89) */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Limiti di Legge (D.M. 236/89 art. 8.1.10):</strong> In edifici pubblici Alzata max <strong>16 cm</strong> e Pedata min <strong>30 cm</strong>; in privati Alzata consigliata max <strong>18-18.5 cm</strong> e Pedata min <strong>26 cm</strong>.
            </span>
          </div>
          <span className="font-mono text-cyan-400 shrink-0 font-semibold">
            Inclinazione attuale: {stairsData.slopeDegrees.toFixed(1)}° ({stairsData.slopeDegrees >= 30 && stairsData.slopeDegrees <= 37 ? 'Ideale' : 'Tollerabile'})
          </span>
        </div>
      </div>

      {/* SECTION 2: MAIN CALCULATOR FOR BUILDING WHOLE STAIRCASE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Parametri della Rampa
            </h3>
            <Ruler className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Height to overcome */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Dislivello Totale da Superare (Altezza Piano)
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min="20"
                max="1000"
                value={totalHeightCm}
                onChange={(e) => setTotalHeightCm(Number(e.target.value) || 20)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                cm ({(totalHeightCm / 100).toFixed(2)} m)
              </span>
            </div>
            {/* Quick heights shortcuts */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[250, 270, 280, 300, 320].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTotalHeightCm(h)}
                  className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                >
                  {h} cm
                </button>
              ))}
            </div>
          </div>

          {/* Usage Type selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Destinazione d&apos;Uso della Scala
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUsageType('private')}
                className={`p-2.5 rounded-lg text-left border cursor-pointer transition-colors ${
                  usageType === 'private'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Interna Privata</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Alzata ideale 16-18 cm</div>
              </button>

              <button
                type="button"
                onClick={() => setUsageType('public')}
                className={`p-2.5 rounded-lg text-left border cursor-pointer transition-colors ${
                  usageType === 'public'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Luogo Pubblico</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Max 16 cm (D.M. 236/89)</div>
              </button>

              <button
                type="button"
                onClick={() => setUsageType('outdoor')}
                className={`p-2.5 rounded-lg text-left border cursor-pointer transition-colors ${
                  usageType === 'outdoor'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Esterna / Giardino</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Alzata dolce 14-16 cm</div>
              </button>

              <button
                type="button"
                onClick={() => setUsageType('service')}
                className={`p-2.5 rounded-lg text-left border cursor-pointer transition-colors ${
                  usageType === 'service'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Servizio / Soppalco</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Compatta 18-20 cm</div>
              </button>
            </div>
          </div>

          {/* Number of steps override control */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
              <span>Numero di Gradini (Alzate):</span>
              <span className="font-mono text-cyan-400 font-bold">
                {stairsData.numRisers} gradini
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOverrideStepCount(Math.max(1, stairsData.numRisers - 1))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => setOverrideStepCount(stairsData.numRisers + 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setOverrideStepCount(0)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Auto Ottimale
              </button>
            </div>
          </div>

          {/* Blondel constant fine adjuster */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Costante del Passo (Blondel):</span>
              <span className="font-mono text-slate-200 font-semibold">{blondelConstant} cm</span>
            </div>
            <input
              type="range"
              min="62"
              max="65"
              step="0.5"
              value={blondelConstant}
              onChange={(e) => setBlondelConstant(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>62 cm (Passo corto)</span>
              <span>63 cm (Standard)</span>
              <span>65 cm (Passo lungo)</span>
            </div>
          </div>

          {/* Validation Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              stairsData.isErgonomic
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {stairsData.isErgonomic ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Scala Conforme ed Ergonomica</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Avviso di Progettazione</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed opacity-90">
              {stairsData.isErgonomic
                ? `Rapporto 2A + P = ${stairsData.ruleBlondelSum.toFixed(1)} cm perfetto. La scala rispetta i criteri di comfort e sicurezza in discesa.`
                : stairsData.warningMessage}
            </p>
          </div>
        </div>

        {/* Right Column: Visual 2D Step Section & Dimension Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 2D Interactive Step SVG Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
              <span className="font-semibold text-white uppercase tracking-wider">
                Sezione Tecnica Quotata dei Gradini
              </span>
              <span className="font-mono text-cyan-400">
                Inclinazione: {stairsData.slopeDegrees.toFixed(1)}° ({stairsData.slopePercent.toFixed(1)}%)
              </span>
            </div>

            <div className="relative bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 overflow-x-auto">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
                <defs>
                  <linearGradient id="stairFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Shaded Stair profile polygon */}
                {stepsPoints.length > 0 && (
                  <polygon
                    points={`${padX},${padY + drawH} ${stepsPoints
                      .map((p) => `${p.x1},${p.y2} ${p.x2},${p.y2}`)
                      .join(' ')} ${padX + drawW},${padY + drawH}`}
                    fill="url(#stairFillGrad)"
                    stroke="none"
                  />
                )}

                {/* Ground floor baseline */}
                <line
                  x1={padX - 20}
                  y1={padY + drawH}
                  x2={padX + drawW + 20}
                  y2={padY + drawH}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* Top landing floor line */}
                <line
                  x1={padX + drawW - 10}
                  y1={padY}
                  x2={padX + drawW + 30}
                  y2={padY}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* Individual Steps (Riser vertical + Tread horizontal) */}
                {stepsPoints.map((p, i) => (
                  <g key={i}>
                    {/* Vertical Riser (Alzata) */}
                    <line
                      x1={p.x1}
                      y1={p.y1}
                      x2={p.x1}
                      y2={p.y2}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                    {/* Horizontal Tread (Pedata) */}
                    <line
                      x1={p.x1}
                      y1={p.y2}
                      x2={p.x2}
                      y2={p.y2}
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                  </g>
                ))}

                {/* Diagonal Incline Guide Line */}
                <line
                  x1={padX}
                  y1={padY + drawH}
                  x2={padX + drawW}
                  y2={padY}
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />

                {/* Angle Arc at base */}
                <path
                  d={`M ${padX + 38} ${padY + drawH} A 38 38 0 0 0 ${padX + Math.cos((stairsData.slopeDegrees * Math.PI) / 180) * 38} ${padY + drawH - Math.sin((stairsData.slopeDegrees * Math.PI) / 180) * 38}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.75"
                />
                <text
                  x={padX + 48}
                  y={padY + drawH - 12}
                  fill="#38bdf8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  θ = {stairsData.slopeDegrees.toFixed(1)}°
                </text>

                {/* Callout on the first step for Alzata & Pedata */}
                {stepsPoints.length > 0 && (
                  <g transform={`translate(${stepsPoints[0].x1 + 10}, ${stepsPoints[0].y1 - 10})`}>
                    <rect x="0" y="-12" width="135" height="24" rx="4" fill="#030712" stroke="#0ea5e9" strokeWidth="1" />
                    <text x="67" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      A: {stairsData.riserA.toFixed(1)} | P: {stairsData.treadP.toFixed(1)} cm
                    </text>
                  </g>
                )}

                {/* Total Vertical Height Dimension Callout */}
                <g transform={`translate(${padX + drawW + 15}, 0)`}>
                  <line x1="0" y1={padY} x2="0" y2={padY + drawH} stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1="-6" y1={padY} x2="6" y2={padY} stroke="#f59e0b" strokeWidth="1" />
                  <line x1="-6" y1={padY + drawH} x2="6" y2={padY + drawH} stroke="#f59e0b" strokeWidth="1" />
                  <text
                    x="10"
                    y={padY + drawH / 2}
                    fill="#f59e0b"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    dominantBaseline="middle"
                  >
                    H = {totalHeightCm} cm
                  </text>
                </g>

                {/* Total Horizontal Base Dimension Callout */}
                <g transform={`translate(0, ${padY + drawH + 18})`}>
                  <line x1={padX} y1="0" x2={padX + drawW} y2="0" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1={padX} y1="-6" x2={padX} y2="6" stroke="#94a3b8" strokeWidth="1" />
                  <line x1={padX + drawW} y1="-6" x2={padX + drawW} y2="6" stroke="#94a3b8" strokeWidth="1" />
                  <text
                    x={padX + drawW / 2}
                    y="14"
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Ingombro a Terra: {stairsData.totalBaseLengthCm.toFixed(1)} cm ({(stairsData.totalBaseLengthCm / 100).toFixed(2)} m)
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Key Dimensions Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Alzata (A)</span>
              <div className="my-1 text-2xl font-mono font-bold text-amber-400">
                {stairsData.riserA.toFixed(2)} <span className="text-xs text-slate-400">cm</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {stairsData.numRisers} gradini totali
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Pedata (P)</span>
              <div className="my-1 text-2xl font-mono font-bold text-cyan-300">
                {stairsData.treadP.toFixed(1)} <span className="text-xs text-slate-400">cm</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {stairsData.numTreads} pedate a terra
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Inclinazione</span>
              <div className="my-1 text-2xl font-mono font-bold text-white">
                {stairsData.slopeDegrees.toFixed(1)}°
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Pendenza {stairsData.slopePercent.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Lunghezza Rampa</span>
              <div className="my-1 text-2xl font-mono font-bold text-emerald-400">
                {(stairsData.diagonalLengthCm / 100).toFixed(2)} <span className="text-xs text-slate-400">m</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                sviluppo cosciale
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: QUICK DIRECT SOLVER (GIVEN ALZATA -> CALCOLA PEDATA O VICEVERSA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Calcolatore Rapido Diretto tra Pedata e Alzata
            </h3>
          </div>

          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setQuickCalcMode('riser_to_tread')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                quickCalcMode === 'riser_to_tread'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data Alzata (A) ➔ Calcola Pedata (P)
            </button>
            <button
              onClick={() => setQuickCalcMode('tread_to_riser')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                quickCalcMode === 'tread_to_riser'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data Pedata (P) ➔ Calcola Alzata (A)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Input side (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            {quickCalcMode === 'riser_to_tread' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Alzata Imposta (A)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="10"
                    max="30"
                    value={inputQuickRiser}
                    onChange={(e) => setInputQuickRiser(Number(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">cm</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[15.5, 16.5, 17.5, 18.0, 19.0].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setInputQuickRiser(v)}
                      className="text-[11px] font-mono px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded border border-slate-700 cursor-pointer min-h-[30px]"
                    >
                      {v} cm
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pedata Imposta (P)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="18"
                    max="45"
                    value={inputQuickTread}
                    onChange={(e) => setInputQuickTread(Number(e.target.value) || 20)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">cm</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[26, 28, 30, 32].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setInputQuickTread(v)}
                      className="text-[11px] font-mono px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded border border-slate-700 cursor-pointer min-h-[30px]"
                    >
                      {v} cm
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results comparison according to 3 rules (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickCalcMode === 'riser_to_tread' ? (
              <>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-cyan-400 font-mono uppercase block">Pedata di Blondel</span>
                  <div className="my-1 text-xl font-mono font-bold text-white">
                    {quickResults.pBlondel?.toFixed(1)} <span className="text-xs text-slate-400">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    P = 63 - 2({quickResults.A}cm)
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase block">Pedata di Sicurezza</span>
                  <div className="my-1 text-xl font-mono font-bold text-white">
                    {quickResults.pSafety?.toFixed(1)} <span className="text-xs text-slate-400">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    P = 47 - {quickResults.A}cm
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-400 font-mono uppercase block">Inclinazione Calcolata</span>
                  <div className="my-1 text-xl font-mono font-bold text-white">
                    {quickResults.angleDegrees?.toFixed(1)}°
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Pendenza: {quickResults.slopePct?.toFixed(1)}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-cyan-400 font-mono uppercase block">Alzata di Blondel</span>
                  <div className="my-1 text-xl font-mono font-bold text-white">
                    {quickResults.aBlondel?.toFixed(1)} <span className="text-xs text-slate-400">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    A = (63 - {quickResults.P}cm) / 2
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase block">Alzata di Sicurezza</span>
                  <div className="my-1 text-xl font-mono font-bold text-white">
                    {quickResults.aSafety?.toFixed(1)} <span className="text-xs text-slate-400">cm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    A = 47 - {quickResults.P}cm
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-400 font-mono uppercase block">Inclinazione Calcolata</span>
                  <div className="my-1 text-xl font-mono font-bold text-white">
                    {quickResults.angleDegrees?.toFixed(1)}°
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Pendenza: {quickResults.slopePct?.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
