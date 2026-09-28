import React from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Star, Banknote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export const HomeScreen: React.FC<{ onSelectCategory: (id: string) => void }> = ({ onSelectCategory }) => {
  const { profile } = useAuth();

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-teal text-white p-6 pt-2 rounded-b-[40px] shadow-lg shadow-teal/20 mb-6">
        <h2 className="text-2xl font-bold mb-1">Assalam-o-Alaikum,</h2>
        <p className="text-teal-50/80 text-sm">Find the right companion for your needs in Chitral.</p>
      </section>

      {/* Main Content */}
      <div className="px-4">
        {profile?.role === 'customer' && (
          <div className="bg-gold/10 border border-gold/20 rounded-3xl p-4 mb-8 flex items-center justify-between">
            <div className="flex-1">
              <span className="block font-bold text-teal text-xs">Earn money as a Service Provider</span>
              <span className="text-[10px] text-slate-500">Switch account type in your profile to start bidding on jobs.</span>
            </div>
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-teal ml-3 shrink-0">
              <Banknote size={20} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-bold text-lg text-teal">Service Categories</h3>
          <button className="text-xs font-bold text-teal/60">See All</button>
        </div>

        {/* How it Works Section */}
        <div className="bg-slate-50 rounded-[32px] p-6 mb-8 border border-slate-100">
           <h4 className="text-xs font-bold text-teal/40 uppercase tracking-widest mb-4">How Hamraah Works</h4>
           <div className="space-y-4">
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
                 <p className="text-xs text-teal/80 font-medium">Post your service need as a Service Taker.</p>
              </div>
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
                 <p className="text-xs text-teal/80 font-medium">Service Providers bid and negotiate the best price.</p>
              </div>
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
                 <p className="text-xs text-teal/80 font-medium">Accept a professional, chat live, and pay after completion.</p>
              </div>
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-gold text-teal text-[10px] font-bold flex items-center justify-center shrink-0">AI</div>
                 <p className="text-xs text-teal font-bold italic tracking-tight">New: AI-powered Professional Job Briefs & Official Civic Notice Drafting!</p>
              </div>
           </div>
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
      </div>
    </div>
  );
};
