import React, { useState } from 'react';
import { DailyReport, WeatherCondition } from '../types';
import { saveReport } from '../services/storageService';
import { Save, AlertCircle, CheckCircle, Users, Droplets, CloudRain, MapPin } from 'lucide-react';

interface DataEntryFormProps {
  onSuccess: () => void;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<Partial<DailyReport>>({
    date: new Date().toISOString().split('T')[0],
    fieldName: 'East Mesa',
    wellId: '',
    oilProducedBbl: 0,
    gasProducedMcf: 0,
    waterProducedBbl: 0,
    employeesAffected: 0,
    weatherCondition: WeatherCondition.SUNNY,
    notes: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.date || !formData.fieldName || !formData.wellId) {
        throw new Error("Date, Field Name, and Well ID are required.");
      }

      const report: DailyReport = {
        id: `${formData.fieldName}-${formData.wellId}-${formData.date}`,
        timestamp: new Date().getTime(),
        ...formData as DailyReport
      };

      saveReport(report);
      
      setNotification({ type: 'success', message: 'Report submitted successfully to database.' });
      setFormData(prev => ({ ...prev, wellId: '', notes: '', employeesAffected: 0 })); // Reset some fields
      setTimeout(() => {
        setNotification(null);
        onSuccess();
      }, 1500);

    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save report. Please check inputs.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-slate-800 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Save size={24} />
          Daily Operational Entry
        </h2>
        <p className="text-slate-400 mt-1">Input well data for centralized reporting.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {notification && (
          <div className={`col-span-full p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
            {notification.message}
          </div>
        )}

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Report Date</label>
          <input
            type="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="col-span-1">
           {/* Spacer */}
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-gray-500"/>
            Field Name
          </label>
          <select
            name="fieldName"
            value={formData.fieldName}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="East Mesa">East Mesa</option>
            <option value="North Unit">North Unit</option>
            <option value="South Ridge">South Ridge</option>
            <option value="West Field">West Field</option>
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Well ID</label>
          <input
            type="text"
            name="wellId"
            placeholder="e.g. W-1001"
            required
            value={formData.wellId}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="col-span-1 md:col-span-2 border-t border-gray-100 my-2"></div>
        
        {/* Production Data */}
        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Droplets size={16} className="text-blue-500"/>
            Oil Produced (BBL)
          </label>
          <input
            type="number"
            name="oilProducedBbl"
            min="0"
            step="0.1"
            required
            value={formData.oilProducedBbl}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Gas Produced (MCF)</label>
          <input
            type="number"
            name="gasProducedMcf"
            min="0"
            step="0.1"
            required
            value={formData.gasProducedMcf}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Water Produced (BBL)</label>
          <input
            type="number"
            name="waterProducedBbl"
            min="0"
            step="0.1"
            required
            value={formData.waterProducedBbl}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* HR & Safety */}
        <div className="col-span-1 md:col-span-2 border-t border-gray-100 my-2"></div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Users size={16} className="text-red-500"/>
            Employees Affected by Incidents
          </label>
          <input
            type="number"
            name="employeesAffected"
            min="0"
            required
            value={formData.employeesAffected}
            onChange={handleChange}
            placeholder="0 if no accidents"
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-colors ${formData.employeesAffected! > 0 ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          <p className="text-xs text-gray-400 mt-1">Total personnel affected by any safety incidents.</p>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <CloudRain size={16} className="text-blue-400"/>
            Weather Condition
          </label>
          <select
            name="weatherCondition"
            value={formData.weatherCondition}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.values(WeatherCondition).map(weather => (
              <option key={weather} value={weather}>{weather}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Operational Notes</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Log details about weather impact, accident specifics, or maintenance performed..."
          />
        </div>

        <div className="col-span-1 md:col-span-2 mt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Submit Daily Report
          </button>
        </div>
      </form>
    </div>
  );
};