import React, { useState } from 'react';
import {
  Mountain,
  Compass,
  Layers,
  Ruler,
  BookOpen,
  Footprints,
  BookmarkCheck,
  RotateCcw,
  Menu,
  X,
  SlidersHorizontal,
  Smartphone,
  Droplets,
} from 'lucide-react';
import { MeasurementSystem } from '../types/clino';

export type NavTab = 'calculator' | 'route' | 'stairs' | 'hydraulics' | 'sensor' | 'standards' | 'formulas';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  system: MeasurementSystem;
  setSystem: (system: MeasurementSystem) => void;
  savedCount: number;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  system,
  setSystem,
  savedCount,
  onOpenHistory,
  onReset,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const navItems: Array<{
    id: NavTab;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'calculator',
      label: 'Calcolatore & Profilo',
      shortLabel: 'Calcolatore',
      description: 'Pendenza, dislivello e simulatore 2D',
      icon: <Compass className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'route',
      label: 'Profili Multi-Tratta',
      shortLabel: 'Multi-Tratta',
      description: 'Itinerari altimetrici a più segmenti',
      icon: <Layers className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'stairs',
      label: 'Scale & Gradini',
      shortLabel: 'Scale (Blondel)',
      description: 'Regole alzata, pedata e formula Blondel',
      icon: <Footprints className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'hydraulics',
      label: 'Idraulica & Tubi',
      shortLabel: 'Idraulica',
      description: 'Pendenze scarichi e velocità autopulente',
      icon: <Droplets className="w-5 h-5 shrink-0" />,
      badge: 'Nuovo',
    },
    {
      id: 'sensor',
      label: 'Clinometro Live',
      shortLabel: 'Clinometro',
      description: 'Giroscopio del telefono e livella 2D',
      icon: <Smartphone className="w-5 h-5 shrink-0" />,
      badge: 'Live',
    },
    {
      id: 'standards',
      label: 'Normative & Standard',
      shortLabel: 'Normative',
      description: 'Rampe disabili, garage, tetti e CNR',
      icon: <Ruler className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'formulas',
      label: 'Formule & Teoria',
      shortLabel: 'Formule',
      description: 'Trigonometria, Pitagora e tabelle',
      icon: <BookOpen className="w-5 h-5 shrink-0" />,
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Sticky Header with Brand, Quick Unit Toggle, Saved Button and Hamburger */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mountain className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">ClinoMetrix</span>
          </div>

          {/* Quick tools on mobile header: Unit Toggle + Saved + Hamburger */}
          <div className="flex items-center gap-1.5">
            {/* Quick unit toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setSystem('metric')}
                className={`px-1.5 py-0.5 rounded ${
                  system === 'metric'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400'
                }`}
              >
                m
              </button>
              <button
                onClick={() => setSystem('imperial')}
                className={`px-1.5 py-0.5 rounded ${
                  system === 'imperial'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400'
                }`}
              >
                ft
              </button>
            </div>

            {/* Saved button on mobile */}
            <button
              onClick={onOpenHistory}
              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs flex items-center gap-1"
              title="Calcoli salvati"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
              {savedCount > 0 && (
                <span className="font-mono text-[9px] font-bold text-cyan-300">{savedCount}</span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Horizontal Quick-Scroll Tab Bar on Mobile (Instant 1-tap switching without opening drawer!) */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 pb-2 pt-0.5 scrollbar-none text-xs border-t border-slate-900">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 shrink-0 min-h-[34px] cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {item.shortLabel}
                {item.badge && (
                  <span className="text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Vertical Navigation Bar (Sticky Desktop Sidebar / Slide-over Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                  ClinoMetrix
                </h1>
                <p className="text-[11px] text-slate-400 font-mono">
                  Calcolo Pendenze & Terreno
                </p>
              </div>
            </div>

            {/* Mobile close button inside drawer */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unit System Switcher in Sidebar */}
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/30">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider">Unità di Misura</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setSystem('metric')}
                className={`py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center min-h-[36px] flex items-center justify-center ${
                  system === 'metric'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Metrico (m, km)
              </button>
              <button
                onClick={() => setSystem('imperial')}
                className={`py-1.5 px-2 rounded-md font-semibold transition-all cursor-pointer text-center min-h-[36px] flex items-center justify-center ${
                  system === 'imperial'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                Imperiale (ft, mi)
              </button>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Tutti i Moduli ({navItems.length})
            </div>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer group min-h-[48px] ${
                    isActive
                      ? 'bg-cyan-500/15 text-white border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div
                    className={`mt-0.5 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & User Tools */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2 pb-6 md:pb-4">
          {/* Saved History Button */}
          <button
            onClick={() => {
              onOpenHistory();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer group min-h-[42px]"
          >
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Calcoli Salvati</span>
            </div>
            {savedCount > 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                {savedCount}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">0</span>
            )}
          </button>

          {/* Reset Defaults Button */}
          <button
            onClick={onReset}
            className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ripristina valori iniziali</span>
          </button>

          {/* Footer Metadata */}
          <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>UNI · D.M. 236/89</span>
            <span className="text-cyan-500/80">P% = (Δh/dh)·100</span>
          </div>
        </div>
      </aside>

      {/* Mobile Ergonomic Bottom Tab Bar (1-tap thumb navigation on smartphones) */}
      <nav
        aria-label="Navigazione rapida mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.5)] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        {/* Tab 1: Calcolatore */}
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] cursor-pointer ${
            activeTab === 'calculator'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className={`w-5 h-5 transition-transform ${activeTab === 'calculator' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">Calcolo</span>
        </button>

        {/* Tab 2: Scale Blondel */}
        <button
          onClick={() => setActiveTab('stairs')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] cursor-pointer ${
            activeTab === 'stairs'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Footprints className={`w-5 h-5 transition-transform ${activeTab === 'stairs' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">Scale</span>
        </button>

        {/* Tab 3: Clinometro Live */}
        <button
          onClick={() => setActiveTab('sensor')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] cursor-pointer ${
            activeTab === 'sensor'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <Smartphone className={`w-5 h-5 transition-transform ${activeTab === 'sensor' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">Sensori</span>
        </button>

        {/* Tab 4: Idraulica */}
        <button
          onClick={() => setActiveTab('hydraulics')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] cursor-pointer ${
            activeTab === 'hydraulics'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Droplets className={`w-5 h-5 transition-transform ${activeTab === 'hydraulics' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">Idraulica</span>
        </button>

        {/* Tab 5: Tutti i moduli / Menu */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] cursor-pointer ${
            isMobileOpen || activeTab === 'route' || activeTab === 'standards' || activeTab === 'formulas'
              ? 'text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight leading-none">Menu</span>
        </button>
      </nav>
    </>
  );
};
