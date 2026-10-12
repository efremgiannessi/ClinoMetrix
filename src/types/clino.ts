export type CalculationMode = 
  | 'from_elevation_distance'    // Dati Dislivello e Distanza -> Calcola Pendenza (% e °)
  | 'from_slope_distance'        // Dati Pendenza (% o °) e Distanza -> Calcola Dislivello
  | 'from_elevation_slope'       // Dati Dislivello e Pendenza (% o °) -> Calcola Distanza necessaria
  | 'live_triangle';             // Risolutore geometrico continuo a 3 vertici

export type DistanceInputType = 
  | 'horizontal'  // Distanza orizzontale in pianta / cartografica (base del triangolo rettangolo)
  | 'hypotenuse'; // Distanza reale percorsa lungo il pendio (ipotenusa)

export type SlopeUnit = 'percent' | 'degrees' | 'permille' | 'ratio';

export type MeasurementSystem = 'metric' | 'imperial';

export interface CalculationResult {
  horizontalDistance: number;   // metri o piedi
  slopeDistance: number;        // metri o piedi (ipotenusa)
  elevationDiff: number;        // metri o piedi (delta h)
  slopePercent: number;         // % (delta h / dh * 100)
  slopePercentTravelled: number;// % calcolata sulla distanza percorsa (delta h / L * 100)
  slopeDegrees: number;         // gradi decimali
  slopeRadians: number;         // radianti
  slopePermille: number;        // per mille ‰
  slopeRatioDenominator: number;// 1:N
  startElevation?: number;      // Quota A
  endElevation?: number;        // Quota B
  classification: SlopeClassification;
}

export interface SlopeClassification {
  label: string;
  category: 'flat' | 'gentle' | 'moderate' | 'steep' | 'severe' | 'cliff';
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  practicalContext: string;
}

export interface TechnicalStandardPreset {
  id: string;
  category: 'accessibilita' | 'edilizia' | 'strade' | 'ciclismo' | 'idraulica' | 'sicurezza';
  title: string;
  subtitle: string;
  normativeRef: string;
  slopePercent: number;
  slopeDegrees: number;
  recommendedMaxDistance?: number;
  description: string;
  notes: string;
}

export interface RouteSegment {
  id: string;
  name: string;
  distance: number;       // metri
  slopePercent: number;   // %
  elevationDiff: number;  // metri
  surfaceType?: 'asphalt' | 'gravel' | 'trail' | 'stairs';
}

export interface SavedCalculation {
  id: string;
  timestamp: number;
  title: string;
  mode: CalculationMode;
  system: MeasurementSystem;
  result: CalculationResult;
  notes?: string;
}
