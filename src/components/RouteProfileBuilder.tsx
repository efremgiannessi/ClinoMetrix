import React, { useState, useMemo } from 'react';
import { RouteSegment, MeasurementSystem } from '../types/clino';
import { Plus, Trash2, Mountain, Layers, Share2, Sparkles, AlertCircle } from 'lucide-react';

interface RouteProfileBuilderProps {
  system: MeasurementSystem;
}

const DEFAULT_SEGMENTS: RouteSegment[] = [
  { id: 'seg-1', name: 'Tratto 1: Avvicinamento e fondovalle', distance: 2000, slopePercent: 2.5, elevationDiff: 50 },
  { id: 'seg-2', name: 'Tratto 2: Inizio salita collinare', distance: 3500, slopePercent: 6.0, elevationDiff: 210 },
  { id: 'seg-3', name: 'Tratto 3: Settore centrale impegnativo', distance: 1800, slopePercent: 9.5, elevationDiff: 171 },
  { id: 'seg-4', name: 'Tratto 4: Falsopiano intermedio', distance: 1200, slopePercent: 1.5, elevationDiff: 18 },
  { id: 'seg-5', name: 'Tratto 5: Muro finale verso il valico', distance: 1500, slopePercent: 12.0, elevationDiff: 180 },
];

export const RouteProfileBuilder: React.FC<RouteProfileBuilderProps> = ({ system }) => {
  const [segments, setSegments] = useState<RouteSegment[]>(DEFAULT_SEGMENTS);
  const [startAltitude, setStartAltitude] = useState<number>(250); // Metri s.l.m.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const unitLength = system === 'metric' ? 'm' : 'ft';
  const unitKm = system === 'metric' ? 'km' : 'mi';

  // Compute progressive segments coordinates and totals
  const routeData = useMemo(() => {
    let currentDistance = 0;
    let currentAltitude = startAltitude;
    let totalGain = 0;
    let totalLoss = 0;
    let maxSlope = 0;

    const points: Array<{
      segmentIndex: number;
      name: string;
      distStart: number;
      distEnd: number;
      altStart: number;
      altEnd: number;
      slopePercent: number;
    }> = [];

    segments.forEach((seg, idx) => {
      const dist = Math.max(1, seg.distance);
      const elev = (dist * seg.slopePercent) / 100;
      const nextAltitude = currentAltitude + elev;

      if (elev > 0) totalGain += elev;
      if (elev < 0) totalLoss += Math.abs(elev);
      if (Math.abs(seg.slopePercent) > maxSlope) maxSlope = Math.abs(seg.slopePercent);

      points.push({
        segmentIndex: idx,
        name: seg.name,
        distStart: currentDistance,
        distEnd: currentDistance + dist,
        altStart: currentAltitude,
        altEnd: nextAltitude,
        slopePercent: seg.slopePercent,
      });

      currentDistance += dist;
      currentAltitude = nextAltitude;
    });

    const totalDist = currentDistance;
    const finalAltitude = currentAltitude;
    const avgSlope = totalDist > 0 ? ((finalAltitude - startAltitude) / totalDist) * 100 : 0;

    return {
      points,
      totalDist,
      totalGain,
      totalLoss,
      finalAltitude,
      avgSlope,
      maxSlope,
    };
  }, [segments, startAltitude]);

  // Color mapper based on slope %
  const getSlopeColor = (pct: number) => {
    const abs = Math.abs(pct);
    if (abs < 3) return '#10b981'; // emerald (<3%)
    if (abs < 6) return '#06b6d4'; // cyan (3-6%)
    if (abs < 9) return '#3b82f6'; // blue (6-9%)
    if (abs < 12) return '#f59e0b'; // amber (9-12%)
    if (abs < 16) return '#f97316'; // orange (12-16%)
    return '#ef4444'; // red/purple (>16%)
  };

  // Add new segment
  const handleAddSegment = () => {
    const newSeg: RouteSegment = {
      id: `seg-${Date.now()}`,
      name: `Tratto ${segments.length + 1}`,
      distance: 1000,
      slopePercent: 5.0,
      elevationDiff: 50,
    };
    setSegments([...segments, newSeg]);
  };

  // Remove segment
  const handleRemoveSegment = (index: number) => {
    if (segments.length <= 1) return;
    setSegments(segments.filter((_, i) => i !== index));
  };

  // Update segment
  const handleUpdateSegment = (
    index: number,
    field: 'name' | 'distance' | 'slopePercent',
    value: string | number
  ) => {
    setSegments(
      segments.map((s, i) => {
        if (i !== index) return s;
        const updated = { ...s, [field]: value };
        if (field === 'distance' || field === 'slopePercent') {
          updated.elevationDiff = ((Number(updated.distance) || 0) * (Number(updated.slopePercent) || 0)) / 100;
        }
        return updated;
      })
    );
  };

  // Pre-load templates
  const loadTemplate = (type: 'alpine' | 'garage' | 'rolling') => {
    if (type === 'alpine') {
      setStartAltitude(500);
      setSegments([
        { id: '1', name: 'Tratto 1: Fondovalle', distance: 3000, slopePercent: 3.0, elevationDiff: 90 },
        { id: '2', name: 'Tratto 2: Primo settore tornanti', distance: 4500, slopePercent: 7.8, elevationDiff: 351 },
        { id: '3', name: 'Tratto 3: Ripiano alpino', distance: 1500, slopePercent: 2.0, elevationDiff: 30 },
        { id: '4', name: 'Tratto 4: Gradone roccioso', distance: 2800, slopePercent: 10.5, elevationDiff: 294 },
        { id: '5', name: 'Tratto 5: Volata al colle', distance: 2000, slopePercent: 8.5, elevationDiff: 170 },
      ]);
    } else if (type === 'garage') {
      setStartAltitude(0);
      setSegments([
        { id: '1', name: 'Raccordo d\'imbocco sommitale', distance: 3, slopePercent: 10.0, elevationDiff: 0.3 },
        { id: '2', name: 'Tratto centrale rettilineo', distance: 12, slopePercent: 20.0, elevationDiff: 2.4 },
        { id: '3', name: 'Raccordo inferiore di sbarco', distance: 3, slopePercent: 10.0, elevationDiff: 0.3 },
      ]);
    } else {
      setStartAltitude(100);
      setSegments([
        { id: '1', name: 'Tratto 1: Saliscendi collinare', distance: 4000, slopePercent: 4.5, elevationDiff: 180 },
        { id: '2', name: 'Tratto 2: Discesa tecnica', distance: 3000, slopePercent: -5.0, elevationDiff: -150 },
        { id: '3', name: 'Tratto 3: Strappo finale', distance: 1200, slopePercent: 11.0, elevationDiff: 132 },
      ]);
    }
  };

  // SVG Chart Dimensions
  const chartW = 740;
  const chartH = 260;
  const padL = 60;
  const padR = 40;
  const padT = 30;
  const padB = 40;

  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  // Find min and max altitudes for scaling
  const allAlts = [startAltitude, ...routeData.points.map((p) => p.altEnd)];
  const minAlt = Math.min(...allAlts);
  const maxAlt = Math.max(...allAlts);
  const altRange = Math.max(10, maxAlt - minAlt);

  // Coord converter
  const getX = (dist: number) => padL + (routeData.totalDist > 0 ? (dist / routeData.totalDist) * innerW : 0);
  const getY = (alt: number) => padT + innerH - ((alt - minAlt) / altRange) * innerH;

  return (
    <div className="space-y-6">
      {/* Intro Header & Template buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Costruttore Profili Multi-Tratta
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Componi più segmenti continui con pendenze differenti per simulare itinerari, rampe o percorsi complessi.
          </p>
        </div>

        {/* Template buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 mr-1">Modelli:</span>
          <button
            onClick={() => loadTemplate('alpine')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
          >
            Passo Alpino (13.8 km)
          </button>
          <button
            onClick={() => loadTemplate('garage')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
          >
            Rampa Garage (18 m)
          </button>
          <button
            onClick={() => loadTemplate('rolling')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
          >
            Misto Collinare
          </button>
        </div>
      </div>

      {/* Altimetry Profile Graphic Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">PROFILO ALTIMETRICO DEL PERCORSO</span>
            <span className="text-slate-600">·</span>
            <span>Colorazione per fascia di pendenza</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Quota iniziale (s.l.m.):</label>
            <input
              type="number"
              value={startAltitude}
              onChange={(e) => setStartAltitude(Number(e.target.value) || 0)}
              className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-right font-mono text-xs text-cyan-300"
            />
            <span className="text-slate-500 font-mono">{unitLength}</span>
          </div>
        </div>

        {/* Dynamic SVG Altimetry Profile */}
        <div className="relative bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 overflow-x-auto">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto select-none">
            <defs>
              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Background grid */}
            <rect x={padL} y={padT} width={innerW} height={innerH} fill="url(#gridPattern)" opacity="0.6" />

            {/* Y Axis Grid lines & labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
              const yVal = padT + innerH * (1 - frac);
              const altVal = minAlt + altRange * frac;
              return (
                <g key={idx}>
                  <line x1={padL} y1={yVal} x2={padL + innerW} y2={yVal} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.7" />
                  <text x={padL - 8} y={yVal + 3} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                    {altVal.toFixed(0)}{unitLength}
                  </text>
                </g>
              );
            })}

            {/* Render segment polygon fills & lines */}
            {routeData.points.map((pt, idx) => {
              const x1 = getX(pt.distStart);
              const y1 = getY(pt.altStart);
              const x2 = getX(pt.distEnd);
              const y2 = getY(pt.altEnd);
              const yBase = padT + innerH;
              const color = getSlopeColor(pt.slopePercent);
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity"
                >
                  {/* Shaded area under segment */}
                  <polygon
                    points={`${x1},${yBase} ${x1},${y1} ${x2},${y2} ${x2},${yBase}`}
                    fill={color}
                    fillOpacity={isHovered ? 0.35 : 0.15}
                  />

                  {/* Segment top line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={isHovered ? 4 : 2.5}
                    strokeLinecap="round"
                  />

                  {/* Segment slope tag badge at center of segment */}
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2 - 10})`}>
                    <rect
                      x="-20"
                      y="-8"
                      width="40"
                      height="16"
                      rx="3"
                      fill="#020617"
                      stroke={color}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill={color}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {pt.slopePercent > 0 ? `+${pt.slopePercent.toFixed(1)}%` : `${pt.slopePercent.toFixed(1)}%`}
                    </text>
                  </g>

                  {/* Vertex circle at end */}
                  <circle cx={x2} cy={y2} r={isHovered ? 5 : 3.5} fill={color} stroke="#ffffff" strokeWidth="1" />
                </g>
              );
            })}

            {/* Start point marker */}
            <circle cx={getX(0)} cy={getY(startAltitude)} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <text x={getX(0)} y={getY(startAltitude) - 8} fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              START
            </text>

            {/* Finish point marker */}
            <circle cx={getX(routeData.totalDist)} cy={getY(routeData.finalAltitude)} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <text x={getX(routeData.totalDist)} y={getY(routeData.finalAltitude) - 8} fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              ARRIVO
            </text>

            {/* X Axis Baseline */}
            <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#475569" strokeWidth="1.5" />

            {/* Distance tick marks */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
              const xVal = padL + innerW * frac;
              const distVal = routeData.totalDist * frac;
              const formattedDist = distVal >= 1000 ? `${(distVal / 1000).toFixed(1)}km` : `${distVal.toFixed(0)}m`;
              return (
                <g key={idx}>
                  <line x1={xVal} y1={padT + innerH} x2={xVal} y2={padT + innerH + 4} stroke="#475569" strokeWidth="1" />
                  <text x={xVal} y={padT + innerH + 16} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {formattedDist}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Route Totals Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Distanza Totale</span>
            <span className="text-base font-bold text-white">
              {routeData.totalDist >= 1000 ? `${(routeData.totalDist / 1000).toFixed(2)} km` : `${routeData.totalDist.toFixed(0)} m`}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Dislivello D+</span>
            <span className="text-base font-bold text-amber-400">
              +{routeData.totalGain.toFixed(1)} {unitLength}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Pendenza Media</span>
            <span className="text-base font-bold text-cyan-300">
              {routeData.avgSlope.toFixed(2)} %
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Pendenza Max</span>
            <span className="text-base font-bold text-rose-400">
              {routeData.maxSlope.toFixed(1)} %
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block uppercase">Quota Arrivo</span>
            <span className="text-base font-bold text-emerald-400">
              {routeData.finalAltitude.toFixed(1)} {unitLength}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Segments List & Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Tabella Segmenti e Dati di Tratta ({segments.length})
          </h3>
          <button
            onClick={handleAddSegment}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi Tratto</span>
          </button>
        </div>

        {/* Mobile View: Touch-Friendly Segment Cards */}
        <div className="sm:hidden space-y-3">
          {segments.map((seg, idx) => {
            const elev = ((seg.distance * seg.slopePercent) / 100).toFixed(1);
            const color = getSlopeColor(seg.slopePercent);
            return (
              <div
                key={seg.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    Tratto #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={seg.name}
                    onChange={(e) => handleUpdateSegment(idx, 'name', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-sans focus:border-cyan-500 focus:outline-none"
                    placeholder="Nome tratto"
                  />
                  <button
                    onClick={() => handleRemoveSegment(idx)}
                    disabled={segments.length <= 1}
                    className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* Distance */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Lunghezza ({unitLength})
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="50"
                        value={seg.distance}
                        onChange={(e) => handleUpdateSegment(idx, 'distance', Number(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Slope */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Pendenza (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={seg.slopePercent}
                        onChange={(e) => handleUpdateSegment(idx, 'slopePercent', Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-cyan-300 text-xs font-mono focus:border-cyan-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-bar with calculated Δh */}
                <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Dislivello tratto:</span>
                  <span className="text-amber-400 font-bold">
                    {Number(elev) >= 0 ? `+${elev}` : elev} {unitLength}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2 px-3 w-8">#</th>
                <th className="py-2 px-3">Descrizione Segmento</th>
                <th className="py-2 px-3 w-36">Lunghezza ({unitLength})</th>
                <th className="py-2 px-3 w-32">Pendenza (%)</th>
                <th className="py-2 px-3 w-32">Dislivello (Δh)</th>
                <th className="py-2 px-2 w-12 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {segments.map((seg, idx) => {
                const elev = ((seg.distance * seg.slopePercent) / 100).toFixed(1);
                const color = getSlopeColor(seg.slopePercent);
                const isHovered = hoveredIndex === idx;

                return (
                  <tr
                    key={seg.id}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`transition-colors ${isHovered ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={seg.name}
                        onChange={(e) => handleUpdateSegment(idx, 'name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-sans focus:border-cyan-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="10"
                        value={seg.distance}
                        onChange={(e) => handleUpdateSegment(idx, 'distance', Number(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          value={seg.slopePercent}
                          onChange={(e) => handleUpdateSegment(idx, 'slopePercent', Number(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-semibold">
                      {Number(elev) >= 0 ? `+${elev}` : elev} {unitLength}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => handleRemoveSegment(idx)}
                        disabled={segments.length <= 1}
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Elimina tratto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
