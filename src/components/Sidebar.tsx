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
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-jb-panel border-r border-slate-200 dark:border-jb-border transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 shadow-xl md:shadow-none' : '-translate-x-full md:hidden'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Top bar inside sidebar for mobile */}
        <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-jb-border md:hidden">
          <span className="font-semibold text-xs text-slate-800 dark:text-jb-text">Navigation</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-jb-hover text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu items */}
        <div className="p-2 space-y-1 flex-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full group flex items-center gap-2.5 px-3 py-2 rounded transition-colors text-left text-xs ${
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
                </div>

                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 dark:text-jb-accent self-center shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info with ADB & Dark/Light mode buttons to the right of version */}
        <div className="p-2.5 border-t border-slate-100 dark:border-jb-border text-[11px] text-slate-400 dark:text-jb-textMuted flex items-center justify-between gap-1.5">
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
  );
};
