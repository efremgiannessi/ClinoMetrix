import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Activity,
  Wind,
  CloudSnow,
  Thermometer,
  Layers,
  ShieldCheck,
  Search,
  Copy,
  Check,
  ArrowRight,
  Sliders,
  Info,
  Maximize2,
  FileText,
  TrendingUp,
  Landmark,
  Building2,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { NtcSnowDriftCalculator } from './NtcSnowDriftCalculator';

export const NtcActionsSection: React.FC = () => {
  // Main selected Chapter 3 section
  const [activeMainSection, setActiveMainSection] = useState<'3.1' | '3.2' | '3.3' | '3.4' | 'snow_drift' | '3.5'>('3.1');
  
  // Search filter query
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Copied state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ========================================================
  // INTERACTIVE STATE: 3.1 CARICHI OPERE CIVILI
  // ========================================================
  const [selectedUseCategory, setSelectedUseCategory] = useState<string>('Cat_A'); // Cat_A .. Cat_I
  const [slabThicknessCm, setSlabThicknessCm] = useState<number>(20); // cm
  const [nonStructuralG2, setNonStructuralG2] = useState<number>(1.50); // kN/m²

  // ========================================================
  // INTERACTIVE STATE: 3.2 AZIONE SISMICA
  // ========================================================
  const [soilCategory, setSoilCategory] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('B');
  const [topoCategory, setTopoCategory] = useState<'T1' | 'T2' | 'T3' | 'T4'>('T1');
  const [agPga, setAgPga] = useState<number>(0.20); // ag/g (0.05 to 0.40)
  const [f0Coeff, setF0Coeff] = useState<number>(2.40); // F0 (2.2 to 2.6)
  const [tcStar, setTcStar] = useState<number>(0.32); // Tc* in sec
  const [behaviourFactorQ, setBehaviourFactorQ] = useState<number>(2.5); // q (1.0 to 6.0)
  const [activeLimitState, setActiveLimitState] = useState<'SLO' | 'SLD' | 'SLV' | 'SLC'>('SLV');

  // ========================================================
  // INTERACTIVE STATE: 3.3 AZIONI DEL VENTO
  // ========================================================
  const [windZone, setWindZone] = useState<number>(1); // Zone 1 to 9
  const [siteAltitudeM, setSiteAltitudeM] = useState<number>(150); // m s.l.m.
  const [roughnessClass, setRoughnessClass] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [buildingHeightZ, setBuildingHeightZ] = useState<number>(15); // m
  const [aerodynamicCp, setAerodynamicCp] = useState<number>(0.8); // +0.8 windward, -0.4 leeward

  // ========================================================
  // INTERACTIVE STATE: 3.4 AZIONI DELLA NEVE
  // ========================================================
  const [snowZone, setSnowZone] = useState<'I_Alpina' | 'I_Mediterranea' | 'II' | 'III'>('I_Alpina');
  const [snowAltitudeM, setSnowAltitudeM] = useState<number>(350); // m s.l.m.
  const [roofPitchAngleDeg, setRoofPitchAngleDeg] = useState<number>(25); // degrees
  const [exposureType, setExposureType] = useState<'normale' | 'ventosa' | 'riparata'>('normale');

  // ========================================================
  // INTERACTIVE STATE: 3.5 AZIONI DELLA TEMPERATURA
  // ========================================================
  const [structMaterial, setStructMaterial] = useState<'calcestruzzo' | 'acciaio' | 'muratura' | 'legno'>('calcestruzzo');
  const [elementLengthM, setElementLengthM] = useState<number>(30); // meters
  const [deltaTUniform, setDeltaTUniform] = useState<number>(25); // °C

  const handleCopySection = (title: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(title);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // ========================================================
  // CALCULATIONS: 3.1 CARICHI SUI SOLAI
  // ========================================================
  const useCategoriesData: Record<string, { label: string; desc: string; qk: number; Qk: number; Hk: number; psi0: number; psi1: number; psi2: number }> = {
    Cat_A: { label: 'Cat. A: Ambienti Residenziali', desc: 'Abitazioni, camere d\'albergo, degenze ospedaliere', qk: 2.0, Qk: 2.0, Hk: 1.0, psi0: 0.7, psi1: 0.5, psi2: 0.3 },
    Cat_B: { label: 'Cat. B: Uffici', desc: 'Uffici aperti o non al pubblico, sale riunioni', qk: 2.0, Qk: 2.0, Hk: 1.0, psi0: 0.7, psi1: 0.5, psi2: 0.3 },
    Cat_C1: { label: 'Cat. C1: Luoghi Pubblici con Tavoli', desc: 'Ristoranti, bar, sale da pranzo', qk: 3.0, Qk: 3.0, Hk: 1.0, psi0: 0.7, psi1: 0.7, psi2: 0.6 },
    Cat_C2: { label: 'Cat. C2: Luoghi con Posti Fissi', desc: 'Teatri, cinema, aule universitarie, sale conferenze', qk: 4.0, Qk: 3.0, Hk: 2.0, psi0: 0.7, psi1: 0.7, psi2: 0.6 },
    Cat_C3: { label: 'Cat. C3: Aree Senza Ostacoli', desc: 'Musei, corridoi accesso, sale d\'attesa stazioni', qk: 5.0, Qk: 4.0, Hk: 3.0, psi0: 0.7, psi1: 0.7, psi2: 0.6 },
    Cat_D1: { label: 'Cat. D1: Commercio al Dettaglio', desc: 'Negozi, boutique, minimarket', qk: 4.0, Qk: 4.0, Hk: 2.0, psi0: 0.7, psi1: 0.7, psi2: 0.6 },
    Cat_D2: { label: 'Cat. D2: Grandi Magazzini', desc: 'Supermercati, ipermercati, centri commerciali', qk: 5.0, Qk: 5.0, Hk: 2.0, psi0: 0.7, psi1: 0.7, psi2: 0.6 },
    Cat_E: { label: 'Cat. E: Aree di Magazzino e Archivi', desc: 'Depositi merci, archivi cartacei e industriali', qk: 6.0, Qk: 6.0, Hk: 1.0, psi0: 1.0, psi1: 0.9, psi2: 0.8 },
    Cat_F: { label: 'Cat. F: Rimesse e Traffico Veicoli Leggeri', desc: 'Auto e SUV peso pieno carico P ≤ 30 kN (3.0 t)', qk: 2.5, Qk: 10.0, Hk: 1.0, psi0: 0.7, psi1: 0.7, psi2: 0.6 },
    Cat_G: { label: 'Cat. G: Rimesse e Traffico Veicoli Medi', desc: 'Furgoni e mezzi soccorso 30 < P ≤ 160 kN (16.0 t)', qk: 5.0, Qk: 90.0, Hk: 1.5, psi0: 0.7, psi1: 0.5, psi2: 0.3 },
    Cat_H: { label: 'Cat. H: Coperture Praticabili', desc: 'Tetti accessibili secondo categorie A..D', qk: 2.0, Qk: 2.0, Hk: 1.0, psi0: 0.7, psi1: 0.5, psi2: 0.3 },
    Cat_I: { label: 'Cat. I: Coperture Non Praticabili', desc: 'Accessibili solo per manutenzione e riparazioni', qk: 0.5, Qk: 1.2, Hk: 0.5, psi0: 0.0, psi1: 0.0, psi2: 0.0 },
  };

  const selectedCat = useCategoriesData[selectedUseCategory] || useCategoriesData.Cat_A;
  const g1_structural = (slabThicknessCm / 100) * 25.0; // 25 kN/m³ per c.a.
  const g2_nonStructural = nonStructuralG2;
  const qk_live = selectedCat.qk;

  // Combinazione fondamentale SLU (Eq. 2.6.1 NTC):
  const qEd_SLU = 1.30 * g1_structural + 1.50 * g2_nonStructural + 1.50 * qk_live;
  // Combinazione rara SLE:
  const qk_rara_SLE = g1_structural + g2_nonStructural + qk_live;
  // Combinazione quasi permanente SLE (frecce viscose):
  const qk_qp_SLE = g1_structural + g2_nonStructural + selectedCat.psi2 * qk_live;

  // ========================================================
  // CALCULATIONS: 3.2 SPETTRO SISMICO NTC 2018
  // ========================================================
  const soilParams = useMemo(() => {
    // Stratigraphic amplification coefficient SS (Tabella 3.2.V NTC)
    let SS = 1.0;
    let CC = 1.0;

    switch (soilCategory) {
      case 'A':
        SS = 1.0;
        CC = 1.0;
        break;
      case 'B':
        SS = Math.min(1.40, Math.max(1.00, 1.40 - 0.40 * f0Coeff * agPga));
        CC = 1.10 * Math.pow(tcStar, -0.20);
        break;
      case 'C':
        SS = Math.min(1.50, Math.max(1.00, 1.70 - 0.60 * f0Coeff * agPga));
        CC = 1.05 * Math.pow(tcStar, -0.33);
        break;
      case 'D':
        SS = Math.min(1.80, Math.max(0.90, 2.40 - 1.50 * f0Coeff * agPga));
        CC = 1.25 * Math.pow(tcStar, -0.50);
        break;
      case 'E':
        SS = Math.min(1.60, Math.max(1.00, 2.00 - 1.10 * f0Coeff * agPga));
        CC = 1.15 * Math.pow(tcStar, -0.40);
        break;
    }

    // Topographic amplification coefficient ST (Tabella 3.2.VI NTC)
    const ST_dict: Record<string, number> = { T1: 1.0, T2: 1.2, T3: 1.2, T4: 1.4 };
    const ST = ST_dict[topoCategory] || 1.0;

    const S = SS * ST;

    // Characteristic periods
    const TC = CC * tcStar;
    const TB = TC / 3.0;
    const TD = 4.0 * (agPga / 0.10) + 1.6; // TD in sec

    return { SS, ST, S, CC, TB, TC, TD };
  }, [soilCategory, topoCategory, agPga, f0Coeff, tcStar]);

  // Generate Elastic Spectrum Curve Se(T) & Design Spectrum Curve Sd(T)
  const spectrumPoints = useMemo(() => {
    const points: Array<{ T: number; Se: number; Sd: number }> = [];
    const { S, TB, TC, TD } = soilParams;
    const eta = 1.0; // damping factor for 5% critical damping: eta = sqrt(10 / (5 + xi)) = 1.0
    const q = Math.max(1.0, behaviourFactorQ);

    for (let T = 0; T <= 3.0; T += 0.04) {
      let Se = 0;
      let Sd = 0;

      // Elastic spectrum Se(T) (NTC Par. 3.2.3.2.1):
      if (T < TB) {
        Se = agPga * S * eta * f0Coeff * (T / TB) + agPga * S * (1 - T / TB);
      } else if (T <= TC) {
        Se = agPga * S * eta * f0Coeff;
      } else if (T <= TD) {
        Se = agPga * S * eta * f0Coeff * (TC / T);
      } else {
        Se = agPga * S * eta * f0Coeff * ((TC * TD) / (T * T));
      }

      // Design inelastic spectrum Sd(T) (NTC Par. 3.2.3.5):
      if (T < TB) {
        Sd = agPga * S * (1 + (T / TB) * (f0Coeff / q - 1));
      } else if (T <= TC) {
        Sd = (agPga * S * f0Coeff) / q;
      } else if (T <= TD) {
        Sd = ((agPga * S * f0Coeff) / q) * (TC / T);
        if (Sd < 0.2 * agPga) Sd = 0.2 * agPga;
      } else {
        Sd = ((agPga * S * f0Coeff) / q) * ((TC * TD) / (T * T));
        if (Sd < 0.2 * agPga) Sd = 0.2 * agPga;
      }

      points.push({ T, Se, Sd });
    }
    return points;
  }, [soilParams, agPga, f0Coeff, behaviourFactorQ]);

  // ========================================================
  // CALCULATIONS: 3.3 AZIONI DEL VENTO
  // ========================================================
  const windCalculations = useMemo(() => {
    // NTC 2018 Tabella 3.3.I (Zone vento d'Italia)
    const zoneData: Record<number, { vb0: number; a0: number; ka: number; name: string }> = {
      1: { vb0: 25.0, a0: 1000, ka: 0.010, name: 'Val d\'Aosta, Piemonte, Lombardia, Trentino, Friuli, Veneto (esclusa prov. Venezia)' },
      2: { vb0: 25.0, a0: 750, ka: 0.015, name: 'Emilia-Romagna' },
      3: { vb0: 27.0, a0: 500, ka: 0.020, name: 'Toscana, Marche, Umbria, Lazio, Abruzzo, Molise, Puglia, Campania, Basilicata, Calabria' },
      4: { vb0: 28.0, a0: 500, ka: 0.020, name: 'Sicilia e prov. Venezia' },
      5: { vb0: 27.0, a0: 750, ka: 0.015, name: 'Sardegna (zona orientale)' },
      6: { vb0: 28.0, a0: 500, ka: 0.020, name: 'Sardegna (zona occidentale)' },
      7: { vb0: 28.0, a0: 1000, ka: 0.010, name: 'Liguria' },
      8: { vb0: 30.0, a0: 1500, ka: 0.010, name: 'Isole tirreniche e del canale di Sicilia' },
      9: { vb0: 31.0, a0: 500, ka: 0.020, name: 'Isole minori Sardegna, Pantelleria, Lampedusa' },
    };

    const zParam = zoneData[windZone] || zoneData[1];
    let vb = zParam.vb0;
    if (siteAltitudeM > zParam.a0) {
      vb = zParam.vb0 + zParam.ka * (siteAltitudeM - zParam.a0);
    }

    // Pressione cinetica di riferimento qb (NTC Par. 3.3.6): qb = 0.5 * rho * vb^2
    const rho = 1.25; // kg/m³
    const qb_N = 0.5 * rho * (vb * vb); // N/m²
    const qb_kN = qb_N / 1000; // kN/m²

    // Coefficiente di esposizione ce(z) (NTC Par. 3.3.7):
    // Parameters by roughness class (Tabella 3.3.II)
    const roughParams: Record<string, { kr: number; z0: number; zmin: number; desc: string }> = {
      A: { kr: 0.17, z0: 0.01, zmin: 2, desc: 'Aree costiere aperte senza ostacoli, specchi d\'acqua' },
      B: { kr: 0.19, z0: 0.05, zmin: 4, desc: 'Campagna aperta con pochi alberi o modesti ostacoli' },
      C: { kr: 0.20, z0: 0.10, zmin: 5, desc: 'Aree suburbane, industriali o forestali' },
      D: { kr: 0.23, z0: 0.30, zmin: 8, desc: 'Aree urbane con edifici alti diffusi' },
    };

    const rp = roughParams[roughnessClass] || roughParams.B;
    const zEff = Math.max(rp.zmin, buildingHeightZ);
    // ct = 1.0 (coefficiente topografico standard)
    const ct = 1.0;
    const lnVal = Math.log(zEff / rp.z0);
    const ce = ct * ct * rp.kr * rp.kr * lnVal * (7 + ct * rp.kr * lnVal);

    // Pressione del vento p (NTC Par. 3.3.4): p = qb * ce * cp * cd (cd = 1.0)
    const cd = 1.0;
    const p_wind_kN = qb_kN * ce * aerodynamicCp * cd; // kN/m²

    return {
      vb,
      vb0: zParam.vb0,
      zoneName: zParam.name,
      qb_kN,
      qb_N,
      ce,
      p_wind_kN,
      zEff,
      roughDesc: rp.desc,
    };
  }, [windZone, siteAltitudeM, roughnessClass, buildingHeightZ, aerodynamicCp]);

  // ========================================================
  // CALCULATIONS: 3.4 AZIONI DELLA NEVE
  // ========================================================
  const snowCalculations = useMemo(() => {
    // Valore caratteristico carico neve al suolo qsk (NTC Par. 3.4.2 & Tab. 3.4.I)
    let qsk = 1.5; // kN/m²
    const as = snowAltitudeM;

    if (snowZone === 'I_Alpina') {
      if (as <= 200) {
        qsk = 1.50;
      } else {
        qsk = 1.39 * (1 + Math.pow(as / 728, 2));
      }
    } else if (snowZone === 'I_Mediterranea') {
      if (as <= 200) {
        qsk = 1.50;
      } else {
        qsk = 1.50 * (1 + Math.pow(as / 481, 2));
      }
    } else if (snowZone === 'II') {
      if (as <= 200) {
        qsk = 1.00;
      } else {
        qsk = 0.85 * (1 + Math.pow(as / 481, 2));
      }
    } else {
      // Zona III
      if (as <= 200) {
        qsk = 0.60;
      } else {
        qsk = 0.51 * (1 + Math.pow(as / 481, 2));
      }
    }

    // Coefficiente di forma della copertura mu_1(alpha) (NTC Par. 3.4.3.2):
    // alpha <= 30°: mu1 = 0.8
    // 30° < alpha < 60°: mu1 = 0.8 * (60 - alpha) / 30
    // alpha >= 60°: mu1 = 0.0
    const alpha = roofPitchAngleDeg;
    let mu1 = 0.8;
    if (alpha <= 30) {
      mu1 = 0.8;
    } else if (alpha < 60) {
      mu1 = 0.8 * ((60 - alpha) / 30);
    } else {
      mu1 = 0.0;
    }

    // Coefficiente di esposizione ce (NTC Par. 3.4.4)
    const ce_dict: Record<string, number> = { ventosa: 0.9, normale: 1.0, riparata: 1.1 };
    const ce = ce_dict[exposureType] || 1.0;
    const ct = 1.0; // coefficiente termico standard

    // Carico neve sulla copertura qs (NTC Par. 3.4.1): qs = mu_i * qsk * ce * ct
    const qs = mu1 * qsk * ce * ct;

    return {
      qsk,
      mu1,
      ce,
      ct,
      qs,
    };
  }, [snowZone, snowAltitudeM, roofPitchAngleDeg, exposureType]);

  // ========================================================
  // CALCULATIONS: 3.5 AZIONI DELLA TEMPERATURA
  // ========================================================
  const tempCalculations = useMemo(() => {
    // Thermal expansion coefficients alpha_T (1/°C)
    const alpha_dict: Record<string, { alpha: number; E_mod: number; desc: string }> = {
      calcestruzzo: { alpha: 1.0e-5, E_mod: 31000, desc: 'Calcestruzzo armato (α_T = 10 × 10⁻⁶ °C⁻¹)' },
      acciaio: { alpha: 1.2e-5, E_mod: 210000, desc: 'Acciaio strutturale (α_T = 12 × 10⁻⁶ °C⁻¹)' },
      muratura: { alpha: 0.6e-5, E_mod: 3000, desc: 'Muratura ordinaria/laterizio (α_T = 6 × 10⁻⁶ °C⁻¹)' },
      legno: { alpha: 0.5e-5, E_mod: 11000, desc: 'Legno strutturale parallelo alle fibre (α_T = 5 × 10⁻⁶ °C⁻¹)' },
    };

    const mat = alpha_dict[structMaterial];
    // Free elongation / contraction: Delta L = alpha_T * L * Delta T
    const deltaL_mm = mat.alpha * (elementLengthM * 1000) * deltaTUniform;

    // Fully restrained thermal stress: sigma = E * alpha_T * Delta T
    const sigmaRestrained_MPa = (mat.E_mod * mat.alpha * deltaTUniform);

    // Recommended maximum spacing between expansion joints (NTC Circolare Par. C3.5):
    // Calcestruzzo: 30-40 m (edifici ordinari), fino a 50 m in zone poco sismiche con armatura diffusa.
    const maxJointSpacingM = structMaterial === 'calcestruzzo' ? 35 : structMaterial === 'acciaio' ? 50 : 30;
    const isJointExceeded = elementLengthM > maxJointSpacingM;

    return {
      alpha: mat.alpha,
      desc: mat.desc,
      deltaL_mm,
      sigmaRestrained_MPa,
      maxJointSpacingM,
      isJointExceeded,
    };
  }, [structMaterial, elementLengthM, deltaTUniform]);

  return (
    <div className="space-y-8">
      {/* Title & Introduction Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                NTC 2018 · D.M. 17 Gennaio 2018
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Circolare C.S.LL.PP. 21/01/2019 n. 7
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Landmark className="w-6 h-6 text-cyan-400" />
              Capitolo 3 – Azioni sulle Costruzioni
            </h2>
            <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
              Manuale tecnico universitario e calcolatore strutturale integrato: carichi permanenti e variabili, spettri sismici, vento, neve e azioni termiche secondo la normativa tecnica vigente in Italia.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopySection('Indice NTC 3', 'NTC 2018 CAPITOLO 3 - AZIONI SULLE COSTRUZIONI (D.M. 17/01/2018 e Circ. 7/2019)')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 shrink-0 transition-colors cursor-pointer self-start lg:self-center"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedText ? 'Copiato!' : 'Copia Sintesi Capitolato'}</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cerca paragrafo o concetto: es. 3.2.3.2, spettro, vento, neve, qk, gamma, VS30, giunto termico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* CHAPTER 3 MASTER TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { id: '3.1', label: '3.1 Opere Civili', sub: 'Pesi, Solaio & Carichi', icon: <Layers className="w-4 h-4" /> },
          { id: '3.2', label: '3.2 Azione Sismica', sub: 'Spettro Se(T) & Suoli', icon: <Activity className="w-4 h-4 text-rose-400" /> },
          { id: '3.3', label: '3.3 Vento', sub: 'Zone, qb & ce(z)', icon: <Wind className="w-4 h-4 text-sky-400" /> },
          { id: '3.4', label: '3.4 Neve', sub: 'Suolo qsk & Falde μi', icon: <CloudSnow className="w-4 h-4 text-blue-300" /> },
          { id: 'snow_drift', label: '3.4.Acc Accumulo Neve', sub: 'Tutti i casi NTC & EC1', icon: <CloudSnow className="w-4 h-4 text-cyan-400" />, badge: 'Nuovo' },
          { id: '3.5', label: '3.5 Temperatura', sub: 'ΔT, Dilatazioni & Giunti', icon: <Thermometer className="w-4 h-4 text-amber-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMainSection(tab.id as any)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
              activeMainSection === tab.id
                ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-lg ring-1 ring-cyan-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.badge && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {tab.badge}
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              {tab.icon}
              <span className="text-xs font-bold text-white">{tab.label}</span>
            </div>
            <span className="text-[11px] text-slate-400 block line-clamp-1">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3.1: OPERE CIVILI E INDUSTRIALI                                    */}
      {/* ========================================================================= */}
      {activeMainSection === '3.1' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  3.1. Opere Civili e Industriali
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generalità, pesi propri strutturali, carichi permanenti portati e sovraccarichi di esercizio
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                NTC 2018 §§ 3.1.1 - 3.1.4
              </span>
            </div>

            {/* Subsections Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">3.1.1. GENERALITÀ</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Le azioni si distinguono in <strong>permanenti</strong> ($G_1$ strutturali e $G_2$ non strutturali), <strong>variabili</strong> ($Q_k$ di breve/lunga durata), <strong>eccezionali</strong> ($A$) e <strong>sismiche</strong> ($E$).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">3.1.2. PESI PROPRI DEI MATERIALI (G1)</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Definiti dalla <strong>Tabella 3.1.I</strong>: Calcestruzzo armato &gamma; = 25.0 kN/m&sup3;, Acciaio &gamma; = 78.5 kN/m&sup3;, Legno massiccio 4.0 &divide; 6.0 kN/m&sup3;, Muratura piena 18.0 kN/m&sup3;.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">3.1.3. CARICHI NON STRUTTURALI (G2)</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Massetti, pavimenti, intonaci, controsoffitti, impianti tecnologici e tramezzature interne mobili ripartite (g₂k compreso tra 0.80 e 2.00 kN/m&sup2;).
                </p>
              </div>
            </div>

            {/* 3.1.4 SOVRACCARICHI INTERACTIVE CALCULATOR */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    3.1.4. Sovraccarichi Variabili (Tabella 3.1.II) &amp; Combinatore di Solaio SLU/SLE
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seleziona la destinazione d&apos;uso per ottenere istantaneamente $q_k$, $Q_k$, $H_k$ e la combinazione fondamentale di progetto
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Selector */}
                <div className="lg:col-span-5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Destinazione d&apos;Uso (Tabella 3.1.II NTC 2018):
                    </label>
                    <select
                      value={selectedUseCategory}
                      onChange={(e) => setSelectedUseCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    >
                      {Object.entries(useCategoriesData).map(([key, item]) => (
                        <option key={key} value={key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      {selectedCat.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Spessore Soletta c.a. (s)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="10"
                          max="50"
                          value={slabThicknessCm}
                          onChange={(e) => setSlabThicknessCm(Number(e.target.value) || 20)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-mono">cm</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        g₁ = {g1_structural.toFixed(2)} kN/m²
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Permanenti Non Strutt. (g₂)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="4.0"
                          value={nonStructuralG2}
                          onChange={(e) => setNonStructuralG2(Number(e.target.value) || 1.5)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-mono">kN/m²</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        massetto, pav. e tramezzi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Output Cards */}
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3.1.4.1 Distribuito (qk)</span>
                    <div className="text-xl font-mono font-bold text-cyan-300 my-1">
                      {selectedCat.qk.toFixed(2)} <span className="text-xs text-slate-400">kN/m²</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{(selectedCat.qk * 100).toFixed(0)} kg/m²</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3.1.4.2 Concentrato (Qk)</span>
                    <div className="text-xl font-mono font-bold text-amber-300 my-1">
                      {selectedCat.Qk.toFixed(1)} <span className="text-xs text-slate-400">kN</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">su impronta 50x50/100x100mm</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3.1.4.3 Lineare (Hk)</span>
                    <div className="text-xl font-mono font-bold text-rose-400 my-1">
                      {selectedCat.Hk.toFixed(1)} <span className="text-xs text-slate-400">kN/m</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">spinta parapetti/partizioni</span>
                  </div>

                  {/* Design Load Combination Results */}
                  <div className="col-span-2 sm:col-span-3 bg-gradient-to-r from-slate-950 to-cyan-950/30 p-3.5 rounded-xl border border-cyan-800/40 grid grid-cols-3 gap-2 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">SLU Fondamentale (qEd)</span>
                      <span className="text-base font-bold text-rose-400">{qEd_SLU.toFixed(2)} kN/m²</span>
                      <span className="text-[9px] text-slate-500 block">γG1·g1 + γG2·g2 + γQ·qk</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SLE Rara (qk,tot)</span>
                      <span className="text-base font-bold text-cyan-300">{qk_rara_SLE.toFixed(2)} kN/m²</span>
                      <span className="text-[9px] text-slate-500 block">g1 + g2 + qk</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SLE Quasi Perm. (ψ2)</span>
                      <span className="text-base font-bold text-emerald-400">{qk_qp_SLE.toFixed(2)} kN/m²</span>
                      <span className="text-[9px] text-slate-500 block">frecce a lungo termine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3.2: AZIONE SISMICA                                                */}
      {/* ========================================================================= */}
      {activeMainSection === '3.2' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  3.2. Azione Sismica
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stati limite, pericolosità sismica di base, categorie di sottosuolo A-E e spettro di risposta elastico/di progetto Se(T) &amp; Sd(T)
                </p>
              </div>
              <span className="text-xs font-mono text-rose-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                NTC 2018 §§ 3.2.1 - 3.2.4
              </span>
            </div>

            {/* Subsections 3.2.1 and 3.2.2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 3.2.1 STATI LIMITE */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">
                  3.2.1. STATI LIMITE &amp; PROBABILITÀ DI SUPERAMENTO (PVR)
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Periodo di riferimento dell&apos;azione sismica: $V_R = V_N \times c_U$ ($V_N \ge 50$ anni per opere ordinarie, $c_U$ classe d&apos;uso I: 0.7, II: 1.0, III: 1.5, IV: 2.0).
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px] pt-1">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-cyan-300 font-bold block">SLO</span>
                    <span className="text-slate-400">P_VR = 81%</span>
                    <span className="text-slate-500 text-[9px]">TR = 30 anni</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-emerald-300 font-bold block">SLD</span>
                    <span className="text-slate-400">P_VR = 63%</span>
                    <span className="text-slate-500 text-[9px]">TR = 50 anni</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-amber-300 font-bold block">SLV</span>
                    <span className="text-slate-400">P_VR = 10%</span>
                    <span className="text-slate-500 text-[9px]">TR = 475 anni</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-rose-400 font-bold block">SLC</span>
                    <span className="text-slate-400">P_VR = 5%</span>
                    <span className="text-slate-500 text-[9px]">TR = 975 anni</span>
                  </div>
                </div>
              </div>

              {/* 3.2.2 CATEGORIE DI SOTTOSUOLO */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">
                  3.2.2. CATEGORIE DI SOTTOSUOLO &amp; TOPOGRAFIA
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Classificazione sismica del terreno mediante velocità onde di taglio V_S,30 (Tabella 3.2.II):
                </p>
                <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-4 font-mono">
                  <li><strong>Cat. A:</strong> Ammassi rocciosi affioranti (V_S,30 &gt; 800 m/s)</li>
                  <li><strong>Cat. B:</strong> Rocce tenere o depositi di sabbie/ghiaie addensate (360 &lt; V_S,30 &le; 800 m/s)</li>
                  <li><strong>Cat. C:</strong> Depositi di sabbie/ghiaie mediamente addensate (180 &lt; V_S,30 &le; 360 m/s)</li>
                  <li><strong>Cat. D:</strong> Terreni a grana fine poco o nulla addensati (V_S,30 &lt; 180 m/s)</li>
                  <li><strong>Cat. E:</strong> Strato alluvionale superficiale (5-20 m) su substrato rigido Cat. A</li>
                </ul>
              </div>
            </div>

            {/* INTERACTIVE SEISMIC SPECTRUM GENERATOR (3.2.3.2) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                  3.2.3.2. Spettro di Risposta Elastico Se(T) &amp; di Progetto Sd(T)
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSoilCategory(c)}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        soilCategory === c
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Suolo {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control sliders for parameters ag, F0, Tc*, q */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Accelerazione ag/g:</span>
                    <span className="font-mono text-rose-400 font-bold">{agPga.toFixed(2)} g</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.38"
                    step="0.01"
                    value={agPga}
                    onChange={(e) => setAgPga(Number(e.target.value))}
                    className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Fattore amplificazione F₀:</span>
                    <span className="font-mono text-cyan-300 font-bold">{f0Coeff.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="2.7"
                    step="0.05"
                    value={f0Coeff}
                    onChange={(e) => setF0Coeff(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Periodo T_C* (sec):</span>
                    <span className="font-mono text-amber-300 font-bold">{tcStar.toFixed(2)} s</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="0.45"
                    step="0.01"
                    value={tcStar}
                    onChange={(e) => setTcStar(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Fattore struttura q:</span>
                    <span className="font-mono text-emerald-300 font-bold">{behaviourFactorQ.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.5"
                    step="0.1"
                    value={behaviourFactorQ}
                    onChange={(e) => setBehaviourFactorQ(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Spectrum SVG Graph */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <span className="w-3 h-0.5 bg-rose-400 inline-block" /> Spettro Elastico Se(T) [g]
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-3 h-0.5 bg-emerald-400 border-dashed inline-block" /> Spettro Progetto Sd(T) (q={behaviourFactorQ.toFixed(1)})
                    </span>
                  </div>
                  <span>
                    TB={soilParams.TB.toFixed(2)}s · TC={soilParams.TC.toFixed(2)}s · TD={soilParams.TD.toFixed(2)}s · S={soilParams.S.toFixed(2)}
                  </span>
                </div>

                {/* SVG Graph Plot */}
                <div className="relative h-60 w-full overflow-hidden">
                  <svg viewBox="0 0 600 220" className="w-full h-full select-none overflow-visible">
                    {/* Grid lines */}
                    {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((t) => {
                      const x = 50 + (t / 3.0) * 520;
                      return (
                        <g key={t}>
                          <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={x} y="205" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                            {t.toFixed(1)}s
                          </text>
                        </g>
                      );
                    })}

                    {/* Y-axis markers */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => {
                      const y = 190 - (val / 1.0) * 170;
                      return (
                        <g key={val}>
                          <line x1="50" y1={y} x2="570" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="42" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                            {val.toFixed(1)}g
                          </text>
                        </g>
                      );
                    })}

                    {/* Elastic spectrum polyline */}
                    <path
                      d={spectrumPoints.reduce((acc, pt, idx) => {
                        const x = 50 + (pt.T / 3.0) * 520;
                        const y = Math.max(10, 190 - (pt.Se / 1.0) * 170);
                        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                    />

                    {/* Design spectrum polyline */}
                    <path
                      d={spectrumPoints.reduce((acc, pt, idx) => {
                        const x = 50 + (pt.T / 3.0) * 520;
                        const y = Math.max(10, 190 - (pt.Sd / 1.0) * 170);
                        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />

                    {/* Characteristic period vertical guides (TB, TC) */}
                    <line
                      x1={50 + (soilParams.TB / 3.0) * 520}
                      y1="20"
                      x2={50 + (soilParams.TB / 3.0) * 520}
                      y2="190"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={50 + (soilParams.TC / 3.0) * 520}
                      y1="20"
                      x2={50 + (soilParams.TC / 3.0) * 520}
                      y2="190"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={50 + (soilParams.TC / 3.0) * 520}
                      y="15"
                      fill="#f59e0b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      TC={soilParams.TC.toFixed(2)}s (Piatto)
                    </text>
                  </svg>
                </div>
              </div>

              {/* Subsections 3.2.3.3 - 3.2.4 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="font-bold text-rose-300 block">3.2.3.3 Spostamento Terreno dg</span>
                  <p className="text-slate-400">
                    Spostamento di picco: $d_g = 0.025 \cdot a_g \cdot S \cdot T_C \cdot T_D$. Importante per giunti sismici e isolatori.
                  </p>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="font-bold text-rose-300 block">3.2.3.6 Accelerogrammi</span>
                  <p className="text-slate-400">
                    Analisi dinamica non lineare (Time-History): min 7 accelerogrammi registrati o generati spettro-compatibili.
                  </p>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="font-bold text-rose-300 block">3.2.4 Variabilità Spaziale</span>
                  <p className="text-slate-400">
                    Per strutture a sviluppo lineare esteso (&gt; 400 m, ponti e gallerie), considerare eccitazione asincrona agli appoggi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3.3: AZIONI DEL VENTO                                              */}
      {/* ========================================================================= */}
      {activeMainSection === '3.3' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wind className="w-5 h-5 text-sky-400" />
                  3.3. Azioni del Vento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Velocità di riferimento vb, pressione cinetica qb, coefficiente di esposizione ce(z) e pressione aerodinamica p
                </p>
              </div>
              <span className="text-xs font-mono text-sky-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                NTC 2018 §§ 3.3.1 - 3.3.10
              </span>
            </div>

            {/* General Formula Box */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">3.3.4. Pressione del Vento sulle Pareti:</span>
                <div className="text-base font-bold text-sky-300">
                  p = q_b &times; c_e(z) &times; c_p &times; c_d
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  qb = pressione cinetica · ce(z) = esposizione · cp = aerodinamico · cd = dinamico (default 1.0)
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Pressione di Progetto Calcolata:</span>
                <span className="text-xl font-bold text-white">
                  {windCalculations.p_wind_kN.toFixed(3)} <span className="text-xs text-slate-400">kN/m²</span>
                </span>
                <span className="text-[10px] text-sky-400 block">({(windCalculations.p_wind_kN * 101.97).toFixed(1)} kg/m²)</span>
              </div>
            </div>

            {/* Interactive Wind Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5 space-y-4">
                {/* Zone selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    3.3.1. Zona Geografica del Vento (Tabella 3.3.I):
                  </label>
                  <select
                    value={windZone}
                    onChange={(e) => setWindZone(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => (
                      <option key={z} value={z}>
                        Zona {z}: {z === 1 ? 'Pianura Padana / Alpi (25 m/s)' : z === 3 ? 'Centro-Sud Italia (27 m/s)' : z === 4 ? 'Sicilia / Venezia (28 m/s)' : z === 7 ? 'Liguria (28 m/s)' : `Zona ${z}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {windCalculations.zoneName}
                  </p>
                </div>

                {/* Altitude */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Altitudine Sito (as):</span>
                    <span className="font-mono text-cyan-300 font-bold">{siteAltitudeM} m s.l.m.</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1800"
                    step="50"
                    value={siteAltitudeM}
                    onChange={(e) => setSiteAltitudeM(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Building Height z */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Quota di Calcolo da Terra (z):</span>
                    <span className="font-mono text-sky-400 font-bold">{buildingHeightZ} m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={buildingHeightZ}
                    onChange={(e) => setBuildingHeightZ(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Roughness class */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    3.3.7. Classe di Rugosità del Terreno:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                    {(['A', 'B', 'C', 'D'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoughnessClass(r)}
                        className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                          roughnessClass === r
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        Classe {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {windCalculations.roughDesc}
                  </p>
                </div>
              </div>

              {/* Engineering Metrics Output Panel */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3.3.2. Velocità vb</span>
                    <div className="text-xl font-mono font-bold text-sky-300 my-1">
                      {windCalculations.vb.toFixed(1)} <span className="text-xs text-slate-400">m/s</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{(windCalculations.vb * 3.6).toFixed(1)} km/h</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3.3.6. Cinetica qb</span>
                    <div className="text-xl font-mono font-bold text-white my-1">
                      {windCalculations.qb_kN.toFixed(3)} <span className="text-xs text-slate-400">kN/m²</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">0.5 &times; &rho; &times; vb&sup2;</span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3.3.7. Esposizione ce(z)</span>
                    <div className="text-xl font-mono font-bold text-emerald-400 my-1">
                      {windCalculations.ce.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">quota z = {buildingHeightZ} m</span>
                  </div>
                </div>

                {/* Subsections 3.3.8 - 3.3.10 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
                    3.3.8 - 3.3.10. Coefficienti Aerodinamici &amp; Avvertenze Progettuali
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <strong className="text-slate-300">Pareti verticali sopravvento:</strong> c_pe = +0.80 (pressione diretta spingente).
                    </div>
                    <div>
                      <strong className="text-slate-300">Pareti verticali sottovento:</strong> c_pe = -0.40 (depressione/risucchio aspirante).
                    </div>
                    <div>
                      <strong className="text-slate-300">Coperture piane:</strong> depressioni localizzate ai bordi fino a c_pe = -1.8 &divide; -2.0.
                    </div>
                    <div>
                      <strong className="text-slate-300">Distacco vortici (Karman):</strong> verificare stabilità aeroelastica per ciminiere e torri snelle ($H/D &gt; 6$).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3.4: AZIONI DELLA NEVE                                             */}
      {/* ========================================================================= */}
      {activeMainSection === '3.4' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CloudSnow className="w-5 h-5 text-blue-300" />
                  3.4. Azioni della Neve
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Carico al suolo qsk in funzione della zona e dell&apos;altitudine, coefficienti di forma μi e carico in copertura qs
                </p>
              </div>
              <span className="text-xs font-mono text-blue-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                NTC 2018 §§ 3.4.1 - 3.4.5
              </span>
            </div>

            {/* Formula Banner */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">3.4.1. Carico della Neve sulla Copertura:</span>
                <div className="text-base font-bold text-blue-300">
                  q_s = &mu;_i &times; q_sk &times; c_e &times; c_t
                </div>
                <div className="text-[10px] text-slate-400 font-sans">
                  &mu;i = forma della falda · qsk = carico al suolo · ce = esposizione vento · ct = coefficiente termico (1.0)
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Carico di Progetto in Copertura qs:</span>
                <span className="text-2xl font-bold text-white">
                  {snowCalculations.qs.toFixed(2)} <span className="text-xs text-slate-400">kN/m²</span>
                </span>
                <span className="text-[10px] text-blue-400 block">({(snowCalculations.qs * 101.97).toFixed(1)} kg/m²)</span>
              </div>
            </div>

            {/* Interactive Snow Parameters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5 space-y-4">
                {/* Zone selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    3.4.2. Zona Neve (Tabella 3.4.I):
                  </label>
                  <select
                    value={snowZone}
                    onChange={(e) => setSnowZone(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="I_Alpina">Zona I Alpina: Aosta, Belluno, Bergamo, Brescia, Como, Sondrio, Trento, Bolzano, Verbania, Vercelli</option>
                    <option value="I_Mediterranea">Zona I Mediterranea: Alessandria, Asti, Biella, Cuneo, Novara, Torino, Pavia, Lodi, Cremona</option>
                    <option value="II">Zona II: Emilia Romagna, Friuli, Veneto pianura, Liguria, Toscana, Marche, Umbria, Lazio, Abruzzo, Molise, Campania, Basilicata, Puglia</option>
                    <option value="III">Zona III: Calabria, Sicilia, Sardegna</option>
                  </select>
                </div>

                {/* Altitude */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Altitudine Sito (as):</span>
                    <span className="font-mono text-cyan-300 font-bold">{snowAltitudeM} m s.l.m.</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1800"
                    step="25"
                    value={snowAltitudeM}
                    onChange={(e) => setSnowAltitudeM(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Carico neve al suolo risultante: <strong>qsk = {snowCalculations.qsk.toFixed(2)} kN/m²</strong> ({(snowCalculations.qsk * 100).toFixed(0)} kg/m²)
                  </p>
                </div>

                {/* Roof Pitch Angle alpha */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Inclinazione Falda Copertura (&alpha;):</span>
                    <span className="font-mono text-blue-300 font-bold">{roofPitchAngleDeg}&deg; ({((Math.tan((roofPitchAngleDeg * Math.PI) / 180)) * 100).toFixed(1)}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="1"
                    value={roofPitchAngleDeg}
                    onChange={(e) => setRoofPitchAngleDeg(Number(e.target.value))}
                    className="w-full accent-blue-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>0° (Piana μ₁=0.8)</span>
                    <span>30° (μ₁=0.8)</span>
                    <span>45° (μ₁=0.4)</span>
                    <span>≥60° (Scivolo μ₁=0)</span>
                  </div>
                </div>

                {/* Exposure type */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    3.4.4. Topografia di Esposizione al Vento:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {(['ventosa', 'normale', 'riparata'] as const).map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setExposureType(exp)}
                        className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                          exposureType === exp
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {exp.charAt(0).toUpperCase() + exp.slice(1)} (ce={exp === 'ventosa' ? '0.9' : exp === 'normale' ? '1.0' : '1.1'})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Factors Detail (3.4.3.1 - 3.4.3.3) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    3.4.3. Coefficienti di Forma &mu;i (Coperture a una e due falde)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-blue-300 font-bold block">3.4.3.2. Copertura a una falda</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Per &alpha; &le; 30&deg;: <strong>&mu;₁ = 0.80</strong>.<br />
                        Per 30&deg; &lt; &alpha; &lt; 60&deg;: <strong>&mu;₁ = 0.80 &times; (60 - &alpha;)/30</strong>.<br />
                        Per &alpha; &ge; 60&deg;: <strong>&mu;₁ = 0.00</strong> (la neve scivola via spontaneamente).
                      </p>
                      <div className="pt-1 font-mono text-cyan-300 text-xs font-bold">
                        Valore attuale: &mu;₁ = {snowCalculations.mu1.toFixed(3)}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-blue-300 font-bold block">3.4.3.3. Copertura a due falde</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Prevedere 3 condizioni di carico distinte:<br />
                        1. Carico simmetrico uniforme su entrambe le falde (&mu;₁).<br />
                        2. Carico asimmetrico per accumulo sottovento (0.5&middot;&mu;₁ su falda 1 e &mu;₁ su falda 2).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Snow Drifting and Roof Obstacles */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white block">
                      Prescrizioni Speciali per Accumuli &amp; Balconi (Circolare n. 7/2019):
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      8 Casi Disponibili
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    In presenza di riseghe di fabbricati, pareti adiacenti più alte, tetti a shed, coperture a volta, parapetti alti a tetto, ostacoli tecnologici, barriere fermaneve o sbalzi di gronda, considerare l&apos;accumulo localizzato della neve con coefficiente fino a <strong>&mu;₂ = 2.0 &divide; 4.0</strong> per evitare sfondamenti localizzati di solette di copertura.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMainSection('snow_drift')}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    <CloudSnow className="w-4 h-4" />
                    <span>Apri Calcolatore Avanzato Accumuli Neve (Tutti gli 8 Casi NTC/EC1)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3.4.ACC: ACCUMULO NEVE NELLE COPERTURE (TUTTI I CASI POSSIBILI)    */}
      {/* ========================================================================= */}
      {activeMainSection === 'snow_drift' && (
        <NtcSnowDriftCalculator
          initialZone={snowZone}
          initialAltitude={snowAltitudeM}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 3.5: AZIONI DELLA TEMPERATURA                                      */}
      {/* ========================================================================= */}
      {activeMainSection === '3.5' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-amber-400" />
                  3.5. Azioni della Temperatura
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Componente uniforme ΔTu, componente lineare ΔTM, distorsioni termiche e dimensionamento dei giunti di dilatazione
                </p>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                NTC 2018 §§ 3.5.1 - 3.5.7
              </span>
            </div>

            {/* Subsections 3.5.1 - 3.5.4 Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                  3.5.1. GENERALITÀ
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Le azioni termiche sono variabili nel tempo e causano variazioni dimensionali e deformazioni negli elementi strutturali vincolati, inducendo stati tensionali coattivi.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                  3.5.2 - 3.5.3. ARIA ESTERNA &amp; INTERNA
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Temperatura dell&apos;aria esterna T_max e T_min dedotta da mappe isoterme NTC. Temperatura interna T_in &asymp; +20&deg;C per edifici riscaldati in inverno.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                  3.5.4. COMPONENTI DELLA TEMPERATURA
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  La distribuzione termica si scinde in una <strong>componente uniforme</strong> &Delta;Tu (allungamento/accorciamento assiale) e una <strong>componente a farfalla</strong> &Delta;TM (gradiente lineare flettente).
                </p>
              </div>
            </div>

            {/* INTERACTIVE THERMAL JOINT CALCULATOR (3.5.5 - 3.5.7) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                3.5.5 - 3.5.7. Calcolo Dilatazioni Termiche &amp; Verifica Interasse Giunti di Dilatazione
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-5 space-y-4">
                  {/* Material selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Materiale Strutturale (Coefficiente α_T):
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {(['calcestruzzo', 'acciaio', 'muratura', 'legno'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setStructMaterial(m)}
                          className={`py-1.5 px-2 rounded border text-center transition-colors cursor-pointer capitalize ${
                            structMaterial === m
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {tempCalculations.desc}
                    </p>
                  </div>

                  {/* Element Length L */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                      <span>Lunghezza Struttura senza Giunti (L):</span>
                      <span className="font-mono text-cyan-300 font-bold">{elementLengthM} m</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={elementLengthM}
                      onChange={(e) => setElementLengthM(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>5 m</span>
                      <span>30-35 m (Consigliato c.a.)</span>
                      <span>100 m</span>
                    </div>
                  </div>

                  {/* Temperature Delta */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                      <span>Escursione Termica Uniforme (&Delta;Tu):</span>
                      <span className="font-mono text-amber-400 font-bold">&plusmn;{deltaTUniform}&deg;C</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={deltaTUniform}
                      onChange={(e) => setDeltaTUniform(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      Standard NTC: &plusmn;15&deg;C (edifici chiusi isolati), &plusmn;25&divide;30&deg;C (strutture all&apos;aperto)
                    </span>
                  </div>
                </div>

                {/* Outputs Panel */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Allungamento / Accorciamento (&Delta;L)</span>
                      <div className="text-2xl font-mono font-bold text-amber-300">
                        &plusmn;{tempCalculations.deltaL_mm.toFixed(2)} <span className="text-xs text-slate-400">mm</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ampiezza giunto minima libera
                      </span>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Tensione Coattiva Bloccata (&sigma;)</span>
                      <div className="text-2xl font-mono font-bold text-rose-400">
                        {tempCalculations.sigmaRestrained_MPa.toFixed(1)} <span className="text-xs text-slate-400">MPa</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        se la dilatazione è impedita (E&middot;&alpha;&middot;&Delta;T)
                      </span>
                    </div>
                  </div>

                  {/* Expansion Joint Status Alert */}
                  <div className={`p-4 rounded-xl border text-xs ${
                    tempCalculations.isJointExceeded
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {tempCalculations.isJointExceeded ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>3.5.6. Lunghezza Superiore all&apos;Interasse Massimo Consigliato ({tempCalculations.maxJointSpacingM} m)</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>3.5.6. Struttura entro i Limiti di Non Rilevanza dei Giunti (&le; {tempCalculations.maxJointSpacingM} m)</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                      {tempCalculations.isJointExceeded
                        ? `Per L = ${elementLengthM} m in ${structMaterial}, le NTC 2018 prescrivono l'inserimento di un giunto di dilatazione termica (apertura netta ≥ ${(tempCalculations.deltaL_mm * 1.5).toFixed(1)} mm) per non dover calcolare esplicitamente le ingenti sollecitazioni termiche coattive nei pilastri d'estremità.`
                        : `La lunghezza di ${elementLengthM} m consente di omettere il giunto di dilatazione termica ordinario secondo la Circolare n. 7/2019, assorbendo le dilatazioni con opportuna armatura diffusa.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
