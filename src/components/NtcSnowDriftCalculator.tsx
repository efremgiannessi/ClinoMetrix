import React, { useState, useMemo } from 'react';
import {
  CloudSnow,
  Info,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Maximize2,
  FileText,
  AlertTriangle,
  Compass,
  Building,
  RotateCcw,
} from 'lucide-react';

export type SnowDriftCase =
  | 'step_down'        // 1. Parete alta adiacente / Dislivello / Ridosso
  | 'duopitch'         // 2. Doppia falda asimmetrica (sottovento/sopravvento)
  | 'multi_shed'       // 3. Falde multiple / Shed / Dente di sega (valli)
  | 'cylindrical'      // 4. Coperture a volta / Cilindriche / Archi
  | 'parapet'          // 5. Parapetti perimetrali su tetti piani
  | 'obstruction'      // 6. Ostacoli locali, abbaini, camini, fotovoltaico
  | 'snow_guards'      // 7. Barriere fermaneve (forza di scorrimento Fs)
  | 'overhang';        // 8. Neve a sbalzo su gronde e cornicioni (carico lineare Se)

interface NtcSnowDriftCalculatorProps {
  initialZone?: 'I_Alpina' | 'I_Mediterranea' | 'II' | 'III';
  initialAltitude?: number;
}

