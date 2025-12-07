export interface DailyReport {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  fieldName: string;
  wellId: string;
  oilProducedBbl: number;
  gasProducedMcf: number;
  waterProducedBbl: number;
  employeesAffected: number;
  weatherCondition: WeatherCondition;
  notes: string;
  timestamp: number;
}

export enum WeatherCondition {
  SUNNY = 'Sunny',
  CLOUDY = 'Cloudy',
  RAINY = 'Rainy',
  STORMY = 'Stormy',
  SNOWY = 'Snowy',
  WINDY = 'Windy',
  CLEAR = 'Clear'
}

export type ViewState = 'DASHBOARD' | 'ENTRY' | 'REPORTS';

export interface ReportFilter {
  startDate: string;
  endDate: string;
}

export interface AIAnalysisResult {
  summary: string;
  auditFlags: string[];
  recommendations: string[];
}