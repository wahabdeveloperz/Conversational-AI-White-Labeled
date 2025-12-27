
export enum EvaluationStatus {
  Successful = 'Successful',
  NoAnswer = 'No answer',
  Failed = 'Failed',
}

export type Call = {
  id: string;
  date: string;
  agent: string;
  duration: string;
  messages: number;
  evaluation: EvaluationStatus;
  summary: string;
  cost: number;
  transcription: { speaker: string; text: string; timestamp: string }[];
  clientData: Record<string, string>;

  // Optional detailed fields from Vapi
  status?: string;
  terminationReason?: string;
  transcriptSummary?: string;
  charges?: {
    call: number;
    llm: number;
  };
  ragUsage?: {
    count: number;
    model: string;
  };
};

export type AgentInfo = {
  name: string;
  instructions: string;
  roleplay: string;
  voiceId: string;
  model: string;
  temperature: number;
  firstSentence: string;
};

export type Credentials = {
  assistantId: string;
  apiToken: string;
};
