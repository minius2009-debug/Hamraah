import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { User, ArrowRight, Star, ShieldCheck, MapPin, Search } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'service' | 'provider';
  title: string;
  subtitle: string;
  extra?: any;
}

const CATEGORIES = [
  { id: 'drivers', name: 'Drivers' },
  { id: 'painters', name: 'Painters' },
  { id: 'builders', name: 'Builders' },
  { id: 'electricians', name: 'Electricians' },
  { id: 'plumbers', name: 'Plumbers' },
  { id: 'cars', name: 'Rent a Car' },
];

export const SearchScreen: React.FC<{ 
  queryText: string; 
  onSelectCategory: (id: string) => void;
}> = ({ queryText, onSelectCategory }) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryText.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      const lowerQuery = queryText.toLowerCase();
      const newResults: SearchResult[] = [];

      // 1. Search Services (Local)
      CATEGORIES.forEach(cat => {
        if (cat.name.toLowerCase().includes(lowerQuery)) {
          newResults.push({
            id: cat.id,
            type: 'service',
            title: cat.name,
            subtitle: 'Service Category'
          });
        }
      });

      try {
        // 2. Search Providers (Firestore)
        // Note: Client side filtering because Firestore doesn't support easy case-insensitive partial match
        // In a real app we'd use Algolia or specialized search, but for this demo we'll fetch a limited set
        const providersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'provider'), limit(20)));
        providersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.name.toLowerCase().includes(lowerQuery)) {
            newResults.push({
              id: doc.id,
              type: 'provider',
              title: data.name,
              subtitle: 'Service Provider',
              extra: { rating: data.rating, isVerified: data.isVerified }
            });
          }
        });
      } catch (error) {
        console.error("Search error:", error);
      }

      setResults(newResults);
      setLoading(false);
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [queryText]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'service': return <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal font-bold text-lg">S</div>;
      case 'provider': return <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold"><User size={20} /></div>;
      default: return null;
    }
  };

  return (
    <div className="p-4 pt-6 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xl font-bold text-teal">Search Results</h2>
        {loading && <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {results.map((res, idx) => (
            <motion.button
              key={`${res.type}-${res.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                if (res.type === 'service') onSelectCategory(res.id);
              }}
              className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-teal/30 active:scale-[0.98] transition-all text-left group"
            >
              {getIcon(res.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-teal truncate">{res.title}</h4>
                  {res.extra?.isVerified && <ShieldCheck size={14} className="text-emerald-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.subtitle}</span>
                  {res.extra?.rating && (
                    <div className="flex items-center gap-0.5 text-gold font-bold text-[10px]">
                      <Star size={8} className="fill-gold" />
                      {res.extra.rating}
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-200 group-hover:text-teal transition-colors" />
            </motion.button>
          ))}
        </AnimatePresence>

        {!loading && results.length === 0 && queryText.trim() !== '' && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">No results found for "{queryText}"</p>
          </div>
        )}

        {queryText.trim() === '' && (
          <div className="text-center py-20 text-slate-300">
            <Search className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-sm">Start typing to search across Hamraah...</p>
          </div>
        )}
      </div>
    </div>
  );
};
