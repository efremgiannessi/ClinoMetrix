import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, RefreshCw, Lock, Unlock, ArrowRight, ShieldCheck, HelpCircle, Compass } from 'lucide-react';

interface SensorClinometerProps {
  onTransferToCalculator: (degrees: number) => void;
}

export const SensorClinometer: React.FC<SensorClinometerProps> = ({ onTransferToCalculator }) => {
  // Live orientation angles
  const [pitch, setPitch] = useState<number>(0); // beta (-180 to 180)
  const [roll, setRoll] = useState<number>(0);   // gamma (-90 to 90)

  // Tare / Calibration offset
  const [tarePitch, setTarePitch] = useState<number>(0);
  const [tareRoll, setTareRoll] = useState<number>(0);

  // Hold / Lock measurement
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockedPitch, setLockedPitch] = useState<number>(0);

  // Sensor state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Simulated manual slider when on desktop
  const [manualPitch, setManualPitch] = useState<number>(8.5);

  // Handle live device orientation
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (isLocked) return;

    // Beta: front-to-back tilt (-180 to 180)
    // Gamma: left-to-right tilt (-90 to 90)
    if (e.beta !== null && e.gamma !== null) {
      setPitch(e.beta);
      setRoll(e.gamma);
      setIsSupported(true);
      setIsSimulated(false);
    }
  }, [isLocked]);

  // Request permissions (specifically for iOS Safari 13+)
  const requestSensorPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (permission === 'granted') {
          setHasPermission(true);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setHasPermission(false);
          setIsSimulated(true);
        }
      } catch {
        setHasPermission(false);
        setIsSimulated(true);
      }
    } else {
      // Standard browser
      setHasPermission(true);
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // Check if permission API exists
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function') {
        // Needs user gesture on iOS
        setHasPermission(null);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
        // Timeout to check if sensor actually emitted events
        const timer = setTimeout(() => {
          setIsSupported((prev) => {
            if (!prev) setIsSimulated(true);
            return prev;
          });
        }, 1200);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('deviceorientation', handleOrientation);
        };
      }
    } else {
      setIsSimulated(true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation]);

  // Current effective pitch (after tare calibration)
  const rawAngle = isSimulated ? manualPitch : (isLocked ? lockedPitch : pitch);
  const calibratedAngle = rawAngle - tarePitch;
  // Normalized angle between -90 and 90
  const effectiveAngle = Math.max(-90, Math.min(90, calibratedAngle));
  const absAngle = Math.abs(effectiveAngle);

  // Slope in percent
  const angleRad = (absAngle * Math.PI) / 180;
  const slopePercent = absAngle >= 89.9 ? 999999 : Math.tan(angleRad) * 100;
  const slopeRatio = slopePercent > 0.001 ? (100 / slopePercent).toFixed(1) : '∞';

  // Spirit level 2D bubble positions
  const bubbleX = Math.max(-42, Math.min(42, (roll - tareRoll) * 1.4));
  const bubbleY = Math.max(-42, Math.min(42, -effectiveAngle * 1.4));

  // Trigger mobile vibration if supported
  const triggerHaptic = (duration = 40) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignore
      }
    }
  };

  // Toggle Lock
  const toggleLock = () => {
    triggerHaptic(50);
    if (!isLocked) {
      setLockedPitch(pitch);
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  };

  // Zero / Tare calibration
  const handleTare = () => {
    triggerHaptic(40);
    setTarePitch(rawAngle);
    setTareRoll(roll);
  };

  // Reset Tare
  const handleResetTare = () => {
    triggerHaptic(40);
    setTarePitch(0);
    setTareRoll(0);
  };

  // Transfer to main slope calculator
  const handleTransfer = () => {
    triggerHaptic(60);
    onTransferToCalculator(Number(absAngle.toFixed(2)));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            Clinometro Digitale Live (Sensori Gyro & Livella)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Usa il giroscopio e l&apos;accelerometro del tuo smartphone/tablet per misurare l&apos;inclinazione dal vivo, oppure usa il simulatore manuale su PC.
          </p>
        </div>

        {/* Sensor connection status */}
        <div className="flex items-center gap-2">
          {isSimulated ? (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300">
              Modalità Manuale (PC)
            </span>
          ) : (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sensore Hardware Attivo
            </span>
          )}
        </div>
      </div>

      {/* iOS Permission Prompt if required */}
      {hasPermission === null && (
        <div className="bg-cyan-950/40 border border-cyan-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Su dispositivi iOS / Safari è necessaria l&apos;autorizzazione esplicita per leggere il giroscopio.</span>
          </div>
          <button
            onClick={requestSensorPermission}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shrink-0 cursor-pointer transition-colors"
          >
            Attiva Sensori Telefono
          </button>
        </div>
      )}

      {/* Main Clinometer Instrument Gauge Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Large Visual Dial / 2D Bubble Level (7 cols) */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Subtle radial calibration ring background */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-slate-800/80 bg-slate-950 flex items-center justify-center shadow-inner">
            {/* Outer degree tick marks */}
            <div className="absolute inset-2 rounded-full border border-slate-800/80" />
            <div className="absolute inset-6 rounded-full border border-slate-800/40" />

            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-slate-800/80 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-slate-800/80 pointer-events-none" />

            {/* Target bullseye circle (Center 0°) */}
            <div className="absolute w-14 h-14 rounded-full border-2 border-emerald-500/40 bg-emerald-950/20 pointer-events-none" />

            {/* Fluid Air Bubble */}
            <div
              className="absolute w-10 h-10 rounded-full bg-emerald-400/90 shadow-[0_0_20px_#34d399] transition-transform duration-100 ease-out flex items-center justify-center pointer-events-none border border-emerald-200"
              style={{
                transform: `translate(${bubbleX}px, ${bubbleY}px)`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
            </div>

            {/* Center HUD Readout */}
            <div className="z-10 text-center pointer-events-none mt-20">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {absAngle.toFixed(1)}°
              </div>
              <div className="font-mono text-xs font-semibold text-cyan-400 mt-0.5">
                {absAngle >= 89.9 ? '∞' : `${slopePercent.toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Quick instructions */}
          <p className="text-[11px] text-slate-400 mt-4 text-center max-w-sm">
            Appoggia il dispositivo di taglio o sul dorso per misurare l&apos;inclinazione della superficie.
          </p>
        </div>

        {/* Right: Instrument Controls & Telemetry Data (5 cols) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Letture & Strumenti
            </span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Metrics Readout */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Angolo (θ)</span>
              <span className="text-2xl font-bold text-white">{absAngle.toFixed(1)}°</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Pendenza %</span>
              <span className="text-2xl font-bold text-cyan-300">
                {absAngle >= 89.9 ? '∞' : `${slopePercent.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Rapporto</span>
              <span className="text-sm font-bold text-amber-400">
                {absAngle >= 89.9 ? '1 : 0' : `1 : ${slopeRatio}`}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Livella (Rollio)</span>
              <span className="text-sm font-bold text-slate-200">{(roll - tareRoll).toFixed(1)}°</span>
            </div>
          </div>

          {/* Calibration / Tare & Hold Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={toggleLock}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                isLocked
                  ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isLocked ? 'Misura Bloccata' : 'Blocca Misura'}</span>
            </button>

            <button
              onClick={tarePitch !== 0 ? handleResetTare : handleTare}
              className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tarePitch !== 0 ? 'Ripristina Zero' : 'Tara Zero'}</span>
            </button>
          </div>

          {/* Manual Scrubber on PC / desktop fallback */}
          {isSimulated && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Inclinazione Manuale:</span>
                <span className="font-mono text-cyan-400 font-bold">{manualPitch.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="0.5"
                value={manualPitch}
                onChange={(e) => setManualPitch(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0° (Piano)</span>
                <span>45° (100%)</span>
                <span>90° (Muro)</span>
              </div>
            </div>
          )}

          {/* Main Action: Transfer directly to Slope Calculator */}
          <button
            onClick={handleTransfer}
            className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <span>Invia Questa Misura al Calcolatore ({absAngle.toFixed(1)}°)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
