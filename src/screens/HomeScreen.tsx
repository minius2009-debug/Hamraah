import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Star, Banknote, Megaphone, ChevronRight, MessageSquare, Send, Sparkles, Loader2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AIFAQComponent: React.FC = () => {
  const { t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/ai/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('FAQ error:', error);
      setAnswer("Sorry, I couldn't get an answer right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Sparkles size={120} className="text-gold rotate-12" />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
          <MessageSquare size={24} />
        </div>
        <div>
          <h3 className="font-bold text-teal">{t('faq_title')}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Gemini AI</p>
        </div>
      </div>

      <form onSubmit={askGemini} className="relative mb-6">
        <input 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('faq_ask_placeholder')}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-5 pr-14 text-sm font-medium text-teal focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all"
        />
        <button 
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-2 top-2 bottom-2 w-10 bg-gold text-teal rounded-xl flex items-center justify-center disabled:opacity-50 shadow-lg shadow-gold/20 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-6 bg-gold/5 rounded-3xl border border-gold/10 relative group"
          >
            <div className="flex gap-3">
              <div className="shrink-0 mt-1">
                <Info size={16} className="text-gold" />
              </div>
              <p className="text-xs text-teal leading-relaxed whitespace-pre-line">
                {answer}
              </p>
            </div>
            <button 
              onClick={() => setAnswer(null)}
              className="absolute top-2 right-2 p-2 text-slate-300 hover:text-crimson transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!answer && (
        <div className="flex flex-wrap gap-2">
          {["What services are available?", "How to verify a provider?", "Average pricing in Chitral?"].map((q) => (
            <button 
              key={q}
              onClick={() => { setQuestion(q); }}
              className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-2 rounded-full hover:border-gold/30 hover:text-teal transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  { id: 'bikes', name: 'Hire a Bike', image: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?w=400&h=400&fit=crop', count: 28 },
  { id: 'taxis', name: 'Book a Taxi', image: 'https://images.unsplash.com/photo-1549416878-b9ca35df2f6f?w=400&h=400&fit=crop', count: 35 },
  { id: 'rickshaws', name: 'Rickshaw', image: 'https://images.unsplash.com/photo-1623192257217-10499d2a0f8c?w=400&h=400&fit=crop', count: 50 },
];

export const HomeScreen: React.FC<{ onSelectCategory: (id: string) => void }> = ({ onSelectCategory }) => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-teal text-white p-6 pt-2 rounded-b-[40px] shadow-lg shadow-teal/20 mb-6">
        <h2 className="text-2xl font-bold mb-1">{t('welcome_msg')}</h2>
        <p className="text-teal-50/80 text-sm">{t('hero_subtitle')}</p>
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
          <h3 className="font-bold text-lg text-teal">{t('service_categories')}</h3>
          <button className="text-xs font-bold text-teal/60">See All</button>
        </div>

        {/* How it Works Section */}
        <div className="bg-slate-50 rounded-[32px] p-6 mb-8 border border-slate-100">
           <h4 className="text-xs font-bold text-teal/40 uppercase tracking-widest mb-4">{t('how_it_works')}</h4>
           <div className="space-y-4">
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
                 <p className="text-xs text-teal/80 font-medium">{t('step_1')}</p>
              </div>
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
                 <p className="text-xs text-teal/80 font-medium">{t('step_2')}</p>
              </div>
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
                 <p className="text-xs text-teal/80 font-medium">{t('step_3')}</p>
              </div>
              <div className="flex gap-3">
                 <div className="w-6 h-6 rounded-full bg-gold text-teal text-[10px] font-bold flex items-center justify-center shrink-0">AI</div>
                 <p className="text-xs text-teal font-bold italic tracking-tight">{t('ai_matching')}</p>
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

        {/* AI FAQ Component */}
        <AIFAQComponent />

        {/* Chitral Spotlight / Promotional Banners */}
        <div className="mt-10 mb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-lg text-teal">Chitral Spotlight</h3>
            <span className="text-[10px] bg-gold/20 text-teal px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Local Hub</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
            {[
              {
                id: 'event1',
                title: 'Kalash Chilam Joshi',
                subtitle: 'Upcoming Festival',
                image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop',
                tag: 'Community',
                color: 'bg-crimson'
              },
              {
                id: 'biz1',
                title: 'Mount View Hotel',
                subtitle: 'Best Views in Town',
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
                tag: 'Business',
                color: 'bg-teal'
              },
              {
                id: 'biz2',
                title: 'Traditional Crafts',
                subtitle: 'Handmade in Chitral',
                image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&h=400&fit=crop',
                tag: 'Artisan',
                color: 'bg-emerald-600'
              }
            ].map((banner) => (
              <motion.div
                key={banner.id}
                whileHover={{ y: -5 }}
                className="min-w-[280px] h-[160px] relative rounded-[32px] overflow-hidden shadow-lg shadow-slate-200/50"
              >
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
                  <span className={`${banner.color} text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md w-fit mb-2`}>
                    {banner.tag}
                  </span>
                  <h4 className="text-white font-black text-lg leading-none mb-1">{banner.title}</h4>
                  <p className="text-white/70 text-xs font-medium">{banner.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
