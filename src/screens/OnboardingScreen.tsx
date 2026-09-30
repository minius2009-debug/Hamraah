import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Briefcase, ChevronRight, LogIn, Sparkles, ShieldCheck, Globe, Users } from 'lucide-react';

export const OnboardingScreen: React.FC = () => {
  const { user, profile, login, isLoggingIn, authError, updateRole } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async (role: 'customer' | 'provider') => {
    setLoading(true);
    await updateRole(role);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <img 
            src="/src/assets/images/hamrah_logo_1790495411663.jpg" 
            alt="Hamraah Logo" 
            className="w-24 h-24 rounded-[32px] mx-auto mb-8 shadow-2xl shadow-teal/20"
          />
          <h1 className="text-4xl font-black text-teal mb-4 tracking-tight">Hamraah</h1>
          <p className="text-slate-500 mb-12 text-lg leading-relaxed">
            Chitral's dedicated community service marketplace. Connect, earn, and build a better future together.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100">
              <Users className="mx-auto mb-2 text-teal" size={24} />
              <p className="text-[10px] font-black text-teal uppercase tracking-widest leading-none">5k+ Users</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100">
              <ShieldCheck className="mx-auto mb-2 text-emerald-500" size={24} />
              <p className="text-[10px] font-black text-teal uppercase tracking-widest leading-none">Verified</p>
            </div>
          </div>

          <button 
            onClick={login}
            disabled={isLoggingIn}
            className="w-full bg-teal text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-teal/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoggingIn ? 'Connecting...' : (
              <>
                <LogIn size={24} />
                Get Started
              </>
            )}
          </button>

          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 bg-crimson/5 border border-crimson/10 rounded-2xl text-left"
              >
                <div className="flex gap-3 text-crimson">
                  <div className="shrink-0 mt-0.5">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight mb-1">Login Blocked</p>
                    <p className="text-[10px] leading-relaxed font-medium opacity-80 whitespace-pre-line">
                      {authError}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="mt-8 text-[10px] text-slate-400 font-medium px-4">
            By joining, you agree to the community guidelines and terms of service of Chitral's Hamraah platform.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className="text-center mb-12">
          <span className="inline-block bg-gold/20 text-teal px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            Welcome to the community
          </span>
          <h2 className="text-3xl font-black text-teal mb-4 leading-tight">Choose Your Path</h2>
          <p className="text-slate-500">Tell us how you want to use the Hamraah platform today.</p>
        </div>

        <div className="grid gap-6">
          <button 
            onClick={() => handleRoleSelection('customer')}
            disabled={loading}
            className="group relative bg-white p-8 rounded-[40px] border-2 border-transparent hover:border-teal/20 hover:shadow-2xl hover:shadow-teal/10 transition-all text-left flex items-center gap-6"
          >
            <div className="w-20 h-20 bg-teal/5 rounded-[28px] flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-white transition-colors">
              <User size={40} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-teal mb-1">Service Taker</h3>
              <p className="text-sm text-slate-500 leading-relaxed">I want to book rides, hire professionals, and find local experts.</p>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-teal transition-colors" />
          </button>

          <button 
            onClick={() => handleRoleSelection('provider')}
            disabled={loading}
            className="group relative bg-white p-8 rounded-[40px] border-2 border-transparent hover:border-teal/20 hover:shadow-2xl hover:shadow-teal/10 transition-all text-left flex items-center gap-6"
          >
            <div className="w-20 h-20 bg-gold/10 rounded-[28px] flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-teal transition-colors">
              <Briefcase size={40} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-teal mb-1">Service Provider</h3>
              <p className="text-sm text-slate-500 leading-relaxed">I want to offer my services, find work, and earn money in Chitral.</p>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-gold transition-colors" />
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Globe size={14} />
          Verified Chitral Network
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <Sparkles size={14} />
          AI Powered Matching
        </div>
      </motion.div>
    </div>
  );
};
