import { CalculationResult, DistanceInputType, SlopeClassification } from '../types/clino';

export function getSlopeClassification(slopePercent: number, degrees: number): SlopeClassification {
  const absPct = Math.abs(slopePercent);
  const absDeg = Math.abs(degrees);

  if (absPct <= 2) {
    return {
      label: 'Pianeggiante',
      category: 'flat',
      colorHex: '#10B981', // emerald
      badgeBg: 'bg-emerald-950/60 border-emerald-800/60',
      badgeText: 'text-emerald-400',
      description: 'Dislivello trascurabile o impercettibile. Nessun attrito aggiuntivo rilevante.',
      practicalContext: 'Ideale per piste di decollo, marciapiedi pedonali accessibili senza ausilio.',
    };
  }

  if (absPct <= 5) {
    return {
      label: 'Dolce / Lieve',
      category: 'gentle',
      colorHex: '#06B6D4', // cyan
      badgeBg: 'bg-cyan-950/60 border-cyan-800/60',
      badgeText: 'text-cyan-400',
      description: 'Pendenza leggera, percorribile agevolmente da pedoni e ciclisti senza affanno.',
      practicalContext: 'Standard per autostrade (max 4-5%) e pendenze ottimali per rampe disabili comode.',
    };
  }

  if (absPct <= 8) {
    return {
      label: 'Moderata',
      category: 'moderate',
      colorHex: '#3B82F6', // blue
      badgeBg: 'bg-blue-950/60 border-blue-800/60',
      badgeText: 'text-blue-400',
      description: 'Salita chiaramente percepibile. Richiede marce basse per ciclisti.',
      practicalContext: 'Limite massimo legale per rampe disabili secondo la legge italiana (8% max per 10m).',
    };
  }

  if (absPct <= 12) {
    return {
      label: 'Impegnativa',
      category: 'steep',
      colorHex: '#F59E0B', // amber
      badgeBg: 'bg-amber-950/60 border-amber-800/60',
      badgeText: 'text-amber-400',
      description: 'Salita ripida che richiede notevole sforzo fisico. Rallentamento marcato per veicoli pesanti.',
      practicalContext: 'Tipica salita di montagna da Giro d\'Italia (es. Passo dello Stelvio media 7.4%, max 12%).',
    };
  }

  if (absPct <= 20) {
    return {
      label: 'Molto Ripida',
      category: 'severe',
      colorHex: '#F97316', // orange
      badgeBg: 'bg-orange-950/60 border-orange-800/60',
      badgeText: 'text-orange-400',
      description: 'Pendenza gravosa. Camminata faticosa, necessita rapporti cortissimi in bici o 1ª marcia in auto.',
      practicalContext: 'Limite massimo per rampe di accesso carraie rettilinee ad autorimesse (20% D.M. 1986).',
    };
  }

  if (absDeg <= 45) {
    return {
      label: 'Estrema / Fuoristrada',
      category: 'severe',
      colorHex: '#EF4444', // red
      badgeBg: 'bg-red-950/60 border-red-800/60',
      badgeText: 'text-red-400',
      description: 'Scarpata ripidissima. Rischio di slittamento pneumatici senza trazione integrale o asfalto asciutto.',
      practicalContext: 'Settore critico per valanghe a lastroni (30°-45°). Pendenza tipica tetti a falda alpini (40-60%).',
    };
  }

  if (absDeg >= 89.5 || absPct >= 9999) {
    return {
      label: 'Parete Verticale (90°)',
      category: 'cliff',
      colorHex: '#C084FC',
      badgeBg: 'bg-purple-950/70 border-purple-800/80',
      badgeText: 'text-purple-300',
      description: 'Parete a strapiombo perpendicolare (inclinazione 90°). La distanza orizzontale è nulla e la pendenza tende ad infinito.',
      practicalContext: 'Pareti rocciose verticali a picco o scale a pioli a 90°.',
    };
  }

  return {
    label: 'Dirupo / Parete',
    category: 'cliff',
    colorHex: '#A855F7', // purple
    badgeBg: 'bg-purple-950/60 border-purple-800/60',
    badgeText: 'text-purple-400',
    description: 'Inclinazione oltre i 45° (>100%). Richiede appigli o attrezzatura alpinistica/corda per la progressione.',
    practicalContext: 'Pareti rocciose verticali, falesie o canaloni alpinistici.',
  };
}

