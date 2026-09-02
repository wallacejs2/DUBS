
import React, { useState, useEffect } from 'react';
import {
  Building2, Users, ClipboardCheck, LayoutDashboard,
  Sparkles, Moon, Sun, Briefcase, Package,
  CalendarDays, NotebookPen
} from 'lucide-react';
import DealershipsPage from './pages/DealershipsPage.tsx';
import EnterpriseGroupsPage from './pages/EnterpriseGroupsPage.tsx';
import QAPage from './pages/QAPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import NewFeaturesPage from './pages/NewFeaturesPage.tsx';
import TeamMembersPage from './pages/TeamMembersPage.tsx';
import ProvidersProductsPage from './pages/ProvidersProductsPage.tsx';
import MeetingsPage from './pages/MeetingsPage.tsx';
import NotesPage from './pages/NotesPage.tsx';
import { DealershipFilterState, NewFeatureFilterState } from './types.ts';

type NavPage = 'dealerships' | 'groups' | 'qa' | 'dashboard' | 'features' | 'team' | 'providers_products' | 'meetings' | 'notes';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  // Lifted Dealership Filter State
  const [dealershipFilters, setDealershipFilters] = useState<DealershipFilterState>({
    search: '', status: '', group: '', issue: '', managed: '', addl_web: '', cif: '', client_id: '', order_id: '', sms: '', one_time: '',
    received_month: '', onboarding_month: '', go_live_month: '', term_month: ''
  });

  // Lifted New Features Filter State
  const [featureFilters, setFeatureFilters] = useState<NewFeatureFilterState>({
    search: '', source: '', type: '', quarter: '', year: '', status: '', platform: ''
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
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
    { id: 'team', label: 'Team Members', icon: Briefcase },
    { id: 'providers_products', label: 'Providers & Products', icon: Package },
    { id: 'features', label: 'New Features', icon: Sparkles },
    { id: 'meetings', label: 'Meetings', icon: CalendarDays },
    { id: 'notes', label: 'Notes & Tasks', icon: NotebookPen },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dealerships': return <DealershipsPage filters={dealershipFilters} setFilters={setDealershipFilters} />;
      case 'groups': return <EnterpriseGroupsPage />;
      case 'qa': return <QAPage />;
      case 'features': return <NewFeaturesPage filters={featureFilters} setFilters={setFeatureFilters} />;
      case 'team': return <TeamMembersPage />;
      case 'providers_products': return <ProvidersProductsPage />;
      case 'meetings': return <MeetingsPage />;
      case 'notes': return <NotesPage />;
      case 'dashboard': return (
        <DashboardPage
          onNavigateToDealerships={(filters) => {
            setDealershipFilters(prev => ({ ...prev, ...filters }));
            setActivePage('dealerships');
          }}
        />
      );
      default: return (
        <DashboardPage
          onNavigateToDealerships={(filters) => {
            setDealershipFilters(prev => ({ ...prev, ...filters }));
            setActivePage('dealerships');
          }}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* iOS-style Sidebar with vibrancy */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-xl backdrop-saturate-150 flex flex-col z-50 border-r border-slate-200/60 dark:border-[#38383A]">

        {/* Brand / Logo */}
        <div className="flex items-center h-[56px] px-3.5 mb-1 justify-start">
           <div className="w-8 h-8 bg-blue-500 rounded-[10px] flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
             C
           </div>
           <div className="ml-3 font-semibold text-slate-800 dark:text-slate-200 tracking-wide whitespace-nowrap">
             CURATOR
           </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
           {navItems.map((item) => {
             const isActive = activePage === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => setActivePage(item.id as NavPage)}
                 className={`
                   relative flex items-center h-[38px] rounded-xl transition-all duration-200 group flex-shrink-0
                   focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 outline-none
                   ${isActive
                      ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                   }
                   px-3 justify-start
                 `}
               >
                 <item.icon
                    size={18}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className="flex-shrink-0 transition-all duration-200"
                 />

                 {/* Text Label */}
                 <span className="ml-3 font-medium text-sm whitespace-nowrap">
                   {item.label}
                 </span>
               </button>
             );
           })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-0.5 p-2 border-t border-slate-200/40 dark:border-[#38383A]">
           <button
             onClick={toggleDarkMode}
             className={`
               flex items-center h-[38px] rounded-xl transition-all duration-200 group flex-shrink-0
               text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200
               focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 outline-none
               px-3 justify-start
             `}
           >
              {isDarkMode ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
              <span className="ml-3 font-medium text-sm whitespace-nowrap">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-col min-h-screen ml-[240px]">
        {/* iOS-style translucent header — Thick material */}
        <header className="h-12 bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-xl backdrop-saturate-150 border-b border-slate-200/60 dark:border-[#38383A] flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            {navItems.find(i => i.id === activePage)?.label}
          </h2>
        </header>

        {/* Viewport */}
        <div className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
