import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Globe, LogOut, RefreshCcw, X, Sparkles, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const ProfileScreen: React.FC = () => {
  const { profile, user, logout, login, isLoggingIn, resetAccount } = useAuth();

  const [newSkill, setNewSkill] = useState('');
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  
  const [bio, setBio] = useState(profile?.bio || '');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [vehicle, setVehicle] = useState(profile?.vehicle || '');
  const [portfolioItem, setPortfolioItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

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
           // We'll show an alert or just suggest them
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
        vehicle
      });
      alert("Professional info updated!");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addPortfolioItem = async () => {
    if (!portfolioItem.trim() || !user || !profile) return;
    const updatedPortfolio = [...(profile.portfolio || []), portfolioItem.trim()];
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        portfolio: updatedPortfolio
      });
      setPortfolioItem('');
      window.location.reload();
    } catch (error) {
      console.error("Portfolio error:", error);
    }
  };

  const removePortfolioItem = async (index: number) => {
    if (!user || !profile || !profile.portfolio) return;
    const updatedPortfolio = profile.portfolio.filter((_, i) => i !== index);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        portfolio: updatedPortfolio
      });
      window.location.reload();
    } catch (error) {
      console.error("Portfolio error:", error);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user || !profile) return;
    const updatedSkills = [...(profile.skills || []), newSkill.trim()];
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        skills: updatedSkills
      });
      setNewSkill('');
      window.location.reload();
    } catch (error) {
      console.error("Skill error:", error);
    }
  };

  const removeSkill = async (skillToRemove: string) => {
    if (!user || !profile) return;
    const updatedSkills = profile.skills?.filter(s => s !== skillToRemove) || [];
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        skills: updatedSkills
      });
      window.location.reload();
    } catch (error) {
      console.error("Skill error:", error);
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
           <button 
             onClick={login}
             disabled={isLoggingIn}
             className="w-full bg-teal text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal/20 active:scale-[0.98] transition-all disabled:opacity-50"
           >
             {isLoggingIn ? 'Connecting...' : 'Login with Google'}
           </button>
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
              {profile?.role === 'provider' ? 'Professional Provider' : 'Service Taker'}
            </span>
            
            <p className="text-[10px] text-slate-400 font-medium px-4">
              Your role is permanently tied to this profile. To change your role, you must reset your account.
            </p>
          </div>
        </div>
      )}

      {user && profile?.role === 'provider' && (
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 shadow-sm">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Trips</span>
              <span className="text-xl font-black text-teal">{(profile.reviewsCount || 0) + 12}</span>
           </div>
           <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 shadow-sm">
              <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Rating</span>
              <span className="text-xl font-black text-teal">{profile.rating || '4.9'}</span>
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
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Years of Experience in Chitral</label>
                 <input 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 10 years"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-medium text-teal focus:outline-none focus:ring-1 focus:ring-teal/20"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Vehicle Details</label>
                 <input 
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="e.g. Toyota Prado (4x4)"
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

           <div className="mt-8 pt-8 border-t border-slate-50">
              <h3 className="font-bold text-teal mb-4">Portfolio Gallery</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                 {profile.portfolio?.map((img, i) => (
                   <div key={i} className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePortfolioItem(i)}
                        className="absolute top-1 right-1 p-1 bg-white/80 rounded-lg text-crimson"
                      >
                        <X size={10} />
                      </button>
                   </div>
                 ))}
              </div>
              <div className="flex gap-2">
                 <input 
                    value={portfolioItem}
                    onChange={(e) => setPortfolioItem(e.target.value)}
                    placeholder="Paste image URL of your work..."
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal/20"
                 />
                 <button onClick={addPortfolioItem} className="bg-teal/5 text-teal px-4 py-2 rounded-xl text-xs font-bold border border-teal/10">Add</button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 px-1 italic">Note: Use high-quality image URLs to showcase your best work.</p>
           </div>
        </div>
      )}

      {profile?.role === 'provider' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-teal">Professional Skills</h3>
              <button 
                onClick={() => setIsEditingSkills(!isEditingSkills)}
                className="text-xs font-bold text-gold"
              >
                {isEditingSkills ? 'Done' : 'Edit'}
              </button>
           </div>
           
           <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills?.map(skill => (
                <span key={skill} className="bg-teal/5 text-teal text-[10px] font-bold px-3 py-1.5 rounded-lg border border-teal/10 flex items-center gap-2">
                  {skill}
                  {isEditingSkills && (
                    <button onClick={() => removeSkill(skill)} className="text-crimson hover:scale-110 transition-transform">
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
              {(!profile.skills || profile.skills.length === 0) && (
                <p className="text-xs text-slate-400 italic">No skills added yet.</p>
              )}
           </div>

           {isEditingSkills && (
             <div className="flex gap-2">
                <input 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. Expert Driving"
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal/20"
                />
                <button onClick={addSkill} className="bg-teal text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-teal/10">Add</button>
             </div>
           )}
        </div>
      )}

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
              <span className="text-[10px] text-slate-500 font-medium">Verified using CNIC</span>
            </div>
          </div>
          <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider">Verified</span>
        </button>

        <button 
          onClick={logout}
          className="w-full bg-white p-4 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm active:bg-slate-50 mt-8"
        >
          <div className="w-10 h-10 bg-crimson/10 rounded-xl flex items-center justify-center text-crimson">
            <LogOut size={20} />
          </div>
          <span className="font-bold text-crimson">Logout from App</span>
        </button>

        {/* Developer/Admin Mode Toggle (Secret feature for ease of testing) */}
        <div className="pt-8">
           <button 
             onDoubleClick={async () => {
               if (!user || !profile) return;
               const newRole = profile.role === 'admin' ? 'customer' : 'admin';
               await updateDoc(doc(db, 'users', user.uid), { role: newRole });
               alert(`Admin mode ${newRole === 'admin' ? 'activated' : 'deactivated'}. Please refresh to see the Admin Panel.`);
               window.location.reload();
             }}
             className="w-full py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-teal transition-colors"
           >
             Double-tap to {profile?.role === 'admin' ? 'exit' : 'enter'} Admin Mode
           </button>
        </div>

        <div className="pt-12">
          <div className="bg-red-50 rounded-[32px] p-8 border border-red-100">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle size={20} />
              <h4 className="font-black uppercase tracking-tight text-sm">Danger Zone</h4>
            </div>
            <p className="text-xs text-red-600/70 mb-6 leading-relaxed font-medium">
              Deleting your account will permanently remove your profile, ratings, and role. You can create a new account afterwards if you wish to change your role.
            </p>
            <button 
              onClick={resetAccount}
              className="w-full bg-red-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs shadow-lg shadow-red-600/20 active:scale-[0.98] transition-transform"
            >
              <Trash2 size={16} />
              DELETE & RESET PROFILE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
