import React from 'react';
import { LayoutDashboard, GitFork, Package, Info, ChevronRight, X } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  appVersion: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  appVersion
}) => {
  const menuItems = [
    {
      id: 'funnelboard',
      label: 'FunnelBoard',
      description: 'UI Hierarchy Inspector & Canvas',
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
      description: 'System details and licenses',
      icon: Info
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:hidden'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Top bar inside sidebar for mobile */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 md:hidden">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Navigation</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu items */}
        <div className="p-3 space-y-1.5 flex-1">
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
                className={`w-full group flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>

                {isActive && (
                  <ChevronRight className="w-4 h-4 text-blue-500 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>FunnelPeek Next</span>
          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
            v{appVersion}
          </span>
        </div>
      </div>
    </aside>
  );
};
