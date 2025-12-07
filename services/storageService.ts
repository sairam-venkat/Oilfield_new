import { DailyReport, WeatherCondition } from '../types';

const STORAGE_KEY = 'petrodata_reports';

export const saveReport = (report: DailyReport): void => {
  const existingReports = getReports();
  // Update if same date and well ID
  const index = existingReports.findIndex(r => r.date === report.date && r.wellId === report.wellId && r.fieldName === report.fieldName);
  
  if (index >= 0) {
    existingReports[index] = report;
  } else {
    existingReports.push(report);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingReports));
};

export const getReports = (): DailyReport[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteReport = (id: string): void => {
  const reports = getReports().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const generateCSV = (reports: DailyReport[]): string => {
  if (reports.length === 0) return '';
  
  const headers = [
    'Date',
    'Field Name',
    'Well ID',
    'Oil Produced (BBL)',
    'Gas Produced (MCF)',
    'Water Produced (BBL)',
    'Employees Affected by Accidents',
    'Weather Condition',
    'Notes'
  ];

  const rows = reports.map(r => [
    r.date,
    `"${r.fieldName}"`,
    `"${r.wellId}"`,
    r.oilProducedBbl,
    r.gasProducedMcf,
    r.waterProducedBbl,
    r.employeesAffected,
    r.weatherCondition,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

// Seed sample data for demonstration that matches user provided examples
export const seedData = () => {
  if (getReports().length === 0) {
    const today = new Date();
    const fields = ['East Mesa', 'North Unit', 'South Ridge', 'West Field'];
    const wells = ['W-1001', 'W-1002', 'W-1003', 'W-1004', 'W-1005'];

    // Generate 60 days of data across multiple wells
    const sampleReports: DailyReport[] = [];
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (59 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      // Determine weather pattern for the whole area that day
      const weatherRoll = Math.random();
      let weather = WeatherCondition.SUNNY;
      if (weatherRoll > 0.70) weather = WeatherCondition.CLOUDY;
      if (weatherRoll > 0.85) weather = WeatherCondition.RAINY;
      if (weatherRoll > 0.95) weather = WeatherCondition.STORMY;

      // Generate report for a few random wells each day
      const dailyWells = wells.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      dailyWells.forEach(wellId => {
         const fieldName = fields[Math.floor(Math.random() * fields.length)];
         let employeesAffected = 0;
         
         // Correlate accidents with stormy weather
         if (weather === WeatherCondition.STORMY && Math.random() > 0.6) {
           employeesAffected = 1;
         }

         let oil = 800 + Math.random() * 800;
         if (weather === WeatherCondition.STORMY) oil *= 0.7; // Production drop in storm
         if (employeesAffected > 0) oil *= 0.5; // Production drop due to accident

         sampleReports.push({
            id: `${fieldName}-${wellId}-${dateStr}`,
            date: dateStr,
            fieldName: fieldName,
            wellId: wellId,
            oilProducedBbl: Math.floor(oil),
            gasProducedMcf: Math.floor(1000 + Math.random() * 500),
            waterProducedBbl: Math.floor(600 + Math.random() * 400),
            employeesAffected: employeesAffected,
            weatherCondition: weather,
            notes: employeesAffected > 0 ? 'Safety incident reported. Pump check required.' : 'Routine operations.',
            timestamp: date.getTime()
         });
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleReports));
  }
};