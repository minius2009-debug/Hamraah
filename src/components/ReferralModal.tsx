import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Copy, CheckCircle2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-12 text-center">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-gold relative">
                <Gift size={40} />
                <div className="absolute -bottom-1 -right-1 bg-teal text-white p-1.5 rounded-full border-2 border-white">
                  <Users size={12} />
                </div>
              </div>

              <h2 className="text-2xl font-black text-teal mb-2">Invite your Friends</h2>
              <p className="text-slate-500 text-sm mb-8 px-4 leading-relaxed">
                Invite your companions to Hamraah and earn <span className="text-teal font-bold">community points</span> to grow your reputation in the valley.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8 relative group">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('referral_code')}</p>
                <p className="text-3xl font-black text-teal tracking-widest mb-6">
                  {profile?.referralCode || '------'}
                </p>
                
                <button 
                  onClick={copyToClipboard}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-teal text-white shadow-lg shadow-teal/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 justify-center text-[10px] font-bold text-teal/40 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                Verified Referral Program
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
