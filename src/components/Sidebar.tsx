import React from 'react';
import { LayoutDashboard, GitFork, Package, Info, ChevronRight, X, Terminal, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  appVersion: string;
  adbPath: string | null;
  adbVersion: string | null;
  onOpenAdbModal: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  appVersion,
  adbPath,
  adbVersion,
  onOpenAdbModal,
  darkMode,
  setDarkMode
}) => {
  const menuItems = [
    {
      id: 'funnelboard',
      label: 'Funnel Board',
      description: 'UI Inspector & Canvas',
      icon: LayoutDashboard
    },
    {
      id: 'funnelflow',
      label: 'Funnel Flow',
      description: 'Multi-screen Flow Sequencer',
      icon: GitFork,
      badge: 'NEW'
    },
    {
      id: 'packages',
      label: 'App Manager',
      description: 'Manage & Install Packages',
      icon: Package
    },
    {
      id: 'about',
      label: 'About & Info',
      description: 'System details & licenses',
      icon: Info
    }
  ];

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity"
        />
      )}

      {/* Floating Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-jb-panel border-r border-slate-200 dark:border-jb-border shadow-2xl transition-transform duration-200 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Top header inside sidebar */}
          <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-jb-border">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-jb-accent/15 border border-jb-accent/30 flex items-center justify-center overflow-hidden">
                <img src="/FP2.png" alt="FP" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
              <span className="font-semibold text-xs text-slate-800 dark:text-jb-text">Navegação</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-500 dark:text-jb-textMuted hover:text-slate-700 dark:hover:text-jb-text transition-colors"
              title="Fechar Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu items */}
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full group flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left text-xs ${
                    isActive
                      ? 'bg-blue-50 dark:bg-jb-accentHover text-blue-700 dark:text-white font-medium border border-blue-200 dark:border-jb-accent'
                      : 'text-slate-600 dark:text-jb-text hover:bg-slate-100 dark:hover:bg-jb-hover hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-jb-accent' : 'text-slate-400 dark:text-jb-textMuted group-hover:text-slate-600 dark:group-hover:text-jb-text'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-jb-hover text-indigo-700 dark:text-jb-accent border border-indigo-200 dark:border-jb-border">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-jb-textMuted block truncate">
                      {item.description}
                    </span>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500 dark:text-jb-accent self-center shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer info with ADB & Dark/Light mode buttons to the right of version */}
          <div className="p-2.5 border-t border-slate-100 dark:border-jb-border text-[11px] text-slate-400 dark:text-jb-textMuted flex items-center justify-between gap-1.5 shrink-0 bg-slate-50/50 dark:bg-jb-bg/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">FunnelPeek Next</span>
              <span className="font-mono bg-slate-100 dark:bg-jb-elevated dark:text-jb-text px-1 py-0.2 rounded text-[10px] border border-slate-200 dark:border-jb-border shrink-0">
                v{appVersion}
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {/* ADB Config Button */}
              <button
                onClick={onOpenAdbModal}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text border border-transparent hover:border-slate-200 dark:hover:border-jb-border transition-colors relative"
                title={adbPath ? `ADB: ${adbPath} (${adbVersion || 'Conectado'})` : 'Configurar caminho do ADB'}
              >
                <Terminal className="w-3.5 h-3.5 text-jb-accent" />
                {adbVersion && (
                  <span className="w-1.5 h-1.5 rounded-full bg-jb-success absolute top-0.5 right-0.5" />
                )}
              </button>

              {/* Dark / Light Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-600 dark:text-jb-text border border-transparent hover:border-slate-200 dark:hover:border-jb-border transition-colors"
                title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-jb-warning" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
