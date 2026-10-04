import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Banknote, Loader2, Info } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc, setDoc } from 'firebase/firestore';

interface BiddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    location: string;
    initialOfferPKR: number;
    customerId: string;
  } | null;
  providerId: string;
  providerName: string;
}

export const BiddingModal: React.FC<BiddingModalProps> = ({ isOpen, onClose, job, providerId, providerName }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount || isNaN(Number(bidAmount))) return;

    setIsSubmitting(true);
    try {
      const negId = `${job.id}_${providerId}`;
      const negRef = doc(db, `service_requests/${job.id}/negotiations`, negId);
      
      await setDoc(negRef, {
        id: negId,
        requestId: job.id,
        providerId,
        providerName,
        offerPKR: Number(bidAmount),
        message: message.trim() || 'I can do this job for a better price.',
        createdAt: serverTimestamp()
      });

      // Update job status to negotiating
      await updateDoc(doc(db, 'service_requests', job.id), {
        status: 'negotiating',
        updatedAt: serverTimestamp()
      });

      // Send notification to customer
      const notifId = doc(collection(db, `users/${job.customerId}/notifications`)).id;
      await setDoc(doc(db, `users/${job.customerId}/notifications`, notifId), {
        id: notifId,
        userId: job.customerId,
        title: "New Counter Offer",
        message: `${providerName} offered PKR ${bidAmount} for your request in ${job.location}.`,
        type: 'job_status',
        referenceId: job.id,
        read: false,
        createdAt: serverTimestamp()
      });

      alert("Your bid has been sent to the customer!");
      onClose();
      setBidAmount('');
      setMessage('');
    } catch (error) {
      console.error("Bidding error:", error);
      alert("Failed to send bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="bg-gold p-6 text-teal flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote size={24} />
                <h2 className="text-xl font-black uppercase tracking-tight">Send Counter Offer</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Offer</p>
                <p className="text-lg font-black text-teal">PKR {job.initialOfferPKR}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Your Price (PKR)</label>
                  <input
                    required
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="e.g. 1800"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-teal focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Short Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the customer why they should pick you..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-teal focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-teal/5 rounded-2xl border border-teal/10 flex items-start gap-3">
                <Info className="text-teal shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] text-teal/70 font-medium leading-relaxed">
                  The customer will receive your bid instantly. If they accept, the job will be assigned to you at your counter price.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !bidAmount}
                className="w-full bg-teal text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-teal/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    SENDING BID...
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    SEND COUNTER OFFER
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
