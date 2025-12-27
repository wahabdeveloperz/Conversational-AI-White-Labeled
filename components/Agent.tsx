
import React, { useState, useEffect, useMemo } from 'react';
import { getAgentInfo, updateAgentInfo } from '../services/api';
import { AgentInfo } from '../types';
import { Loader2 } from 'lucide-react';
import SkeletonLoader from './ui/SkeletonLoader';
import ErrorDisplay from './ui/ErrorDisplay';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
  <div className="bg-card p-6 rounded-lg border border-border">
    <h3 className="text-md font-semibold text-muted-foreground mb-3">{title}</h3>
    <div className="text-card-foreground">{children}</div>
  </div>
);

const EditCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
  <div className="bg-card p-6 rounded-lg border border-border">
    <label className="text-md font-semibold text-muted-foreground mb-3 block">{title}</label>
    {children}
  </div>
);

interface AgentProps {
  assistantId: string;
  apiToken: string;
}

const Agent: React.FC<AgentProps> = ({ assistantId, apiToken }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [agentData, setAgentData] = useState<AgentInfo | null>(null);
  const [editableData, setEditableData] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!assistantId || !apiToken) return;
      try {
        setIsLoading(true);
        const data = await getAgentInfo(assistantId, apiToken);
        setAgentData(data);
        setEditableData(JSON.parse(JSON.stringify(data))); // Deep copy for editing
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load assistant configuration from Vapi.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgentData();
  }, [assistantId, apiToken]);

  const handleEditToggle = () => {
    if (isEditing) {
      // If cancelling, revert changes
      setEditableData(JSON.parse(JSON.stringify(agentData)));
    }
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if(editableData) {
          setEditableData({ ...editableData, [name]: name === 'temperature' ? parseFloat(value) : value });
      }
  }
  
  const handleUpdate = async () => {
      if(!editableData || !assistantId || !apiToken) return;
      try {
          setIsSaving(true);
          const updatedData = await updateAgentInfo(editableData, assistantId, apiToken);
          setAgentData(updatedData);
          setIsEditing(false);
          setError(null);
      } catch(err: any) {
          setError(err.message || "Failed to update assistant settings in Vapi.");
          console.error(err);
      } finally {
          setIsSaving(false);
      }
  }

  const hasChanges = useMemo(() => {
      return JSON.stringify(agentData) !== JSON.stringify(editableData);
  }, [agentData, editableData]);

  if (isLoading) {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <SkeletonLoader className="h-9 w-72" />
                <SkeletonLoader className="h-10 w-24" />
            </div>
            <div className="space-y-6">
                <SkeletonLoader className="h-24 w-full" />
                <SkeletonLoader className="h-48 w-full" />
                <SkeletonLoader className="h-40 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <SkeletonLoader className="h-24 w-full" />
                    <SkeletonLoader className="h-24 w-full" />
                    <SkeletonLoader className="h-24 w-full" />
                    <SkeletonLoader className="h-24 w-full" />
                </div>
            </div>
        </div>
    );
  }
  
  if (error) {
    return <div className="max-w-4xl mx-auto"><ErrorDisplay message={error} /></div>;
  }
  
  if (!agentData || !editableData) {
    return <div className="text-center text-muted-foreground py-10">No assistant data available.</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vapi Configuration</h1>
        <div className="flex items-center gap-2">
            {isEditing && (
                 <button 
                    onClick={handleUpdate}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center"
                 >
                   {isSaving && <Loader2 className="animate-spin h-4 w-4 mr-2"/>}
                   Sync to Vapi
                 </button>
            )}
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 text-sm font-semibold border border-border bg-secondary hover:bg-accent rounded-md transition-colors"
            >
              {isEditing ? 'Discard' : 'Edit Configuration'}
            </button>
        </div>
      </div>
      
      <div className="space-y-6">
          {isEditing ? (
              <>
                <EditCard title="Assistant Name">
                    <input type="text" name="name" value={editableData.name} onChange={handleInputChange} className="w-full bg-input border border-border p-2 rounded-md text-lg"/>
                </EditCard>
                <EditCard title="System Prompt (Instructions)">
                    <textarea name="instructions" value={editableData.instructions} onChange={handleInputChange} rows={10} className="w-full whitespace-pre-wrap font-mono text-sm bg-input border border-border p-4 rounded-md"/>
                </EditCard>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <EditCard title="Voice ID">
                        <input type="text" name="voiceId" value={editableData.voiceId} onChange={handleInputChange} className="w-full font-mono text-sm bg-input border border-border p-2 rounded-md"/>
                    </EditCard>
                    <EditCard title="Model">
                        <input type="text" name="model" value={editableData.model} onChange={handleInputChange} className="w-full font-mono text-sm bg-input border border-border p-2 rounded-md"/>
                    </EditCard>
                    <EditCard title="Temperature">
                        <input type="number" name="temperature" value={editableData.temperature} onChange={handleInputChange} step="0.1" min="0" max="1" className="w-full font-mono text-sm bg-input border border-border p-2 rounded-md"/>
                    </EditCard>
                     <EditCard title="First Message">
                        <input type="text" name="firstSentence" value={editableData.firstSentence} onChange={handleInputChange} className="w-full bg-input border border-border p-2 rounded-md italic"/>
                    </EditCard>
                </div>
              </>
          ) : (
              <>
                <InfoCard title="Assistant Name">
                  <p className="text-lg font-bold">{agentData.name}</p>
                </InfoCard>
                
                <InfoCard title="System Prompt">
                  <div className="max-h-80 overflow-y-auto bg-muted/30 p-4 rounded-md border border-border">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                      {agentData.instructions}
                    </pre>
                  </div>
                </InfoCard>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <InfoCard title="Voice ID">
                        <p className="font-mono text-sm text-primary">{agentData.voiceId}</p>
                    </InfoCard>
                    <InfoCard title="Model">
                        <p className="font-mono text-sm text-primary">{agentData.model}</p>
                    </InfoCard>
                    <InfoCard title="Temperature">
                        <p className="font-mono text-sm">{agentData.temperature}</p>
                    </InfoCard>
                     <InfoCard title="First Message">
                        <p className="italic text-muted-foreground">"{agentData.firstSentence}"</p>
                    </InfoCard>
                </div>
              </>
          )}
      </div>
    </div>
  );
};

export default Agent;
