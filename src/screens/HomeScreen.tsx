import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Star, Banknote, Megaphone, ChevronRight, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

const CATEGORIES: Category[] = [
  { id: 'drivers', name: 'Drivers', image: '/src/assets/images/category_driver_1790493813472.jpg', count: 42 },
  { id: 'painters', name: 'Painters', image: '/src/assets/images/category_painter_1790493830207.jpg', count: 18 },
  { id: 'builders', name: 'Builders', image: '/src/assets/images/category_builder_1790493845584.jpg', count: 25 },
  { id: 'electricians', name: 'Electricians', image: '/src/assets/images/category_electrician_1790493862227.jpg', count: 31 },
  { id: 'plumbers', name: 'Plumbers', image: '/src/assets/images/category_plumber_1790493874730.jpg', count: 22 },
  { id: 'cars', name: 'Rent a Car', image: '/src/assets/images/car_rental_hero_1790495430237.jpg', count: 15 },
];

export const HomeScreen: React.FC<{ onSelectCategory: (id: string) => void; onNavigateToProtest: () => void }> = ({ onSelectCategory, onNavigateToProtest }) => {
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(profile?.role === 'provider');

  useEffect(() => {
    if (profile?.role !== 'provider' || !user) return;

    const q = query(
      collection(db, 'service_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((req: any) => req.customerId !== user.uid)
      );
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'service_requests'));

    return () => unsubscribe();
  }, [profile?.role, user]);

  const handleAcceptJob = async (jobId: string, offer: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'service_requests', jobId), {
        status: 'in_progress',
        assignedProviderId: user.uid,
        finalPricePKR: offer,
        updatedAt: serverTimestamp()
      });
      alert("Job accepted! Head over to 'My Jobs' to manage it.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_requests/${jobId}`);
    }
  };

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-teal text-white p-6 pt-2 rounded-b-[40px] shadow-lg shadow-teal/20 mb-6">
        <h2 className="text-2xl font-bold mb-1">
          {profile?.role === 'provider' ? 'Available Work,' : 'Assalam-o-Alaikum,'}
        </h2>
        <p className="text-teal-50/80 text-sm">
          {profile?.role === 'provider' ? 'Find nearby requests and start earning today.' : 'Find the right companion for your needs in Chitral.'}
        </p>
      </section>

      {/* Main Content */}
      <div className="px-4">
        {/* Community Action Banner */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToProtest}
          className="w-full bg-crimson rounded-3xl p-4 mb-6 flex items-center justify-between text-white shadow-lg shadow-crimson/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm">Online Protest Hub</span>
              <span className="text-[10px] opacity-80">Report issues & advocate for Chitral.</span>
            </div>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <ChevronRight size={16} />
          </div>
        </motion.button>

        {profile?.role === 'provider' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-lg text-teal">Live Request Feed</h3>
              <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Scanning</span>
              </div>
            </div>

            {loading ? (
               <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="animate-spin text-teal mb-3" size={32} />
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Searching for gigs...</p>
               </div>
            ) : requests.length === 0 ? (
              <div className="bg-slate-50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
                <Banknote className="mx-auto mb-4 text-slate-300" size={40} />
                <p className="text-slate-500 font-bold text-sm">Quiet moment in Chitral.</p>
                <p className="text-slate-400 text-[10px] mt-1">We'll notify you when new requests arrive.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {requests.map((req) => (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="inline-block bg-teal/5 text-teal text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest mb-3">
                            {req.category}
                          </span>
                          <h4 className="text-lg font-black text-teal leading-tight mb-1">{req.location}</h4>
                          <div className="flex items-center gap-2 text-slate-400">
                             <Clock size={12} />
                             <span className="text-[10px] font-bold">
                                {req.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Offer</p>
                          <p className="text-xl font-black text-teal">PKR {req.initialOfferPKR}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 line-clamp-2">
                        {req.description}
                      </p>

                      <button 
                        onClick={() => handleAcceptJob(req.id, req.initialOfferPKR)}
                        className="w-full bg-teal text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-teal/10 hover:shadow-teal/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        ACCEPT REQUEST
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-gold/10 border border-gold/20 rounded-3xl p-4 mb-8 flex items-center justify-between">
              <div className="flex-1">
                <span className="block font-bold text-teal text-xs">Earn money as a Service Provider</span>
                <span className="text-[10px] text-slate-500">Switch account type in your profile to start bidding on jobs.</span>
              </div>
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-teal ml-3 shrink-0">
                <Banknote size={20} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold text-lg text-teal">Service Categories</h3>
              <button className="text-xs font-bold text-teal/60">See All</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectCategory(cat.id)}
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-sm group bg-card"
                >
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x400/0A4D68/FFB800?text=${cat.name}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal/90 via-teal/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <span className="block text-white font-bold text-base">{cat.name}</span>
                    <span className="text-gold text-[10px] font-bold uppercase tracking-wider">{cat.count} Providers Nearby</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Featured Service Providers */}
            <div className="mt-8 mb-4 px-1 flex items-center justify-between">
              <h3 className="font-bold text-lg text-teal">Top Service Providers</h3>
              <MapPin size={16} className="text-teal/40" />
            </div>

            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=provider${i}`} alt="Avatar" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-teal">Sher Afzal</h4>
                      <div className="flex items-center gap-1 bg-gold/10 px-2 py-0.5 rounded-full">
                        <Star size={10} className="fill-gold text-gold" />
                        <span className="text-[10px] font-bold text-teal">4.9</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Professional Driver · 120+ Jobs</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg text-slate-600 font-medium border border-slate-100">Verified</span>
                      <span className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg text-slate-600 font-medium border border-slate-100">Punctual</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
