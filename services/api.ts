
import type { AgentInfo, Call, EvaluationStatus } from '../types';
import { EvaluationStatus as EvaluationStatusEnum } from '../types';

const VAPI_BASE_URL = 'https://api.vapi.ai';

/**
 * Utility to make Vapi API calls
 */
const vapiFetch = async (endpoint: string, apiToken: string, options: RequestInit = {}) => {
  const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `Vapi API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Map Vapi Assistant to AgentInfo
 */
export const getAgentInfo = async (assistantId: string, apiToken: string): Promise<AgentInfo> => {
  const data = await vapiFetch(`/assistant/${assistantId}`, apiToken);

  // Extract instructions from model messages (usually the first 'assistant' or 'system' role)
  const instructions = data.model?.messages?.find((m: any) => m.role === 'system' || m.role === 'assistant')?.content || '';

  return {
    name: data.name || 'Unnamed Assistant',
    instructions: instructions,
    roleplay: `Vapi Assistant: ${data.name}. Provider: ${data.model?.provider || 'Unknown'}`,
    voiceId: data.voice?.voiceId || 'N/A',
    model: data.model?.model || 'N/A',
    temperature: data.model?.temperature ?? 0.7,
    firstSentence: data.firstMessage || '',
  };
};

/**
 * Update Vapi Assistant settings
 */
export const updateAgentInfo = async (updatedInfo: AgentInfo, assistantId: string, apiToken: string): Promise<AgentInfo> => {
  const payload = {
    name: updatedInfo.name,
    firstMessage: updatedInfo.firstSentence,
    model: {
      model: updatedInfo.model,
      temperature: updatedInfo.temperature,
      messages: [
          {
              role: 'system',
              content: updatedInfo.instructions
          }
      ]
    },
    voice: {
        voiceId: updatedInfo.voiceId
    }
  };

  await vapiFetch(`/assistant/${assistantId}`, apiToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return updatedInfo;
};

/**
 * Fetch and map Vapi Calls
 */
export const getCalls = async (assistantId: string, apiToken: string): Promise<Call[]> => {
  const calls = await vapiFetch(`/call?assistantId=${assistantId}&limit=50`, apiToken);

  if (!Array.isArray(calls)) return [];

  return calls.map((item: any): Call => {
    // Duration calculation
    let durationStr = '0:00';
    if (item.startedAt && item.endedAt) {
        const start = new Date(item.startedAt).getTime();
        const end = new Date(item.endedAt).getTime();
        const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
        const mins = Math.floor(diffSecs / 60);
        const secs = (diffSecs % 60).toString().padStart(2, '0');
        durationStr = `${mins}:${secs}`;
    }

    // Map evaluation status
    let evaluation: EvaluationStatus = EvaluationStatusEnum.NoAnswer;
    const successEval = item.analysis?.successEvaluation?.toLowerCase() || '';
    const endedReason = item.endedReason?.toLowerCase() || '';

    if (successEval.includes('true') || successEval.includes('success') || successEval === '1') {
        evaluation = EvaluationStatusEnum.Successful;
    } else if (endedReason.includes('customer-ended-call') || endedReason.includes('assistant-ended-call')) {
        evaluation = EvaluationStatusEnum.Successful; 
    } else if (endedReason.includes('error') || endedReason.includes('failed')) {
        evaluation = EvaluationStatusEnum.Failed;
    }

    return {
      id: item.id,
      date: item.startedAt ? new Date(item.startedAt).toLocaleString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric', 
          hour: 'numeric', minute: '2-digit', hour12: true 
      }) : 'N/A',
      agent: item.assistant?.name || assistantId.slice(0, 8),
      duration: durationStr,
      messages: item.messages?.length || 0,
      evaluation,
      summary: item.analysis?.summary || 'No summary generated.',
      cost: item.cost ?? 0,
      transcription: [], // Filled during detail view
      clientData: { 
          'Phone': item.customer?.number || 'Unknown',
          'Source': item.type || 'Direct'
      },
    };
  });
};

/**
 * Fetch Full Call Details and Transcription
 */
export const getCallDetails = async (call: Call, assistantId: string, apiToken: string): Promise<Call> => {
  const details = await vapiFetch(`/call/${call.id}`, apiToken);

  // Map messages to transcription format
  const transcription = (details.artifact?.messages || details.messages || []).map((msg: any) => {
    const timeInSecs = msg.secondsFromStart || 0;
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60).toString().padStart(2, '0');
    
    return {
        speaker: msg.role === 'assistant' ? 'Agent' : 'User',
        text: msg.message || '',
        timestamp: `${mins}:${secs}`
    };
  });

  return { 
    ...call, 
    summary: details.analysis?.summary || call.summary, 
    transcriptSummary: details.analysis?.summary,
    transcription, 
    status: details.status,
    terminationReason: details.endedReason,
    charges: {
        call: details.costBreakdown?.transport || 0,
        llm: details.costBreakdown?.llm || 0
    },
    cost: details.cost || call.cost,
    ragUsage: {
        count: 0, // Vapi doesn't expose RAG count directly in the same way
        model: details.model?.model || 'N/A'
    },
  };
};
