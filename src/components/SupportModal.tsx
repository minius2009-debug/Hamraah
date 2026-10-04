import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { profile, user } = useAuth();
  const [type, setType] = useState<'support' | 'report'>('support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        userName: profile.name,
        userEmail: profile.email,
        type,
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setSubject('');
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error("Support ticket error:", error);
      alert("Failed to send ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-teal/20 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="bg-teal p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare size={24} />
                <h2 className="text-xl font-black uppercase tracking-tight">Support & Reports</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-teal mb-2">Ticket Sent!</h3>
                <p className="text-slate-500">Our moderation team in Chitral will review your message shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setType('support')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${type === 'support' ? 'bg-white text-teal shadow-sm' : 'text-slate-400'}`}
                  >
                    GENERAL SUPPORT
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('report')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${type === 'report' ? 'bg-white text-crimson shadow-sm' : 'text-slate-400'}`}
                  >
                    REPORT ISSUE
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                    <input
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What can we help you with?"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-teal focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Message Detail</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the issue or your question in detail..."
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-teal focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gold/5 rounded-2xl border border-gold/10 flex items-start gap-3">
                  <ShieldAlert className="text-gold shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-teal font-medium leading-relaxed">
                    Reports are handled manually by the Hamraah moderation team. We typically respond within 24 hours. Serious safety concerns should be reported to local authorities first.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-teal/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      SENDING...
                    </>
                  ) : (
                    <>
                      <Send size={24} />
                      SUBMIT TICKET
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
