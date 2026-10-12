/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { SlopeCalculator } from './components/SlopeCalculator';
import { RouteProfileBuilder } from './components/RouteProfileBuilder';
import { StairsCalculator } from './components/StairsCalculator';
import { HydraulicsCalculator } from './components/HydraulicsCalculator';
import { SensorClinometer } from './components/SensorClinometer';
import { StandardsCatalog } from './components/StandardsCatalog';
import { FormulasCheatsheet } from './components/FormulasCheatsheet';
import { HistoryModal } from './components/HistoryModal';
import { MeasurementSystem, SavedCalculation, TechnicalStandardPreset } from './types/clino';

const STORAGE_KEY = 'clinometrix_saved_calcs';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('calculator');
  const [system, setSystem] = useState<MeasurementSystem>('metric');
  const [savedList, setSavedList] = useState<SavedCalculation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [presetToLoad, setPresetToLoad] = useState<{
    slopePercent?: number;
    slopeDegrees?: number;
    distance?: number;
    elevationDiff?: number;
    title?: string;
  } | null>(null);

  // Load saved calculations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedList(JSON.parse(stored));
      }
    } catch {
      // Fallback empty
    }
  }, []);

  // Persist saved calculations
  const saveCalculation = (calc: SavedCalculation) => {
    const updated = [calc, ...savedList.filter((c) => c.id !== calc.id)].slice(0, 50);
    setSavedList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage failure graceful handling
    }
  };

  const deleteCalculation = (id: string) => {
    const updated = savedList.filter((c) => c.id !== id);
    setSavedList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const clearAllHistory = () => {
    setSavedList([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Restore calculation from history
  const handleRestoreFromHistory = (calc: SavedCalculation) => {
    setPresetToLoad({
      slopePercent: calc.result.slopePercent,
      slopeDegrees: calc.result.slopeDegrees,
      distance: calc.result.slopeDistance,
      elevationDiff: calc.result.elevationDiff,
      title: calc.title,
    });
    setSystem(calc.system);
    setActiveTab('calculator');
  };

  // Select standard preset
  const handleSelectStandardPreset = (preset: TechnicalStandardPreset) => {
    setPresetToLoad({
      slopePercent: preset.slopePercent,
      slopeDegrees: preset.slopeDegrees,
      distance: preset.recommendedMaxDistance || 100,
      title: preset.title,
    });
    setActiveTab('calculator');
  };

  // Receive live measurement from Sensor Clinometer
  const handleTransferFromSensor = (degrees: number) => {
    setPresetToLoad({
      slopeDegrees: degrees,
      distance: 100,
      title: `Misura Sensore ${degrees}°`,
    });
    setActiveTab('calculator');
  };

  const handleResetCalculator = () => {
    setPresetToLoad({
      slopePercent: 8.33,
      distance: 1800,
      elevationDiff: 150,
      title: 'Ripristinato',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Vertical Navigation Bar pinned on the Left */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        system={system}
        setSystem={setSystem}
        savedCount={savedList.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleResetCalculator}
      />

      {/* Main Content Viewport on the Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0">
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 md:py-8">
          {/* Tab 1: Main Calculator & Profile Visualizer */}
          {activeTab === 'calculator' && (
            <SlopeCalculator
              system={system}
              onSaveCalculation={saveCalculation}
              presetToLoad={presetToLoad}
              onClearPreset={() => setPresetToLoad(null)}
            />
          )}

          {/* Tab 2: Multi-Segment Route Profile Builder */}
          {activeTab === 'route' && (
            <RouteProfileBuilder system={system} />
          )}

          {/* Tab 3: Stairs & Steps (Legge di Blondel 2A + P) */}
          {activeTab === 'stairs' && (
            <StairsCalculator system={system} />
          )}

          {/* Tab 4: Hydraulics & Drainage Pipes */}
          {activeTab === 'hydraulics' && (
            <HydraulicsCalculator system={system} />
          )}

          {/* Tab 5: Live Sensor Clinometer & 2D Bubble Level */}
          {activeTab === 'sensor' && (
            <SensorClinometer onTransferToCalculator={handleTransferFromSensor} />
          )}

          {/* Tab 6: Technical Standards & Normatives */}
          {activeTab === 'standards' && (
            <StandardsCatalog onSelectPreset={handleSelectStandardPreset} />
          )}

          {/* Tab 7: Mathematical Formulas & Theory */}
          {activeTab === 'formulas' && (
            <FormulasCheatsheet />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-5 px-4 sm:px-6 lg:px-8 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">ClinoMetrix</span>
              <span>·</span>
              <span>Calcolatore ingegneristico di pendenza, dislivello, scale e profili altimetrici</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>Normative UNI · D.M. 236/89 · CNR</span>
              <span>·</span>
              <span className="font-mono text-slate-500">P% = (Δh / dh) × 100</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Saved History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedList={savedList}
        onRestore={handleRestoreFromHistory}
        onDelete={deleteCalculation}
        onClearAll={clearAllHistory}
        system={system}
      />
    </div>
  );
}
