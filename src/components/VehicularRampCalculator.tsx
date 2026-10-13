import React, { useState, useMemo } from 'react';
import { MeasurementSystem } from '../types/clino';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  Info,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sliders,
  Droplets,
  Layers,
  Sparkles,
  HardHat,
  Scale,
  FileText,
  Copy,
  Check,
  Building2,
  Activity,
} from 'lucide-react';

interface VehicularRampCalculatorProps {
  system: MeasurementSystem;
}

export type RampType = 'straight_one_way' | 'straight_two_way' | 'curved_helix' | 'heavy_vehicles';
export type NtcCategory = 'cat_f' | 'cat_g';
export type ConcreteGrade = 'C25_30' | 'C28_35' | 'C30_37';

export const VehicularRampCalculator: React.FC<VehicularRampCalculatorProps> = ({ system }) => {
  // Ramp category
  const [rampType, setRampType] = useState<RampType>('straight_one_way');

  // Active view tab inside ramp calculator: 'geometry' | 'ntc_structural' | 'specs_table'
  const [activeViewTab, setActiveViewTab] = useState<'geometry' | 'ntc_structural' | 'specs_table'>('geometry');

  // Total elevation drop / rise to overcome in meters (Dislivello H)
  const [elevationMeters, setElevationMeters] = useState<number>(3.0);

  // Chosen main slope %
  const [chosenSlopePercent, setChosenSlopePercent] = useState<number>(18.0);

  // Transition vertical curves / gentle transitions (Raccordi anti-spanciamento)
  const [hasTransitions, setHasTransitions] = useState<boolean>(true);
  const [topTransitionLengthM, setTopTransitionLengthM] = useState<number>(2.5); // meters
  const [topTransitionSlopePct, setTopTransitionSlopePct] = useState<number>(8.0); // max 8%
  const [bottomTransitionLengthM, setBottomTransitionLengthM] = useState<number>(2.5);
  const [bottomTransitionSlopePct, setBottomTransitionSlopePct] = useState<number>(8.0);

  // Top level waiting area before street / sidewalk (Tratto di sosta in piano a monte)
  const [hasWaitingArea, setHasWaitingArea] = useState<boolean>(true);
  const [waitingAreaLengthM, setWaitingAreaLengthM] = useState<number>(4.0); // 3.5m - 4.5m by regulation

  // Ramp width (Larghezza corsia)
  const [rampWidthM, setRampWidthM] = useState<number>(3.5);

  // Curved / Helical ramp parameters
  const [innerRadiusM, setInnerRadiusM] = useState<number>(4.5); // min 4.5m for D.M. 1/2/1986
  const [curveAngleDeg, setCurveAngleDeg] = useState<number>(180); // 90°, 180°, 360°

  // Interactive vehicle test position along the ramp (0% to 100%)
  const [vehiclePosition, setVehiclePosition] = useState<number>(50);

  // Show NTC structural vectors in SVG diagram
  const [showNtcVectorsInSvg, setShowNtcVectorsInSvg] = useState<boolean>(true);

  // ==========================================
  // NTC VIGENTI (D.M. 17/01/2018) PARAMETERS
  // ==========================================
  const [ntcCategory, setNtcCategory] = useState<NtcCategory>('cat_f');

  // Slab thickness in cm (Spessore soletta in c.a.)
  const [slabThicknessCm, setSlabThicknessCm] = useState<number>(20);

  // Clear structural span between supports (Luce libera trave/setti in m)
  const [structuralSpanM, setStructuralSpanM] = useState<number>(5.0);

  // Non-structural permanent load g2 in kN/m² (Massetto armato, finitura spina di pesce al quarzo, canaline e impianti)
  const [permanentG2, setPermanentG2] = useState<number>(1.20);

  // Concrete grade
  const [concreteGrade, setConcreteGrade] = useState<ConcreteGrade>('C28_35');

  // Copied alert state
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const unitLength = system === 'metric' ? 'm' : 'ft';

  // Synchronize NTC category when user picks "heavy_vehicles"
  const handleSelectRampType = (type: RampType) => {
    setRampType(type);
    if (type === 'heavy_vehicles') {
      setRampWidthM(4.0);
      setChosenSlopePercent(10.0);
      setNtcCategory('cat_g');
      setSlabThicknessCm(25);
    } else if (type === 'curved_helix') {
      setRampWidthM(4.0);
      setChosenSlopePercent(15.0);
      setNtcCategory('cat_f');
    } else if (type === 'straight_two_way') {
      setRampWidthM(4.5);
      setChosenSlopePercent(18.0);
    } else {
      setRampWidthM(3.5);
      setChosenSlopePercent(18.0);
    }
  };

  // Regulatory limits based on D.M. 1 Febbraio 1986 & D.M. 15 Maggio 2020
  const regulatorySpecs = useMemo(() => {
    switch (rampType) {
      case 'straight_two_way':
        return {
          maxSlopePct: 20.0,
          recommendedSlopePct: 16.0,
          minWidthM: 4.5,
          recommendedWidthM: 5.0,
          label: 'Rettilinea a Doppio Senso',
          ruleRef: 'D.M. 01/02/1986 punto 3.7.2 · D.M. 15/05/2020 (RTV V.6)',
          desc: 'Rampa rettilinea a doppio senso di marcia. Pendenza massima consentita 20%, larghezza minima 4.50 m.',
        };
      case 'curved_helix':
        return {
          maxSlopePct: 15.0,
          recommendedSlopePct: 12.0,
          minWidthM: 3.5,
          recommendedWidthM: 4.0,
          minInnerRadiusM: 4.5,
          label: 'Curvilinea o Elicoidale (a Curva / Spirale)',
          ruleRef: 'D.M. 01/02/1986 punto 3.7.2 (limite 15% bordo interno)',
          desc: 'Rampa in curva. La pendenza massima di legge è 15% calcolata sul filo interno della curva (raggio min 4.50 m).',
        };
      case 'heavy_vehicles':
        return {
          maxSlopePct: 12.0,
          recommendedSlopePct: 10.0,
          minWidthM: 3.5,
          recommendedWidthM: 4.0,
          minHeightClearanceM: 3.5,
          label: 'Furgoni, Mezzi di Soccorso e Camion Merci',
          ruleRef: 'NTC 2018 Cat. G · Norme CNR 78/80 · Buona Pratica Logistica',
          desc: 'Rampa per furgoni e veicoli pesanti fino a 16 t (Cat. G NTC). Pendenza consigliata max 10-12% e altezza netta utile min 3.50 m.',
        };
      case 'straight_one_way':
      default:
        return {
          maxSlopePct: 20.0,
          recommendedSlopePct: 16.0,
          minWidthM: 3.0,
          recommendedWidthM: 3.5,
          label: 'Rettilinea a Senso Unico',
          ruleRef: 'D.M. 01/02/1986 punto 3.7.2 · D.M. 15/05/2020',
          desc: 'Rampa rettilinea monodirezionale. Pendenza massima consentita 20%, larghezza minima 3.00 m.',
        };
    }
  }, [rampType]);

  // Adjust chosen slope if it exceeds the maximum for the category
  const effectiveSlopePct = Math.min(chosenSlopePercent, regulatorySpecs.maxSlopePct);

  // Geometric Calculations
  const calculations = useMemo(() => {
    const H = Math.max(0.2, elevationMeters);

    if (rampType !== 'curved_helix') {
      const mainSlope = Math.max(1, effectiveSlopePct);
      const topTransLen = hasTransitions ? Math.max(0, topTransitionLengthM) : 0;
      const topTransSlope = Math.max(1, topTransitionSlopePct);
      const botTransLen = hasTransitions ? Math.max(0, bottomTransitionLengthM) : 0;
      const botTransSlope = Math.max(1, bottomTransitionSlopePct);

      // Height absorbed by top transition
      const topTransH = topTransLen * (topTransSlope / 100);
      // Height absorbed by bottom transition
      const botTransH = botTransLen * (botTransSlope / 100);

      // Remaining height for main ramp body
      let mainH = H - topTransH - botTransH;
      if (mainH < 0) {
        mainH = 0;
      }

      // Horizontal length of main body
      const mainHorizLen = mainH > 0 ? mainH / (mainSlope / 100) : 0;
      // Incline hypotenuse of main body
      const mainInclineLen = Math.sqrt(mainHorizLen * mainHorizLen + mainH * mainH);

      // Total horizontal run of ramp (including transitions)
      const totalRampHorizLen = topTransLen + mainHorizLen + botTransLen;
      // Incline length of transitions
      const topInclineLen = Math.sqrt(topTransLen * topTransLen + topTransH * topTransH);
      const botInclineLen = Math.sqrt(botTransLen * botTransLen + botTransH * botTransH);
      const totalRampInclineLen = topInclineLen + mainInclineLen + botInclineLen;

      // Waiting area at top
      const waitingLen = hasWaitingArea ? Math.max(0, waitingAreaLengthM) : 0;
      // Total footprint on ground including waiting area
      const totalFootprintHorizLen = waitingLen + totalRampHorizLen;

      // Incline angles
      const mainAngleDeg = (Math.atan2(mainH, Math.max(0.001, mainHorizLen)) * 180) / Math.PI;

      // Surface area
      const surfaceAreaM2 = totalRampInclineLen * rampWidthM;

      // Rain runoff volume estimate (standard cloudburst 30 mm/h on surface)
      const catchmentAreaM2 = totalRampHorizLen * rampWidthM;
      const rainRunoffLps = (catchmentAreaM2 * 0.03 * 1000) / 3600; // liters/second

      return {
        isCurved: false,
        totalFootprintHorizLen,
        totalRampHorizLen,
        totalRampInclineLen,
        waitingLen,
        topTransLen,
        topTransH,
        mainHorizLen,
        mainH,
        mainInclineLen,
        botTransLen,
        botTransH,
        mainAngleDeg,
        mainSlope,
        surfaceAreaM2,
        rainRunoffLps,
        innerRadiusM: 0,
        outerRadiusM: 0,
        centerRadiusM: 0,
        innerSlopePct: mainSlope,
        centerSlopePct: mainSlope,
        outerSlopePct: mainSlope,
        helixTurns: 0,
      };
    } else {
      // Curved / Helical Ramp Calculations
      const R_in = Math.max(3.5, innerRadiusM);
      const W = Math.max(3.0, rampWidthM);
      const R_center = R_in + W / 2;
      const R_out = R_in + W;

      // Angular development in radians
      const angleRad = (curveAngleDeg * Math.PI) / 180;

      // Development on inner edge (corsia interna, la più ripida!)
      const innerArcLength = angleRad * R_in;
      const centerArcLength = angleRad * R_center;
      const outerArcLength = angleRad * R_out;

      // Pendenza max ammessa dal D.M. 1/2/1986 è 15% sul filo interno:
      const innerSlope = (H / innerArcLength) * 100;
      const centerSlope = (H / centerArcLength) * 100;
      const outerSlope = (H / outerArcLength) * 100;

      // Incline lengths
      const centerInclineLen = Math.sqrt(centerArcLength * centerArcLength + H * H);

      const surfaceAreaM2 = centerInclineLen * W;
      const rainRunoffLps = (centerArcLength * W * 0.03 * 1000) / 3600;

      return {
        isCurved: true,
        totalFootprintHorizLen: R_out * 2,
        totalRampHorizLen: centerArcLength,
        totalRampInclineLen: centerInclineLen,
        waitingLen: hasWaitingArea ? waitingAreaLengthM : 0,
        topTransLen: 0,
        topTransH: 0,
        mainHorizLen: centerArcLength,
        mainH: H,
        mainInclineLen: centerInclineLen,
        botTransLen: 0,
        botTransH: 0,
        mainAngleDeg: (Math.atan2(H, centerArcLength) * 180) / Math.PI,
        mainSlope: centerSlope,
        surfaceAreaM2,
        rainRunoffLps,
        innerRadiusM: R_in,
        outerRadiusM: R_out,
        centerRadiusM: R_center,
        innerSlopePct: innerSlope,
        centerSlopePct: centerSlope,
        outerSlopePct: outerSlope,
        helixTurns: curveAngleDeg / 360,
      };
    }
  }, [
    elevationMeters,
    effectiveSlopePct,
    hasTransitions,
    topTransitionLengthM,
    topTransitionSlopePct,
    bottomTransitionLengthM,
    bottomTransitionSlopePct,
    hasWaitingArea,
    waitingAreaLengthM,
    rampWidthM,
    rampType,
    innerRadiusM,
    curveAngleDeg,
  ]);

  // ==========================================
  // NTC 2018 (D.M. 17/01/2018) CALCULATION ENGINE
  // ==========================================
  const ntcCalculations = useMemo(() => {
    // 1. Live load specifications by NTC 2018 Tabella 3.1.II
    const isCatG = ntcCategory === 'cat_g';
    const qk = isCatG ? 5.0 : 2.5; // kN/m² uniform distributed load
    const Qk = isCatG ? 90.0 : 10.0; // kN axle/wheel concentrated load (90 kN for Cat. G, 10 kN for Cat. F)
    const psi0 = 0.7;
    const psi1 = isCatG ? 0.5 : 0.7;
    const psi2 = isCatG ? 0.3 : 0.6;

    // 2. Horizontal braking force on ramp (NTC 2018 Par. 3.1.4.2)
    // Hk = 0.2 * Qk (transmitted to slab in longitudinal direction)
    const Hk_braking = 0.2 * Qk; // in kN

    // 3. Parapet/barrier lateral live load (NTC 2018 Tabella 3.1.II)
    const Hk_parapet = isCatG ? 1.5 : 1.0; // kN/m at handrail height (1.00m or 1.10m)

    // 4. Accidental vehicle impact on safety curb/barrier (NTC 2018 Par. 3.6.3.2)
    const Fd_impact = isCatG ? 100.0 : 50.0; // kN static equivalent horizontal force at h = 0.375m - 0.50m

    // 5. Structural self weight g1 (reinforced concrete slab γ_cls = 25 kN/m³)
    const slabThickM = slabThicknessCm / 100;
    const g1 = slabThickM * 25.0; // kN/m²

    // 6. Non-structural permanent load g2 (paving, herringbone screed, waterproof, drainage)
    const g2 = permanentG2; // kN/m²

    // 7. Fundamental SLU design combination (NTC 2018 Eq. 2.6.1):
    // q_Ed = γ_G1 * g1 + γ_G2 * g2 + γ_Q * qk  (γ_G1 = 1.30, γ_G2 = 1.50, γ_Q = 1.50)
    const gammaG1 = 1.30;
    const gammaG2 = 1.50;
    const gammaQ = 1.50;
    const qEd = gammaG1 * g1 + gammaG2 * g2 + gammaQ * qk; // in kN/m²

    // 8. Serviceability SLE rare combination:
    const qk_tot = g1 + g2 + qk; // in kN/m²

    // 9. Structural slenderness check (Rapporto di snellezza L/s senza calcolo frecce NTC Par. 4.1.2.2.2)
    const slenderness = (structuralSpanM * 100) / slabThicknessCm;
    const slendernessLimit = 22.0; // reference limit for continuous vehicle ramp slab
    const isSlendernessCompliant = slenderness <= 25.0;

    // 10. Estimated maximum bending moment per unit meter width M_Ed (kNm/m):
    // Assuming partial continuity over supports: M_Ed ≈ q_Ed * L² / 10
    const M_Ed = (qEd * structuralSpanM * structuralSpanM) / 10;

    // 11. Estimated minimum flexural longitudinal rebar As (cm²/m):
    // As ≈ M_Ed / (0.9 * d * f_yd)
    // with d = slabThicknessCm - 4.0 cm cover, f_yd = 450 / 1.15 = 391.3 MPa
    const d_eff_cm = Math.max(8, slabThicknessCm - 4.0);
    const f_yd = 391.3; // N/mm²
    const As_req_cm2 = (M_Ed * 1e6) / (0.9 * (d_eff_cm * 10) * f_yd * 100); // cm²/m

    // 12. Total concrete volume and weight for the ramp
    const totalConcreteM3 = calculations.surfaceAreaM2 * slabThickM;
    const totalConcreteWeightTon = totalConcreteM3 * 2.5;

    // 13. Concrete characteristic strength
    const fck = concreteGrade === 'C25_30' ? 25 : concreteGrade === 'C28_35' ? 28 : 30;

    return {
      categoryLabel: isCatG
        ? 'Categoria G: Autoveicoli medi e veicoli pesanti (30 < P ≤ 160 kN)'
        : 'Categoria F: Aree traffico e parcheggio autoveicoli leggeri (P ≤ 30 kN)',
      qk,
      Qk,
      psi0,
      psi1,
      psi2,
      Hk_braking,
      Hk_parapet,
      Fd_impact,
      g1,
      g2,
      qEd,
      qk_tot,
      slenderness,
      isSlendernessCompliant,
      slendernessLimit,
      M_Ed,
      As_req_cm2,
      d_eff_cm,
      totalConcreteM3,
      totalConcreteWeightTon,
      fck,
      exposureClass: 'XD3 / XF4', // Sali disgelanti e cicli di gelo severi
      minCoverMm: 35, // 35 mm nominale per calcestruzzo esposto a sali/gelo
    };
  }, [ntcCategory, slabThicknessCm, structuralSpanM, permanentG2, concreteGrade, calculations.surfaceAreaM2]);

  // Overall compliance check
  const complianceStatus = useMemo(() => {
    let isValid = true;
    const warnings: string[] = [];

    if (rampType === 'curved_helix') {
      if (calculations.innerSlopePct > 15.01) {
        isValid = false;
        warnings.push(`Pendenza sul bordo interno (${calculations.innerSlopePct.toFixed(1)}%) superiore al limite di legge del 15% (D.M. 01/02/1986). Aumenta il raggio di curvatura o l'angolo di sviluppo.`);
      }
      if (innerRadiusM < 4.5) {
        isValid = false;
        warnings.push(`Raggio interno di curvatura (${innerRadiusM} m) inferiore al minimo di 4.50 m prescritto dalla normativa antincendio.`);
      }
    } else {
      if (calculations.mainSlope > regulatorySpecs.maxSlopePct) {
        isValid = false;
        warnings.push(`Pendenza del ${calculations.mainSlope.toFixed(1)}% superiore al limite massimo consentito (${regulatorySpecs.maxSlopePct}%).`);
      }
      if (rampWidthM < regulatorySpecs.minWidthM) {
        isValid = false;
        warnings.push(`Larghezza corsia (${rampWidthM} m) inferiore al minimo regolamentare di ${regulatorySpecs.minWidthM} m.`);
      }
      if (!hasTransitions && calculations.mainSlope > 16) {
        warnings.push('Attenzione: con pendenza > 16% senza raccordi dolci alle estremità, veicoli standard e berline toccheranno il sottoscocca (spanciamento) all\'inizio e alla fine della rampa.');
      }
      if (!hasWaitingArea) {
        warnings.push('Manca il tratto di sosta in piano a monte (3.50 ÷ 4.50 m): obbligatorio nella maggior parte dei regolamenti edilizi prima dell\'immissione sulla pubblica via.');
      }
    }

    if (!ntcCalculations.isSlendernessCompliant) {
      warnings.push(`NTC 2018: Rapporto di snellezza soletta L/s = ${ntcCalculations.slenderness.toFixed(1)} > 25. Lo spessore di ${slabThicknessCm} cm potrebbe risultare eccessivamente deformabile per una luce di ${structuralSpanM} m. Verificare la freccia a lungo termine o aumentare lo spessore.`);
    }

    return { isValid, warnings };
  }, [calculations, rampType, innerRadiusM, rampWidthM, regulatorySpecs, hasTransitions, hasWaitingArea, ntcCalculations, slabThicknessCm, structuralSpanM]);

  // Copy technical specification summary to clipboard
  const handleCopySummary = () => {
    const text = `PROGETTO RAMPA CARRAIA EDILIZIA - CONFORME D.M. 01/02/1986 & NTC 2018
Tipologia: ${regulatorySpecs.label}
Dislivello da superare (H): ${elevationMeters.toFixed(2)} m
Pendenza di progetto: ${calculations.mainSlope.toFixed(1)}% (${calculations.mainAngleDeg.toFixed(1)}°)
Larghezza netta corsia (W): ${rampWidthM.toFixed(2)} m
Sviluppo orizzontale (ingombro): ${calculations.totalFootprintHorizLen.toFixed(2)} m
Sviluppo rampa inclinato: ${calculations.totalRampInclineLen.toFixed(2)} m
Superficie pavimentata: ${calculations.surfaceAreaM2.toFixed(1)} m²

PARAMETRI STRUTTURALI NTC 2018 (D.M. 17/01/2018):
Categoria di Carico: ${ntcCategory === 'cat_g' ? 'Cat. G (Veicoli 30 < P ≤ 160 kN)' : 'Cat. F (Autovetture P ≤ 30 kN)'}
Sovraccarico variabile (qk): ${ntcCalculations.qk.toFixed(2)} kN/m²
Carico concentrato (Qk): ${ntcCalculations.Qk.toFixed(1)} kN
Forza frenatura longitudinale (Hk): ${ntcCalculations.Hk_braking.toFixed(1)} kN
Spinta parapetti (Hk): ${ntcCalculations.Hk_parapet.toFixed(2)} kN/m
Urto accidentale veicolo (Fd): ${ntcCalculations.Fd_impact.toFixed(1)} kN
Spessore soletta in c.a.: ${slabThicknessCm} cm
Luce di calcolo campata (L): ${structuralSpanM.toFixed(2)} m
Carico totale di progetto SLU (qEd): ${ntcCalculations.qEd.toFixed(2)} kN/m²
Momento flettente stimato SLU (M_Ed): ${ntcCalculations.M_Ed.toFixed(2)} kNm/m
Armatura tesa minima stimata (As): ${ntcCalculations.As_req_cm2.toFixed(2)} cm²/m
Volume totale calcestruzzo: ${ntcCalculations.totalConcreteM3.toFixed(1)} m³ (${ntcCalculations.totalConcreteWeightTon.toFixed(1)} t)
Classe calcestruzzo / Esposizione: ${concreteGrade.replace('_', '/')} / ${ntcCalculations.exposureClass} (Copriferro c_nom ≥ ${ntcCalculations.minCoverMm} mm)
Prescrizione sismica: Prevedere giunto sismico o appoggio elastomerico scorrevole (NTC Par. 7.2.1)`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // SVG Scaled coordinate generation for technical longitudinal section
  const svgW = 760;
  const svgH = 340;
  const padL = 60;
  const padR = 60;
  const padT = 50;
  const padB = 65;
  const drawW = svgW - padL - padR;
  const drawH = svgH - padT - padB;

  const totalModelLen = Math.max(1, calculations.totalFootprintHorizLen + 3.0);
  const scaleX = drawW / totalModelLen;

  const xStart = padL;
  const xWaitEnd = xStart + calculations.waitingLen * scaleX;
  const xTopTransEnd = xWaitEnd + calculations.topTransLen * scaleX;
  const xBotTransStart = xTopTransEnd + calculations.mainHorizLen * scaleX;
  const xRampEnd = xBotTransStart + calculations.botTransLen * scaleX;
  const xGarageEnd = padL + drawW;

  const yStreet = padT;
  const yTopTransEnd = yStreet + (calculations.topTransH / elevationMeters) * drawH;
  const yBotTransStart = yTopTransEnd + (calculations.mainH / elevationMeters) * drawH;
  const yGarage = padT + drawH;

  // Car position interpolation
  const tPos = vehiclePosition / 100;
  let carX = xWaitEnd;
  let carY = yStreet;
  let carAngleDeg = 0;

  if (tPos <= 0.15) {
    const localT = tPos / 0.15;
    carX = xStart + localT * (xWaitEnd - xStart);
    carY = yStreet;
    carAngleDeg = 0;
  } else if (tPos <= 0.3) {
    const localT = (tPos - 0.15) / 0.15;
    carX = xWaitEnd + localT * (xTopTransEnd - xWaitEnd);
    carY = yStreet + localT * (yTopTransEnd - yStreet);
    carAngleDeg = calculations.topTransH > 0 ? (topTransitionSlopePct / 100) * 45 : 0;
  } else if (tPos <= 0.75) {
    const localT = (tPos - 0.3) / 0.45;
    carX = xTopTransEnd + localT * (xBotTransStart - xTopTransEnd);
    carY = yTopTransEnd + localT * (yBotTransStart - yTopTransEnd);
    carAngleDeg = calculations.mainAngleDeg;
  } else if (tPos <= 0.9) {
    const localT = (tPos - 0.75) / 0.15;
    carX = xBotTransStart + localT * (xRampEnd - xBotTransStart);
    carY = yBotTransStart + localT * (yGarage - yBotTransStart);
    carAngleDeg = calculations.botTransH > 0 ? (bottomTransitionSlopePct / 100) * 45 : 0;
  } else {
    const localT = (tPos - 0.9) / 0.1;
    carX = xRampEnd + localT * (xGarageEnd - xRampEnd);
    carY = yGarage;
    carAngleDeg = 0;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-cyan-400" />
            Calcolatore Rampe Carraie & Accessi Autorimesse
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Progettazione geometrica e strutturale conforme al <strong>D.M. 01/02/1986</strong>, <strong>D.M. 15/05/2020</strong> e alle <strong>Norme Tecniche per le Costruzioni vigenti (NTC 2018 - D.M. 17/01/2018)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Copia specifiche tecniche per relazione di calcolo"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedSummary ? 'Copiato!' : 'Copia Dati Relazione'}</span>
          </button>

          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg font-mono text-xs shrink-0">
            <span className="text-slate-400 block text-[9px] uppercase">Normative Vigenti:</span>
            <span className="text-cyan-300 font-bold">D.M. 86 + NTC 2018</span>
          </div>
        </div>
      </div>

      {/* RAMP TYPE SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Straight One-Way */}
        <button
          type="button"
          onClick={() => handleSelectRampType('straight_one_way')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            rampType === 'straight_one_way'
              ? 'bg-cyan-950/40 border-cyan-500/70 text-white shadow-lg ring-1 ring-cyan-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-300">Rettilinea Senso Unico</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Max 20%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Corsia singola per autorimesse condominiali o private. Larghezza min 3.00 m. NTC Cat. F (≤ 30 kN).
          </p>
        </button>

        {/* Card 2: Straight Two-Way */}
        <button
          type="button"
          onClick={() => handleSelectRampType('straight_two_way')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            rampType === 'straight_two_way'
              ? 'bg-cyan-950/40 border-cyan-500/70 text-white shadow-lg ring-1 ring-cyan-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-300">Rettilinea Doppio Senso</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Max 20%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Doppia corsia per grandi complessi e parcheggi interrati. Larghezza min 4.50 m. NTC Cat. F.
          </p>
        </button>

        {/* Card 3: Curved / Helical */}
        <button
          type="button"
          onClick={() => handleSelectRampType('curved_helix')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            rampType === 'curved_helix'
              ? 'bg-cyan-950/40 border-cyan-500/70 text-white shadow-lg ring-1 ring-cyan-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-300">Curva o Elicoidale</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
              Max 15%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Rampa a curva o a chiocciola. Raggio interno min 4.50 m, pendenza max 15% al filo interno. NTC Cat. F.
          </p>
        </button>

        {/* Card 4: Heavy Vehicles / Trucks */}
        <button
          type="button"
          onClick={() => handleSelectRampType('heavy_vehicles')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            rampType === 'heavy_vehicles'
              ? 'bg-cyan-950/40 border-cyan-500/70 text-white shadow-lg ring-1 ring-cyan-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-300">Furgoni & Mezzi Pesanti</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Max 12%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Per carico/scarico merci e veicoli di soccorso. NTC Categoria G (30 &lt; P ≤ 160 kN, asse 90 kN).
          </p>
        </button>
      </div>

      {/* VIEW SELECTOR: GEOMETRIA VS PARAMETRI STRUTTURALI NTC 2018 VS QUADRO NORMATIVO */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveViewTab('geometry')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeViewTab === 'geometry'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Dimensionamento Geometrico & Sezione 2D</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('ntc_structural')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeViewTab === 'ntc_structural'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HardHat className="w-4 h-4 text-amber-400" />
          <span>Parametri Strutturali NTC Vigenti (D.M. 17/01/2018)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
            SLU &amp; Carichi
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('specs_table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeViewTab === 'specs_table'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quadro Sinottico NTC &amp; Prescrizioni di Cantiere</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: GEOMETRIC DESIGN & TECHNICAL 2D SECTION VIEW      */}
      {/* ======================================================== */}
      {activeViewTab === 'geometry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Geometria Rampa &amp; Dislivello
              </h3>
              <Ruler className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Elevation Difference H */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dislivello da Superare (Altezza Interpiano H)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  min="0.3"
                  max="30"
                  value={elevationMeters}
                  onChange={(e) => setElevationMeters(Number(e.target.value) || 0.3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:border-cyan-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">{unitLength}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[2.5, 2.8, 3.0, 3.2, 3.5, 6.0].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setElevationMeters(h)}
                    className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer min-h-[30px] ${
                      elevationMeters === h
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {h.toFixed(1)} {unitLength}
                  </button>
                ))}
              </div>
            </div>

            {/* Slope % Controller */}
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
                <span>Pendenza Rampa di Progetto:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {chosenSlopePercent.toFixed(1)}% ({calculations.mainAngleDeg.toFixed(1)}°)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={regulatorySpecs.maxSlopePct}
                step="0.5"
                value={chosenSlopePercent}
                onChange={(e) => setChosenSlopePercent(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>8% (Dolce)</span>
                <span>12% (Confort)</span>
                <span>15% (Limite Curve)</span>
                <span>20% (Max Legge)</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {[10, 12, 15, 16, 18, 20].filter(s => s <= regulatorySpecs.maxSlopePct).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChosenSlopePercent(s)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      chosenSlopePercent === s
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            {/* Width of Ramp */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Larghezza Netta della Rampa (W)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="2.5"
                  max="12"
                  value={rampWidthM}
                  onChange={(e) => setRampWidthM(Number(e.target.value) || 3.0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">{unitLength}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Minimo di legge: <strong>{regulatorySpecs.minWidthM.toFixed(1)} m</strong> (consigliato {regulatorySpecs.recommendedWidthM.toFixed(1)} m).
              </p>
            </div>

            {/* Helical / Curved specific inputs */}
            {rampType === 'curved_helix' && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                  <span>Geometria Rampa Curva / Spirale</span>
                  <Compass className="w-4 h-4 text-amber-400" />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Raggio Interno di Curvatura (min 4.50 m per legge)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.25"
                      min="3.5"
                      max="20"
                      value={innerRadiusM}
                      onChange={(e) => setInnerRadiusM(Number(e.target.value) || 4.5)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">{unitLength}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Angolo di Sviluppo in Curva
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                    {[90, 180, 270, 360].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setCurveAngleDeg(deg)}
                        className={`py-1 rounded border transition-colors cursor-pointer ${
                          curveAngleDeg === deg
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {deg}° {deg === 360 ? '(1 giro)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gentle Transitions (Raccordi Anti-Spanciamento) Options */}
            {rampType !== 'curved_helix' && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Raccordi Dolci Anti-Spanciamento
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tratti a pendenza dimezzata (6-8%) per evitare urti al sottoscocca
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasTransitions}
                    onChange={(e) => setHasTransitions(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>

                {hasTransitions && (
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Lunghezza Raccordo (m)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="1.5"
                        max="6"
                        value={topTransitionLengthM}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 2;
                          setTopTransitionLengthM(val);
                          setBottomTransitionLengthM(val);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Pendenza Raccordo (max 8%)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="4"
                        max="10"
                        value={topTransitionSlopePct}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 8;
                          setTopTransitionSlopePct(val);
                          setBottomTransitionSlopePct(val);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Waiting Level Area Option */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Tratto di Sosta in Piano a Monte (3.5 - 4.5 m)
                </span>
                <span className="text-[10px] text-slate-400">
                  Pianerottolo prima della pubblica via (visibilità e fermata sicura)
                </span>
              </div>
              <input
                type="checkbox"
                checked={hasWaitingArea}
                onChange={(e) => setHasWaitingArea(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Compliance Status Alert */}
            <div
              className={`p-3.5 rounded-xl border text-xs ${
                complianceStatus.isValid
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {complianceStatus.isValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Conforme alle Norme Vigenti</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Attenzione: Non Conformità Rilevata</span>
                  </>
                )}
              </div>
              {complianceStatus.warnings.length > 0 ? (
                <ul className="mt-1.5 space-y-1 list-disc pl-4 text-[11px] leading-relaxed opacity-95">
                  {complianceStatus.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                  Pendenza del {calculations.mainSlope.toFixed(1)}% e larghezza {rampWidthM.toFixed(1)} m conformi a D.M. 86 e NTC 2018.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Visual 2D Section & Telemetry (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Technical Section SVG Diagram */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs text-slate-400">
                <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Sezione Tecnica Longitudinale Quotata</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    H = {elevationMeters.toFixed(2)} m · P = {calculations.mainSlope.toFixed(1)}%
                  </span>
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNtcVectorsInSvg}
                    onChange={(e) => setShowNtcVectorsInSvg(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
                  />
                  <span className="text-amber-300 font-mono">Mostra Sovraccarichi NTC (qEd, Hk)</span>
                </label>
              </div>

              <div className="relative bg-slate-950/90 border border-slate-800/90 rounded-lg p-2 overflow-x-auto">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none overflow-visible">
                  <defs>
                    <linearGradient id="rampSoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Soil Polygon */}
                  <polygon
                    points={`${xStart},${yStreet} ${xWaitEnd},${yStreet} ${xTopTransEnd},${yTopTransEnd} ${xBotTransStart},${yBotTransStart} ${xRampEnd},${yGarage} ${xGarageEnd},${yGarage} ${xGarageEnd},${svgH - 25} ${xStart},${svgH - 25}`}
                    fill="url(#rampSoilGrad)"
                    stroke="none"
                  />

                  {/* 1. Sidewalk / Waiting Flat Section */}
                  <line x1={xStart} y1={yStreet} x2={xWaitEnd} y2={yStreet} stroke="#38bdf8" strokeWidth="3" />
                  <rect x={xStart} y={yStreet} width={xWaitEnd - xStart} height="6" fill="#0284c7" opacity="0.6" />
                  {hasWaitingArea && (
                    <text x={(xStart + xWaitEnd) / 2} y={yStreet - 12} fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      Sosta in Piano ({waitingAreaLengthM} m)
                    </text>
                  )}

                  {/* 2. Top Transition */}
                  {hasTransitions && calculations.topTransLen > 0 && (
                    <g>
                      <line x1={xWaitEnd} y1={yStreet} x2={xTopTransEnd} y2={yTopTransEnd} stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 2" />
                      <text x={(xWaitEnd + xTopTransEnd) / 2} y={yTopTransEnd - 10} fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        Raccordo {topTransitionSlopePct}% ({topTransitionLengthM}m)
                      </text>
                    </g>
                  )}

                  {/* 3. Main Ramp Slab with thickness representation */}
                  <line x1={xTopTransEnd} y1={yTopTransEnd} x2={xBotTransStart} y2={yBotTransStart} stroke="#06b6d4" strokeWidth="4" />
                  {/* Concrete slab bottom line */}
                  <line
                    x1={xTopTransEnd}
                    y1={yTopTransEnd + 10}
                    x2={xBotTransStart}
                    y2={yBotTransStart + 10}
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* 4. Bottom Transition */}
                  {hasTransitions && calculations.botTransLen > 0 && (
                    <g>
                      <line x1={xBotTransStart} y1={yBotTransStart} x2={xRampEnd} y2={yGarage} stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 2" />
                      <text x={(xBotTransStart + xRampEnd) / 2} y={yGarage - 10} fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        Raccordo {bottomTransitionSlopePct}% ({bottomTransitionLengthM}m)
                      </text>
                    </g>
                  )}

                  {/* 5. Garage Floor Level */}
                  <line x1={xRampEnd} y1={yGarage} x2={xGarageEnd} y2={yGarage} stroke="#10b981" strokeWidth="3" />
                  <rect x={xRampEnd} y={yGarage} width={xGarageEnd - xRampEnd} height="6" fill="#059669" opacity="0.6" />
                  <text x={(xRampEnd + xGarageEnd) / 2} y={yGarage - 12} fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Piano Interrato Garage
                  </text>

                  {/* Drainage Channel Grate */}
                  <g transform={`translate(${xRampEnd - 12}, ${yGarage - 4})`}>
                    <rect x="0" y="0" width="24" height="12" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1="6" y1="0" x2="6" y2="12" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="12" y1="0" x2="12" y2="12" stroke="#38bdf8" strokeWidth="1" />
                    <line x1="18" y1="0" x2="18" y2="12" stroke="#38bdf8" strokeWidth="1" />
                    <text x="12" y="24" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      Caditoia Scolo
                    </text>
                  </g>

                  {/* Slope Badge along main incline */}
                  <g transform={`translate(${(xTopTransEnd + xBotTransStart) / 2}, ${(yTopTransEnd + yBotTransStart) / 2})`}>
                    <rect x="-48" y="-12" width="96" height="24" rx="4" fill="#030712" stroke="#06b6d4" strokeWidth="1.5" />
                    <text x="0" y="4" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      P = {calculations.mainSlope.toFixed(1)}%
                    </text>
                  </g>

                  {/* NTC Structural Load Overlay (qEd, Hk) */}
                  {showNtcVectorsInSvg && (
                    <g>
                      {/* Distributed Load qEd vectors */}
                      {[0.3, 0.5, 0.7].map((frac, i) => {
                        const px = xTopTransEnd + frac * (xBotTransStart - xTopTransEnd);
                        const py = yTopTransEnd + frac * (yBotTransStart - yTopTransEnd);
                        return (
                          <g key={i}>
                            <line x1={px} y1={py - 18} x2={px} y2={py - 3} stroke="#f59e0b" strokeWidth="1.5" />
                            <polygon points={`${px - 3},${py - 7} ${px + 3},${py - 7} ${px},${py - 2}`} fill="#f59e0b" />
                          </g>
                        );
                      })}
                      <text
                        x={(xTopTransEnd + xBotTransStart) / 2}
                        y={(yTopTransEnd + yBotTransStart) / 2 - 20}
                        fill="#f59e0b"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        NTC q_Ed = {ntcCalculations.qEd.toFixed(1)} kN/m² · Soletta s={slabThicknessCm}cm
                      </text>

                      {/* Longitudinal Braking Force Vector Hk */}
                      <g transform={`translate(${xBotTransStart - 35}, ${yBotTransStart - 12})`}>
                        <line x1="0" y1="0" x2="28" y2="0" stroke="#f43f5e" strokeWidth="2" />
                        <polygon points="28,-4 36,0 28,4" fill="#f43f5e" />
                        <text x="18" y="-6" fill="#f43f5e" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                          Hk = {ntcCalculations.Hk_braking.toFixed(1)} kN
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Elevation Gain / Drop H Dimension Line */}
                  <g transform={`translate(${xGarageEnd + 15}, 0)`}>
                    <line x1="0" y1={yStreet} x2="0" y2={yGarage} stroke="#f59e0b" strokeWidth="1.5" />
                    <line x1="-5" y1={yStreet} x2="5" y2={yStreet} stroke="#f59e0b" strokeWidth="1" />
                    <line x1="-5" y1={yGarage} x2="5" y2={yGarage} stroke="#f59e0b" strokeWidth="1" />
                    <text x="8" y={(yStreet + yGarage) / 2 + 4} fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      H = {elevationMeters.toFixed(2)} m
                    </text>
                  </g>

                  {/* Total Footprint Dimension Line at the Bottom */}
                  <g transform={`translate(0, ${svgH - 12})`}>
                    <line x1={xStart} y1="0" x2={xRampEnd} y2="0" stroke="#94a3b8" strokeWidth="1.2" />
                    <line x1={xStart} y1="-5" x2={xStart} y2="5" stroke="#94a3b8" strokeWidth="1" />
                    <line x1={xRampEnd} y1="-5" x2={xRampEnd} y2="5" stroke="#94a3b8" strokeWidth="1" />
                    <text x={(xStart + xRampEnd) / 2} y="-6" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
                      Ingombro totale a terra: {calculations.totalFootprintHorizLen.toFixed(2)} m {hasWaitingArea ? `(Sosta ${calculations.waitingLen.toFixed(1)}m + Rampa ${calculations.totalRampHorizLen.toFixed(1)}m)` : ''} · Sviluppo inclinato: {calculations.totalRampInclineLen.toFixed(2)} m
                    </text>
                  </g>

                  {/* Vehicle Avatar along profile */}
                  <g transform={`translate(${carX}, ${carY - 14}) rotate(${carAngleDeg})`}>
                    <rect x="-22" y="-10" width="44" height="12" rx="3" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
                    <polygon points="-12,-10 -6,-18 10,-18 16,-10" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                    <circle cx="-14" cy="2" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                    <circle cx="14" cy="2" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                    <circle cx="21" cy="-4" r="2" fill="#fef08a" />
                  </g>
                </svg>
              </div>

              {/* Scrubber Bar */}
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="font-mono text-slate-400 shrink-0 text-[11px]">
                  Simula Posizione Auto:
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vehiclePosition}
                  onChange={(e) => setVehiclePosition(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono text-cyan-300 w-12 text-right shrink-0">
                  {vehiclePosition}%
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Ingombro a Terra</span>
                <div className="my-1 text-2xl font-mono font-bold text-cyan-300">
                  {calculations.totalFootprintHorizLen.toFixed(2)} <span className="text-xs text-slate-400">m</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                  {hasWaitingArea
                    ? `Base ${calculations.totalRampHorizLen.toFixed(1)}m + Sosta ${calculations.waitingLen.toFixed(1)}m`
                    : `Base orizzontale rampa`}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Sviluppo Inclinato</span>
                <div className="my-1 text-2xl font-mono font-bold text-white">
                  {calculations.totalRampInclineLen.toFixed(2)} <span className="text-xs text-slate-400">m</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                  Ipotenusa (&gt; base {calculations.totalRampHorizLen.toFixed(1)}m)
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Superficie Pavimentata</span>
                <div className="my-1 text-2xl font-mono font-bold text-amber-400">
                  {calculations.surfaceAreaM2.toFixed(1)} <span className="text-xs text-slate-400">m²</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">corsia {rampWidthM.toFixed(1)} m</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Portata Caditoia</span>
                <div className="my-1 text-2xl font-mono font-bold text-emerald-400">
                  {calculations.rainRunoffLps.toFixed(2)} <span className="text-xs text-slate-400">l/s</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">scolo pioggia (30mm/h)</span>
              </div>
            </div>

            {/* Quick jump to NTC Parameters Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-cyan-950/40 border border-cyan-800/40 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HardHat className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Verifica Strutturale NTC 2018 per questa Rampa
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Carico SLU: <strong>{ntcCalculations.qEd.toFixed(2)} kN/m²</strong> · Frenatura: <strong>{ntcCalculations.Hk_braking.toFixed(1)} kN</strong> · Soletta c.a.: <strong>{slabThicknessCm} cm</strong> ({ntcCalculations.totalConcreteM3.toFixed(1)} m³ cls)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveViewTab('ntc_structural')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-medium shrink-0 cursor-pointer transition-colors"
              >
                Apri Dettaglio NTC &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: NTC 2018 STRUCTURAL PARAMETERS & DESIGN ENGINE    */}
      {/* ======================================================== */}
      {activeViewTab === 'ntc_structural' && (
        <div className="space-y-6">
          {/* NTC Category Selector */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  Categoria di Traffico e Sovraccarichi (NTC 2018 - Tabella 3.1.II)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Classificazione dell&apos;autorimessa e determinazione dei carichi variabili qk e concentrati Qk
                </p>
              </div>
              <div className="text-xs font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 shrink-0">
                D.M. 17 Gennaio 2018
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category F */}
              <button
                type="button"
                onClick={() => setNtcCategory('cat_f')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  ntcCategory === 'cat_f'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-cyan-300">
                    Categoria F: Autoveicoli Leggeri (P ≤ 30 kN / 3,0 t)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-200 border border-cyan-700">
                    qk = 2,50 kN/m²
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  Autorimesse e rampe carrabili per autovetture, SUV, minivan e motocicli. Sovraccarico distribuito di 250 kg/m² e carico concentrato ruota di 10 kN (1.000 kg).
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-300">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Qk = 10 kN</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Frenatura Hk = 2,0 kN</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Urto Fd = 50 kN</span>
                </div>
              </button>

              {/* Category G */}
              <button
                type="button"
                onClick={() => setNtcCategory('cat_g')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  ntcCategory === 'cat_g'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-300">
                    Categoria G: Veicoli Medi &amp; Soccorso (30 &lt; P ≤ 160 kN)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/50 text-amber-200 border border-amber-700">
                    qk = 5,00 kN/m²
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  Rampe per furgoni merci, ambulanze, autopompe Vigili del Fuoco (indispensabile per autorimesse soggette a prevenzione incendi) e veicoli fino a 16 t.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-300">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Qk asse = 90 kN</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Frenatura Hk = 18,0 kN</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Urto Fd = 100 kN</span>
                </div>
              </button>
            </div>
          </div>

          {/* Structural Inputs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Box 1: Structural Slab Thickness & Span */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Dimensionamento Soletta c.a.
                </span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Slab thickness input */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
                  <span>Spessore Soletta in c.a. (s):</span>
                  <span className="font-mono text-cyan-300 font-bold">{slabThicknessCm} cm</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={slabThicknessCm}
                  onChange={(e) => setSlabThicknessCm(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[16, 18, 20, 22, 25, 28].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlabThicknessCm(t)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        slabThicknessCm === t
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {t} cm
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Peso proprio strutturale: <strong>g₁ = {ntcCalculations.g1.toFixed(2)} kN/m²</strong> (γ = 25 kN/m³)
                </p>
              </div>

              {/* Span distance input */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1">
                  <span>Luce Strutturale Netta (L):</span>
                  <span className="font-mono text-amber-300 font-bold">{structuralSpanM.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="8.0"
                  step="0.25"
                  value={structuralSpanM}
                  onChange={(e) => setStructuralSpanM(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Interasse o luce libera tra travi o setti di sostegno della rampa.
                </p>
              </div>

              {/* Slenderness Check Badge */}
              <div className={`p-3 rounded-lg border text-xs ${
                ntcCalculations.isSlendernessCompliant
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              }`}>
                <div className="flex items-center justify-between font-mono">
                  <span>Snellezza L/s = {ntcCalculations.slenderness.toFixed(1)}</span>
                  <span className="font-bold">
                    {ntcCalculations.slenderness <= 22 ? 'Ottimale (≤ 22)' : ntcCalculations.slenderness <= 25 ? 'Accettabile (≤ 25)' : 'Snella (> 25)'}
                  </span>
                </div>
                <p className="text-[10px] mt-1 opacity-90">
                  {ntcCalculations.isSlendernessCompliant
                    ? 'Verifica di deformabilità SLE superata senza calcolo esplicito della freccia (NTC Par. 4.1.2.2.2).'
                    : 'Rischio deformazioni eccessive: raccomandato calcolo delle frecce a lungo termine o aumento spessore soletta.'}
                </p>
              </div>
            </div>

            {/* Box 2: Non-Structural Load & Concrete Grade */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Materiali &amp; Finiture (g₂)
                </span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>

              {/* Non structural permanent g2 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Carichi Permanenti Portati g₂ (kN/m²)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.5"
                  max="3.0"
                  value={permanentG2}
                  onChange={(e) => setPermanentG2(Number(e.target.value) || 1.2)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Include pavimentazione rigata/a spina di pesce al quarzo ({'>'} 3 cm), impermeabilizzazione e canalette (standard: 1.0 ÷ 1.5 kN/m²).
                </p>
              </div>

              {/* Concrete Grade Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Classe di Resistenza Calcestruzzo (NTC Par. 4.1.2)
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {(['C25_30', 'C28_35', 'C30_37'] as ConcreteGrade[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setConcreteGrade(grade)}
                      className={`py-1.5 px-2 rounded border text-center transition-colors cursor-pointer ${
                        concreteGrade === grade
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {grade.replace('_', '/')}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  fck = <strong>{ntcCalculations.fck} MPa</strong> · Classe esposizione consigliata: <strong>{ntcCalculations.exposureClass}</strong> per sali disgelanti.
                </p>
              </div>

              {/* Concrete Cover and Durability */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Copriferro Nominale (c_nom):</span>
                  <span className="font-mono text-cyan-300 font-bold">&ge; {ntcCalculations.minCoverMm} mm</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Acciaio Armatura Ordinaria:</span>
                  <span className="font-mono text-white font-bold">B450C saldabile</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Altezza Utile d:</span>
                  <span className="font-mono text-amber-300 font-bold">{ntcCalculations.d_eff_cm.toFixed(1)} cm</span>
                </div>
              </div>
            </div>

            {/* Box 3: Total SLU Loads & Rebar Estimation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Combinazione SLU &amp; Sollecitazioni
                </span>
                <Activity className="w-4 h-4 text-rose-400" />
              </div>

              {/* Design combination formula */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase">Combinazione Fondamentale SLU (Eq. 2.6.1):</div>
                <div className="text-white text-xs">
                  q_Ed = 1.30&middot;g₁ + 1.50&middot;g₂ + 1.50&middot;q_k
                </div>
                <div className="text-lg font-bold text-rose-400 pt-1">
                  q_Ed = {ntcCalculations.qEd.toFixed(2)} <span className="text-xs text-slate-400">kN/m²</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Carico raro SLE: qk,tot = {ntcCalculations.qk_tot.toFixed(2)} kN/m²
                </div>
              </div>

              {/* Bending Moment M_Ed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Momento Flettente Stimato (M_Ed):</span>
                  <span className="font-mono text-amber-300 font-bold">{ntcCalculations.M_Ed.toFixed(2)} kNm/m</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Armatura Tesa Minima Stimata (As):</span>
                  <span className="font-mono text-emerald-300 font-bold">{ntcCalculations.As_req_cm2.toFixed(2)} cm²/m</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Suggerimento cantiere: rete <strong>&phi;12/15 cm</strong> (7.54 cm²/m) o <strong>&phi;14/15 cm</strong> (10.26 cm²/m).
                </p>
              </div>

              {/* Concrete Volume Summary */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Volume Calcestruzzo Rampa:</span>
                  <span className="font-mono text-cyan-300 font-bold">{ntcCalculations.totalConcreteM3.toFixed(1)} m³</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Peso Strutturale Totale:</span>
                  <span className="font-mono text-white font-bold">{ntcCalculations.totalConcreteWeightTon.toFixed(1)} ton</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Forces Grid (Braking, Parapets, Vehicle Impact) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Forze di Frenatura, Spinta sui Parapetti e Urto Veicolare (NTC 2018)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Force 1: Longitudinal Braking */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-300">Frenatura Orizzontale (Hk)</span>
                  <span className="text-[10px] font-mono text-slate-400">NTC Par. 3.1.4.2</span>
                </div>
                <div className="text-2xl font-mono font-bold text-rose-400 my-1">
                  {ntcCalculations.Hk_braking.toFixed(1)} <span className="text-xs text-slate-400">kN</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Forza longitudinale applicata al piano di rotolamento (0.2 &times; Qk). Induce tensioni tangenziali di taglio alla superficie e richiede finitura zigrinata per prevenire lo slittamento pneumatici.
                </p>
              </div>

              {/* Force 2: Parapet Lateral Load */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">Spinta Parapetti (Hk)</span>
                  <span className="text-[10px] font-mono text-slate-400">NTC Tab. 3.1.II</span>
                </div>
                <div className="text-2xl font-mono font-bold text-cyan-300 my-1">
                  {ntcCalculations.Hk_parapet.toFixed(2)} <span className="text-xs text-slate-400">kN/m</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Carico lineare orizzontale di esercizio da applicare alla sommità del parapetto o corrimano a quota +1.00 m / +1.10 m per garantire sicurezza ai pedoni a bordo rampa.
                </p>
              </div>

              {/* Force 3: Accidental Vehicle Impact */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300">Urto Veicolo Fuori Controllo (Fd)</span>
                  <span className="text-[10px] font-mono text-slate-400">NTC Par. 3.6.3.2</span>
                </div>
                <div className="text-2xl font-mono font-bold text-amber-300 my-1">
                  {ntcCalculations.Fd_impact.toFixed(1)} <span className="text-xs text-slate-400">kN</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Azione accidentale statica equivalente applicata ad altezza cordolo guida (h = 0.375 m per auto, h = 0.50 m per veicoli pesanti). Il cordolo in c.a. di contenimento deve avere altezza &ge; 15-20 cm.
                </p>
              </div>
            </div>
          </div>

          {/* Seismic Warning Box (Effetto Puntone Rampa NTC Par. 7.2.1) */}
          <div className="p-4 bg-amber-950/30 border border-amber-800/70 rounded-xl flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block">
                Prescrizione Antisismica Fondamentale (NTC 2018 Par. 7.2.1 &amp; Circolare n. 7/2019):
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Le solette delle rampe carrabili inclinate connesse rigidamente all&apos;edificio costituiscono <strong>puntoni diagonali ad elevatissima rigidezza assiale</strong>, capaci di trasferire tagli sismici enormi tra piani adiacenti e provocare rotture premature per torsione della struttura principale.
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                &rarr; <strong>Raccomandazione di progetto:</strong> Realizzare un giunto strutturale sismico continuo oppure vincolare un estremo della rampa mediante <strong>appoggi elastomerici scorrevoli unidirezionali in neoprene armato / teflon</strong>, svincolando la dilatazione termica e il moto sismico.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SYNOPTIC TABLE NTC 2018 & REGULATIONS COMPARISON  */}
      {/* ======================================================== */}
      {activeViewTab === 'specs_table' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Quadro Sinottico Comparativo NTC 2018 per Parcheggi e Rampe Carrabili
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Riepilogo dei parametri di carico definiti dalle Norme Tecniche per le Costruzioni (D.M. 17/01/2018)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Parametro Tecnico</th>
                    <th className="py-2.5 px-3">Categoria F (Autovetture)</th>
                    <th className="py-2.5 px-3">Categoria G (Mezzi Medi &amp; Soccorso)</th>
                    <th className="py-2.5 px-3">Riferimento Normativo NTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Tipologia Veicoli Ammessi</td>
                    <td className="py-2.5 px-3 text-cyan-300">P &le; 30 kN (3,0 t) - Auto, SUV</td>
                    <td className="py-2.5 px-3 text-amber-300">30 &lt; P &le; 160 kN (16,0 t) - Camion 2 assi, VV.F.</td>
                    <td className="py-2.5 px-3 text-slate-400">Tabella 3.1.II</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Sovraccarico Variabile (qk)</td>
                    <td className="py-2.5 px-3 text-white font-bold">2,50 kN/m² (250 kg/m²)</td>
                    <td className="py-2.5 px-3 text-white font-bold">5,00 kN/m² (500 kg/m²)</td>
                    <td className="py-2.5 px-3 text-slate-400">Tabella 3.1.II</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Carico Concentrato (Qk)</td>
                    <td className="py-2.5 px-3 text-slate-300">10 kN (impronta 100&times;100 mm)</td>
                    <td className="py-2.5 px-3 text-slate-300">90 kN asse (due ruote da 45 kN 200&times;200 mm)</td>
                    <td className="py-2.5 px-3 text-slate-400">Tabella 3.1.II</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Fattori Combinazione (&psi;0, &psi;1, &psi;2)</td>
                    <td className="py-2.5 px-3 text-slate-300">0,7 · 0,7 · 0,6</td>
                    <td className="py-2.5 px-3 text-slate-300">0,7 · 0,5 · 0,3</td>
                    <td className="py-2.5 px-3 text-slate-400">Tabella 2.5.I</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Forza Orizzontale Frenatura (Hk)</td>
                    <td className="py-2.5 px-3 text-rose-300">2,0 kN (0.2 &times; Qk)</td>
                    <td className="py-2.5 px-3 text-rose-300">18,0 kN (0.2 &times; Qk asse)</td>
                    <td className="py-2.5 px-3 text-slate-400">Par. 3.1.4.2</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Spinta Lineare Parapetti (Hk)</td>
                    <td className="py-2.5 px-3 text-cyan-300">1,00 kN/m a quota +1,00 m</td>
                    <td className="py-2.5 px-3 text-cyan-300">1,50 kN/m a quota +1,10 m</td>
                    <td className="py-2.5 px-3 text-slate-400">Tabella 3.1.II</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Urto Eccezionale Veicolo (Fd)</td>
                    <td className="py-2.5 px-3 text-amber-300">50 kN statica (h = 0,375 m)</td>
                    <td className="py-2.5 px-3 text-amber-300">100 ÷ 150 kN statica (h = 0,50 m)</td>
                    <td className="py-2.5 px-3 text-slate-400">Par. 3.6.3.2</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Pendenza Massima Consigliata</td>
                    <td className="py-2.5 px-3 text-slate-300">20% rettilinea / 15% curva</td>
                    <td className="py-2.5 px-3 text-slate-300">10% ÷ 12% (stabilità carico merci)</td>
                    <td className="py-2.5 px-3 text-slate-400">D.M. 86 &amp; CNR 78/80</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Altezza Libera Franco Netto (h)</td>
                    <td className="py-2.5 px-3 text-slate-300">&ge; 2,00 m (consigliato 2,20-2,40 m)</td>
                    <td className="py-2.5 px-3 text-slate-300">&ge; 3,50 m (accesso autopompe VV.F.)</td>
                    <td className="py-2.5 px-3 text-slate-400">D.M. 15/05/2020 RTV V.6</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">Classe Esposizione Ambientale</td>
                    <td className="py-2.5 px-3 text-emerald-300" colSpan={2}>
                      XD3 (Sali disgelanti) / XF4 (Gelo severo) · Copriferro c_nom &ge; 35 mm
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">UNI EN 206 / NTC Par. 4.1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Construction Prescriptions Detail */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Prescrizioni Esecutive di Cantiere per Rampe Carrabili
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 text-[11px] leading-relaxed">
              <div className="space-y-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-300 block">1. Pavimentazione a Spina di Pesce</span>
                <p className="text-slate-400">
                  La finitura del calcestruzzo deve essere eseguita a fresco con rigature a spina di pesce (pettinatura o elicotteratura zigrinata al quarzo) per assicurare un coefficiente d&apos;attrito pneumatico adeguato alle forze di frenatura Hk anche con superficie bagnata o umida.
                </p>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-300 block">2. Caditoia di Scolo alla Base</span>
                <p className="text-slate-400">
                  Alla base della rampa, immediatamente a monte della porta dell&apos;autorimessa, deve essere posizionata una griglia carrabile continua per l&apos;intera larghezza della corsia collegata a un pozzetto di decantazione con pompa sommergibile di sollevamento acque meteoriche.
                </p>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-300 block">3. Cordoli Salvaruota Laterali</span>
                <p className="text-slate-400">
                  Lungo entrambi i bordi della rampa devono essere realizzati cordoli in c.a. salvaruota alti almeno 15 cm e larghi 15-20 cm, capaci di resistere all&apos;urto statico laterale Fd prescritto dall&apos;NTC 2018 (50 kN per Cat. F, 100 kN per Cat. G).
                </p>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-300 block">4. Svincolo Sismico Strutturale</span>
                <p className="text-slate-400">
                  Per evitare l&apos;indesiderato &quot;effetto puntone diagonale&quot; che irrigidisce asimmetricamente il telaio durante il sisma, svincolare l&apos;appoggio di monte o di valle con giunto sismico (&ge; 5 cm) e cuscinetti in elastomero armato.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
