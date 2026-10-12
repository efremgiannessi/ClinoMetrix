import React from 'react';
import { SavedCalculation, MeasurementSystem } from '../types/clino';
import { X, Trash2, ArrowUpRight, Copy, Check, BookmarkCheck, Calendar } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedList: SavedCalculation[];
  onRestore: (calc: SavedCalculation) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  system: MeasurementSystem;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedList,
  onRestore,
  onDelete,
  onClearAll,
  system,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const unitLength = system === 'metric' ? 'm' : 'ft';

  const handleCopy = (calc: SavedCalculation) => {
    const text = `[CLOMETRIX REPORT]
Titolo: ${calc.title}
Data: ${new Date(calc.timestamp).toLocaleString('it-IT')}
Pendenza: ${calc.result.slopePercent.toFixed(2)}% (${calc.result.slopeDegrees.toFixed(2)}°)
Dislivello: ${calc.result.elevationDiff.toFixed(2)} ${unitLength}
Distanza Orizzontale: ${calc.result.horizontalDistance.toFixed(2)} ${unitLength}
Distanza Reale: ${calc.result.slopeDistance.toFixed(2)} ${unitLength}
Classificazione: ${calc.result.classification.label}`;

    navigator.clipboard.writeText(text);
    setCopiedId(calc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Calcoli Salvati ({savedList.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {savedList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <BookmarkCheck className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm">Nessun calcolo salvato al momento.</p>
              <p className="text-xs text-slate-500">
                Usa il pulsante &ldquo;Salva nei Preferiti&rdquo; nel calcolatore per archiviare i tuoi risultati.
              </p>
            </div>
          ) : (
            savedList.map((calc) => (
              <div
                key={calc.id}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {calc.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${calc.result.classification.badgeBg} ${calc.result.classification.badgeText}`}
                    >
                      {calc.result.classification.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>
                      Δh: <strong className="text-amber-400">{calc.result.elevationDiff.toFixed(1)}{unitLength}</strong>
                    </span>
                    <span>
                      L: <strong className="text-cyan-300">{calc.result.slopeDistance.toFixed(1)}{unitLength}</strong>
                    </span>
                    <span>
                      θ: <strong className="text-white">{calc.result.slopeDegrees.toFixed(1)}°</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(calc.timestamp).toLocaleDateString('it-IT')} ore {new Date(calc.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(calc)}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 cursor-pointer"
                    title="Copia dati"
                  >
                    {copiedId === calc.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onRestore(calc);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <span>Carica</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDelete(calc.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        {savedList.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              Cancella tutta la cronologia
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
