
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowDown, Search } from 'lucide-react';
import { getCalls } from '../services/api';
import { Call, EvaluationStatus } from '../types';
import EvaluationBadge from './ui/EvaluationBadge';
import CallDetailView from './CallDetailView';
import SkeletonLoader from './ui/SkeletonLoader';
import ErrorDisplay from './ui/ErrorDisplay';

interface EvaluationsProps {
  assistantId: string;
  apiToken: string;
}

const Evaluations: React.FC<EvaluationsProps> = ({ assistantId, apiToken }) => {
  const [allCalls, setAllCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateAfter: '',
    dateBefore: '',
    customer: '',
    evaluation: '',
  });

  useEffect(() => {
    const fetchCalls = async () => {
        if (!assistantId || !apiToken) return;
        try {
            setLoading(true);
            const callsData = await getCalls(assistantId, apiToken);
            setAllCalls(callsData);
            setError(null);
        } catch(err: any) {
            setError(err.message || 'Failed to fetch call history from Vapi.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    fetchCalls();
  }, [assistantId, apiToken]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const resetFilters = () => {
      setSearchTerm('');
      setFilters({
          dateAfter: '',
          dateBefore: '',
          customer: '',
          evaluation: '',
      });
  }

  const filteredCalls = useMemo(() => {
    return allCalls.filter(call => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchTermMatch = lowerCaseSearchTerm === '' ||
        call.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
        call.transcription.some(t => t.text.toLowerCase().includes(lowerCaseSearchTerm));

      const customerMatch = filters.customer.trim().toLowerCase() === '' ||
        (call.clientData['Phone'] || '').toLowerCase().includes(filters.customer.trim().toLowerCase());

      const evaluationMatch = filters.evaluation === '' || call.evaluation === filters.evaluation;
      
      return searchTermMatch && customerMatch && evaluationMatch;
    });
  }, [allCalls, searchTerm, filters]);
  
  const inputBaseClasses = "px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md border border-border focus:ring-ring focus:border-ring outline-none transition-colors";

  const renderTableBody = () => {
    if (loading) {
        return (
            <>
            {Array.from({length: 10}).map((_, i) => (
                <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4"><SkeletonLoader className="h-5 w-32" /></td>
                    <td className="py-3 px-4"><SkeletonLoader className="h-5 w-24" /></td>
                    <td className="py-3 px-4"><SkeletonLoader className="h-5 w-16" /></td>
                    <td className="py-3 px-4"><SkeletonLoader className="h-5 w-12" /></td>
                    <td className="py-3 px-4"><SkeletonLoader className="h-6 w-28" /></td>
                </tr>
            ))}
            </>
        )
    }

    if (error) {
        return (
            <tr>
                <td colSpan={5} className="p-4">
                    <ErrorDisplay message={error} details="Vapi was unable to return your call history." />
                </td>
            </tr>
        )
    }

    if (filteredCalls.length === 0) {
       return (
        <tr>
            <td colSpan={5} className="text-center py-12 text-muted-foreground">
                No calls found matching your criteria.
            </td>
        </tr>
       );
    }

    return filteredCalls.map((call) => (
      <tr
          key={call.id}
          className="border-b border-border hover:bg-muted/50 cursor-pointer"
          onClick={() => setSelectedCall(call)}
      >
          <td className="py-3 px-4 text-sm">{call.date}</td>
          <td className="py-3 px-4 text-sm">{call.clientData['Phone'] || '-'}</td>
          <td className="py-3 px-4 text-sm">{call.duration}</td>
          <td className="py-3 px-4 text-sm">{call.messages}</td>
          <td className="py-3 px-4">
          <EvaluationBadge status={call.evaluation} />
          </td>
      </tr>
    ));
  };


  return (
    <div className="relative">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vapi Call History</h1>
        
        <div className="bg-card p-4 rounded-lg border border-border space-y-4">
          <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                  type="text"
                  placeholder="Search by summary keywords..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md text-sm focus:ring-ring focus:border-ring outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search calls"
              />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
            <input 
                type="text"
                name="customer"
                placeholder="Phone number"
                aria-label="Filter by phone number"
                value={filters.customer}
                onChange={handleFilterChange}
                className={`${inputBaseClasses} w-36`}
            />
            <select
                name="evaluation"
                aria-label="Filter by evaluation status"
                value={filters.evaluation}
                onChange={handleFilterChange}
                className={`${inputBaseClasses} appearance-none`}
            >
                <option value="">All Statuses</option>
                {Object.values(EvaluationStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
            <button onClick={resetFilters} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Reset</button>
          </div>
        </div>


        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="py-3 px-4 font-medium text-sm text-muted-foreground">
                    <div className="flex items-center">
                      Started At <ArrowDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium text-sm text-muted-foreground">Customer</th>
                  <th className="py-3 px-4 font-medium text-sm text-muted-foreground">Duration</th>
                  <th className="py-3 px-4 font-medium text-sm text-muted-foreground">Turns</th>
                  <th className="py-3 px-4 font-medium text-sm text-muted-foreground">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedCall && (
        <CallDetailView 
            call={selectedCall} 
            onClose={() => setSelectedCall(null)} 
            assistantId={assistantId} 
            apiToken={apiToken}
        />
      )}
    </div>
  );
};

export default Evaluations;
