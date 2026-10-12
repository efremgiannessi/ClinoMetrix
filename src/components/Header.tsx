import React from 'react';
import { Mountain, Ruler, Compass, BookOpen, Layers, BookmarkCheck, RotateCcw } from 'lucide-react';
import { MeasurementSystem } from '../types/clino';

interface HeaderProps {
  activeTab: 'calculator' | 'route' | 'standards' | 'formulas';
  setActiveTab: (tab: 'calculator' | 'route' | 'standards' | 'formulas') => void;
  system: MeasurementSystem;
  setSystem: (system: MeasurementSystem) => void;
  savedCount: number;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  system,
  setSystem,
  savedCount,
  onOpenHistory,
  onReset,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              ClinoMetrix
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 ml-2">
              v2.4 · Calcolo Pendenze
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single line) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'calculator'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Calcolatore & Profilo</span>
          </button>

          <button
            onClick={() => setActiveTab('route')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'route'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Profili Multi-Tratta</span>
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'standards'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Normative & Standard</span>
          </button>

          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'formulas'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Formule & Teoria</span>
          </button>
        </nav>

        {/* Zone 3: Actions & System Switch */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setSystem('metric')}
              className={`px-2.5 py-1 rounded transition-colors ${
                system === 'metric'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sistema Metrico (metri, chilometri)"
            >
              m / km
            </button>
            <button
              onClick={() => setSystem('imperial')}
              className={`px-2.5 py-1 rounded transition-colors ${
                system === 'imperial'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sistema Imperiale (feet, miles)"
            >
              ft / mi
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reimposta valori predefiniti"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Saved History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Salvati</span>
            {savedCount > 0 && (
              <span className="font-mono text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800/80">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 px-2 py-2 text-xs">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-2 py-1 rounded ${
            activeTab === 'calculator' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Calcolatore
        </button>
        <button
          onClick={() => setActiveTab('route')}
          className={`px-2 py-1 rounded ${
            activeTab === 'route' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Multi-Tratta
        </button>
        <button
          onClick={() => setActiveTab('standards')}
          className={`px-2 py-1 rounded ${
            activeTab === 'standards' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Norme
        </button>
        <button
          onClick={() => setActiveTab('formulas')}
          className={`px-2 py-1 rounded ${
            activeTab === 'formulas' ? 'text-cyan-400 font-semibold bg-slate-900' : 'text-slate-400'
          }`}
        >
          Formule
        </button>
      </div>
    </header>
  );
};