export function solveFromElevationAndDistance(params: {
  elevationDiff: number;
  distance: number;
  distanceType: DistanceInputType;
  startElevation?: number;
}): CalculationResult {
  const { elevationDiff, distance, distanceType, startElevation } = params;
  const absElev = Math.abs(elevationDiff);

  let horizontalDistance: number;
  let slopeDistance: number;

  if (distanceType === 'horizontal') {
    horizontalDistance = Math.max(distance, 0);
    slopeDistance = Math.sqrt(horizontalDistance * horizontalDistance + elevationDiff * elevationDiff);
  } else {
    // Distance along slope (hypotenuse)
    slopeDistance = Math.max(distance, 0);
    if (slopeDistance < absElev) {
      // Hypotenuse cannot be shorter than delta h
      slopeDistance = absElev;
    }
    const underRoot = Math.max(0, slopeDistance * slopeDistance - elevationDiff * elevationDiff);
    horizontalDistance = Math.sqrt(underRoot);
  }

  // Handle vertical / near-vertical wall (distance orizzontale = 0 o trascurabile)
  const isVertical = horizontalDistance < 0.001 && absElev > 0;
  const slopePercent = isVertical ? 999999 : (elevationDiff / horizontalDistance) * 100;
  const slopePercentTravelled = slopeDistance > 0 ? (elevationDiff / slopeDistance) * 100 : 0;
  const slopeRadians = isVertical ? Math.PI / 2 : Math.atan2(elevationDiff, horizontalDistance);
  const slopeDegrees = isVertical ? 90.0 : (slopeRadians * 180) / Math.PI;
  const slopePermille = isVertical ? 9999999 : slopePercent * 10;
  const slopeRatioDenominator = isVertical ? 0 : (Math.abs(slopePercent) > 0.0001 ? 100 / Math.abs(slopePercent) : 999999);

  const result: CalculationResult = {
    horizontalDistance,
    slopeDistance,
    elevationDiff,
    slopePercent,
    slopePercentTravelled,
    slopeDegrees,
    slopeRadians,
    slopePermille,
    slopeRatioDenominator,
    startElevation,
    endElevation: startElevation !== undefined ? startElevation + elevationDiff : undefined,
    classification: getSlopeClassification(slopePercent, slopeDegrees),
  };

  return result;
}

export function solveFromSlopeAndDistance(params: {
  slopeValue: number;
  slopeUnit: 'percent' | 'degrees';
  distance: number;
  distanceType: DistanceInputType;
  startElevation?: number;
}): CalculationResult {
  const { slopeValue, slopeUnit, distance, distanceType, startElevation } = params;

  let slopePercent: number;
  let slopeDegrees: number;
  let slopeRadians: number;

  if (slopeUnit === 'degrees') {
    slopeDegrees = Math.min(Math.max(slopeValue, -89.99), 89.99);
    slopeRadians = (slopeDegrees * Math.PI) / 180;
    slopePercent = Math.tan(slopeRadians) * 100;
  } else {
    slopePercent = slopeValue;
    slopeRadians = Math.atan(slopePercent / 100);
    slopeDegrees = (slopeRadians * 180) / Math.PI;
  }

  let horizontalDistance: number;
  let slopeDistance: number;
  let elevationDiff: number;

  if (distanceType === 'horizontal') {
    horizontalDistance = Math.max(distance, 0.000001);
    elevationDiff = horizontalDistance * (slopePercent / 100);
    slopeDistance = Math.sqrt(horizontalDistance * horizontalDistance + elevationDiff * elevationDiff);
  } else {
    // Distance along slope (hypotenuse)
    slopeDistance = Math.max(distance, 0.000001);
    elevationDiff = slopeDistance * Math.sin(slopeRadians);
    horizontalDistance = slopeDistance * Math.cos(slopeRadians);
  }

  const slopePercentTravelled = (elevationDiff / slopeDistance) * 100;
  const slopePermille = slopePercent * 10;
  const slopeRatioDenominator = Math.abs(slopePercent) > 0.0001 ? 100 / Math.abs(slopePercent) : 999999;

  return {
    horizontalDistance,
    slopeDistance,
    elevationDiff,
    slopePercent,
    slopePercentTravelled,
    slopeDegrees,
    slopeRadians,
    slopePermille,
    slopeRatioDenominator,
    startElevation,
    endElevation: startElevation !== undefined ? startElevation + elevationDiff : undefined,
    classification: getSlopeClassification(slopePercent, slopeDegrees),
  };
}

