import React, { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MapPin, Mic, Send, Banknote } from 'lucide-react';
import { motion } from 'motion/react';

interface BookingScreenProps {
  categoryId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ categoryId, onBack, onSuccess }) => {
  const { user, login, isLoggingIn } = useAuth();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [offer, setOffer] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const path = 'service_requests';
    try {
      const requestId = doc(collection(db, path)).id;
      await setDoc(doc(db, path, requestId), {
        id: requestId,
        customerId: user.uid,
        category: categoryId,
        location,
        description,
        initialOfferPKR: Number(offer),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 h-14 bg-white flex items-center px-4 gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-teal capitalize">Book {categoryId === 'cars' ? 'Rent a Car' : categoryId}</h2>
      </header>

      {!user && (
        <div className="px-6 mt-4">
          <div className="bg-gold/10 border border-gold/20 rounded-[32px] p-8 text-center">
             <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 text-teal">
                <Banknote size={32} />
             </div>
             <h3 className="text-xl font-bold text-teal mb-2">Login to Post Request</h3>
             <p className="text-slate-500 text-sm mb-6">Sign in to connect with local service providers and get the best prices.</p>
             <button 
               onClick={login}
               disabled={isLoggingIn}
               className="w-full bg-teal text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal/20 disabled:opacity-50"
             >
               {isLoggingIn ? 'Connecting...' : 'Login with Google'}
             </button>
          </div>
        </div>
      )}

      {user && categoryId === 'cars' && (
        <div className="px-6 mb-6">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-lg shadow-teal/10">
            <img 
              src="/src/assets/images/car_rental_hero_1790495430237.jpg" 
              alt="Car Rental"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal/80 via-transparent to-transparent flex items-end p-6">
              <div>
                <span className="block text-white font-bold text-lg">Premium Fleet</span>
                <span className="text-gold text-xs font-bold uppercase tracking-wider">Available for Chitral Explorers</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Pickup / Service Location</label>
            <div className="relative">
              <input 
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shahi Bazar, Chitral"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-crimson" size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Job Details</label>
            <div className="relative">
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what you need..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 resize-none"
              />
              <button 
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`absolute right-4 bottom-4 p-3 rounded-full transition-all ${isRecording ? 'bg-crimson text-white animate-pulse' : 'bg-gold text-teal shadow-md'}`}
              >
                <Mic size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 px-1">Tip: You can use voice note if you prefer not to type.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              {categoryId === 'cars' ? 'Rental Duration (Days)' : 'Your Initial Offer (PKR)'}
            </label>
            <div className="relative">
              <input 
                required
                type="number"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder={categoryId === 'cars' ? "e.g. 3" : "e.g. 1500"}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-12 text-sm font-bold text-teal focus:outline-none focus:ring-2 focus:ring-teal/50"
              />
              <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
            </div>
            {categoryId === 'cars' && <p className="text-[10px] text-slate-400 px-1">Providers will bid based on your duration.</p>}
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full btn-secondary mt-8 h-14"
          >
            Post Service Request
            <Send size={18} />
          </motion.button>
        </form>
      </div>
      )}
    </div>
  );
};
