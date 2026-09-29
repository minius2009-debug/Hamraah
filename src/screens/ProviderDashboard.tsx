import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Banknote, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight,
  MessageSquare,
  Sparkles,
  Loader2,
  Wallet,
  LayoutDashboard,
  Star,
  User as UserIcon
} from 'lucide-react';
import { ChatModal } from '../components/ChatModal';

interface ServiceRequest {
  id: string;
  customerId: string;
  category: string;
  location: string;
  description: string;
  initialOfferPKR: number;
  status: 'pending' | 'negotiating' | 'in_progress' | 'completed' | 'cancelled';
  assignedProviderId?: string;
  finalPricePKR?: number;
  createdAt: any;
  updatedAt?: any;
}

export const ProviderDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [activeJobs, setActiveJobs] = useState<ServiceRequest[]>([]);
  const [completedJobs, setCompletedJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<'daily' | 'weekly'>('daily');

  // Chat integration
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Available Jobs (pending)
    const availQ = query(
      collection(db, 'service_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeAvail = onSnapshot(availQ, (snapshot) => {
      setAvailableJobs(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest))
        .filter(job => job.customerId !== user.uid)
      );
    });

    // 2. Active Jobs (assigned to me and in progress)
    const activeQ = query(
      collection(db, 'service_requests'),
      where('assignedProviderId', '==', user.uid),
      where('status', 'in', ['in_progress', 'negotiating']),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribeActive = onSnapshot(activeQ, (snapshot) => {
      setActiveJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
    });

    // 3. Completed Jobs (for earnings)
    const completedQ = query(
      collection(db, 'service_requests'),
      where('assignedProviderId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribeCompleted = onSnapshot(completedQ, (snapshot) => {
      const completed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
      setCompletedJobs(completed);
      
      const earnings = completed.reduce((sum, job) => sum + (job.finalPricePKR || job.initialOfferPKR || 0), 0);
      setTotalEarnings(earnings);

      // Process Trends
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      }).reverse();

      const dailyMap = new Map();
      completed.forEach(job => {
        const day = job.updatedAt?.toDate().toLocaleDateString('en-US', { weekday: 'short' });
        if (day) {
          dailyMap.set(day, (dailyMap.get(day) || 0) + (job.finalPricePKR || job.initialOfferPKR || 0));
        }
      });

      setEarningsData(last7Days.map(day => ({
        name: day,
        amount: dailyMap.get(day) || 0
      })));

      // Weekly Trend (Last 4 Weeks)
      const weeklyMap = new Map();
      completed.forEach(job => {
        const date = job.updatedAt?.toDate();
        if (date) {
          const weekNum = Math.ceil(date.getDate() / 7);
          const weekLabel = `Week ${weekNum}`;
          weeklyMap.set(weekLabel, (weeklyMap.get(weekLabel) || 0) + (job.finalPricePKR || job.initialOfferPKR || 0));
        }
      });

      setWeeklyData(Array.from({ length: 4 }, (_, i) => ({
        name: `Week ${i + 1}`,
        amount: weeklyMap.get(`Week ${i + 1}`) || 0
      })));

      setLoading(false);
    });

    return () => {
      unsubscribeAvail();
      unsubscribeActive();
      unsubscribeCompleted();
    };
  }, [user]);

  useEffect(() => {
    if (!user || activeJobs.length === 0) return;

    const hasInProgressJob = activeJobs.some(job => job.status === 'in_progress');
    if (!hasInProgressJob) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateDoc(doc(db, 'users', user.uid), {
          lastLocation: { lat: latitude, lng: longitude },
          lastLocationUpdate: serverTimestamp()
        }).catch(err => console.error("Location update error:", err));
      },
      (error) => console.warn("Location watch error:", error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, activeJobs]);

  const handleAcceptJob = async (job: ServiceRequest) => {
    try {
      await updateDoc(doc(db, 'service_requests', job.id), {
        status: 'in_progress',
        assignedProviderId: user?.uid,
        finalPricePKR: job.initialOfferPKR,
        updatedAt: serverTimestamp()
      });
      alert("Job accepted! You can find it in your active work section.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_requests/${job.id}`);
    }
  };

  const handleDeclineJob = async (job: ServiceRequest) => {
    // For "decline" in a broadcast system, we usually just ignore it locally or mark it as "hidden for me"
    // But if it was explicitly assigned, we'd release it.
    // For now, let's just simulate a decline by hiding it from the UI or showing a message.
    alert("Job declined. It will no longer appear in your incoming requests.");
    setAvailableJobs(prev => prev.filter(j => j.id !== job.id));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="animate-spin text-teal mb-4" size={32} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-8 pb-24">
      {/* Performance Summary Card */}
      <section className="bg-teal text-white rounded-[40px] p-8 shadow-2xl shadow-teal/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-gold/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
              <TrendingUp size={20} className="text-gold" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/80">Performance Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Lifetime Earnings */}
            <div className="md:border-r border-white/10 md:pr-8">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Lifetime Earnings</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter">PKR {totalEarnings.toLocaleString()}</span>
                <ArrowUpRight size={16} className="text-emerald-400" />
              </div>
            </div>

            {/* Completed Jobs */}
            <div className="md:border-r border-white/10 md:px-8">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Completed Jobs</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black tracking-tighter">{completedJobs.length}</span>
                <div className="px-2 py-0.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <span className="text-[10px] font-black text-emerald-400">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="md:pl-8">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Average Rating</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black tracking-tighter">{profile?.rating?.toFixed(1) || '5.0'}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i <= Math.round(profile?.rating || 5) ? "fill-gold text-gold" : "text-white/20"} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-gold">
                <LayoutDashboard size={16} />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Active Work</p>
                <p className="text-sm font-black leading-none">{activeJobs.length} Ongoing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-emerald-400">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Live Market</p>
                <p className="text-sm font-black leading-none">{availableJobs.length} New Requests</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Trend */}
      <section className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-teal">Earnings Trends</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Analytics</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setActiveChart('daily')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeChart === 'daily' ? 'bg-white text-teal shadow-sm' : 'text-slate-400'}`}
            >
              Daily
            </button>
            <button 
              onClick={() => setActiveChart('weekly')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeChart === 'weekly' ? 'bg-white text-teal shadow-sm' : 'text-slate-400'}`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'daily' ? (
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#115E59" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#115E59" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                  cursor={{ stroke: '#115E59', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#115E59" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorAmt)" 
                  animationDuration={1500}
                />
              </AreaChart>
            ) : (
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9', radius: 12 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                />
                <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={40}>
                  {weeklyData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === weeklyData.length - 1 ? '#115E59' : '#CCF6E4'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Incoming Requests */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-black text-teal flex items-center gap-2">
            Incoming Requests
            <span className="bg-crimson text-white text-[10px] font-black px-2 py-0.5 rounded-full">LIVE</span>
          </h3>
          <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-teal transition-colors flex items-center gap-1">
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {availableJobs.map((job) => (
              <motion.div 
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-teal/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-teal/5 text-teal text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest mb-3">
                      {job.category}
                    </span>
                    <h4 className="text-lg font-black text-teal leading-tight mb-1">{job.location}</h4>
                    <div className="flex items-center gap-3 text-slate-400">
                       <div className="flex items-center gap-1"><Clock size={12} /><span className="text-[10px] font-bold">{job.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                       <div className="flex items-center gap-1"><MapPin size={12} /><span className="text-[10px] font-bold">Chitral Town</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Offer</p>
                    <p className="text-xl font-black text-teal">PKR {job.initialOfferPKR}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {job.description}
                </p>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAcceptJob(job)}
                    className="flex-1 bg-teal text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-teal/10 hover:shadow-teal/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    ACCEPT JOB
                  </button>
                  <button 
                    onClick={() => handleDeclineJob(job)}
                    className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {availableJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Sparkles size={32} />
              </div>
              <p className="text-slate-400 font-bold">Waiting for new requests in Chitral...</p>
            </div>
          )}
        </div>
      </section>

      {/* Active Work Tracker */}
      <section>
        <h3 className="text-xl font-black text-teal mb-6 px-2">Active Work Progress</h3>
        <div className="space-y-4">
          {activeJobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal/5 rounded-full -mr-12 -mt-12" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal/10 text-teal rounded-xl flex items-center justify-center">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-teal">{job.location}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-teal">PKR {job.finalPricePKR || job.initialOfferPKR}</p>
                </div>
              </div>
              
              <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div className={`h-full bg-teal transition-all duration-1000 ${job.status === 'in_progress' ? 'w-2/3' : 'w-1/3'}`} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                   ))}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const chatId = user!.uid < job.customerId ? `${user!.uid}_${job.customerId}` : `${job.customerId}_${user!.uid}`;
                      setActiveChat({ id: chatId, name: 'Service Taker' });
                    }}
                    className="flex items-center gap-1 text-[10px] font-black text-gold uppercase tracking-widest hover:underline"
                  >
                    <MessageSquare size={12} />
                    Chat
                  </button>
                  <button className="flex items-center gap-1 text-[10px] font-black text-teal uppercase tracking-widest hover:underline">
                    Open Control Center <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {activeJobs.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-slate-100">
               <p className="text-slate-400 font-bold text-sm">No active jobs at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <ChatModal 
        isOpen={!!activeChat}
        onClose={() => setActiveChat(null)}
        chatId={activeChat?.id || ''}
        recipientName={activeChat?.name || ''}
      />
    </div>
  );
};
