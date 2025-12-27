
import React, { useState } from 'react';
import { Bot, Key, User } from 'lucide-react';

interface LoginProps {
  onLogin: (assistantId: string, apiToken: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [assistantId, setAssistantId] = useState('');
  const [apiToken, setApiToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(assistantId.trim() && apiToken.trim()) {
        onLogin(assistantId.trim(), apiToken.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl border border-border shadow-lg">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">Vapi Dashboard</h1>
          <p className="text-muted-foreground">Enter your credentials to access live data</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="apiToken" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Key size={14} /> Private API Token
              </label>
              <input
                id="apiToken"
                name="apiToken"
                type="password"
                required
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="vapi-private-token-..."
                className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm font-mono"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Find this in your Vapi Dashboard -> Settings -> API Keys</p>
            </div>
            <div>
              <label htmlFor="assistantId" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User size={14} /> Assistant ID
              </label>
              <input
                id="assistantId"
                name="assistantId"
                type="text"
                autoComplete="off"
                required
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                placeholder="e.g., 550e8400-e29b-..."
                className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 transition-all"
              disabled={!assistantId.trim() || !apiToken.trim()}
            >
              Connect to Vapi
            </button>
          </div>
          <div className="text-center pt-2">
            <a 
              href="https://dashboard.vapi.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
            >
              Go to Vapi Dashboard
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
