import React from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Triangle, Compass } from 'lucide-react';

export const FormulasCheatsheet: React.FC = () => {
  const conversionTable = [
    { deg: '0.57°', pct: '1.0%', permille: '10‰', ratio: '1 : 100', note: 'Scolo acque minime / Fognature / Ferrovie' },
    { deg: '1.15°', pct: '2.0%', permille: '20‰', ratio: '1 : 50', note: 'Canalizzazioni / Autostrade pianura' },
    { deg: '2.86°', pct: '5.0%', permille: '50‰', ratio: '1 : 20', note: 'Rampa disabili confortevole' },
    { deg: '4.57°', pct: '8.0%', permille: '80‰', ratio: '1 : 12.5', note: 'Limite massimo legge rampa disabili (L. 13/89)' },
    { deg: '5.71°', pct: '10.0%', permille: '100‰', ratio: '1 : 10', note: 'Salita alpina impegnativa' },
    { deg: '8.53°', pct: '15.0%', permille: '150‰', ratio: '1 : 6.67', note: 'Rampa garage curvilinea' },
    { deg: '11.31°', pct: '20.0%', permille: '200‰', ratio: '1 : 5.0', note: 'Rampa garage rettilinea max / Muri ciclistici' },
    { deg: '14.04°', pct: '25.0%', permille: '250‰', ratio: '1 : 4.0', note: 'Scarpate di contenimento terreno' },
    { deg: '19.29°', pct: '35.0%', permille: '350‰', ratio: '1 : 2.86', note: 'Tetto a falda tegole e coppi' },
    { deg: '30.00°', pct: '57.7%', permille: '577‰', ratio: '1 : 1.73', note: 'Inizio settore critico valanghe a lastroni' },
    { deg: '45.00°', pct: '100.0%', permille: '1000‰', ratio: '1 : 1.0', note: 'Cateto = Base (1m salita ogni 1m piano)' },
    { deg: '60.00°', pct: '173.2%', permille: '1732‰', ratio: '1 : 0.58', note: 'Scarpata ripidissima / Parete alpinismo' },
    { deg: '89.00°', pct: '5729%', permille: '57290‰', ratio: '1 : 0.02', note: 'Quasi verticale (parete rocciosa)' },
    { deg: '90.00°', pct: '∞ (Infinito)', permille: '∞', ratio: '1 : 0', note: 'Parete a strapiombo perfettamente verticale' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Guida Teorica e Formulario Matematico
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          In topografia, ingegneria civile ed escursionismo, la pendenza descrive il rapporto tra il dislivello verticale superato e lo sviluppo orizzontale del terreno. Di seguito sono illustrate le formule rigorose impiegate da ClinoMetrix.
        </p>
      </div>

      {/* Crucial Concept: Why 100% = 45 degrees */}
      <div className="bg-slate-900 border border-cyan-900/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          L&apos;equivoco comune: Perché 100% di Pendenza NON equivale a 90°?
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Molti credono erroneamente che il 100% corrisponda a una parete verticale a 90°. In realtà la pendenza in percentuale è definita come la tangente trigonometrica dell&apos;angolo moltiplicata per 100:
        </p>

        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-center text-sm md:text-base text-cyan-300 space-y-1">
          <div>Pendenza (%) = (Dislivello Δh / Distanza Orizzontale dh) × 100</div>
          <div className="text-xs text-slate-400 mt-1 font-sans">
            Quando il dislivello verticale è uguale alla distanza orizzontale (es. 1 metro di salita per ogni metro percorso in avanti):
          </div>
          <div className="text-white font-bold">Δh = dh ➔ Pendenza = (1 / 1) × 100 = 100% ➔ Angolo = arctan(1) = 45°</div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          A 90° (parete verticale a strapiombo), la distanza orizzontale è pari a 0, quindi la pendenza percentuale tende a <strong className="text-white">infinito (∞)</strong>.
        </p>
      </div>

      {/* The Two Types of Distance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Triangle className="w-4 h-4 text-amber-400" />
            1. Pendenza su Distanza Orizzontale (dh)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            È la convenzione ufficiale utilizzata in cartografia, segnaletica stradale e norme tecniche edilizie. La distanza è misurata sulla proiezione in pianta (cateto di base).
          </p>
          <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-amber-300 border border-slate-800 space-y-1">
            <div>P% = (Δh / dh) × 100</div>
            <div>θ = arctan(Δh / dh) × (180 / π)</div>
            <div>Δh = dh × (P% / 100)</div>
            <div>dh = Δh / (P% / 100)</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            2. Pendenza su Distanza Reale Inclinata (L)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            È la distanza misurata dal contachilometri della bicicletta, dall&apos;odometro dell&apos;auto o dal passo di chi cammina sul pendio (ipotenusa del triangolo).
          </p>
          <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800 space-y-1">
            <div>L = √(dh² + Δh²) (Pitagora)</div>
            <div>dh = √(L² - Δh²)</div>
            <div>sin(θ) = Δh / L ➔ θ = arcsin(Δh / L)</div>
            <div>Δh = L × sin(θ)</div>
          </div>
        </div>
      </div>

      {/* Immediate Conversion Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Tabella di Conversione e Corrispondenze di Riferimento
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Gradi (°)</th>
                <th className="py-2.5 px-3">Percentuale (%)</th>
                <th className="py-2.5 px-3">Per Mille (‰)</th>
                <th className="py-2.5 px-3">Rapporto (1:N)</th>
                <th className="py-2.5 px-3">Applicazione Tipica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {conversionTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{row.deg}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{row.pct}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.permille}</td>
                  <td className="py-2.5 px-3 text-amber-300">{row.ratio}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
