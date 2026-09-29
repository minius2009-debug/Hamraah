import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Package,
  History,
  Layout,
  MessageSquare,
  Trash2
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

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState<ServiceRequest[]>([]);
  const [pastBookings, setPastBookings] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat integration
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Active Bookings (pending, negotiating, in_progress)
    const activeQ = query(
      collection(db, 'service_requests'),
      where('customerId', '==', user.uid),
      where('status', 'in', ['pending', 'negotiating', 'in_progress']),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeActive = onSnapshot(activeQ, (snapshot) => {
      setActiveBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
      setLoading(false);
    });

    // 2. Past Bookings (completed, cancelled)
    const pastQ = query(
      collection(db, 'service_requests'),
      where('customerId', '==', user.uid),
      where('status', 'in', ['completed', 'cancelled']),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribePast = onSnapshot(pastQ, (snapshot) => {
      setPastBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
    });

    return () => {
      unsubscribeActive();
      unsubscribePast();
    };
  }, [user]);

  const handleCancelRequest = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this service request?")) return;
    try {
      await updateDoc(doc(db, 'service_requests', jobId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      alert("Request cancelled successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_requests/${jobId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'negotiating': return 'text-gold bg-gold/5 border-gold/10';
      case 'pending': return 'text-teal bg-teal/5 border-teal/10';
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'cancelled': return 'text-slate-400 bg-slate-50 border-slate-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Your Hamraah Space...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-10 pb-24 bg-slate-50/30">
      {/* Welcome Header */}
      <section className="relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-teal tracking-tighter mb-1">My Activity</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Taker Dashboard</p>
          </div>
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-teal border border-slate-100">
            <ShoppingBag size={28} />
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-teal p-6 rounded-[32px] text-white shadow-xl shadow-teal/20">
            <Zap size={24} className="mb-4 text-gold" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Services</p>
            <h3 className="text-3xl font-black">{activeBookings.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <CheckCircle2 size={24} className="mb-4 text-emerald-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            <h3 className="text-3xl font-black text-teal">{pastBookings.filter(b => b.status === 'completed').length}</h3>
          </div>
        </div>
      </section>

      {/* Active Bookings Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-black text-teal">Track Ongoing Services</h3>
          <span className="text-[10px] font-black text-teal bg-teal/5 px-2 py-1 rounded-lg uppercase tracking-widest">In Progress</span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeBookings.map((job) => (
              <motion.div 
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {job.status === 'in_progress' && (
                  <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </div>
                  <span className="text-sm font-black text-teal">PKR {job.finalPricePKR || job.initialOfferPKR}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-teal">
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-teal leading-tight mb-0.5 capitalize">{job.category} Service</h4>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <MapPin size={10} /> {job.location}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-6 line-clamp-2 bg-slate-50/50 p-4 rounded-2xl">
                  {job.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400">Assigned Professional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.assignedProviderId && (
                      <button 
                        onClick={() => {
                          const chatId = user!.uid < job.assignedProviderId! ? `${user!.uid}_${job.assignedProviderId}` : `${job.assignedProviderId}_${user!.uid}`;
                          setActiveChat({ id: chatId, name: 'Service Provider' });
                        }}
                        className="flex items-center gap-1 text-[10px] font-black text-gold uppercase tracking-widest hover:underline"
                      >
                        <MessageSquare size={14} />
                        Chat
                      </button>
                    )}
                    <button className="flex items-center gap-1 text-[10px] font-black text-teal uppercase tracking-widest">
                      Manage Request <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {job.status === 'pending' && (
                  <button 
                    onClick={() => handleCancelRequest(job.id)}
                    className="mt-4 w-full py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Cancel This Request
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {activeBookings.length === 0 && (
            <div className="text-center py-16 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Layout size={40} />
              </div>
              <h4 className="text-slate-400 font-black mb-2 uppercase tracking-widest text-[10px]">No Active Bookings</h4>
              <p className="text-slate-300 text-xs px-12">Looking for a service? Head over to the home screen to book your next ride or hire a professional.</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking History Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-black text-teal flex items-center gap-2">
            Service History
            <History size={20} className="text-slate-300" />
          </h3>
          <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest">View All</button>
        </div>

        <div className="space-y-3">
          {pastBookings.map((job) => (
            <div key={job.id} className="bg-white/60 p-4 rounded-[28px] border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-teal transition-colors">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-teal capitalize">{job.category}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{job.updatedAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-teal">PKR {job.finalPricePKR || job.initialOfferPKR}</p>
                <span className={`text-[8px] font-black uppercase tracking-widest ${job.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {job.status}
                </span>
              </div>
            </div>
          ))}
          {pastBookings.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-xs italic">Your service history will appear here once you complete your first booking.</p>
          )}
        </div>
      </section>

      {/* Community Tip */}
      <div className="bg-gold/10 p-6 rounded-[32px] border border-gold/20 flex gap-4">
        <AlertCircle className="text-gold shrink-0" size={24} />
        <div>
          <h4 className="text-sm font-black text-teal mb-1 uppercase tracking-tight">Hamraah Community Tip</h4>
          <p className="text-xs text-teal/70 leading-relaxed font-medium">Always check the service provider's ID verification badge and rating before confirming a booking for maximum safety.</p>
        </div>
      </div>

      <ChatModal 
        isOpen={!!activeChat}
        onClose={() => setActiveChat(null)}
        chatId={activeChat?.id || ''}
        recipientName={activeChat?.name || ''}
      />
    </div>
  );
};
