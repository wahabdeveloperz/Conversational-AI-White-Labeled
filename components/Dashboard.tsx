
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getCalls } from '../services/api';
import { Call, EvaluationStatus } from '../types';
import EvaluationBadge from './ui/EvaluationBadge';
import SkeletonLoader from './ui/SkeletonLoader';
import ErrorDisplay from './ui/ErrorDisplay';

const COLORS = {
  [EvaluationStatus.Successful]: '#22c55e',
  [EvaluationStatus.NoAnswer]: '#f97316',
  [EvaluationStatus.Failed]: '#ef4444',
};

const KpiCard: React.FC<{ title: string; value: string; isLoading: boolean }> = ({ title, value, isLoading }) => (
  <div className="bg-card p-6 rounded-lg border border-border">
    <p className="text-sm text-muted-foreground">{title}</p>
    {isLoading ? <SkeletonLoader className="h-9 w-24 mt-1" /> : <p className="text-3xl font-bold mt-1">{value}</p>}
  </div>
);

interface DashboardProps {
  assistantId: string;
  apiToken: string;
}

const Dashboard: React.FC<DashboardProps> = ({ assistantId, apiToken }) => {
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpiData, setKpiData] = useState([
    { title: 'Number of Calls', value: '...' },
    { title: 'Average Duration', value: '...' },
    { title: 'Total Cost', value: '...' },
    { title: 'Total Minutes', value: '...' },
  ]);
  const [successRateData, setSuccessRateData] = useState<{name: string; value: number}[]>([]);
  const [usageData, setUsageData] = useState<{name: string, calls: number}[]>([]);


  useEffect(() => {
    const fetchAndProcessCalls = async () => {
      if (!assistantId || !apiToken) return;
      try {
        setLoading(true);
        const allCalls = await getCalls(assistantId, apiToken);
        setRecentCalls(allCalls.slice(0, 5));
        setError(null);

        if (allCalls.length > 0) {
            // Calculate KPIs
            const totalSeconds = allCalls.reduce((acc, call) => {
                const parts = call.duration.split(':').map(Number);
                if (parts.length === 2) {
                    return acc + (parts[0] * 60 + parts[1]);
                }
                return acc;
            }, 0);

            const avgSeconds = Math.round(totalSeconds / allCalls.length);
            const avgMinutes = Math.floor(avgSeconds / 60);
            const avgRemainingSeconds = (avgSeconds % 60).toString().padStart(2, '0');
            const totalCost = allCalls.reduce((acc, call) => acc + (call.cost || 0), 0);

            setKpiData([
                { title: 'Number of Calls', value: allCalls.length.toLocaleString() },
                { title: 'Average Duration', value: `${avgMinutes}:${avgRemainingSeconds}` },
                { title: 'Total Cost', value: `$${totalCost.toFixed(2)}` },
                { title: 'Total Minutes', value: Math.floor(totalSeconds / 60).toLocaleString() },
            ]);

            // Calculate Success Rate
            const successCounts = allCalls.reduce((acc, call) => {
                acc[call.evaluation] = (acc[call.evaluation] || 0) + 1;
                return acc;
            }, {} as Record<EvaluationStatus, number>);
            
            setSuccessRateData(Object.entries(successCounts).map(([name, value]) => ({ name, value })));

            // Calculate Usage (by date)
            const daysMap: Record<string, number> = {};
            // Last 7 days
            for(let i=6; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                daysMap[label] = 0;
            }

            allCalls.forEach(call => {
                const callDate = new Date(call.date);
                const label = callDate.toLocaleDateString('en-US', { weekday: 'short' });
                if (daysMap[label] !== undefined) {
                    daysMap[label]++;
                }
            });
            
            setUsageData(Object.entries(daysMap).map(([name, calls]) => ({ name, calls })));
        } else {
             setKpiData([
                { title: 'Number of Calls', value: '0' },
                { title: 'Average Duration', value: '0:00' },
                { title: 'Total Cost', value: '$0.00' },
                { title: 'Minutes Used', value: '0' },
            ]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch call data from Vapi.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessCalls();
  }, [assistantId, apiToken]);

  const renderRecentCalls = () => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              <td className="py-3 px-4"><SkeletonLoader className="h-4 w-32" /></td>
              <td className="py-3 px-4"><SkeletonLoader className="h-4 w-16" /></td>
              <td className="py-3 px-4"><SkeletonLoader className="h-4 w-full max-w-sm" /></td>
              <td className="py-3 px-4 text-right"><SkeletonLoader className="h-6 w-24 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (error) {
       return (
        <tbody>
          <tr>
            <td colSpan={4} className="p-4">
              <ErrorDisplay message={error} />
            </td>
          </tr>
        </tbody>
      );
    }
    
    return (
      <tbody>
        {recentCalls.map((call) => (
          <tr key={call.id} className="border-b border-border hover:bg-muted/50">
            <td className="py-3 px-4 text-sm">{call.date}</td>
            <td className="py-3 px-4 text-sm">{call.duration}</td>
            <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-sm">{call.summary}</td>
            <td className="py-3 px-4 text-right">
              <EvaluationBadge status={call.evaluation} />
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Vapi Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} isLoading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-4">Daily Volume (Last 7 Days)</h2>
           {loading ? (
             <SkeletonLoader className="h-[300px] w-full" />
           ) : (
             <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: 'rgba(161, 161, 170, 0.1)'}} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}/>
                <Bar dataKey="calls" fill="#fafafa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           )}
        </div>
        <div className="bg-card p-6 rounded-lg border border-border flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Call Success</h2>
          {loading ? (
            <div className="flex-grow flex justify-center items-center">
                <SkeletonLoader className="h-[200px] w-full" />
            </div>
          ) : (
            <>
            <div className="flex-grow flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                  <Pie
                      data={successRateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                  >
                      {successRateData.map((entry, index) => {
                         const statusKey = entry.name as keyof typeof COLORS;
                         return <Cell key={`cell-${index}`} fill={COLORS[statusKey] || '#8884d8'} />;
                      })}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}/>
                  </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col space-y-2 mt-4 text-sm">
               {successRateData.map(entry => (
                   <div key={entry.name} className="flex items-center justify-between">
                       <div className="flex items-center">
                           <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[entry.name as keyof typeof COLORS]}}></span>
                           <span>{entry.name}</span>
                       </div>
                       <span className="font-semibold">{entry.value}</span>
                   </div>
               ))}
            </div>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Latest Call Log</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Duration</th>
                  <th className="py-3 px-4 font-medium">Summary</th>
                  <th className="py-3 px-4 font-medium text-right">Result</th>
                </tr>
              </thead>
              {renderRecentCalls()}
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
