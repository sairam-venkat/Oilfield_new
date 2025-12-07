import React, { useState, useEffect } from 'react';
import { DataEntryForm } from './components/DataEntryForm';
import { StatCard } from './components/StatCard';
import { DailyReport, ViewState } from './types';
import { getReports, seedData, generateCSV } from './services/storageService';
import { generateAuditReport } from './services/geminiService';
import { 
  FileSpreadsheet, 
  Droplets,
  Users,
  AlertTriangle,
  CloudRain,
  Download,
  BrainCircuit,
  Loader2,
  Calendar,
  MapPin
} from 'lucide-react';

// Helper to determine dominant weather
const getDominantWeather = (reports: DailyReport[]): string => {
  if (reports.length === 0) return 'N/A';
  const counts: Record<string, number> = {};
  reports.forEach(r => {
    counts[r.weatherCondition] = (counts[r.weatherCondition] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
};

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  
  // Reporting State
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    seedData();
    refreshData();
  }, []);

  const refreshData = () => {
    setReports(getReports());
  };

  const handleExport = () => {
    const csv = generateCSV(reports);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `petrodata_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAudit = async () => {
    setLoadingAudit(true);
    const filteredReports = getFilteredReports();
    const result = await generateAuditReport(filteredReports);
    setAuditResult(result);
    setLoadingAudit(false);
  };

  // Filter Logic
  const getFilteredReports = () => {
    const targetDate = new Date(selectedDate);
    // Normalize targetDate to midnight
    targetDate.setHours(0,0,0,0);
    
    return reports.filter(r => {
      const rDate = new Date(r.date);
      rDate.setHours(0,0,0,0); // Normalize report date
      
      if (reportType === 'DAILY') {
        return rDate.getTime() === targetDate.getTime();
      }
      if (reportType === 'WEEKLY') {
        // Last 7 days inclusive of target date
        const weekStart = new Date(targetDate);
        weekStart.setDate(targetDate.getDate() - 6);
        return rDate >= weekStart && rDate <= targetDate;
      }
      if (reportType === 'MONTHLY') {
        return rDate.getMonth() === targetDate.getMonth() && rDate.getFullYear() === targetDate.getFullYear();
      }
      return true;
    });
  };

  const filteredData = getFilteredReports();
  
  // Aggregate Stats
  const totalOil = filteredData.reduce((sum, r) => sum + r.oilProducedBbl, 0);
  const totalEmployeesAffected = filteredData.reduce((sum, r) => sum + r.employeesAffected, 0);
  const dominantWeather = getDominantWeather(filteredData);
  const activeWells = new Set(filteredData.map(r => r.wellId)).size;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-400" size={28} />
            <h1 className="text-xl font-bold tracking-tight">PetroData <span className="text-blue-400">Nexus</span></h1>
          </div>
          <nav className="flex space-x-4">
            <button 
              onClick={() => setView('DASHBOARD')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'DASHBOARD' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('ENTRY')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'ENTRY' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Data Entry
            </button>
            <button 
              onClick={() => setView('REPORTS')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'REPORTS' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Reports & Audit
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {view === 'DASHBOARD' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Operational Overview</h2>
                <p className="text-slate-500 mt-1">Real-time insight into production and safety metrics.</p>
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <FileSpreadsheet size={18} />
                Export Data for Excel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Oil (All Time)" 
                value={`${reports.reduce((s,r) => s + r.oilProducedBbl, 0).toLocaleString()} BBL`} 
                icon={<Droplets size={24} />} 
                color="blue"
              />
              <StatCard 
                title="Active Wells" 
                value={new Set(reports.map(r => r.wellId)).size}
                icon={<MapPin size={24} />} 
                color="orange"
              />
              <StatCard 
                title="Employees Affected" 
                value={reports.reduce((s,r) => s + r.employeesAffected, 0)}
                subValue={reports.reduce((s,r) => s + r.employeesAffected, 0) > 0 ? "Requires Attention" : "Safety Goal Met"}
                trend={reports.reduce((s,r) => s + r.employeesAffected, 0) > 0 ? 'down' : 'neutral'}
                icon={<AlertTriangle size={24} />} 
                color="red"
              />
              <StatCard 
                title="Current Weather" 
                value={reports[0]?.weatherCondition || 'N/A'}
                icon={<CloudRain size={24} />} 
                color="green"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Field Activity</h3>
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Field Name</th>
                      <th className="py-3 px-4 font-semibold">Well ID</th>
                      <th className="py-3 px-4 font-semibold">Oil (BBL)</th>
                      <th className="py-3 px-4 font-semibold">Employees Affected</th>
                      <th className="py-3 px-4 font-semibold">Weather</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">{r.date}</td>
                        <td className="py-3 px-4">{r.fieldName}</td>
                        <td className="py-3 px-4 font-mono text-xs bg-slate-100 rounded px-2 w-fit">{r.wellId}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{r.oilProducedBbl.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {r.employeesAffected > 0 ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                              <AlertTriangle size={12}/> {r.employeesAffected}
                            </span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{r.weatherCondition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'ENTRY' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button onClick={() => setView('DASHBOARD')} className="text-slate-500 hover:text-slate-800 mb-4 text-sm font-medium">← Back to Dashboard</button>
              <h2 className="text-3xl font-bold text-slate-800">New Data Entry</h2>
            </div>
            <DataEntryForm onSuccess={() => {
              refreshData();
              setView('DASHBOARD');
            }} />
          </div>
        )}

        {view === 'REPORTS' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Company Reports</h2>
                <p className="text-slate-500">Generate Daily, Weekly, or Monthly reports for Power BI and Audit.</p>
              </div>
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${reportType === type ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-400" size={20} />
                <span className="text-sm font-medium text-gray-700">Select Date:</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 text-right text-sm text-gray-500">
                {reportType === 'DAILY' && "Showing data for specific day."}
                {reportType === 'WEEKLY' && "Showing data for the week ending on selected date."}
                {reportType === 'MONTHLY' && "Showing data for the entire month of selected date."}
              </div>
            </div>

            {/* Report Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-6">
                {/* Visual Stats for the Report */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-xs font-bold text-blue-500 uppercase">Total Oil Produced</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{totalOil.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Barrels (BBL)</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-xs font-bold text-red-500 uppercase">Employees Affected</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{totalEmployeesAffected}</p>
                    <p className="text-xs text-slate-400">By Accidents</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                    <p className="text-xs font-bold text-orange-500 uppercase">Active Wells</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{activeWells}</p>
                    <p className="text-xs text-slate-400">Reporting in Period</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                    <p className="text-xs font-bold text-green-500 uppercase">Weather</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1 truncate">{dominantWeather}</p>
                    <p className="text-xs text-slate-400">Most Common Condition</p>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Detailed Logs</h3>
                    <span className="text-xs font-medium text-gray-500">{filteredData.length} records found</span>
                  </div>
                  <div className="overflow-x-auto max-h-96 custom-scroll">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Well ID</th>
                          <th className="px-6 py-3 font-medium">Oil (BBL)</th>
                          <th className="px-6 py-3 font-medium">Employees Affected</th>
                          <th className="px-6 py-3 font-medium">Weather</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredData.length > 0 ? filteredData.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-slate-800 font-medium">{r.date}</td>
                            <td className="px-6 py-3">{r.wellId}</td>
                            <td className="px-6 py-3">{r.oilProducedBbl.toLocaleString()}</td>
                            <td className={`px-6 py-3 font-bold ${r.employeesAffected > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {r.employeesAffected}
                            </td>
                            <td className="px-6 py-3">{r.weatherCondition}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                              No records found for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar - Actions & AI */}
              <div className="space-y-6">
                {/* AI Audit Section */}
                <div className="bg-gradient-to-br from-slate-800 to-indigo-900 rounded-xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <BrainCircuit className="text-blue-400" />
                    <h3 className="font-bold text-lg">AI Audit Agent</h3>
                  </div>
                  <p className="text-slate-300 text-sm mb-6">
                    Analyze the selected {reportType.toLowerCase()} data for production efficiency, accident correlation, and weather impact.
                  </p>
                  
                  <button 
                    onClick={handleAudit}
                    disabled={loadingAudit || filteredData.length === 0}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingAudit ? <Loader2 className="animate-spin" size={20} /> : 'Generate Audit Report'}
                  </button>
                </div>

                {auditResult && (
                  <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="font-bold text-indigo-900 border-b border-indigo-100 pb-2 mb-3">Audit Findings</h4>
                    <div className="prose prose-sm prose-indigo max-h-96 overflow-y-auto custom-scroll text-slate-600">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{auditResult}</pre>
                    </div>
                  </div>
                )}
                
                {/* Cloud Export Simulation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-800 mb-2">Cloud Storage</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Download complete dataset to upload to your Cloud Storage for Power BI integration.
                  </p>
                  <button 
                    onClick={handleExport}
                    className="w-full border border-gray-300 hover:border-green-500 text-gray-700 hover:text-green-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download for Power BI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}