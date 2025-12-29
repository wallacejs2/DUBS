import React, { useState } from 'react';
import { 
  Building2, Users, ClipboardCheck, LayoutDashboard, 
  Menu, Bell, Search, LogOut 
} from 'lucide-react';
import DealershipsPage from './pages/DealershipsPage.tsx';
import EnterpriseGroupsPage from './pages/EnterpriseGroupsPage.tsx';
import QAPage from './pages/QAPage.tsx';

type NavPage = 'dealerships' | 'groups' | 'qa' | 'dashboard';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('dealerships');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dealerships', label: 'Dealerships', icon: Building2 },
    { id: 'groups', label: 'Enterprise Groups', icon: Users },
    { id: 'qa', label: 'QA Shoppers', icon: ClipboardCheck },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dealerships': return <DealershipsPage />;
      case 'groups': return <EnterpriseGroupsPage />;
      case 'qa': return <QAPage />;
      case 'dashboard': return (
        <div className="p-8 flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Curator</h1>
            <p className="text-xs text-slate-500">Select a section from the sidebar to manage your business operations.</p>
          </div>
        </div>
      );
      default: return <DealershipsPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-hidden text-xs">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-56' : 'w-16'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-40 relative`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
             <span className="text-white font-bold text-lg">C</span>
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-indigo-900">CURATOR</span>}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as NavPage)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                activePage === item.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={18} strokeWidth={activePage === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span className="text-[13px]">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button className={`w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all`}>
            <LogOut size={18} />
            {isSidebarOpen && <span className="text-[13px]">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <Menu size={18} />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Global search..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full w-56 text-[12px] focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-slate-400 hover:text-indigo-600">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">Admin User</p>
                <p className="text-[10px] text-slate-400">System Manager</p>
              </div>
              <img 
                src="https://picsum.photos/seed/admin/40/40" 
                className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm"
                alt="Profile" 
              />
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;