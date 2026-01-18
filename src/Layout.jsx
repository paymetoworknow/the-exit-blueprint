import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Lightbulb, 
  Building2, 
  Rocket, 
  Calculator, 
  Shield, 
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stages = [
  { id: 1, name: 'The Oracle', subtitle: 'Ideation & Validation', icon: Lightbulb, page: 'Stage1Oracle', color: 'from-violet-500 to-purple-600' },
  { id: 2, name: 'The Architect', subtitle: 'Operational Setup', icon: Building2, page: 'Stage2Architect', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'The Engine', subtitle: 'Growth & Pitching', icon: Rocket, page: 'Stage3Engine', color: 'from-emerald-500 to-teal-500' },
  { id: 4, name: 'The Quant', subtitle: 'Financial Engineering', icon: Calculator, page: 'Stage4Quant', color: 'from-amber-500 to-orange-500' },
  { id: 5, name: 'The Exit Vault', subtitle: 'Due Diligence', icon: Shield, page: 'Stage5Exit', color: 'from-rose-500 to-pink-500' },
];

const utilityPages = [
  { name: 'Analytics', page: 'Analytics', icon: BarChart3 },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessCore.list('-created_date', 1),
  });

  const currentBusiness = businesses?.[0];
  const currentStage = currentBusiness?.current_stage || 1;

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style>{`
        :root {
          --bg-primary: #0a0a0f;
          --bg-secondary: #12121a;
          --bg-tertiary: #1a1a24;
          --border-color: rgba(255,255,255,0.08);
          --text-primary: #ffffff;
          --text-secondary: #a1a1aa;
          --accent-primary: #8b5cf6;
          --accent-secondary: #6366f1;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#12121a]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/5 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight">Exit Blueprint</span>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#12121a] border-r border-white/5 p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold tracking-tight">Exit Blueprint</h1>
                  <p className="text-xs text-zinc-500">Build • Scale • Exit</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent 
              currentPageName={currentPageName} 
              currentStage={currentStage}
              currentBusiness={currentBusiness}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 flex-col bg-[#12121a]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 z-40",
        sidebarOpen ? "w-72" : "w-20"
      )}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold tracking-tight">Exit Blueprint</h1>
                <p className="text-xs text-zinc-500">Build • Scale • Exit</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarContent 
            currentPageName={currentPageName} 
            currentStage={currentStage}
            currentBusiness={currentBusiness}
            collapsed={!sidebarOpen}
            onLogout={handleLogout}
          />
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a24] border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronRight className={cn("w-3 h-3 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
        sidebarOpen ? "lg:ml-72" : "lg:ml-20"
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ currentPageName, currentStage, currentBusiness, collapsed, onNavigate, onLogout }) {
  return (
    <div className="space-y-6">
      {/* Current Business Card */}
      {currentBusiness && !collapsed && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20">
          <p className="text-xs text-violet-400 uppercase tracking-wider mb-1">Active Project</p>
          <p className="font-semibold truncate">{currentBusiness.business_name}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${(currentStage / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500">{currentStage}/5</span>
          </div>
        </div>
      )}

      {/* Dashboard Link */}
      <div>
        {!collapsed && <p className="text-xs text-zinc-500 uppercase tracking-wider px-3 mb-2">Overview</p>}
        <Link 
          to={createPageUrl('Dashboard')}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPageName === 'Dashboard' 
              ? "bg-white/10 text-white" 
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            currentPageName === 'Dashboard' ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-white/5"
          )}>
            <Sparkles className="w-4 h-4" />
          </div>
          {!collapsed && <span className="font-medium">Dashboard</span>}
        </Link>
      </div>

      {/* Analytics & Utilities */}
      <div>
        {!collapsed && <p className="text-xs text-zinc-500 uppercase tracking-wider px-3 mb-2">Analytics</p>}
        <div className="space-y-1">
          {utilityPages.map((page) => {
            const Icon = page.icon;
            const isActive = currentPageName === page.page;
            return (
              <Link
                key={page.page}
                to={createPageUrl(page.page)}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isActive ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-white/5"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && <span className="font-medium">{page.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stage Navigation */}
      <div>
        {!collapsed && <p className="text-xs text-zinc-500 uppercase tracking-wider px-3 mb-2">Journey Stages</p>}
        <div className="space-y-1">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isActive = currentPageName === stage.page;
            const isUnlocked = stage.id <= currentStage || !currentBusiness;
            const isCompleted = stage.id < currentStage;

            return (
              <Link
                key={stage.id}
                to={createPageUrl(stage.page)}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive ? "bg-white/10 text-white" : "",
                  isUnlocked ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-zinc-600 cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isActive ? `bg-gradient-to-br ${stage.color}` : 
                  isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm", isActive && "text-white")}>
                      {stage.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{stage.subtitle}</p>
                  </div>
                )}
                {!collapsed && isCompleted && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Settings & Logout */}
      <div className="pt-4 border-t border-white/5">
        <Link
          to={createPageUrl('Settings')}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPageName === 'Settings' 
              ? "bg-white/10 text-white" 
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          {!collapsed && <span className="font-medium">Settings</span>}
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}