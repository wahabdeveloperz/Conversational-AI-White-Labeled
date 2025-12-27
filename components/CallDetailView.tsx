
import React, { useState, useEffect } from 'react';
import { X, Play, FileText, Activity, Info } from 'lucide-react';
import { Call, AgentInfo } from '../types';
import EvaluationBadge from './ui/EvaluationBadge';
import { getCallDetails, getAgentInfo } from '../services/api';
import SkeletonLoader from './ui/SkeletonLoader';
import ErrorDisplay from './ui/ErrorDisplay';

interface CallDetailViewProps {
  call: Call | null;
  onClose: () => void;
  assistantId: string;
  apiToken: string;
}

const AudioWaveform: React.FC = () => (
    <div className="flex items-center justify-between gap-1 h-12 w-full opacity-40">
        {Array.from({ length: 60 }).map((_, i) => {
            const height = Math.random() * 100 + 10;
            return <div key={i} className="bg-primary rounded-full w-1" style={{ height: `${height}%` }} />;
        })}
    </div>
);


const CallDetailView: React.FC<CallDetailViewProps> = ({ call, onClose, assistantId, apiToken }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [details, setDetails] = useState<Call | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (call && assistantId && apiToken) {
      const fetchDetails = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setDetails(null);
          setAgentInfo(null);
          setActiveTab('Overview'); 
          
          const [callDetails, agentDetails] = await Promise.all([
             getCallDetails(call, assistantId, apiToken),
             getAgentInfo(assistantId, apiToken),
          ]);

          setDetails(callDetails);
          setAgentInfo(agentDetails);

        } catch (err: any) {
          setError(err.message || 'Failed to load Vapi call artifacts.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    }
  }, [call, assistantId, apiToken]);

  if (!call) return null;

  const tabs = [
    { name: 'Overview', icon: <Info size={14} /> },
    { name: 'Transcription', icon: <FileText size={14} /> }
  ];
  const displayData = details || call;

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="mt-4 space-y-6 p-4">
                <SkeletonLoader className="h-16 w-full" />
                <SkeletonLoader className="h-8 w-1/3" />
                <SkeletonLoader className="h-24 w-full" />
            </div>
        )
    }
    if (error) {
        return <div className="p-4"><ErrorDisplay message={error} details="Failed to sync with Vapi servers."/></div>;
    }
    if (!details) return null;

    switch(activeTab) {
        case 'Overview':
            return (
                <div className="mt-4 space-y-8 animate-in fade-in duration-300">
                    <div className="bg-muted/20 p-5 rounded-lg border border-border">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">AI Summary</h3>
                        <p className="text-sm leading-relaxed text-foreground/90">{details.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Turns</h3>
                            <p className="text-xl font-bold">{details.messages}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Outcome</h3>
                            <div className="mt-1"><EvaluationBadge status={details.evaluation} /></div>
                        </div>
                    </div>
                </div>
            )
        case 'Transcription':
            return (
                 <div className="mt-4 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-4 custom-scrollbar">
                        {details.transcription.length > 0 ? details.transcription.map((item, index) => (
                            <div key={index} className={`flex flex-col gap-1 p-3 rounded-lg ${item.speaker === 'Agent' ? 'bg-primary/5 border-l-2 border-primary ml-4' : 'bg-muted/20 border-l-2 border-muted-foreground mr-4'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.speaker === 'Agent' ? 'text-primary' : 'text-muted-foreground'}`}>{item.speaker}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{item.timestamp}</span>
                                </div>
                                <p className="text-sm leading-snug">{item.text}</p>
                            </div>
                        )) : <p className="text-muted-foreground text-sm">No transcription generated for this call.</p>}
                    </div>
                </div>
            )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-end">
      <div className="w-full max-w-4xl h-full bg-background flex shadow-2xl overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Call Review</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{displayData.id}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground capitalize">{displayData.status}</span>
                </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="mt-10 bg-card border border-border p-6 rounded-xl">
            <div className="relative mb-6">
                <AudioWaveform />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="bg-primary text-primary-foreground p-3 rounded-full hover:scale-105 active:scale-95 transition-all">
                    <Play size={20} fill="currentColor" />
                </button>
                <div>
                    <p className="text-sm font-bold">Recording Artifact</p>
                    <p className="text-xs text-muted-foreground">Stereo Audio (24kbps)</p>
                </div>
              </div>
              <div className="text-sm font-mono text-muted-foreground bg-muted/30 px-3 py-1 rounded">
                <span>0:00 / {displayData.duration}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <div className="border-b border-border">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button 
                            key={tab.name} 
                            onClick={() => setActiveTab(tab.name)} 
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-bold uppercase tracking-wider transition-all ${
                                activeTab === tab.name 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}
          </div>
        </div>

        <aside className="w-80 border-l border-border p-8 bg-muted/10 flex-shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8">
            <Activity size={18} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Metadata Analysis</h3>
          </div>
          
          <div className="space-y-6 text-sm">
            <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Timestamp</span>
                  <span className="font-medium">{displayData.date}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Ended Reason</span>
                  <span className="font-mono text-[11px] bg-muted/50 p-2 rounded break-all">{displayData.terminationReason || 'N/A'}</span>
                </div>
            </div>

            <div className="h-px bg-border my-6" />
            
            <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-primary mb-3">Cost Breakdown</h4>
                <div className="flex justify-between items-center bg-card/50 p-3 rounded border border-border/50">
                    <span className="text-muted-foreground">Total Billable</span>
                    <span className="font-bold text-lg">${displayData.cost.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted/20 rounded">
                        <span className="text-[10px] text-muted-foreground block mb-1">Vapi (LLM)</span>
                        <span className="font-mono text-xs">${displayData.charges?.llm.toFixed(4)}</span>
                    </div>
                    <div className="p-3 bg-muted/20 rounded">
                        <span className="text-[10px] text-muted-foreground block mb-1">Transport</span>
                        <span className="font-mono text-xs">${displayData.charges?.call.toFixed(4)}</span>
                    </div>
                </div>
            </div>

            {agentInfo && (
                <>
                    <div className="h-px bg-border my-6" />
                    <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-bold text-primary mb-3">Model Params</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Provider</span>
                                <span className="font-mono text-xs">{agentInfo.model.split('-')[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Model</span>
                                <span className="font-mono text-xs">{agentInfo.model}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Temperature</span>
                                <span className="font-mono text-xs">{agentInfo.temperature}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground mb-1">Voice ID</span>
                                <span className="font-mono text-[10px] truncate bg-muted/50 p-1 rounded" title={agentInfo.voiceId}>{agentInfo.voiceId}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CallDetailView;
