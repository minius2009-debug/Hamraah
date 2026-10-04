import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Quote, RefreshCw } from 'lucide-react';

export const ChitralWisdom: React.FC = () => {
  const [wisdom, setWisdom] = useState<{ text: string; category: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchWisdom = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/ai/chitral-wisdom');
      if (!response.ok) throw new Error('API limit reached');
      const data = await response.json();
      setWisdom(data);
    } catch (error) {
      console.error('Error fetching wisdom:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWisdom();
  }, []);

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-teal flex items-center gap-2">
          <Sparkles size={18} className="text-gold" />
          Chitral Wisdom
        </h3>
        <button 
          onClick={fetchWisdom}
          disabled={loading}
          className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse" />
          </motion.div>
        ) : error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-slate-400 italic py-2"
          >
            Wisdom is resting. Try again in a minute.
          </motion.div>
        ) : wisdom ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="relative">
              <Quote className="absolute -top-2 -left-2 text-gold/20" size={32} />
              <p className="text-sm font-medium text-teal italic leading-relaxed pl-4">
                "{wisdom.text}"
              </p>
            </div>
            {wisdom.category && (
              <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-3 text-right">
                # {wisdom.category}
              </p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