export function solveFromElevationAndSlope(params: {
  elevationDiff: number;
  slopeValue: number;
  slopeUnit: 'percent' | 'degrees';
  startElevation?: number;
}): CalculationResult {
  const { elevationDiff, slopeValue, slopeUnit, startElevation } = params;

  let slopePercent: number;
  let slopeDegrees: number;
  let slopeRadians: number;

  if (slopeUnit === 'degrees') {
    slopeDegrees = Math.min(Math.max(slopeValue, -89.99), 89.99);
    slopeRadians = (slopeDegrees * Math.PI) / 180;
    slopePercent = Math.tan(slopeRadians) * 100;
  } else {
    slopePercent = slopeValue;
    slopeRadians = Math.atan(slopePercent / 100);
    slopeDegrees = (slopeRadians * 180) / Math.PI;
  }

  const effectiveSlopePct = Math.abs(slopePercent) < 0.0001 ? 0.0001 : slopePercent;
  const horizontalDistance = elevationDiff / (effectiveSlopePct / 100);
  const slopeDistance = Math.sqrt(horizontalDistance * horizontalDistance + elevationDiff * elevationDiff);

  const slopePercentTravelled = (elevationDiff / slopeDistance) * 100;
  const slopePermille = slopePercent * 10;
  const slopeRatioDenominator = Math.abs(slopePercent) > 0.0001 ? 100 / Math.abs(slopePercent) : 999999;

  return {
    horizontalDistance: Math.abs(horizontalDistance),
    slopeDistance,
    elevationDiff,
    slopePercent,
    slopePercentTravelled,
    slopeDegrees,
    slopeRadians,
    slopePermille,
    slopeRatioDenominator,
    startElevation,
    endElevation: startElevation !== undefined ? startElevation + elevationDiff : undefined,
    classification: getSlopeClassification(slopePercent, slopeDegrees),
  };
}

/**
 * Hiking time estimate using Naismith's Rule with Scarf / Langmuir correction:
 * Standard hiking: 4 km/h flat + 1 hour every 400m elevation gain.
 * If downhill and steep (>12%), add slight braking time penalty.
 */
export function calculateNaismithHikingTime(distanceMeters: number, elevationDiffMeters: number): {
  totalMinutes: number;
  hoursAndMinutes: string;
  notes: string;
} {
  const km = distanceMeters / 1000;
  const positiveGain = Math.max(0, elevationDiffMeters);
  
  // Base flat time: 15 min per km (4 km/h)
  const flatMinutes = km * 15;
  // Elevation gain time: 60 min every 400m = 0.15 min per meter
  const climbMinutes = positiveGain * (60 / 400);

  // If downhill and very steep (>15%), add 10 min every 300m descent for joint fatigue
  let descentAdjustment = 0;
  if (elevationDiffMeters < 0) {
    descentAdjustment = Math.abs(elevationDiffMeters) * (10 / 300);
  }

  const totalMinutes = Math.round(flatMinutes + climbMinutes + descentAdjustment);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return {
    totalMinutes,
    hoursAndMinutes: hours > 0 ? `${hours}h ${mins}min` : `${mins}min`,
    notes: positiveGain > 0 
      ? `Stima Naismith (${km.toFixed(2)} km a 4 km/h + ${positiveGain.toFixed(0)}m D+)` 
      : `Discesa stimata (${km.toFixed(2)} km)`,
  };
}

/**
 * Cycling Climbing Speed / VAM & Effort Calculator:
 * VAM = (Elevation gain meters / hours)
 * Typical reference VAM:
 * 500-700 m/h: Cicloturista rilassato
 * 800-1100 m/h: Amatore allenato
 * 1200-1500 m/h: Granfondista avanzato
 * 1600-1800+ m/h: Professionista WorldTour
 */
export function calculateCyclingEstimates(distanceMeters: number, elevationDiffMeters: number): {
  climbTimeMinutes: number;
  climbTimeFormatted: string;
  avgVam: number;
  cyclingCategory: string;
} {
  const gain = Math.max(0, elevationDiffMeters);
  const distanceKm = distanceMeters / 1000;

  // Assume amateur average VAM of 850 m/h on sustained climbs
  const assumedVam = 850;
  let climbMinutes = 0;

  if (gain > 10) {
    const hours = gain / assumedVam;
    climbMinutes = Math.max(Math.round(hours * 60), Math.round((distanceKm / 25) * 60));
  } else {
    // Flat/rolling: 25 km/h
    climbMinutes = Math.round((distanceKm / 25) * 60);
  }

  const h = Math.floor(climbMinutes / 60);
  const m = climbMinutes % 60;

  // Salita category index: (Distance km) * (Slope %)^2 / 100 or UCI index
  const slope = distanceMeters > 0 ? (gain / distanceMeters) * 100 : 0;
  let category = 'Tratto Pianeggiante';
  if (gain >= 600 || (gain >= 400 && slope >= 8)) {
    category = 'Salita 1ª Categoria / Hors Catégorie';
  } else if (gain >= 350 || (gain >= 250 && slope >= 7)) {
    category = 'Salita 2ª Categoria';
  } else if (gain >= 180 || (gain >= 120 && slope >= 6)) {
    category = 'Salita 3ª Categoria';
  } else if (gain >= 60 || slope >= 4) {
    category = 'Salita 4ª Categoria / Strappo';
  }

  return {
    climbTimeMinutes: climbMinutes,
    climbTimeFormatted: h > 0 ? `${h}h ${m}min` : `${m}min`,
    avgVam: assumedVam,
    cyclingCategory: category,
  };
}
