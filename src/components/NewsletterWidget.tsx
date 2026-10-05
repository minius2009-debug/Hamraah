import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const NewsletterWidget: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Use email as ID to prevent duplicates if rules allow or just use it as key
      const docRef = doc(db, 'newsletters', email.trim().toLowerCase());
      await setDoc(docRef, {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error("Newsletter error:", err);
      setError("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-teal/5 rounded-full blur-2xl transition-transform group-hover:scale-110" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-teal uppercase tracking-widest">Valley Voice</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Community Newsletter</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Get weekly updates on Chitral's development, events, and opportunities directly in your inbox.
        </p>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center"
            >
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
              <p className="text-xs font-bold text-emerald-700">You're Subscribed!</p>
              <p className="text-[10px] text-emerald-600 mt-1">Welcome to the community.</p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-4 text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:underline"
              >
                Add another
              </button>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-[10px] text-crimson font-bold px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-teal text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal/10 hover:shadow-teal/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    SUBSCRIBE NOW
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-center gap-2 pt-6 border-t border-slate-50">
           <Sparkles size={12} className="text-gold" />
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Join 1,200+ Hamraahs</span>
        </div>
      </div>
    </div>
  );
};
