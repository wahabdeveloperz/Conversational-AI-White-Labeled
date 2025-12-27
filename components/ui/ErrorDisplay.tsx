import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  details?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, details }) => (
  <div className="bg-destructive/20 border border-destructive/50 text-destructive-foreground p-4 rounded-lg flex items-start space-x-3">
    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="font-semibold">{message}</p>
      {details && <p className="text-sm opacity-80 mt-1">{details}</p>}
    </div>
  </div>
);

export default ErrorDisplay;