export const NtcSnowDriftCalculator: React.FC<NtcSnowDriftCalculatorProps> = ({
  initialZone = 'I_Alpina',
  initialAltitude = 350,
}) => {
  // Active Case Selector
  const [activeCase, setActiveCase] = useState<SnowDriftCase>('step_down');

  // Shared Geographical & Climatic Parameters (NTC 2018 § 3.4.2)
  const [snowZone, setSnowZone] = useState<'I_Alpina' | 'I_Mediterranea' | 'II' | 'III'>(initialZone);
  const [altitudeM, setAltitudeM] = useState<number>(initialAltitude);
  const [exposureType, setExposureType] = useState<'normale' | 'ventosa' | 'riparata'>('normale');
  const [thermalCoeffCt, setThermalCoeffCt] = useState<number>(1.0); // ct = 1.0 standard
  const [snowDensityGamma, setSnowDensityGamma] = useState<number>(2.0); // kN/m³ (2.0 default, 3.0 wet/compact)

  // Copy status
  const [copied, setCopied] = useState<boolean>(false);

  // =========================================================================
  // CASE 1: RIDOSSO DI PARETE PIÙ ALTA / DISLIVELLO (Circolare C3.4.3 / EN 1991-1-3 § 5.4.1)
  // =========================================================================
  const [stepH, setStepH] = useState<number>(3.5); // Salto di quota h (m)
  const [lowerRoofB1, setLowerRoofB1] = useState<number>(12.0); // Larghezza copertura inferiore b1 (m)
  const [upperRoofB2, setUpperRoofB2] = useState<number>(18.0); // Larghezza copertura superiore b2 (m)
  const [upperPitchAngle, setUpperPitchAngle] = useState<number>(15); // Inclinazione tetto superiore α2 (deg)

  // =========================================================================
  // CASE 2: DOPPIA FALDA ASIMMETRICA (NTC § 3.4.3.3)
  // =========================================================================
  const [pitch1Alpha, setPitch1Alpha] = useState<number>(25); // Falda 1 (deg)
  const [pitch2Alpha, setPitch2Alpha] = useState<number>(25); // Falda 2 (deg)
  const [duoSpan1, setDuoSpan1] = useState<number>(8.0); // Falda 1 luce (m)
  const [duoSpan2, setDuoSpan2] = useState<number>(8.0); // Falda 2 luce (m)
  const [windDirection, setWindDirection] = useState<'simmetrico' | 'vento_da_sx' | 'vento_da_dx'>('vento_da_sx');

  // =========================================================================
  // CASE 3: FALDE MULTIPLE / SHED / DENTE DI SEGA (Circolare C3.4.3 / EN 1991-1-3 § 5.3.4)
  // =========================================================================
  const [shedPitch1, setShedPitch1] = useState<number>(60); // Falda ripida/vetrata α1 (deg)
  const [shedPitch2, setShedPitch2] = useState<number>(20); // Falda lunga α2 (deg)
  const [shedSpanB1, setShedSpanB1] = useState<number>(3.0); // Luce falda 1 (m)
  const [shedSpanB2, setShedSpanB2] = useState<number>(7.0); // Luce falda 2 (m)

  // =========================================================================
  // CASE 4: COPERTURE A VOLTA / CILINDRICHE / ARCHI (Circolare C3.4.3 / EN 1991-1-3 § 5.3.5)
  // =========================================================================
  const [vaultSpanL, setVaultSpanL] = useState<number>(20.0); // Luce arco L (m)
  const [vaultRiseF, setVaultRiseF] = useState<number>(4.0); // Freccia arco f (m)
  const [vaultCondition, setVaultCondition] = useState<'undrifted' | 'drifted'>('drifted');

  // =========================================================================
  // CASE 5: PARAPETTI PERIMETRALI SU TETTO PIANO (Circolare C3.4.3 / EN 1991-1-3 § 5.4.2)
  // =========================================================================
  const [parapetHeightHp, setParapetHeightHp] = useState<number>(1.2); // Altezza parapetto hp (m)
  const [roofSpanB, setRoofSpanB] = useState<number>(16.0); // Larghezza copertura (m)

  // =========================================================================
  // CASE 6: OSTACOLI LOCALI, ABBAINI & IMPIANTI SOLARI (Circolare C3.4.3 / EN 1991-1-3 § 6.2)
  // =========================================================================
  const [obstacleHeight, setObstacleHeight] = useState<number>(1.5); // Altezza ostacolo h (m)
  const [obstacleWidth, setObstacleWidth] = useState<number>(2.0); // Larghezza b (m)
  const [obstacleType, setObstacleType] = useState<'abbaino' | 'volume_tecnico' | 'pannello_solare' | 'camino'>('volume_tecnico');

  // =========================================================================
  // CASE 7: FERMANEVE E LINEE PARANEVE (NTC § 3.4.3.1 & Circolare C3.4.3)
  // =========================================================================
  const [guardPitchAlpha, setGuardPitchAlpha] = useState<number>(35); // Pendenza falda α (deg)
  const [guardUpstreamLen, setGuardUpstreamLen] = useState<number>(6.5); // Lunghezza falda a monte (m)
  const [bracketSpacingM, setBracketSpacingM] = useState<number>(0.8); // Passo staffe di fissaggio (m)

  // =========================================================================
  // CASE 8: NEVE A SBALZO OLTRE LA GRONDA (EN 1991-1-3 § 6.3 & Circolare C3.4)
  // =========================================================================
  const [overhangPitchAlpha, setOverhangPitchAlpha] = useState<number>(25); // Pendenza falda (deg)
  const [overhangKFactor, setOverhangKFactor] = useState<number>(0.17); // Coefficiente k di forma (0.0 a 0.2, tipico 0.17)

  // =========================================================================
  // BASE CALCULATIONS: CARICO AL SUOLO qsk (NTC 2018 Tab. 3.4.I)
  // =========================================================================
  const baseSnowCalculations = useMemo(() => {
    let qsk = 1.5;
    const as = altitudeM;

    if (snowZone === 'I_Alpina') {
      qsk = as <= 200 ? 1.50 : 1.39 * (1 + Math.pow(as / 728, 2));
    } else if (snowZone === 'I_Mediterranea') {
      qsk = as <= 200 ? 1.50 : 1.50 * (1 + Math.pow(as / 481, 2));
    } else if (snowZone === 'II') {
      qsk = as <= 200 ? 1.00 : 0.85 * (1 + Math.pow(as / 481, 2));
    } else {
      // Zona III
      qsk = as <= 200 ? 0.60 : 0.51 * (1 + Math.pow(as / 481, 2));
    }

    const ceDict: Record<string, number> = { ventosa: 0.9, normale: 1.0, riparata: 1.1 };
    const ce = ceDict[exposureType] || 1.0;
    const ct = thermalCoeffCt;

    return {
      qsk,
      ce,
      ct,
    };
  }, [snowZone, altitudeM, exposureType, thermalCoeffCt]);

  // Helper for basic single pitch mu1
  const getMu1 = (alpha: number) => {
    if (alpha <= 30) return 0.8;
    if (alpha < 60) return 0.8 * ((60 - alpha) / 30);
    return 0.0;
  };

  // =========================================================================
  // COMPUTE DETAILED CASE CALCULATIONS
  // =========================================================================
  const caseResults = useMemo(() => {
    const { qsk, ce, ct } = baseSnowCalculations;

    switch (activeCase) {
      // -----------------------------------------------------------------------
      // 1. RIDOSSO DI PARETE PIÙ ALTA / DISLIVELLO
      // -----------------------------------------------------------------------
      case 'step_down': {
        const h = stepH;
        const b1 = lowerRoofB1;
        const b2 = upperRoofB2;
        const alpha2 = upperPitchAngle;
        const gamma = snowDensityGamma;

        // Lunghezza zona di accumulo ls = 2*h, limitata tra 5m e 15m e non eccedente b1
        let ls = Math.min(Math.max(2 * h, 5.0), 15.0);
        if (ls > b1) ls = b1;

        // Quota neve scivolata dalla falda superiore (mus):
        // se alpha2 <= 15° -> mus = 0; se alpha2 > 15° -> quota calcolata
        let mus = 0;
        if (alpha2 > 15) {
          const mu1_upper = getMu1(alpha2);
          mus = (0.5 * mu1_upper * b2) / ls;
        }

        // Quota neve da deriva da vento (muw):
        // muw = (b1 + b2) / (2 * h) con tetto massimo gamma * h / qsk
        const muw_raw = (b1 + b2) / (2 * h);
        const muw_max_physical = (gamma * h) / qsk;
        const muw = Math.min(Math.max(muw_raw, 0.8), muw_max_physical, 4.0);

        // Coefficiente di forma totale mu2:
        const mu2 = Math.min(Math.max(mus + muw, 0.8), 4.0);

        // Carico massimo al ridosso della parete (x = 0):
        const q_max = mu2 * qsk * ce * ct; // kN/m²
        // Carico base indisturbato (x >= ls):
        const mu1_lower = 0.8;
        const q_min = mu1_lower * qsk * ce * ct; // kN/m²

        // Carico totale risultante per metro lineare di copertura:
        // Area trapezio accumulo [0, ls] + rettangolo [ls, b1]
        const Q_drift_kN_m = ((q_max + q_min) / 2) * ls;
        const Q_flat_kN_m = q_min * Math.max(0, b1 - ls);
        const Q_tot_kN_m = Q_drift_kN_m + Q_flat_kN_m;

        // Altezza stimata del manto nevoso al colmo della parete: d_max = q_max / gamma
        const d_max_m = q_max / gamma;

        return {
          caseName: 'Ridosso di Parete più Alta (Salto di Quota)',
          normRef: 'NTC 2018 Circolare n. 7/2019 § C3.4.3 · UNI EN 1991-1-3 § 5.4.1',
          ls,
          mus,
          muw,
          mu2,
          mu1: mu1_lower,
          q_max,
          q_min,
          Q_tot_kN_m,
          d_max_m,
          notes: 'Il carico decresce linearmente da q_max in adiacenza alla parete verticale fino a q_min alla distanza di transizione ls.',
        };
      }

      // -----------------------------------------------------------------------
      // 2. DOPPIA FALDA ASIMMETRICA
      // -----------------------------------------------------------------------
      case 'duopitch': {
        const mu1_p1 = getMu1(pitch1Alpha);
        const mu1_p2 = getMu1(pitch2Alpha);

        let mu_actual_1 = mu1_p1;
        let mu_actual_2 = mu1_p2;

        if (windDirection === 'vento_da_sx') {
          // Sopravvento falda 1 (0.5 mu1), Sottovento falda 2 (mu1 pieno)
          mu_actual_1 = 0.5 * mu1_p1;
          mu_actual_2 = mu1_p2;
        } else if (windDirection === 'vento_da_dx') {
          // Sopravvento falda 2 (0.5 mu1), Sottovento falda 1 (mu1 pieno)
          mu_actual_1 = mu1_p1;
          mu_actual_2 = 0.5 * mu1_p2;
        }

        const q1 = mu_actual_1 * qsk * ce * ct;
        const q2 = mu_actual_2 * qsk * ce * ct;

        return {
          caseName: 'Copertura a Due Falde (Carico Asimmetrico da Vento)',
          normRef: 'NTC 2018 § 3.4.3.3 & Fig. 3.4.2 · Caso II / III',
          mu_actual_1,
          mu_actual_2,
          q1,
          q2,
          q_max: Math.max(q1, q2),
          q_min: Math.min(q1, q2),
          notes: 'NTC prescrive la combinazione con 0.5·μ1 sulla falda sopravvento e μ1 sulla falda sottovento per verificare gli effetti torsionali e flessionali asimmetrici sulle capriate e sui portali.',
        };
      }

      // -----------------------------------------------------------------------
      // 3. FALDE MULTIPLE / SHED / DENTE DI SEGA
      // -----------------------------------------------------------------------
      case 'multi_shed': {
        const alphaAvg = (shedPitch1 + shedPitch2) / 2;
        // In una valle di tetto multiplo, la neve si accumula nel canale di gronda:
        // μ2 per la gola della valle (NTC Circolare C3.4.3 / EN 1991-1-3 § 5.3.4):
        // μ2 = min(2.0, variazione in funzione di αmedio)
        let mu2_valley = 0.8;
        if (alphaAvg <= 30) {
          mu2_valley = 0.8 + 0.8 * (alphaAvg / 30); // fino a 1.6
        } else if (alphaAvg <= 60) {
          mu2_valley = 1.6 * (60 - alphaAvg) / 30;
        } else {
          mu2_valley = 0.0;
        }
        // Il picco in gola secondo EN 1991-1-3 può raggiungere 1.6 ÷ 2.0
        mu2_valley = Math.max(mu2_valley, 1.2);

        const q_valley = mu2_valley * qsk * ce * ct;
        const q_ridge = 0.0; // Al colmo il carico decresce a zero o μ1 minimo

        return {
          caseName: 'Coperture a Più Falde / Shed / Dente di Sega',
          normRef: 'NTC 2018 Circolare § C3.4.3 · EN 1991-1-3 § 5.3.4',
          alphaAvg,
          mu2_valley,
          q_valley,
          q_ridge,
          q_max: q_valley,
          q_min: q_ridge,
          notes: 'Il carico varia linearmente dai colmi (dove tende a zero a causa dello scivolamento e del soffio del vento) fino al valore massimo concentrato nella gola tra le campate contigue.',
        };
      }

      // -----------------------------------------------------------------------
      // 4. COPERTURE A VOLTA / CILINDRICHE / ARCHI
      // -----------------------------------------------------------------------
      case 'cylindrical': {
        const L = vaultSpanL;
        const f = vaultRiseF;
        // Angolo all'imposta beta: tan(beta) = 4*f / L
        const betaRad = Math.atan((4 * f) / L);
        const betaDeg = (betaRad * 180) / Math.PI;

        // Se beta > 60°, la neve scivola oltre i 60°
        let mu3 = 0.8;
        if (vaultCondition === 'undrifted') {
          // Caso non accumulato
          if (betaDeg <= 30) mu3 = 0.8;
          else if (betaDeg <= 60) mu3 = 0.8 * ((60 - betaDeg) / 30);
          else mu3 = 0.0;
        } else {
          // Caso accumulato (deriva sottovento):
          // Picco concentrato a circa 1/4 della luce sottovento
          mu3 = Math.min(0.2 + 10 * (f / L), 2.0);
        }

        const q_arch_max = mu3 * qsk * ce * ct;

        return {
          caseName: 'Coperture Cilindriche e a Volta (Centine, Archi, Tunnel)',
          normRef: 'NTC 2018 Circolare § C3.4.3 & Fig. C3.4.4 · EN 1991-1-3 § 5.3.5',
          betaDeg,
          fOverL: f / L,
          mu3,
          q_arch_max,
          q_max: q_arch_max,
          q_min: vaultCondition === 'drifted' ? 0 : q_arch_max * 0.5,
          notes: 'Nelle coperture a botte o ad arco con f/L elevato, il caso con carico asimmetrico sottovento genera notevoli flessioni parassite che innescano l\'instabilità dell\'arco.',
        };
      }

      // -----------------------------------------------------------------------
      // 5. PARAPETTI PERIMETRALI SU TETTI PIANI
      // -----------------------------------------------------------------------
      case 'parapet': {
        const hp = parapetHeightHp;
        const b = roofSpanB;
        const gamma = snowDensityGamma;

        // Lunghezza accumulo: ls = min(2 * hp, 5m <= ls <= 15m, b)
        let ls = Math.min(Math.max(2 * hp, 5.0), 15.0);
        if (ls > b / 2) ls = b / 2; // se la copertura è stretta, non oltre la mezzeria

        // mu2 = min(gamma * hp / qsk, 2.0)
        const mu2 = Math.min(Math.max((gamma * hp) / qsk, 0.8), 2.0);
        const mu1 = 0.8; // tetto piano

        const q_parapet_max = mu2 * qsk * ce * ct;
        const q_center = mu1 * qsk * ce * ct;

        // Spinta orizzontale sul parapetto dovuta al cumulo di neve appoggiato (modello Rankine neve):
        // K0 ~ 0.5; P_horiz = 0.5 * K0 * gamma * hp_snow^2
        const hp_snow = Math.min(hp, q_parapet_max / gamma);
        const k0 = 0.5;
        const F_horiz_parapet_kN_m = 0.5 * k0 * gamma * Math.pow(hp_snow, 2);

        return {
          caseName: 'Copertura con Parapetto Perimetrale di Bordo',
          normRef: 'NTC 2018 Circolare § C3.4.3 · EN 1991-1-3 § 5.4.2',
          hp,
          ls,
          mu2,
          mu1,
          q_parapet_max,
          q_center,
          q_max: q_parapet_max,
          q_min: q_center,
          hp_snow,
          F_horiz_parapet_kN_m,
          notes: 'Il parapetto funge da barriera frangivento, accumulando un prisma triangolare di neve sul bordo del solaio e inducendo una spinta orizzontale diretta sulla parete del parapetto.',
        };
      }

      // -----------------------------------------------------------------------
      // 6. OSTACOLI LOCALI, ABBAINI & IMPIANTI SOLARI
      // -----------------------------------------------------------------------
      case 'obstruction': {
        const h = obstacleHeight;
        const b = obstacleWidth;
        const gamma = snowDensityGamma;

        const ls = Math.min(2 * h, 5.0);
        const mu2 = Math.min(Math.max((gamma * h) / qsk, 0.8), 2.0);
        const mu1 = 0.8;

        const q_obs_max = mu2 * qsk * ce * ct;
        const q_undisturbed = mu1 * qsk * ce * ct;

        return {
          caseName: `Ostacoli Locali & Volumi Tecnici (${obstacleType.replace('_', ' ').toUpperCase()})`,
          normRef: 'NTC 2018 Circolare § C3.4.3 · EN 1991-1-3 § 6.2',
          h,
          b,
          ls,
          mu2,
          mu1,
          q_obs_max,
          q_undisturbed,
          q_max: q_obs_max,
          q_min: q_undisturbed,
          notes: 'In corrispondenza di corpi emergenti come abbaini, vani ascensore o stringhe di pannelli fotovoltaici, si forma un cumulo a monte e a valle dell\'ostacolo esteso per 2·h.',
        };
      }

      // -----------------------------------------------------------------------
      // 7. FERMANEVE E LINEE PARANEVE
      // -----------------------------------------------------------------------
      case 'snow_guards': {
        const alpha = guardPitchAlpha;
        const L = guardUpstreamLen;
        const s_bracket = bracketSpacingM;

        // Regola NTC 2018 § 3.4.3.1:
        // "Nel caso in cui siano presenti dispositivi paraneve, il coefficiente di forma non deve essere assunto inferiore a 0.80, indipendentemente dalla pendenza della falda."
        const mu1_guard = 0.80;
        const s_load = mu1_guard * qsk * ce * ct; // kN/m² sul piano orizzontale

        // Forza di scorrimento parallela alla falda per metro lineare di barriera paraneve:
        // Fs = s * L_falda * sin(alpha) in kN/m
        const alphaRad = (alpha * Math.PI) / 180;
        const Fs_kN_m = s_load * L * Math.sin(alphaRad);

        // Forza concentrata su ogni singola staffa di ritegno fermaneve:
        const F_bracket_kN = Fs_kN_m * s_bracket;
        const F_bracket_kg = F_bracket_kN * 101.97;

        return {
          caseName: 'Dispositivi Paraneve (Fermaneve a Griglia / Tubolari)',
          normRef: 'NTC 2018 § 3.4.3.1 & Circolare § C3.4.3',
          mu1_guard,
          s_load,
          Fs_kN_m,
          F_bracket_kN,
          F_bracket_kg,
          alpha,
          L,
          s_bracket,
          q_max: s_load,
          q_min: s_load,
          notes: 'I fermaneve impediscono lo scivolamento gravitazionale spontaneo del manto nevoso. Pertanto, la normativa vieta di ridurre il carico a zero anche oltre i 60° e impone il calcolo della trazione di scorrimento Fs sulle staffe.',
        };
      }

      // -----------------------------------------------------------------------
      // 8. NEVE A SBALZO OLTRE LA GRONDA
      // -----------------------------------------------------------------------
      case 'overhang': {
        const alpha = overhangPitchAlpha;
        const k = overhangKFactor;
        const gamma = snowDensityGamma;

        const mu1 = getMu1(alpha);
        const s_load = mu1 * qsk * ce * ct; // kN/m²

        // Spessore del manto d = s / gamma
        const d_m = s_load / gamma;

        // Carico lineare concentrato al bordo estremo della gronda:
        // Se = k * (s^2 / gamma) in kN/m
        const Se_kN_m = k * (Math.pow(s_load, 2) / gamma);
        const Se_kg_m = Se_kN_m * 101.97;

        return {
          caseName: 'Neve a Sbalzo oltre la Linea di Gronda (Cornicioni)',
          normRef: 'NTC 2018 Circolare § C3.4.3 · UNI EN 1991-1-3 § 6.3',
          mu1,
          s_load,
          d_m,
          k,
          Se_kN_m,
          Se_kg_m,
          q_max: s_load,
          q_min: s_load,
          notes: 'Al bordo di gronda la neve si protende verso l\'esterno formando un becco a sbalzo. Tale aggetto applica una forza lineare concentrata Se che sollecita severamente il canale di gronda e il cornicione.',
        };
      }
    }
  }, [
    activeCase,
    baseSnowCalculations,
    stepH,
    lowerRoofB1,
    upperRoofB2,
    upperPitchAngle,
    snowDensityGamma,
    pitch1Alpha,
    pitch2Alpha,
    duoSpan1,
    duoSpan2,
    windDirection,
    shedPitch1,
    shedPitch2,
    shedSpanB1,
    shedSpanB2,
    vaultSpanL,
    vaultRiseF,
    vaultCondition,
    parapetHeightHp,
    roofSpanB,
    obstacleHeight,
    obstacleWidth,
    obstacleType,
    guardPitchAlpha,
    guardUpstreamLen,
    bracketSpacingM,
    overhangPitchAlpha,
    overhangKFactor,
  ]);

  // Export report text handler
  const handleCopyReport = () => {
    const lines = [
      `RELATIONE TECNICA - CALCOLO ACCUMULO NEVE IN COPERTURA`,
      `Normativa di Riferimento: ${caseResults.normRef}`,
      `Tipologia di Caso: ${caseResults.caseName}`,
      `-------------------------------------------------------`,
      `PARAMETRI CLIMATICI & DI SITO (NTC 2018 § 3.4.2):`,
      `- Zona Neve: ${snowZone}`,
      `- Altitudine Sito: ${altitudeM} m s.l.m.`,
      `- Carico Caratteristico al Suolo qsk: ${baseSnowCalculations.qsk.toFixed(2)} kN/m² (${(baseSnowCalculations.qsk * 101.97).toFixed(1)} kg/m²)`,
      `- Coefficiente di Esposizione ce: ${baseSnowCalculations.ce.toFixed(2)} (${exposureType})`,
      `- Coefficiente Termico ct: ${baseSnowCalculations.ct.toFixed(2)}`,
      `- Peso Volumico Neve gamma: ${snowDensityGamma.toFixed(1)} kN/m³`,
      `-------------------------------------------------------`,
      `RISULTATI SPECIFICI DI ACCUMULO:`,
    ];

    if (activeCase === 'step_down') {
      const res = caseResults as any;
      lines.push(
        `- Dislivello Parete h: ${stepH} m | Larghezza tetti b1: ${lowerRoofB1} m, b2: ${upperRoofB2} m`,
        `- Lunghezza di Accumulo ls: ${res.ls.toFixed(2)} m (NTC ls = 2·h compreso tra 5m e 15m)`,
        `- Coeff. da Scivolamento μs: ${res.mus.toFixed(3)} | Coeff. da Vento μw: ${res.muw.toFixed(3)}`,
        `- Coeff. di Forma Totale μ2: ${res.mu2.toFixed(3)} (al ridosso)`,
        `- Carico Neve di Picco q_max: ${res.q_max.toFixed(2)} kN/m² (${(res.q_max * 101.97).toFixed(1)} kg/m²)`,
        `- Carico Neve a Distanza ls (q_min): ${res.q_min.toFixed(2)} kN/m²`,
        `- Spessore Massimo Manto d_max: ${res.d_max_m.toFixed(2)} m`,
        `- Risultante Totale sul Solaio Q_tot: ${res.Q_tot_kN_m.toFixed(2)} kN per metro lineare di facciata`
      );
    } else if (activeCase === 'duopitch') {
      const res = caseResults as any;
      lines.push(
        `- Inclinazioni Falde: Falda 1 = ${pitch1Alpha}° | Falda 2 = ${pitch2Alpha}°`,
        `- Condizione di Vento: ${windDirection}`,
        `- Coeff. Falda 1 μ: ${res.mu_actual_1.toFixed(3)} -> Carico q1: ${res.q1.toFixed(2)} kN/m²`,
        `- Coeff. Falda 2 μ: ${res.mu_actual_2.toFixed(3)} -> Carico q2: ${res.q2.toFixed(2)} kN/m²`
      );
    } else if (activeCase === 'multi_shed') {
      const res = caseResults as any;
      lines.push(
        `- Inclinazioni Falde: Falda 1 = ${shedPitch1}° | Falda 2 = ${shedPitch2}° (αmedio = ${res.alphaAvg.toFixed(1)}°)`,
        `- Coeff. di Forma in Valle μ2: ${res.mu2_valley.toFixed(3)}`,
        `- Carico Massimo nella Gola tra Campate: ${res.q_valley.toFixed(2)} kN/m² (${(res.q_valley * 101.97).toFixed(1)} kg/m²)`,
        `- Carico al Colmo dello Shed: ${res.q_ridge.toFixed(2)} kN/m²`
      );
    } else if (activeCase === 'cylindrical') {
      const res = caseResults as any;
      lines.push(
        `- Luce Arco L: ${vaultSpanL} m | Freccia in Chiave f: ${vaultRiseF} m (f/L = ${res.fOverL.toFixed(3)})`,
        `- Angolo all'Imposta beta: ${res.betaDeg.toFixed(1)}°`,
        `- Regime: ${vaultCondition === 'drifted' ? 'Accumulato sottovento asimmetrico' : 'Indisturbato uniforme'}`,
        `- Coeff. di Forma μ3: ${res.mu3.toFixed(3)}`,
        `- Carico di Progetto in Copertura: ${res.q_arch_max.toFixed(2)} kN/m²`
      );
    } else if (activeCase === 'parapet') {
      const res = caseResults as any;
      lines.push(
        `- Altezza Parapetto hp: ${parapetHeightHp} m | Luce Copertura b: ${roofSpanB} m`,
        `- Lunghezza di Accumulo al Bordo ls: ${res.ls.toFixed(2)} m`,
        `- Coeff. di Forma al Parapetto μ2: ${res.mu2.toFixed(3)}`,
        `- Carico Verticale di Picco al Bordo: ${res.q_parapet_max.toFixed(2)} kN/m² (${(res.q_parapet_max * 101.97).toFixed(1)} kg/m²)`,
        `- Carico Indisturbato al Centro: ${res.q_center.toFixed(2)} kN/m²`,
        `- Spinta Orizzontale sul Parapetto F_orizz: ${res.F_horiz_parapet_kN_m.toFixed(2)} kN/m`
      );
    } else if (activeCase === 'obstruction') {
      const res = caseResults as any;
      lines.push(
        `- Ostacolo: ${obstacleType} (Altezza h = ${obstacleHeight} m, Larghezza b = ${obstacleWidth} m)`,
        `- Lunghezza Accumulo a Monte/Valle ls: ${res.ls.toFixed(2)} m`,
        `- Coeff. di Forma all'Ostacolo μ2: ${res.mu2.toFixed(3)}`,
        `- Sovraccarico Concentrato di Picco: ${res.q_obs_max.toFixed(2)} kN/m²`
      );
    } else if (activeCase === 'snow_guards') {
      const res = caseResults as any;
      lines.push(
        `- Inclinazione Falda: ${guardPitchAlpha}° | Lunghezza Falda a Monte: ${guardUpstreamLen} m`,
        `- Coeff. di Forma Obbligatorio (NTC § 3.4.3.1): μ1 = ${res.mu1_guard.toFixed(2)} (divieto di riduzione a zero)`,
        `- Carico Neve Distribuito sulla Falda: ${res.s_load.toFixed(2)} kN/m²`,
        `- Forza di Scorrimento Parallela alla Falda Fs: ${res.Fs_kN_m.toFixed(2)} kN per metro lineare di barriera`,
        `- Sollecitazione su Singola Staffa (passo ${bracketSpacingM} m): ${res.F_bracket_kN.toFixed(2)} kN (${res.F_bracket_kg.toFixed(0)} kg)`
      );
    } else if (activeCase === 'overhang') {
      const res = caseResults as any;
      lines.push(
        `- Inclinazione Falda: ${overhangPitchAlpha}° | Spessore Manto d: ${res.d_m.toFixed(2)} m`,
        `- Carico Distribuito sulla Falda s: ${res.s_load.toFixed(2)} kN/m²`,
        `- Fattore k di Forma Sbalzo: ${overhangKFactor}`,
        `- CARICO LINEARE CONCENTRATO AL BORDO DI GRONDA Se: ${res.Se_kN_m.toFixed(2)} kN/m (${res.Se_kg_m.toFixed(1)} kg/m)`
      );
    }

    lines.push(`-------------------------------------------------------`);
    lines.push(`Nota: Valori caratteristici da moltiplicare per il coeff. parziale γQ = 1.50 per combinazioni SLU.`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Case definitions
  const caseList: Array<{ id: SnowDriftCase; label: string; tag: string; desc: string }> = [
    {
      id: 'step_down',
      label: '1. Ridosso Parete Alta',
      tag: 'NTC C3.4.3 · EC1 §5.4.1',
      desc: 'Salto di quota tra edifici adiacenti, riseghe e avancorpi (trasporto eolico + scivolamento)',
    },
    {
      id: 'duopitch',
      label: '2. Due Falde Asimmetriche',
      tag: 'NTC §3.4.3.3',
      desc: 'Carico asimmetrico sottovento / sopravvento con 0.5·μ1 e μ1 pieno',
    },
    {
      id: 'multi_shed',
      label: '3. Shed / Falde Multiple',
      tag: 'NTC C3.4.3 · EC1 §5.3.4',
      desc: 'Accumuli e concentrazioni nelle valli e nei canali di gronda tra campate contigue',
    },
    {
      id: 'cylindrical',
      label: '4. Coperture a Volta / Archi',
      tag: 'NTC C3.4.3 · EC1 §5.3.5',
      desc: 'Tetti cilindrici, volte a botte, tunnel centinati con deriva sottovento',
    },
    {
      id: 'parapet',
      label: '5. Parapetti Perimetrali',
      tag: 'NTC C3.4.3 · EC1 §5.4.2',
      desc: 'Accumulo triangolare ai bordi di coperture piane e spinta orizzontale sul parapetto',
    },
    {
      id: 'obstruction',
      label: '6. Ostacoli & Impianti Solari',
      tag: 'NTC C3.4.3 · EC1 §6.2',
      desc: 'Abbaini, volumi tecnici, camini, torrette e stringhe di pannelli fotovoltaici',
    },
    {
      id: 'snow_guards',
      label: '7. Barriere Paraneve',
      tag: 'NTC §3.4.3.1',
      desc: 'Fermaneve a griglia su falda ripida e spinta tangenziale di scorrimento Fs sulle staffe',
    },
    {
      id: 'overhang',
      label: '8. Neve a Sbalzo su Gronda',
      tag: 'NTC C3.4.3 · EC1 §6.3',
      desc: 'Carico lineare di bordo Se sul cornicione generato dal mantello nevoso a sbalzo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                Modulo Specialistico NTC 2018 &amp; Circolare n. 7/2019
              </span>
              <span className="text-xs text-slate-400 font-mono">
                UNI EN 1991-1-3 (Eurocodice 1)
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <CloudSnow className="w-6 h-6 text-cyan-400" />
              Calcolo dell&apos;Accumulo Neve nelle Coperture (Tutti i Casi Possibili)
            </h3>
            <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
              Trattazione accademica e calcolatore strutturale integrato per tutti gli 8 scenari di accumulo, deriva e redistribuzione eolica della neve: riseghe a ridosso di corpi alti, tetti a dente di sega (shed), archi cilindrici, parapetti frangivento, ostacoli tecnologici, barriere fermaneve e neve a sbalzo sui cornicioni.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-950 transition-colors cursor-pointer shrink-0 self-start lg:self-center"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white" />}
            <span>{copied ? 'Relazione Copiata!' : 'Copia Relazione di Calcolo'}</span>
          </button>
        </div>

        {/* Global Weather / Site Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Zona Climatica Neve:</span>
            <select
              value={snowZone}
              onChange={(e) => setSnowZone(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
            >
              <option value="I_Alpina">Zona I Alpina (qsk base 1.50)</option>
              <option value="I_Mediterranea">Zona I Mediterranea (qsk base 1.50)</option>
              <option value="II">Zona II: Pianura Padana &amp; Centro-Sud (1.00)</option>
              <option value="III">Zona III: Sud &amp; Isole (0.60)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[10px] uppercase font-mono text-slate-400 mb-1">
              <span>Altitudine as:</span>
              <span className="text-cyan-300 font-bold">{altitudeM} m s.l.m.</span>
            </div>
            <input
              type="range"
              min="0"
              max="1800"
              step="25"
              value={altitudeM}
              onChange={(e) => setAltitudeM(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg mt-1"
            />
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Topografia / Esposizione:</span>
            <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
              {(['ventosa', 'normale', 'riparata'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setExposureType(t)}
                  className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                    exposureType === t
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Carico al Suolo qsk:</span>
            <div className="font-mono text-base font-bold text-cyan-300">
              {baseSnowCalculations.qsk.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kN/m²</span>
              <span className="text-xs text-slate-400 block font-normal">
                ({(baseSnowCalculations.qsk * 101.97).toFixed(1)} kg/m² · ce={baseSnowCalculations.ce.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8-CASE INTERACTIVE SELECTOR CARDS */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            Seleziona Tipologia Geometrica di Accumulo ({caseList.length} Casi Disponibili):
          </span>
          <span className="text-[11px] text-cyan-400 font-mono">
            {caseList.findIndex((c) => c.id === activeCase) + 1} di {caseList.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {caseList.map((item) => {
            const isSelected = activeCase === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCase(item.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {item.tag.split('·')[0].trim()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CASE WORKBENCH: CONTROLS (LEFT) + INTERACTIVE SVG & METRICS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PARAMETER CONTROLS */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Parametri Geometrici &amp; Strutturali
              </h4>
              <span className="text-[11px] text-slate-400">{caseResults.caseName}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {caseResults.normRef.split('·')[0].trim()}
            </span>
          </div>

          {/* DYNAMIC INPUTS ACCORDING TO SELECTED CASE */}
          {activeCase === 'step_down' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Salto di quota / Dislivello (h):</span>
                  <span className="font-mono text-cyan-300 font-bold">{stepH.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={stepH}
                  onChange={(e) => setStepH(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Lunghezza accumulo NTC: <strong>ls = 2·h = {(2 * stepH).toFixed(1)} m</strong> (vincolo tra 5m e 15m)
                </span>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Luce Copertura Inferiore (b1):</span>
                  <span className="font-mono text-cyan-300 font-bold">{lowerRoofB1.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="40.0"
                  step="1.0"
                  value={lowerRoofB1}
                  onChange={(e) => setLowerRoofB1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Luce Copertura Superiore (b2):</span>
                  <span className="font-mono text-cyan-300 font-bold">{upperRoofB2.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="50.0"
                  step="1.0"
                  value={upperRoofB2}
                  onChange={(e) => setUpperRoofB2(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Pendenza Tetto Superiore (α2):</span>
                  <span className="font-mono text-cyan-300 font-bold">{upperPitchAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={upperPitchAngle}
                  onChange={(e) => setUpperPitchAngle(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {upperPitchAngle <= 15 ? 'α2 ≤ 15°: Scivolamento nullo (μs = 0)' : `α2 > 15°: Quota di scivolamento attiva (μs = ${(caseResults as any).mus.toFixed(2)})`}
                </span>
              </div>
            </div>
          )}

          {activeCase === 'duopitch' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Condizione Eolica di Accumulo (NTC Fig. 3.4.2):
                </label>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  {[
                    { id: 'simmetrico', label: 'Simmetrico' },
                    { id: 'vento_da_sx', label: 'Vento sx' },
                    { id: 'vento_da_dx', label: 'Vento dx' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWindDirection(w.id as any)}
                      className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                        windDirection === w.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Inclinazione Falda 1 (α1):</span>
                  <span className="font-mono text-cyan-300 font-bold">{pitch1Alpha}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="65"
                  step="1"
                  value={pitch1Alpha}
                  onChange={(e) => setPitch1Alpha(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Inclinazione Falda 2 (α2):</span>
                  <span className="font-mono text-cyan-300 font-bold">{pitch2Alpha}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="65"
                  step="1"
                  value={pitch2Alpha}
                  onChange={(e) => setPitch2Alpha(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Luce Falda 1 (m):</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={duoSpan1}
                    onChange={(e) => setDuoSpan1(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Luce Falda 2 (m):</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={duoSpan2}
                    onChange={(e) => setDuoSpan2(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCase === 'multi_shed' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Pendenza Falda Ripida / Vetrata (α1):</span>
                  <span className="font-mono text-cyan-300 font-bold">{shedPitch1}°</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="1"
                  value={shedPitch1}
                  onChange={(e) => setShedPitch1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Pendenza Falda Lunga (α2):</span>
                  <span className="font-mono text-cyan-300 font-bold">{shedPitch2}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={shedPitch2}
                  onChange={(e) => setShedPitch2(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Luce Falda 1 b1 (m):</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={shedSpanB1}
                    onChange={(e) => setShedSpanB1(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Luce Falda 2 b2 (m):</span>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    step="0.5"
                    value={shedSpanB2}
                    onChange={(e) => setShedSpanB2(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCase === 'cylindrical' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Regime di Distribuzione Eolica:
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setVaultCondition('undrifted')}
                    className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                      vaultCondition === 'undrifted'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Indisturbato
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultCondition('drifted')}
                    className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                      vaultCondition === 'drifted'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Accumulo Sottovento
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Corda / Luce Arco (L):</span>
                  <span className="font-mono text-cyan-300 font-bold">{vaultSpanL.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="50.0"
                  step="1.0"
                  value={vaultSpanL}
                  onChange={(e) => setVaultSpanL(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Freccia in Chiave (f):</span>
                  <span className="font-mono text-cyan-300 font-bold">{vaultRiseF.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.5"
                  value={vaultRiseF}
                  onChange={(e) => setVaultRiseF(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Rapporto di ribassamento: <strong>f/L = {(vaultRiseF / vaultSpanL).toFixed(3)}</strong> · Angolo imposta β = {((Math.atan((4 * vaultRiseF) / vaultSpanL) * 180) / Math.PI).toFixed(1)}°
                </span>
              </div>
            </div>
          )}

          {activeCase === 'parapet' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Altezza Parapetto dal Piano Tetto (hp):</span>
                  <span className="font-mono text-cyan-300 font-bold">{parapetHeightHp.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="2.50"
                  step="0.05"
                  value={parapetHeightHp}
                  onChange={(e) => setParapetHeightHp(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Luce Copertura Piano (b):</span>
                  <span className="font-mono text-cyan-300 font-bold">{roofSpanB.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="40.0"
                  step="1.0"
                  value={roofSpanB}
                  onChange={(e) => setRoofSpanB(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {activeCase === 'obstruction' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Tipologia Ostacolo / Volume Tecnico:
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {[
                    { id: 'abbaino', label: 'Abbaino' },
                    { id: 'volume_tecnico', label: 'Vano Tecnico' },
                    { id: 'pannello_solare', label: 'Pannelli Solari' },
                    { id: 'camino', label: 'Camino / Torretta' },
                  ].map((obs) => (
                    <button
                      key={obs.id}
                      type="button"
                      onClick={() => setObstacleType(obs.id as any)}
                      className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                        obstacleType === obs.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {obs.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Altezza Emergente Ostacolo (h):</span>
                  <span className="font-mono text-cyan-300 font-bold">{obstacleHeight.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="3.00"
                  step="0.10"
                  value={obstacleHeight}
                  onChange={(e) => setObstacleHeight(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Larghezza Frontale (b):</span>
                  <span className="font-mono text-cyan-300 font-bold">{obstacleWidth.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.5"
                  value={obstacleWidth}
                  onChange={(e) => setObstacleWidth(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {activeCase === 'snow_guards' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Inclinazione Falda Copertura (α):</span>
                  <span className="font-mono text-cyan-300 font-bold">{guardPitchAlpha}° ({((Math.tan((guardPitchAlpha * Math.PI) / 180)) * 100).toFixed(1)}%)</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="65"
                  step="1"
                  value={guardPitchAlpha}
                  onChange={(e) => setGuardPitchAlpha(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  ✓ Prescrizione NTC § 3.4.3.1: <strong>μ1 = 0.80 costante</strong> (divieto di abbattimento per falde ripide).
                </span>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Lunghezza Falda a Monte della Linea (L):</span>
                  <span className="font-mono text-cyan-300 font-bold">{guardUpstreamLen.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="18.0"
                  step="0.5"
                  value={guardUpstreamLen}
                  onChange={(e) => setGuardUpstreamLen(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Passo tra Staffe / Ganci Fermaneve (s):</span>
                  <span className="font-mono text-cyan-300 font-bold">{bracketSpacingM.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="1.50"
                  step="0.05"
                  value={bracketSpacingM}
                  onChange={(e) => setBracketSpacingM(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {activeCase === 'overhang' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Inclinazione Falda (α):</span>
                  <span className="font-mono text-cyan-300 font-bold">{overhangPitchAlpha}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="55"
                  step="1"
                  value={overhangPitchAlpha}
                  onChange={(e) => setOverhangPitchAlpha(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Fattore di Forma Becco Neve a Sbalzo (k):</span>
                  <span className="font-mono text-cyan-300 font-bold">{overhangKFactor.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.25"
                  step="0.01"
                  value={overhangKFactor}
                  onChange={(e) => setOverhangKFactor(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  UNI EN 1991-1-3 § 6.3 raccomanda <strong>k = 0.17</strong>.
                </span>
              </div>
            </div>
          )}

          {/* Density Control */}
          <div className="pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between font-medium text-slate-300 mb-1">
              <span>Peso Volumico Neve (γ):</span>
              <span className="font-mono text-cyan-300 font-bold">{snowDensityGamma.toFixed(1)} kN/m³</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="3.5"
              step="0.1"
              value={snowDensityGamma}
              onChange={(e) => setSnowDensityGamma(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>1.5 (Fresca)</span>
              <span>2.0 (Normale NTC)</span>
              <span>3.0 (Bagnata/Ghiacciata)</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE SVG DIAGRAM & ENGINEERING METRICS */}
        <div className="lg:col-span-7 space-y-5">
          {/* INTERACTIVE CROSS-SECTION SVG DIAGRAM */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                Sezione Tecnica 2D dell&apos;Accumulo (Profilo di Carico)
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Scala Dinamica Auto-Adattiva
              </span>
            </div>

            <div className="w-full bg-slate-900/60 rounded-xl border border-slate-800/80 p-2 overflow-x-auto">
              <svg
                viewBox="0 0 600 240"
                className="w-full h-auto min-w-[500px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Snow Gradient */}
                  <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
                  </linearGradient>

                  {/* High Accumulation Gradient */}
                  <linearGradient id="snowPeakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
                  </linearGradient>

                  {/* Building Hatch Pattern */}
                  <pattern id="concreteHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1.2" />
                  </pattern>
                </defs>

                {/* SVG RENDERING BASED ON ACTIVE CASE */}
                {activeCase === 'step_down' && (
                  <g>
                    {/* Upper Building (Left/High) */}
                    <rect x="30" y="30" width="120" height="170" fill="url(#concreteHatch)" stroke="#64748b" strokeWidth="1.5" />
                    <text x="90" y="25" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      Edificio Alto (+{stepH}m)
                    </text>

                    {/* Lower Roof (Right) */}
                    <rect x="150" y="140" width="410" height="60" fill="url(#concreteHatch)" stroke="#64748b" strokeWidth="1.5" />
                    <text x="355" y="175" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      Copertura Inferiore (Luce b1 = {lowerRoofB1}m)
                    </text>

                    {/* Snow Accumulation Triangle + Trapezoid */}
                    {/* Peak at x=150, y=55; drops to baseline at x=340, y=120; stays flat to x=560 */}
                    <polygon
                      points="150,140 150,55 340,120 560,120 560,140"
                      fill="url(#snowPeakGrad)"
                      stroke="#7dd3fc"
                      strokeWidth="2"
                    />

                    {/* Dimension Line for ls */}
                    <line x1="150" y1="215" x2="340" y2="215" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx="150" cy="215" r="3" fill="#38bdf8" />
                    <circle cx="340" cy="215" r="3" fill="#38bdf8" />
                    <text x="245" y="228" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      ls = {(caseResults as any).ls.toFixed(1)} m
                    </text>

                    {/* Peak Load Vector at wall */}
                    <line x1="160" y1="35" x2="160" y2="53" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow)" />
                    <text x="165" y="45" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      q_max = {caseResults.q_max.toFixed(2)} kN/m² (μ2={(caseResults as any).mu2.toFixed(2)})
                    </text>

                    {/* Base Load Vector */}
                    <line x1="450" y1="102" x2="450" y2="118" stroke="#38bdf8" strokeWidth="2" />
                    <text x="450" y="98" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      q_min = {caseResults.q_min.toFixed(2)} kN/m²
                    </text>
                  </g>
                )}

                {activeCase === 'duopitch' && (
                  <g>
                    {/* Duopitch Roof Rafters */}
                    <line x1="60" y1="170" x2="300" y2="70" stroke="#94a3b8" strokeWidth="3" />
                    <line x1="300" y1="70" x2="540" y2="170" stroke="#94a3b8" strokeWidth="3" />
                    {/* Tie Beam */}
                    <line x1="60" y1="170" x2="540" y2="170" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

                    {/* Left pitch snow layer */}
                    <polygon
                      points={`60,170 300,70 300,${70 - (caseResults as any).mu_actual_1 * 25} 60,${170 - (caseResults as any).mu_actual_1 * 25}`}
                      fill="url(#snowGrad)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />

                    {/* Right pitch snow layer */}
                    <polygon
                      points={`300,70 540,170 540,${170 - (caseResults as any).mu_actual_2 * 25} 300,${70 - (caseResults as any).mu_actual_2 * 25}`}
                      fill="url(#snowGrad)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />

                    {/* Colmo text */}
                    <text x="300" y="45" fill="#f8fafc" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      Colmo (α1={pitch1Alpha}°, α2={pitch2Alpha}°)
                    </text>

                    {/* Loads Labels */}
                    <text x="160" y="115" fill="#7dd3fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Falda 1: {(caseResults as any).q1.toFixed(2)} kN/m² (μ={(caseResults as any).mu_actual_1.toFixed(2)})
                    </text>
                    <text x="440" y="115" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      Falda 2: {(caseResults as any).q2.toFixed(2)} kN/m² (μ={(caseResults as any).mu_actual_2.toFixed(2)})
                    </text>

                    {/* Wind Arrow if active */}
                    {windDirection === 'vento_da_sx' && (
                      <g>
                        <line x1="30" y1="60" x2="100" y2="60" stroke="#38bdf8" strokeWidth="2.5" />
                        <polygon points="100,55 112,60 100,65" fill="#38bdf8" />
                        <text x="65" y="52" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          Vento &rarr; (accumulo a dx)
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {activeCase === 'multi_shed' && (
                  <g>
                    {/* Multi-shed profile (2 consecutive bays) */}
                    <polygon points="40,160 140,80 280,160 380,80 520,160" fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                    {/* Snow concentrated in the valley at x=280 */}
                    <polygon
                      points="220,160 280,160 340,160 310,130 280,110 250,130"
                      fill="url(#snowGrad)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    {/* Valley Center Line & Peak */}
                    <line x1="280" y1="75" x2="280" y2="105" stroke="#f43f5e" strokeWidth="2" />
                    <polygon points="277,105 280,112 283,105" fill="#f43f5e" />
                    <text x="280" y="65" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      Picco in Gola: {(caseResults as any).q_valley.toFixed(2)} kN/m² (μ2={(caseResults as any).mu2_valley.toFixed(2)})
                    </text>

                    <text x="140" y="70" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      Colmo (μ=0)
                    </text>
                    <text x="380" y="70" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      Colmo (μ=0)
                    </text>
                  </g>
                )}

                {activeCase === 'cylindrical' && (
                  <g>
                    {/* Curved Vault Path */}
                    <path
                      d="M 60,170 Q 300,50 540,170"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="3"
                    />
                    {/* Vault Tie */}
                    <line x1="60" y1="170" x2="540" y2="170" stroke="#475569" strokeWidth="1.5" strokeDasharray="4,4" />

                    {/* Asymmetric drift snow on the right side if drifted */}
                    {vaultCondition === 'drifted' ? (
                      <path
                        d="M 300,110 Q 420,70 510,150 L 510,158 Q 420,95 300,110 Z"
                        fill="url(#snowPeakGrad)"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                    ) : (
                      <path
                        d="M 120,150 Q 300,80 480,150 L 480,158 Q 300,95 120,158 Z"
                        fill="url(#snowGrad)"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                    )}

                    <text x="300" y="35" fill="#f8fafc" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      Volta a Botte (L = {vaultSpanL}m, f = {vaultRiseF}m, β = {(caseResults as any).betaDeg.toFixed(1)}°)
                    </text>

                    <text x="430" y="70" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      q_max = {caseResults.q_max.toFixed(2)} kN/m² (μ3={(caseResults as any).mu3.toFixed(2)})
                    </text>
                  </g>
                )}

                {activeCase === 'parapet' && (
                  <g>
                    {/* Parapet at left (x=60 to 75, height) */}
                    <rect x="60" y="70" width="20" height="110" fill="url(#concreteHatch)" stroke="#64748b" strokeWidth="1.5" />
                    {/* Flat Roof Slab */}
                    <rect x="80" y="150" width="480" height="30" fill="url(#concreteHatch)" stroke="#64748b" strokeWidth="1.5" />

                    {/* Snow Drift against parapet */}
                    <polygon
                      points="80,150 80,85 240,135 550,135 550,150"
                      fill="url(#snowPeakGrad)"
                      stroke="#7dd3fc"
                      strokeWidth="2"
                    />

                    <text x="70" y="55" fill="#f8fafc" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      Parapetto hp = {parapetHeightHp}m
                    </text>

                    {/* Parapet load arrow */}
                    <line x1="90" y1="70" x2="90" y2="83" stroke="#f43f5e" strokeWidth="2" />
                    <text x="95" y="77" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      q_max = {caseResults.q_max.toFixed(2)} kN/m² (μ2={(caseResults as any).mu2.toFixed(2)})
                    </text>

                    {/* Horizontal thrust on parapet */}
                    <line x1="50" y1="120" x2="68" y2="120" stroke="#f59e0b" strokeWidth="2" />
                    <polygon points="68,117 74,120 68,123" fill="#f59e0b" />
                    <text x="50" y="137" fill="#f59e0b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      F_orizz = {(caseResults as any).F_horiz_parapet_kN_m.toFixed(2)} kN/m
                    </text>

                    {/* Dimension for ls */}
                    <line x1="80" y1="195" x2="240" y2="195" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="160" y="210" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      ls = {(caseResults as any).ls.toFixed(1)} m
                    </text>
                  </g>
                )}

                {activeCase === 'obstruction' && (
                  <g>
                    {/* Flat / pitched roof line */}
                    <line x1="40" y1="160" x2="560" y2="160" stroke="#64748b" strokeWidth="3" />

                    {/* Central Obstacle (e.g. Dormer or PV or Chimney) */}
                    <rect x="260" y="90" width="80" height="70" fill="url(#concreteHatch)" stroke="#38bdf8" strokeWidth="2" />
                    <text x="300" y="80" fill="#38bdf8" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      {obstacleType.toUpperCase()} (h={obstacleHeight}m)
                    </text>

                    {/* Upstream Drift (Left) */}
                    <polygon points="170,160 260,160 260,110" fill="url(#snowGrad)" stroke="#7dd3fc" strokeWidth="1.5" />
                    {/* Downstream Drift (Right) */}
                    <polygon points="340,160 430,160 340,110" fill="url(#snowGrad)" stroke="#7dd3fc" strokeWidth="1.5" />

                    {/* Drift Labels */}
                    <text x="215" y="105" fill="#f43f5e" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      q_max = {caseResults.q_max.toFixed(2)} kN/m²
                    </text>
                    <text x="385" y="105" fill="#f43f5e" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      q_max = {caseResults.q_max.toFixed(2)} kN/m²
                    </text>

                    {/* Extents */}
                    <line x1="170" y1="180" x2="260" y2="180" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="215" y="195" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      ls = {(caseResults as any).ls.toFixed(1)} m
                    </text>
                    <line x1="340" y1="180" x2="430" y2="180" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="385" y="195" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      ls = {(caseResults as any).ls.toFixed(1)} m
                    </text>
                  </g>
                )}

                {activeCase === 'snow_guards' && (
                  <g>
                    {/* Pitched Roof Rafter */}
                    <line x1="60" y1="190" x2="480" y2="50" stroke="#94a3b8" strokeWidth="3" />

                    {/* Snow Guard Barrier Post at x=140, y=163 */}
                    <line x1="140" y1="163" x2="125" y2="135" stroke="#f43f5e" strokeWidth="4" />
                    <rect x="122" y="132" width="16" height="6" fill="#f43f5e" />

                    {/* Retained Snow Blanket on Slope */}
                    <polygon
                      points="140,163 480,50 470,25 130,138"
                      fill="url(#snowGrad)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    {/* Sliding Force Arrow along slope */}
                    <line x1="280" y1="117" x2="210" y2="140" stroke="#f59e0b" strokeWidth="3" />
                    <polygon points="210,136 198,144 214,146" fill="#f59e0b" />
                    <text x="240" y="105" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Fs = {(caseResults as any).Fs_kN_m.toFixed(2)} kN/m (Spinta di Scorrimento)
                    </text>

                    {/* Single bracket reaction */}
                    <text x="145" y="195" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Forza su Staffa (passo {bracketSpacingM}m): {(caseResults as any).F_bracket_kN.toFixed(2)} kN ({(caseResults as any).F_bracket_kg.toFixed(0)} kg)
                    </text>
                  </g>
                )}

                {activeCase === 'overhang' && (
                  <g>
                    {/* Roof with Eaves Overhang at left */}
                    <line x1="120" y1="150" x2="480" y2="60" stroke="#94a3b8" strokeWidth="3" />
                    {/* Gutter (Canale di gronda) */}
                    <circle cx="115" cy="158" r="8" fill="none" stroke="#64748b" strokeWidth="2" />

                    {/* Overhanging curved snow cantilever */}
                    <path
                      d="M 480,60 L 120,150 C 95,155 85,175 95,190 C 105,185 110,165 130,135 L 470,45 Z"
                      fill="url(#snowGrad)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    {/* Edge Linear Load Vector */}
                    <line x1="90" y1="130" x2="90" y2="175" stroke="#f43f5e" strokeWidth="2.5" />
                    <polygon points="87,175 90,183 93,175" fill="#f43f5e" />
                    <text x="100" y="160" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Se = {(caseResults as any).Se_kN_m.toFixed(2)} kN/m (Carico di Bordo)
                    </text>
                    <text x="100" y="175" fill="#f43f5e" fontSize="9" fontFamily="monospace">
                      ({(caseResults as any).Se_kg_m.toFixed(1)} kg per metro di gronda)
                    </text>

                    <text x="300" y="50" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                      Spessore Manto d = {(caseResults as any).d_m.toFixed(2)} m (k = {overhangKFactor})
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Carico di Picco q_max</span>
              <div className="text-xl font-mono font-bold text-cyan-300 my-1">
                {caseResults.q_max.toFixed(2)} <span className="text-xs text-slate-400">kN/m²</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">
                {(caseResults.q_max * 101.97).toFixed(1)} kg/m²
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Carico Base q_min</span>
              <div className="text-xl font-mono font-bold text-white my-1">
                {caseResults.q_min.toFixed(2)} <span className="text-xs text-slate-400">kN/m²</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {(caseResults.q_min * 101.97).toFixed(1)} kg/m²
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Rapporto di Amplificazione</span>
              <div className="text-xl font-mono font-bold text-emerald-400 my-1">
                {caseResults.q_min > 0 ? (caseResults.q_max / caseResults.q_min).toFixed(2) : (caseResults.q_max / baseSnowCalculations.qsk).toFixed(2)}x
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                rispetto a q_min
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Fattore SLU γQ</span>
              <div className="text-xl font-mono font-bold text-rose-400 my-1">
                {(caseResults.q_max * 1.50).toFixed(2)} <span className="text-xs text-slate-400">kN/m²</span>
              </div>
              <span className="text-[10px] text-rose-400/80 font-mono">
                q_Ed (γQ = 1.50)
              </span>
            </div>
          </div>

          {/* NORMATIVE TECHNICAL NOTES PANEL */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Prescrizioni Specifiche da Normativa:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {caseResults.notes}
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span>Normativa: {caseResults.normRef}</span>
              <span className="text-cyan-400">Combinazione Fondamentale SLU: q_Ed = 1.3·G1 + 1.5·G2 + 1.5·qs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
