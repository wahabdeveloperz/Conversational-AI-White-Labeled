
import React, { useState, useCallback } from 'react';
import { LayoutDashboard, UserCircle, Phone, LogOut, Bot, Key } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Agent from './components/Agent';
import Evaluations from './components/Evaluations';
import Login from './components/Login';
import { Credentials } from './types';

type View = 'dashboard' | 'agent' | 'evaluations';

const App: React.FC = () => {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [view, setView] = useState<View>('dashboard');

  const handleLogin = useCallback((assistantId: string, apiToken: string) => {
    setCreds({ assistantId, apiToken });
  }, []);
  
  const handleLogout = useCallback(() => {
    setCreds(null);
  }, []);

  if (!creds) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard assistantId={creds.assistantId} apiToken={creds.apiToken} />;
      case 'agent':
        return <Agent assistantId={creds.assistantId} apiToken={creds.apiToken} />;
      case 'evaluations':
        return <Evaluations assistantId={creds.assistantId} apiToken={creds.apiToken} />;
      default:
        return <Dashboard assistantId={creds.assistantId} apiToken={creds.apiToken} />;
    }
  };

  const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <aside className="w-64 flex-shrink-0 border-r border-border p-4 flex flex-col justify-between">
        <div>
          <div className="flex flex-col mb-8 px-2">
             <div className="flex items-center">
                <Bot className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold ml-2">Vapi Dash</h1>
             </div>
             <div className="mt-4 space-y-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Assistant</p>
                    <p className="text-xs font-mono text-foreground break-all bg-muted/30 p-1 rounded mt-1">{creds.assistantId}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">API Token</p>
                    <div className="flex items-center gap-2 mt-1 bg-muted/30 p-1 rounded">
                        <Key size={10} className="text-muted-foreground" />
                        <p className="text-xs font-mono text-foreground">••••{creds.apiToken.slice(-4)}</p>
                    </div>
                </div>
             </div>
          </div>
          <nav className="space-y-2">
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              isActive={view === 'dashboard'}
              onClick={() => setView('dashboard')}
            />
            <NavItem
              icon={<UserCircle size={20} />}
              label="Agent"
              isActive={view === 'agent'}
              onClick={() => setView('agent')}
            />
            <NavItem
              icon={<Phone size={20} />}
              label="Evaluations"
              isActive={view === 'evaluations'}
              onClick={() => setView('evaluations')}
            />
          </nav>
        </div>
        <div>
            <NavItem
              icon={<LogOut size={20} />}
              label="Logout"
              isActive={false}
              onClick={handleLogout}
            />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
