import React, { useState } from 'react';
import { CalculationResult, MeasurementSystem } from '../types/clino';
import { Bike, Footprints, Car, CircleDot, Info } from 'lucide-react';

interface InteractiveProfileVisualizerProps {
  result: CalculationResult;
  system: MeasurementSystem;
  onSave?: () => void;
}

export const InteractiveProfileVisualizer: React.FC<InteractiveProfileVisualizerProps> = ({
  result,
  system,
}) => {
  const [avatarMode, setAvatarMode] = useState<'bike' | 'hiker' | 'car' | 'bubble'>('bike');
  const [avatarProgress, setAvatarProgress] = useState<number>(45); // 0 to 100%

  const unitLength = system === 'metric' ? 'm' : 'ft';

  // Format values
  const isVertical = result.slopeDegrees >= 89.9 || Math.abs(result.slopePercent) >= 9999;

  const elevFormatted = result.elevationDiff.toLocaleString('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
  const horizFormatted = result.horizontalDistance.toLocaleString('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
  const slopeLenFormatted = result.slopeDistance.toLocaleString('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  // Triangle SVG coordinate math with generous padding
  const svgW = 740;
  const svgH = 340;
  const padLeft = 85;
  const padRight = 100;
  const padTop = 45;
  const padBottom = 60;

  const maxDrawW = svgW - padLeft - padRight; // 555
  const maxDrawH = svgH - padTop - padBottom; // 235

  // Visual aspect ratio clamping: between ~3.5° and ~60°
  const trueAngleRad = Math.abs(result.slopeRadians);
  const visualAngleRad = isVertical
    ? 1.05 // ~60° visual representation for vertical
    : Math.min(Math.max(trueAngleRad, 0.06), 1.05);

  // Compute adaptive base and height so steep slopes don't push everything to the far-right border
  let drawBase = maxDrawW;
  let drawHeight = Math.tan(visualAngleRad) * drawBase;
  if (drawHeight > maxDrawH) {
    drawHeight = maxDrawH;
    drawBase = drawHeight / Math.tan(visualAngleRad);
    // Keep a minimum width of 140px so angles and text are clearly readable
    drawBase = Math.max(140, drawBase);
  }

  // Triangle Points:
  // P_A (start bottom-left):
  const pAx = padLeft;
  const pAy = svgH - padBottom;
  // P_C (bottom-right under height):
  const pCx = padLeft + drawBase;
  const pCy = svgH - padBottom;
  // P_B (top-right peak):
  const pBx = pCx;
  const pBy = pCy - drawHeight;

  // Normal vector pointing perpendicular to hypotenuse (outward/up-left):
  const dx = pBx - pAx;
  const dy = pBy - pAy; // negative in SVG
  const hypLen = Math.sqrt(dx * dx + dy * dy);
  const ux = hypLen > 0 ? dx / hypLen : 1;
  const uy = hypLen > 0 ? dy / hypLen : 0;
  // Perpendicular unit vector (pointing outward/up-left from the terrain):
  const nx = uy;
  const ny = -ux;

  // Hypotenuse dimension line offset (28px outward from the incline):
  const dimOffset = 28;
  const pAxOff = pAx + nx * dimOffset;
  const pAyOff = pAy + ny * dimOffset;
  const pBxOff = pBx + nx * dimOffset;
  const pByOff = pBy + ny * dimOffset;
  const midXOff = (pAxOff + pBxOff) / 2;
  const midYOff = (pAyOff + pByOff) / 2;

  // Avatar position directly along hypotenuse P_A -> P_B:
  const t = avatarProgress / 100;
  const avatarX = pAx + dx * t;
  const avatarY = pAy + dy * t;

  // Avatar tooltip position shifted INWARD towards the shaded terrain (down-right):
  // Since ny is negative (upward), -ny is positive (downward into the terrain), zero overlap!
  const tooltipX = avatarX - nx * 22;
  const tooltipY = avatarY - ny * 22;

  // Current stats at avatar position
  const currentDist = (result.slopeDistance * t).toFixed(1);
  const currentElevGain = (result.elevationDiff * t).toFixed(1);
  const currentAlt = result.startElevation !== undefined
    ? (result.startElevation + result.elevationDiff * t).toFixed(1)
    : undefined;

  // Angle arc & text position
  const arcRadius = 46;
  const bisectorRad = visualAngleRad / 2;
  // If angle is small (< 9°), place text to the right of the arc; otherwise along bisector with safe offset
  const isAngleSmall = visualAngleRad < 0.16;
  const angleLabelX = isAngleSmall
    ? pAx + arcRadius + 28
    : pAx + Math.cos(bisectorRad) * (arcRadius + 22);
  const angleLabelY = isAngleSmall
    ? pAy - 14
    : pAy - Math.sin(bisectorRad) * (arcRadius + 22);

  // Spirit level bubble offset (-32 to +32 px)
  const bubbleOffset = Math.max(-32, Math.min(32, (result.slopeDegrees / 45) * 32));

  // Determine Point B label orientation to guarantee zero right-edge clipping
  const isPointBNearRight = pBx > svgW - 130;
  const pBLabelAnchor = isPointBNearRight ? 'end' : 'start';
  const pBLabelX = isPointBNearRight ? pBx - 12 : pBx + 12;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top Banner: Classification + Integrated Clinometer + Avatar Mode */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Classification Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Classificazione
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${result.classification.badgeBg} ${result.classification.badgeText}`}
            >
              {result.classification.label}
            </span>
          </div>
          <span className="text-slate-600 text-xs hidden sm:inline">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isVertical
              ? 'Parete Verticale 90°'
              : result.slopeRatioDenominator < 1000
              ? `Rapporto 1 : ${result.slopeRatioDenominator.toFixed(1)}`
              : 'In Piano'}
          </span>
        </div>

        {/* Center: Integrated Clinometer & Spirit Level (NOT overlapping inside the canvas!) */}
        <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800/90 rounded-lg px-3 py-1.5 shadow-inner">
          <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider">
            CLINOMETRO
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {result.slopeDegrees.toFixed(1)}°
          </span>

          {/* Bubble level vial */}
          <div className="relative w-14 h-3.5 bg-emerald-950/70 rounded-full border border-emerald-700/60 overflow-hidden flex items-center justify-center">
            <div className="absolute w-2 h-full border-x border-emerald-500/80 pointer-events-none z-10" />
            <div
              className="w-3.5 h-2.5 rounded-full bg-emerald-300 shadow-[0_0_6px_#34d399] transition-transform duration-150 ease-out"
              style={{
                transform: `translateX(${-bubbleOffset}px)`,
              }}
            />
          </div>

          <span className="text-xs font-mono font-bold text-slate-200">
            {isVertical ? '∞' : `${result.slopePercent.toFixed(1)}%`}
          </span>
        </div>

        {/* Right: Avatar Mode Picker */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 px-1 hidden lg:inline">Simulatore:</span>
          <button
            onClick={() => setAvatarMode('bike')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              avatarMode === 'bike' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bicicletta da corsa"
          >
            <Bike className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAvatarMode('hiker')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              avatarMode === 'hiker' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Escursionista a piedi"
          >
            <Footprints className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAvatarMode('car')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              avatarMode === 'car' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Veicolo / Auto"
          >
            <Car className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAvatarMode('bubble')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              avatarMode === 'bubble' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Sfera / Bolla"
          >
            <CircleDot className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Stage - 100% Free of any floating overlapping widgets */}
      <div className="relative w-full bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 p-2 sm:p-4 min-h-[310px] flex items-center justify-center">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto max-h-[350px] select-none overflow-visible"
        >
          <defs>
            {/* Linear gradient for terrain fill */}
            <linearGradient id="slopeTerrainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
            </linearGradient>

            {/* Pattern for grid ground */}
            <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1" strokeOpacity="0.3" />
            </pattern>

            {/* Dimension line arrow markers */}
            <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 5 L 5 0 L 10 5 z" fill="#f59e0b" />
            </marker>
            <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="8" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 5 L 5 10 L 10 5 z" fill="#f59e0b" />
            </marker>
            <marker id="arrowCyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 2 L 6 5 L 0 8 z" fill="#0ea5e9" />
            </marker>
          </defs>

          {/* 1. Shaded Terrain Area under the slope */}
          <polygon
            points={`${pAx},${pAy} ${pBx},${pBy} ${pCx},${pCy}`}
            fill="url(#slopeTerrainGrad)"
            stroke="none"
          />

          {/* Ground hatch under base line */}
          <rect
            x={pAx}
            y={pAy}
            width={drawBase}
            height={16}
            fill="url(#diagonalHatch)"
            opacity="0.6"
          />

          {/* 2. Base Line (Ground level) */}
          <line
            x1={pAx}
            y1={pAy}
            x2={pCx}
            y2={pCy}
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* 3. Vertical Line (Elevation Δh) */}
          <line
            x1={pCx}
            y1={pAy}
            x2={pBx}
            y2={pBy}
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Right Angle Square Symbol at (pCx, pCy) */}
          <path
            d={`M ${pCx - 14} ${pCy} L ${pCx - 14} ${pCy - 14} L ${pCx} ${pCy - 14}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <circle cx={pCx - 7} cy={pCy - 7} r="1.5" fill="#94a3b8" />

          {/* 4. Incline Path (Hypotenuse) */}
          <line
            x1={pAx}
            y1={pAy}
            x2={pBx}
            y2={pBy}
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* 5. Separate Engineering Dimension Line for Hypotenuse (L) */}
          {/* Dimension extension lines */}
          <line
            x1={pAx}
            y1={pAy}
            x2={pAxOff}
            y2={pAyOff}
            stroke="#0284c7"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
          />
          <line
            x1={pBx}
            y1={pBy}
            x2={pBxOff}
            y2={pByOff}
            stroke="#0284c7"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
          />
          {/* Dimension parallel guide line */}
          <line
            x1={pAxOff}
            y1={pAyOff}
            x2={pBxOff}
            y2={pByOff}
            stroke="#0284c7"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Dimension badge at midpoint (never collides with the avatar!) */}
          <g transform={`translate(${midXOff}, ${midYOff})`}>
            <rect
              x="-60"
              y="-11"
              width="120"
              height="22"
              rx="4"
              fill="#030712"
              stroke="#0284c7"
              strokeWidth="1"
            />
            <text
              x="0"
              y="4"
              fill="#38bdf8"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              L = {slopeLenFormatted} {unitLength}
            </text>
          </g>

          {/* 6. Angle Arc at Point A */}
          <path
            d={`M ${pAx + arcRadius} ${pAy} A ${arcRadius} ${arcRadius} 0 0 0 ${pAx + Math.cos(visualAngleRad) * arcRadius} ${pAy - Math.sin(visualAngleRad) * arcRadius}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Angle Badge with opaque backing (NO collision with hypotenuse line!) */}
          <g transform={`translate(${angleLabelX}, ${angleLabelY})`}>
            <rect
              x="-36"
              y="-10"
              width="72"
              height="20"
              rx="4"
              fill="#030712"
              stroke="#0284c7"
              strokeWidth="1"
            />
            <text
              x="0"
              y="4"
              fill="#38bdf8"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              θ = {result.slopeDegrees.toFixed(1)}°
            </text>
          </g>

          {/* 7. Base Orizzontale Engineering Dimension Callout */}
          <g transform={`translate(0, ${pAy + 24})`}>
            {/* Extension lines */}
            <line x1={pAx} y1="-18" x2={pAx} y2="6" stroke="#475569" strokeWidth="1" />
            <line x1={pCx} y1="-18" x2={pCx} y2="6" stroke="#475569" strokeWidth="1" />
            {/* Dimension line */}
            <line x1={pAx} y1="0" x2={pCx} y2="0" stroke="#475569" strokeWidth="1.2" />
            {/* Label in center with solid dark backing */}
            <rect
              x={(pAx + pCx) / 2 - 95}
              y="-10"
              width="190"
              height="20"
              rx="4"
              fill="#030712"
              stroke="#334155"
              strokeWidth="0.8"
            />
            <text
              x={(pAx + pCx) / 2}
              y="4"
              fill="#94a3b8"
              fontSize="11"
              fontFamily="monospace"
              textAnchor="middle"
            >
              Base (dh): {horizFormatted} {unitLength}
            </text>
          </g>

          {/* 8. Vertical Elevation Gain (Δh) Dimension Callout */}
          <g transform={`translate(${pCx + 20}, 0)`}>
            {/* Extension lines */}
            <line x1="-16" y1={pAy} x2="10" y2={pAy} stroke="#78350f" strokeWidth="1" />
            <line x1="-16" y1={pBy} x2="10" y2={pBy} stroke="#78350f" strokeWidth="1" />
            {/* Vertical dimension line with arrowheads */}
            <line x1="6" y1={pAy} x2="6" y2={pBy} stroke="#f59e0b" strokeWidth="1.5" />
            {/* Label box with plenty of space on the right (never clips!) */}
            <g transform={`translate(16, ${(pAy + pBy) / 2})`}>
              <rect
                x="0"
                y="-11"
                width="84"
                height="22"
                rx="4"
                fill="#030712"
                stroke="#b45309"
                strokeWidth="1"
              />
              <text
                x="42"
                y="4"
                fill="#f59e0b"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                Δh = +{elevFormatted}
              </text>
            </g>
          </g>

          {/* 9. Point A Label (Positioned safely to the LEFT, textAnchor="end") */}
          <circle cx={pAx} cy={pAy} r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          <text
            x={pAx - 12}
            y={pAy - 2}
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="bold"
            textAnchor="end"
          >
            Punto A
          </text>
          {result.startElevation !== undefined && (
            <text
              x={pAx - 12}
              y={pAy + 12}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="end"
            >
              Quota: {result.startElevation}{unitLength}
            </text>
          )}

          {/* 10. Point B (Summit) Label (Adaptive placement, textAnchor="start" or "end") */}
          <circle cx={pBx} cy={pBy} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
          <text
            x={pBLabelX}
            y={pBy - 12}
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="bold"
            textAnchor={pBLabelAnchor}
          >
            Punto B
          </text>
          {result.endElevation !== undefined && (
            <text
              x={pBLabelX}
              y={pBy + 4}
              fill="#f59e0b"
              fontSize="10"
              fontFamily="monospace"
              textAnchor={pBLabelAnchor}
            >
              Quota: {result.endElevation.toFixed(1)}{unitLength}
            </text>
          )}

          {/* 11. Interactive Avatar directly on the slope segment */}
          <g transform={`translate(${avatarX}, ${avatarY})`}>
            {/* Halo ring */}
            <circle r="14" fill="#06b6d4" fillOpacity="0.25" className="animate-pulse" />
            <circle r="9" fill="#082f49" stroke="#38bdf8" strokeWidth="2" />

            {avatarMode === 'bike' && (
              <text y="3" fontSize="10" textAnchor="middle" fill="#38bdf8">🚲</text>
            )}
            {avatarMode === 'hiker' && (
              <text y="3" fontSize="10" textAnchor="middle" fill="#38bdf8">🚶</text>
            )}
            {avatarMode === 'car' && (
              <text y="3" fontSize="10" textAnchor="middle" fill="#38bdf8">🚗</text>
            )}
            {avatarMode === 'bubble' && (
              <circle r="4" fill="#38bdf8" />
            )}
          </g>

          {/* Avatar Tooltip placed INWARD in the empty terrain area (ZERO collision!) */}
          <g transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect
              x="-36"
              y="-10"
              width="72"
              height="20"
              rx="4"
              fill="#030712"
              stroke="#0369a1"
              strokeWidth="0.8"
            />
            <text
              x="0"
              y="4"
              fill="#bae6fd"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {avatarProgress}% salita
            </text>
          </g>
        </svg>
      </div>

      {/* Avatar Scrubber Bar */}
      <div className="px-3 sm:px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono shrink-0 whitespace-nowrap">
            Esplora:
          </span>
          <button
            type="button"
            onClick={() => setAvatarProgress(Math.max(0, avatarProgress - 10))}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded text-[11px] font-mono cursor-pointer shrink-0"
            title="Indietro 10%"
          >
            -10%
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={avatarProgress}
            onChange={(e) => setAvatarProgress(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setAvatarProgress(Math.min(100, avatarProgress + 10))}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded text-[11px] font-mono cursor-pointer shrink-0"
            title="Avanti 10%"
          >
            +10%
          </button>
          <span className="text-xs font-mono font-bold text-cyan-400 w-11 text-right shrink-0">
            {avatarProgress}%
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs font-mono text-slate-300 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0">
          <div>
            Percorso: <span className="text-white font-semibold">{currentDist} {unitLength}</span>
          </div>
          <div>
            D+: <span className="text-amber-400 font-semibold">+{currentElevGain} {unitLength}</span>
          </div>
          {currentAlt !== undefined && (
            <div>
              Quota: <span className="text-cyan-300 font-semibold">{currentAlt} {unitLength}</span>
            </div>
          )}
        </div>
      </div>

      {/* Numerical Telemetry Metrics Grid (Tabular Precision with Extreme Value Guard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 border-t border-slate-800">
        {/* Pendenza % */}
        <div className="p-3 sm:p-4 bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>PENDENZA REALE</span>
            <span className="font-mono text-[10px] text-slate-500">Δh / dh</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight">
              {isVertical ? '∞' : result.slopePercent.toFixed(2)}
            </span>
            <span className="text-sm font-mono text-cyan-400 font-semibold">
              {isVertical ? 'Verticale' : '%'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            = {isVertical ? '∞' : result.slopePermille.toFixed(1)} ‰ (per mille)
          </div>
        </div>

        {/* Angolo Gradi */}
        <div className="p-3 sm:p-4 bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>INCLINAZIONE</span>
            <span className="font-mono text-[10px] text-slate-500">arctan(P)</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight">
              {result.slopeDegrees.toFixed(2)}
            </span>
            <span className="text-sm font-mono text-cyan-400 font-semibold">°</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            = {result.slopeRadians.toFixed(3)} rad
          </div>
        </div>

        {/* Dislivello */}
        <div className="p-3 sm:p-4 bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>DISLIVELLO (Δh)</span>
            <span className="font-mono text-[10px] text-slate-500">Altezza</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-amber-400 tracking-tight">
              {elevFormatted}
            </span>
            <span className="text-sm font-mono text-slate-400">{unitLength}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {result.startElevation !== undefined && result.endElevation !== undefined
              ? `${result.startElevation} → ${result.endElevation.toFixed(1)} ${unitLength}`
              : `Quota relativa`}
          </div>
        </div>

        {/* Distanze Confrontate */}
        <div className="p-3 sm:p-4 bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>DISTANZE</span>
            <span className="font-mono text-[10px] text-slate-500">Piano / Reale</span>
          </div>
          <div className="my-1 flex flex-col text-xs font-mono gap-0.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Orizzontale (dh):</span>
              <strong className="text-white">{horizFormatted} {unitLength}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400">Inclinata (L):</span>
              <strong className="text-cyan-300">{slopeLenFormatted} {unitLength}</strong>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Differenza: +{(result.slopeDistance - result.horizontalDistance).toFixed(2)} {unitLength}
          </div>
        </div>
      </div>

      {/* Practical Context Box */}
      <div className="p-4 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="leading-relaxed">
            <strong className="text-white">{result.classification.label}:</strong> {result.classification.description}
          </p>
          <p className="text-slate-400 leading-relaxed">
            <span className="text-cyan-400 font-medium">Contesto applicativo:</span> {result.classification.practicalContext}
          </p>
        </div>
      </div>
    </div>
  );
};
