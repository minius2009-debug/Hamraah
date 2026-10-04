import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { CivicScreen } from './screens/CivicScreen';
import { BookingScreen } from './screens/BookingScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { JobsScreen } from './screens/JobsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SearchScreen } from './screens/SearchScreen';
import { EmergencyScreen } from './screens/EmergencyScreen';
import { UpdatesScreen } from './screens/UpdatesScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ProviderDashboard } from './screens/ProviderDashboard';
import { CustomerDashboard } from './screens/CustomerDashboard';
import { AdminScreen } from './screens/AdminScreen';
import { NotificationToaster } from './components/NotificationToaster';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ChitralWisdom } from './components/ChitralWisdom';
import { WeatherWidget } from './components/WeatherWidget';
import { CommunityGoals } from './components/CommunityGoals';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Home, ClipboardList, Megaphone, User, BellRing, PhoneCall, ChevronLeft, ChevronRight, Loader2, Shield } from 'lucide-react';

const Sidebar: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void; role?: string | null }> = ({ activeTab, setActiveTab, role }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'home', label: 'Services', icon: Home },
    { id: 'jobs', label: role === 'provider' ? 'My Jobs' : 'Bookings', icon: ClipboardList },
    { id: 'civic', label: 'Protest', icon: Megaphone },
    { id: 'updates', label: 'Updates', icon: BellRing },
    { id: 'emergency', label: 'Emergency', icon: PhoneCall },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (role === 'admin') {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-slate-200 p-6 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-64'}`}>
      <div className="flex items-center justify-between mb-10 px-2">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <img 
              src="/src/assets/images/hamrah_logo_1790495411663.jpg" 
              alt="Hamrah Logo" 
              className="w-10 h-10 rounded-xl"
            />
            <h1 className="text-xl font-bold text-teal tracking-tight">Hamraah</h1>
          </motion.div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav className="space-y-2 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center transition-all ${
                isCollapsed ? 'justify-center p-3' : 'gap-4 px-4 py-3'
              } rounded-xl ${
                isActive 
                  ? 'bg-teal text-white shadow-lg shadow-teal/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-teal'
              }`}
              title={isCollapsed ? tab.label : ''}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && <span className="font-bold text-sm">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-auto p-4 bg-gold/5 rounded-2xl border border-gold/10"
        >
          <p className="text-[10px] font-bold text-teal/40 uppercase tracking-widest mb-1">Chitral Community</p>
          <p className="text-xs text-teal font-medium">Building a better future together.</p>
        </motion.div>
      )}
    </aside>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-teal/10 rounded-[24px] flex items-center justify-center mb-6"
        >
          <img src="/src/assets/images/hamrah_logo_1790495411663.jpg" alt="" className="w-12 h-12 rounded-xl" />
        </motion.div>
        <Loader2 className="animate-spin text-teal mb-4" size={32} />
        <p className="text-sm font-bold text-teal tracking-widest uppercase">Hamraah Chitral</p>
      </div>
    );
  }

  if (!user || !profile?.role) {
    return <OnboardingScreen />;
  }

  const renderScreen = () => {
    if (searchQuery.trim()) {
      return (
        <SearchScreen 
          queryText={searchQuery} 
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            setSearchQuery('');
          }}
          onSelectIssue={(id) => {
            setActiveTab('civic');
            setSearchQuery('');
          }}
        />
      );
    }

    if (isNotificationsOpen) {
      return (
        <div className="min-h-screen bg-white">
          <header className="sticky top-0 z-30 h-14 bg-white flex items-center px-4 gap-4 border-b border-slate-100">
            <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-teal">Notifications</h2>
          </header>
          <NotificationsScreen />
        </div>
      );
    }

    if (selectedCategory) {
      return (
        <BookingScreen 
          categoryId={selectedCategory} 
          onBack={() => setSelectedCategory(null)} 
          onSuccess={() => {
            setSelectedCategory(null);
            setActiveTab('jobs');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'home': return (
        <HomeScreen 
          onSelectCategory={(id) => setSelectedCategory(id)} 
          onNavigateToProtest={() => setActiveTab('civic')}
        />
      );
      case 'jobs': return profile?.role === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />;
      case 'civic': return <CivicScreen />;
      case 'updates': return <UpdatesScreen />;
      case 'emergency': return <EmergencyScreen />;
      case 'profile': return <ProfileScreen />;
      case 'admin': return <AdminScreen />;
      default: return (
        <HomeScreen 
          onSelectCategory={(id) => setSelectedCategory(id)} 
          onNavigateToProtest={() => setActiveTab('civic')}
        />
      );
    }
  };

  const getTitle = () => {
    if (searchQuery.trim()) return 'Search Results';
    if (isNotificationsOpen) return 'Notifications';
    if (selectedCategory) return 'Booking Service';
    switch (activeTab) {
      case 'home': return 'Home';
      case 'jobs': return profile?.role === 'provider' ? 'Provider Dashboard' : 'My Bookings';
      case 'civic': return 'Community Action';
      case 'updates': return 'Chitral Updates';
      case 'emergency': return 'Emergency Hub';
      case 'profile': return 'My Account';
      case 'admin': return 'Admin Panel';
      default: return 'Hamraah';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row max-w-[1440px] mx-auto">
      <NotificationToaster />
      <ConnectionStatus />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={profile?.role} />
        
        <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden border-x border-slate-100 bg-white">
          {!selectedCategory && !isNotificationsOpen && (
            <Header 
              title={getTitle()} 
              onNotificationClick={() => setIsNotificationsOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
          
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery.trim() ? 'search' : (isNotificationsOpen ? 'notifications' : (selectedCategory ? 'booking' : activeTab))}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </main>
          
          {!selectedCategory && !isNotificationsOpen && <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />}
        </div>

        {/* Right Sidebar / Ad Space / Info - Only on Large Screens */}
        <aside className="hidden lg:block w-80 h-screen sticky top-0 p-6 bg-slate-50 border-l border-slate-200 overflow-y-auto custom-scrollbar">
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 cursor-pointer hover:border-teal/20 transition-all" onClick={() => setActiveTab('updates')}>
             <h3 className="font-bold text-teal mb-4 flex items-center justify-between">
               Chitral Updates
               <BellRing size={16} className="text-crimson" />
             </h3>
             <div className="space-y-4">
               <div className="pb-4 border-b border-slate-50">
                 <p className="text-xs text-slate-500 mb-1">2 hours ago</p>
                 <p className="text-sm font-bold text-teal">Lowari Tunnel is open for all traffic.</p>
               </div>
               <div className="pb-4 border-b border-slate-50">
                 <p className="text-xs text-slate-500 mb-1">5 hours ago</p>
                 <p className="text-sm font-bold text-teal">Weather alert: Rain expected in upper Chitral.</p>
               </div>
             </div>
           </div>

           <div className="bg-gold p-6 rounded-[32px] shadow-lg shadow-gold/20 text-teal cursor-pointer mb-6" onClick={() => setActiveTab('emergency')}>
             <h3 className="font-bold mb-2 flex items-center justify-between">
               Emergency?
               <PhoneCall size={20} />
             </h3>
             <p className="text-sm font-medium mb-4 opacity-80">Quick access to local emergency services.</p>
             <button className="w-full bg-teal text-white py-3 rounded-xl font-bold text-sm shadow-md">Open Hub</button>
           </div>

           <WeatherWidget />
           <ChitralWisdom />
           <CommunityGoals />
        </aside>
      </div>
  );
};

