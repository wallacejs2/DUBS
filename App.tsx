
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ClipboardCheck, LayoutDashboard, 
  Menu, Search, Sparkles, Moon, Sun, Briefcase, Package,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import DealershipsPage from './pages/DealershipsPage.tsx';
import EnterpriseGroupsPage from './pages/EnterpriseGroupsPage.tsx';
import QAPage from './pages/QAPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import NewFeaturesPage from './pages/NewFeaturesPage.tsx';
import TeamMembersPage from './pages/TeamMembersPage.tsx';
import ProvidersProductsPage from './pages/ProvidersProductsPage.tsx';
import DealershipSidebarFilters from './components/DealershipSidebarFilters.tsx';
import { DealershipFilterState } from './types.ts';

type NavPage = 'dealerships' | 'groups' | 'qa' | 'dashboard' | 'features' | 'team' | 'providers_products';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Lifted Dealership Filter State
  const [dealershipFilters, setDealershipFilters] = useState<DealershipFilterState>({ 
    search: '', status: '', group: '', issue: '', managed: '', addl_web: '', cif: '', sms: '' 
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
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dealerships': return <DealershipsPage filters={dealershipFilters} setFilters={setDealershipFilters} />;
      case 'groups': return <EnterpriseGroupsPage />;
      case 'qa': return <QAPage />;
      case 'features': return <NewFeaturesPage />;
      case 'team': return <TeamMembersPage />;
      case 'providers_products': return <ProvidersProductsPage />;
      case 'dashboard': return <DashboardPage />;
      default: return <DashboardPage />;
    }
  };

  // Auto-expand sidebar if dealing with filters
  useEffect(() => {
    if (activePage === 'dealerships' && !isSidebarExpanded) {
        // Optional: Could auto-expand, but might be annoying. Keeping manual for now.
    }
  }, [activePage]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Collapsible Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen bg-[#0f1729] flex flex-col z-50 border-r border-white/5 transition-all duration-300 ease-in-out shadow-2xl ${isSidebarExpanded ? 'w-[240px]' : 'w-[60px]'}`}>
        
        {/* Simple Chevron Toggle Button */}
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-[20px] z-50 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 group"
          title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
           <ChevronRight 
             size={14} 
             className={`text-slate-400 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400 transition-transform duration-300 ${isSidebarExpanded ? 'rotate-180' : ''}`}
           />
        </button>

        {/* Brand / Logo */}
        <div className={`flex items-center h-[60px] px-3.5 mb-2 transition-all ${isSidebarExpanded ? 'justify-start' : 'justify-center'}`}>
           <div className="w-8 h-8 bg-[#4c6ef5] rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 cursor-pointer" onClick={() => setIsSidebarExpanded(true)}>
             C
           </div>
           <div className={`ml-3 font-bold text-white tracking-wider transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
             CURATOR
           </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
           {navItems.map((item) => {
             const isActive = activePage === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => { setActivePage(item.id as NavPage); if (item.id === 'dealerships') setIsSidebarExpanded(true); }}
                 className={`
                   relative flex items-center h-[38px] rounded-lg transition-all duration-200 group flex-shrink-0
                   ${isActive 
                      ? 'bg-[#4c6ef5] text-white shadow-md' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                   }
                   ${isSidebarExpanded ? 'px-3 justify-start' : 'justify-center px-0'}
                 `}
                 title={!isSidebarExpanded ? item.label : undefined}
               >
                 <item.icon 
                    size={18} 
                    strokeWidth={2} 
                    className={`flex-shrink-0 transition-transform duration-200 ${!isSidebarExpanded && 'group-hover:scale-110'}`} 
                 />
                 
                 {/* Text Label with Slide In Transition */}
                 <span className={`
                   ml-3 font-medium text-[13px] tracking-wide whitespace-nowrap transition-all duration-300 ease-in-out
                   ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-10 pointer-events-none w-0 overflow-hidden'}
                 `}>
                   {item.label}
                 </span>

                 {/* Tooltip for collapsed state */}
                 {!isSidebarExpanded && (
                   <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-2">
                     {item.label}
                   </div>
                 )}
               </button>
             );
           })}

           {/* Integrated Filters for Dealership Page */}
           {activePage === 'dealerships' && isSidebarExpanded && (
              <DealershipSidebarFilters filters={dealershipFilters} setFilters={setDealershipFilters} />
           )}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-1 p-2 border-t border-white/5 bg-[#0f1729]">
           <button
             onClick={toggleDarkMode}
             className={`
               flex items-center h-[38px] rounded-lg transition-all duration-200 group flex-shrink-0
               text-slate-400 hover:bg-white/5 hover:text-white
               ${isSidebarExpanded ? 'px-3 justify-start' : 'justify-center px-0'}
             `}
             title={!isSidebarExpanded ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : undefined}
           >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className={`
                 ml-3 font-medium text-[13px] tracking-wide whitespace-nowrap transition-all duration-300 ease-in-out
                 ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-10 pointer-events-none w-0 overflow-hidden'}
              `}>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-[240px]' : 'ml-[60px]'}`}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {navItems.find(i => i.id === activePage)?.label}
            </h2>
          </div>
          <div className="relative hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Global search..." 
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full w-64 text-[13px] text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
