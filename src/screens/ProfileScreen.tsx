import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Globe, LogOut, RefreshCcw, X, Sparkles, Loader2, Trash2, AlertTriangle, LogIn, CheckCircle2, Send } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export const ProfileScreen: React.FC = () => {
  const { profile, user, logout, login, isLoggingIn, resetAccount, updateRole } = useAuth();

  const [bio, setBio] = useState(profile?.bio || '');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Verification State
  const [pendingApp, setPendingApp] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'provider') return;

    const q = query(
      collection(db, 'verification_applications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPendingApp({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setPendingApp(null);
      }
    });

    return () => unsubscribe();
  }, [user, profile?.role]);

  const applyForVerification = async () => {
    if (!user || !profile) return;
    setIsApplying(true);
    try {
      await addDoc(collection(db, 'verification_applications'), {
        userId: user.uid,
        userName: profile.name,
        userEmail: profile.email,
        status: 'pending',
        bio: bio || '',
        skills: profile.skills || [],
        createdAt: serverTimestamp()
      });
      alert("Application submitted! Our team will review your profile shortly.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'verification_applications');
    } finally {
      setIsApplying(false);
    }
  };

  const optimizeWithAI = async () => {
    if (!profile) return;
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/ai/optimize-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, skills: profile.skills, experience }),
      });
      const data = await response.json();
      if (data.optimizedBio) {
        setBio(data.optimizedBio);
        if (data.recommendedSkills && data.recommendedSkills.length > 0) {
           alert(`AI Suggestion:\n\nBio updated!\nRecommended skills: ${data.recommendedSkills.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const saveProfessionalInfo = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio,
        experience,
        updatedAt: serverTimestamp()
      });
      alert("Professional profile updated successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-2xl mx-auto">
      {!user ? (
        <div className="bg-white rounded-[40px] p-12 text-center shadow-sm border border-slate-100 mb-8">
           <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-gold">
              <Shield size={40} />
           </div>
           <h2 className="text-2xl font-bold text-teal mb-2">Join the Community</h2>
           <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Login to manage your profile, track your service needs, and grow your professional reputation in Chitral.</p>
           <div className="space-y-3">
             <button 
               onClick={() => login()}
               disabled={isLoggingIn}
               className="w-full bg-teal text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal/20 active:scale-[0.98] transition-all disabled:opacity-50"
             >
               {isLoggingIn ? 'Connecting...' : 'Get Started'}
             </button>
             <button 
               onClick={() => login()}
               disabled={isLoggingIn}
               className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
             >
               <Shield size={18} />
               Login to Admin
             </button>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] p-8 text-center shadow-sm border border-slate-100 mb-8">
          <div className="w-24 h-24 bg-teal/5 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'default'}`} alt="Avatar" className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-teal">{profile?.name || 'Guest User'}</h2>
          <p className="text-slate-500 text-sm mb-4">{profile?.email}</p>
          <div className="flex flex-col items-center gap-3">
            <span className="inline-block bg-teal text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
              {profile?.role === 'admin' ? 'Administrator' : (profile?.role === 'provider' ? 'Professional Provider' : 'Service Taker')}
            </span>
            
            <p className="text-[10px] text-slate-400 font-medium px-4">
              Your role is permanently tied to this local profile.
            </p>
          </div>
        </div>
      )}

      {profile?.role === 'provider' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
           <h3 className="font-bold text-teal mb-4">Professional Profile</h3>
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Professional Bio</label>
                 <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your expertise and reliability..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-medium text-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                 />
                 <button 
                    onClick={optimizeWithAI}
                    disabled={isOptimizing}
                    className="flex items-center gap-2 text-[10px] font-bold text-teal bg-gold/20 px-3 py-1.5 rounded-lg hover:bg-gold/30 transition-colors mt-2"
                   >
                    {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Optimize Bio with AI
                  </button>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Experience</label>
                 <input 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5 years"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-medium text-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                 />
              </div>
              <button 
                onClick={saveProfessionalInfo}
                disabled={isSaving}
                className="w-full bg-teal text-white py-3 rounded-2xl text-xs font-bold shadow-lg shadow-teal/10 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile Details'}
              </button>
           </div>
        </div>
      )}

      {user && (
        <div className="space-y-3">
          <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm active:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                <Globe size={20} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-teal">Language</span>
                <span className="text-[10px] text-slate-500 font-medium">Urdu / English</span>
              </div>
            </div>
            <span className="text-teal font-bold text-xs bg-gold/20 px-2 py-1 rounded-lg">Change</span>
          </button>

          <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm active:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal">
                <Shield size={20} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-teal">Identity Verification</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {profile?.isVerified ? 'Verified Account' : (pendingApp ? `Status: ${pendingApp.status}` : 'Not Verified')}
                </span>
              </div>
            </div>
            {profile?.isVerified ? (
              <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} /> Verified
              </span>
            ) : pendingApp ? (
              <span className={`font-bold text-[10px] uppercase tracking-wider ${pendingApp.status === 'rejected' ? 'text-crimson' : 'text-gold'}`}>
                {pendingApp.status}
              </span>
            ) : profile?.role === 'provider' ? (
              <button 
                onClick={applyForVerification}
                disabled={isApplying}
                className="bg-teal text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 active:scale-95 transition-transform"
              >
                {isApplying ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                Apply
              </button>
            ) : (
              <span className="text-slate-300 font-bold text-[10px] uppercase tracking-wider">Unverified</span>
            )}
          </button>

          <div className="pt-8 border-t border-slate-50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Switch Mode</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => updateRole('customer')}
                className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                  profile?.role === 'customer' 
                    ? 'bg-teal border-teal text-white shadow-lg shadow-teal/20' 
                    : 'bg-white border-slate-100 text-teal hover:border-teal/20'
                }`}
              >
                Service Taker
              </button>
              <button 
                onClick={() => updateRole('provider')}
                className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                  profile?.role === 'provider' 
                    ? 'bg-teal border-teal text-white shadow-lg shadow-teal/20' 
                    : 'bg-white border-slate-100 text-teal hover:border-teal/20'
                }`}
              >
                Professional
              </button>
            </div>
          </div>

          <button 
            onClick={logout}
            className="w-full bg-white p-4 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm active:bg-slate-50 mt-8"
          >
            <div className="w-10 h-10 bg-crimson/10 rounded-xl flex items-center justify-center text-crimson">
              <LogOut size={20} />
            </div>
            <span className="font-bold text-crimson">Logout from App</span>
          </button>

          <div className="pt-12">
            <div className="bg-red-50 rounded-[32px] p-8 border border-red-100">
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <AlertTriangle size={20} />
                <h4 className="font-black uppercase tracking-tight text-sm">Danger Zone</h4>
              </div>
              <p className="text-xs text-red-600/70 mb-6 leading-relaxed font-medium">
                Resetting your account will clear all local storage data.
              </p>
              <button 
                onClick={resetAccount}
                className="w-full bg-red-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs shadow-lg shadow-red-600/20 active:scale-[0.98] transition-transform"
              >
                <Trash2 size={16} />
                RESET LOCAL PROFILE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
