
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ClipboardCheck, LayoutDashboard, 
  Menu, Search, Sparkles, Moon, Sun 
} from 'lucide-react';
import DealershipsPage from './pages/DealershipsPage.tsx';
import EnterpriseGroupsPage from './pages/EnterpriseGroupsPage.tsx';
import QAPage from './pages/QAPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import NewFeaturesPage from './pages/NewFeaturesPage.tsx';

type NavPage = 'dealerships' | 'groups' | 'qa' | 'dashboard' | 'features';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (localStorage.getItem('theme') === 'dark' || 
       (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dealerships', label: 'Dealerships', icon: Building2 },
    { id: 'groups', label: 'Enterprise Groups', icon: Users },
    { id: 'qa', label: 'QA Shoppers', icon: ClipboardCheck },
    { id: 'features', label: 'New Features', icon: Sparkles },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dealerships': return <DealershipsPage />;
      case 'groups': return <EnterpriseGroupsPage />;
      case 'qa': return <QAPage />;
      case 'features': return <NewFeaturesPage />;
      case 'dashboard': return <DashboardPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden text-xs transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-56' : 'w-16'
        } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col z-40 relative`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
             <span className="text-white font-bold text-lg">C</span>
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-indigo-900 dark:text-indigo-100">CURATOR</span>}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as NavPage)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                activePage === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={18} strokeWidth={activePage === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span className="text-[13px]">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={toggleDarkMode}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200`}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {isSidebarOpen && <span className="text-[13px]">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500"
            >
              <Menu size={18} />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Global search..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-full w-56 text-[12px] text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
