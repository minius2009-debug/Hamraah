import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  ShoppingBag, 
  UserPlus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { collection, query, getDocs, where, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StatsData {
  totalUsers: number;
  activeProviders: number;
  totalServiceRequests: number;
  newSignupsToday: number;
}

export const AdminDashboardStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeProviders: 0,
    totalServiceRequests: 0,
    newSignupsToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Total Users Listener
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const total = snapshot.size;
      const providers = snapshot.docs.filter(d => d.data().role === 'provider').length;
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const newToday = snapshot.docs.filter(d => {
         const createdAt = d.data().createdAt;
         return createdAt && new Date(createdAt).getTime() >= startOfDay.getTime();
      }).length;

      setStats(prev => ({
        ...prev,
        totalUsers: total,
        activeProviders: providers,
        newSignupsToday: newToday
      }));
      setLoading(false);
    });

    // Service Requests Listener
    const unsubscribeRequests = onSnapshot(collection(db, 'service_requests'), (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalServiceRequests: snapshot.size
      }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRequests();
    };
  }, []);

  const metrics = [
    { label: 'Total Members', value: stats.totalUsers, icon: Users, color: 'bg-teal/10 text-teal', detail: 'Across Chitral' },
    { label: 'Active Providers', value: stats.activeProviders, icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-600', detail: 'Verified & Ready' },
    { label: 'Total Services', value: stats.totalServiceRequests, icon: ShoppingBag, color: 'bg-gold/20 text-teal', detail: 'Life-to-date' },
    { label: 'New Today', value: stats.newSignupsToday, icon: UserPlus, color: 'bg-crimson/10 text-crimson', detail: 'Welcome Hamraahs' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[32px]" />
        ))}
      </div>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-6 px-2">
        <Activity size={20} className="text-teal" />
        <h3 className="font-black text-teal uppercase tracking-widest text-xs">Platform Vitality</h3>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <m.icon size={20} />
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-teal">{m.value.toLocaleString()}</h4>
                <TrendingUp size={12} className="text-emerald-500" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1">{m.detail}</p>
            </div>

            {/* Decorative BG element */}
            <div className={`absolute -right-4 -bottom-4 w-16 h-16 ${m.color.split(' ')[0]} opacity-10 rounded-full blur-xl`} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
