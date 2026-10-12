import React, { useState } from 'react';
import { TECHNICAL_PRESETS } from '../utils/presets';
import { TechnicalStandardPreset } from '../types/clino';
import { Ruler, ShieldCheck, ArrowRight, ExternalLink, Filter } from 'lucide-react';

interface StandardsCatalogProps {
  onSelectPreset: (preset: TechnicalStandardPreset) => void;
}

export const StandardsCatalog: React.FC<StandardsCatalogProps> = ({ onSelectPreset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'Tutti gli Standard' },
    { id: 'accessibilita', label: 'Accessibilità & Disabilità' },
    { id: 'edilizia', label: 'Edilizia & Garage' },
    { id: 'idraulica', label: 'Idraulica & Fognature' },
    { id: 'strade', label: 'Strade & Ferrovie' },
    { id: 'ciclismo', label: 'Ciclismo & Grandi Salite' },
    { id: 'sicurezza', label: 'Sicurezza & Valanghe' },
  ];

  const filteredPresets = TECHNICAL_PRESETS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.normativeRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Category filter tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Cerca normativa, legge, salita..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of technical standard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors group"
          >
            <div>
              {/* Top metadata */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase font-semibold">
                  {preset.normativeRef}
                </span>
                <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
                  {preset.slopePercent}% ({preset.slopeDegrees.toFixed(1)}°)
                </span>
              </div>

              <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                {preset.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {preset.subtitle}
              </p>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {preset.description}
              </p>

              {preset.notes && (
                <div className="mt-3 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 leading-normal">
                  <strong className="text-slate-300 font-medium">Requisito pratico: </strong>
                  {preset.notes}
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Rapporto 1:{(100 / preset.slopePercent).toFixed(1)}
              </span>

              <button
                onClick={() => onSelectPreset(preset)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer group-hover:border-cyan-500/60"
              >
                <span>Applica al Calcolatore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
