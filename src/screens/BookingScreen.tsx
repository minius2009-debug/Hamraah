import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, query, where, orderBy, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MapPin, Mic, Send, Banknote, Navigation, Loader2, Radio, Star, ShieldCheck, Car, Clock, MessageSquare, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingScreenProps {
  categoryId: string;
  onBack: () => void;
  onSuccess: () => void;
}

interface Driver {
  id: string;
  name: string;
  rating?: number;
  reviewsCount?: number;
  vehicle?: string;
  experience?: string;
  photoURL?: string;
  isVerified?: boolean;
}

interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ categoryId, onBack, onSuccess }) => {
  const { user, login, isLoggingIn } = useAuth();
  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [offer, setOffer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatingDest, setLocatingDest] = useState(false);
  
  const isTransport = ['drivers', 'bikes', 'taxis', 'rickshaws', 'cars'].includes(categoryId);
  const categoryLabel = categoryId === 'cars' ? 'Rent a Car' : categoryId === 'bikes' ? 'Hire a Bike' : categoryId === 'taxis' ? 'Book a Taxi' : categoryId === 'rickshaws' ? 'Rickshaw' : categoryId;
  
  // Real Data States
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  // Fetch Drivers from Firestore
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'driver'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
      setLoadingDrivers(false);
    }, (error) => {
      console.error("Error fetching drivers:", error);
      setLoadingDrivers(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Chat Listener
  useEffect(() => {
    if (!activeChatId) return;
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'), 
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsubscribe();
  }, [activeChatId]);

  const handleSelectDriver = async (driver: Driver) => {
    if (!user) {
      login();
      return;
    }
    
    setSelectedDriver(driver);
    setEta(Math.floor(Math.random() * 15) + 5);
    
    // Check or Create Chat Session
    const chatId = user.uid < driver.id ? `${user.uid}_${driver.id}` : `${driver.id}_${user.uid}`;
    setActiveChatId(chatId);
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          customerId: user.uid,
          driverId: driver.id,
          updatedAt: serverTimestamp()
        });
        
        // Initial Greeting
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: driver.id,
          text: `Salam! I'm nearby. Where exactly in Chitral do you want to go?`,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Chat setup error:", error);
    }
  };

  const QUICK_REPLIES = ["Where are you?", "I am here", "Wait for me", "How much?"];

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    if (!user || !activeChatId) return;
    
    const messageToSend = textOverride || chatMessage;
    if (!messageToSend.trim()) return;

    try {
      await addDoc(collection(db, 'chats', activeChatId, 'messages'), {
        senderId: user.uid,
        text: messageToSend,
        createdAt: serverTimestamp()
      });
      if (!textOverride) setChatMessage('');
    } catch (error) {
      console.error("Message send error:", error);
    }
  };

  const handleUseCurrentLocation = (target: 'pickup' | 'destination') => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    if (target === 'pickup') setLocating(true); else setLocatingDest(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const val = `${target === 'pickup' ? 'Current' : 'Selected'} Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
        if (target === 'pickup') {
          setLocation(val);
          setLocating(false);
        } else {
          setDestination(val);
          setLocatingDest(false);
        }
      },
      (error) => {
        const errorDetails = {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        };
        console.warn("Geolocation detailed error:", errorDetails);
        
        let displayMessage = "Unable to retrieve your location";
        if (error.code === error.PERMISSION_DENIED) {
          displayMessage = "Location access denied. Please enable location permissions in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          displayMessage = "Location information is unavailable in your current area.";
        } else if (error.code === error.TIMEOUT) {
          displayMessage = "The request to get your location timed out.";
        }
        
        alert(displayMessage);
        if (target === 'pickup') setLocating(false); else setLocatingDest(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!location.trim()) {
      alert("Please enter a pickup location");
      return;
    }

    if (isTransport && !destination.trim()) {
      alert("Please enter a destination");
      return;
    }

    if (!offer || Number(offer) <= 0) {
      alert("Please enter a valid price offer");
      return;
    }

    const path = 'service_requests';
    try {
      const requestId = doc(collection(db, path)).id;
      await setDoc(doc(db, path, requestId), {
        id: requestId,
        customerId: user.uid,
        category: categoryId,
        location,
        destination: isTransport ? destination : null,
        description,
        initialOfferPKR: Number(offer),
        assignedDriverId: selectedDriver?.id || null,
        status: selectedDriver ? 'negotiating' : 'pending',
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
        <h2 className="text-lg font-bold text-teal capitalize">
          {categoryLabel}
        </h2>
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

      {user && isTransport && (
        <div className="px-6 mb-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
              </div>
              <div>
                <span className="block text-emerald-700 font-bold text-xs uppercase tracking-tight">Live Service Active</span>
                <span className="text-[10px] text-emerald-600 font-medium">Scanning for nearby {categoryLabel}...</span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-emerald-700 font-black text-sm">Live</span>
              <span className="text-[10px] text-emerald-600">Tracking</span>
            </div>
          </div>
        </div>
      )}

      {user && ['drivers', 'bikes', 'taxis', 'rickshaws'].includes(categoryId) && (
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-teal text-sm uppercase tracking-wider">Available {categoryLabel}s</h3>
            <span className="text-[10px] bg-teal/5 text-teal px-2 py-1 rounded-lg font-bold">Live Valley Network</span>
          </div>
          
          {loadingDrivers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-teal" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border border-dashed border-slate-200">
               <p className="text-xs text-slate-500 italic">No {categoryLabel}s currently online in your area.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {drivers.map((driver) => (
                <motion.div 
                  key={driver.id}
                  whileTap={{ scale: 0.98 }}
                  className="min-w-[280px] bg-white border border-slate-100 rounded-[32px] p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img 
                        src={driver.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.id}`} 
                        alt={driver.name} 
                        className="w-14 h-14 rounded-2xl object-cover bg-slate-100" 
                      />
                      {driver.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg" title="Identity Verified">
                          <ShieldCheck size={12} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-teal leading-tight">{driver.name}</h4>
                          {driver.isVerified && (
                             <span className="text-[7px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase border border-emerald-100">
                               ID Verified
                             </span>
                          )}
                        </div>
                        {driver.isVerified && <span className="text-[8px] text-emerald-500 font-bold">Verification Complete 100%</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="fill-gold text-gold" />
                        <span className="text-xs font-bold text-teal">Rating: {driver.rating || '5.0'}</span>
                        <span className="text-[10px] text-slate-400">({driver.reviewsCount || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Car size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold leading-none mb-1">Vehicle</p>
                        <p className="text-xs font-bold text-teal leading-none">{driver.vehicle || 'Standard (4x4)'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold leading-none mb-1">Experience</p>
                        <p className="text-xs font-bold text-teal leading-none">{driver.experience || 'Experienced'} in Chitral</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectDriver(driver)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                      selectedDriver?.id === driver.id 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-50 text-teal hover:bg-teal hover:text-white'
                    }`}
                  >
                    {selectedDriver?.id === driver.id ? 'Selected' : 'Connect with Driver'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {user && selectedDriver && (
        <div className="px-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-teal text-white rounded-3xl p-5 shadow-lg shadow-teal/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Estimated Arrival</p>
                  <p className="text-lg font-black">{eta} Minutes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(true)}
                className="bg-white text-teal px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gold transition-colors"
              >
                <MessageSquare size={16} />
                Chat
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] bg-black/10 p-2 rounded-lg">
              <Info size={12} />
              <span>Live tracking is active based on {selectedDriver.name}'s GPS.</span>
            </div>
          </motion.div>
        </div>
      )}

      {user && (
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTransport ? 'From (Pickup)' : 'Location'}</label>
              <button 
                type="button"
                onClick={() => handleUseCurrentLocation('pickup')}
                disabled={locating}
                className="flex items-center gap-1 text-[10px] font-bold text-teal hover:text-crimson transition-colors disabled:opacity-50"
              >
                {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                Use My Location
              </button>
            </div>
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

          {isTransport && (
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To (Destination)</label>
                <button 
                  type="button"
                  onClick={() => handleUseCurrentLocation('destination')}
                  disabled={locatingDest}
                  className="flex items-center gap-1 text-[10px] font-bold text-teal hover:text-crimson transition-colors disabled:opacity-50"
                >
                  {locatingDest ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                  Use My Location
                </button>
              </div>
              <div className="relative">
                <input 
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Booni, Upper Chitral"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
              </div>
            </div>
          )}

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
              {categoryId === 'cars' ? 'Rental Duration (Days)' : isTransport ? 'Price Offer (PKR)' : 'Your Initial Offer (PKR)'}
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
            {isTransport && <p className="text-[10px] text-slate-400 px-1">Providers will bid based on your offer.</p>}
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
      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && selectedDriver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] flex flex-col h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-teal text-white">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedDriver.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDriver.id}`} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20 bg-slate-100" 
                  />
                  <div>
                    <h4 className="font-bold text-sm leading-none">{selectedDriver.name}</h4>
                    <span className="text-[10px] opacity-80 italic">Active Now</span>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${user && msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      user && msg.senderId === user.uid
                        ? 'bg-teal text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 rounded-tl-none shadow-sm'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`text-[8px] block mt-1 ${user && msg.senderId === user.uid ? 'text-white/60' : 'text-slate-400'}`}>
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSendMessage(undefined, reply)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-teal hover:border-teal transition-colors shadow-sm"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                <input 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal/20"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="w-10 h-10 bg-teal text-white rounded-xl flex items-center justify-center disabled:opacity-50 shadow-lg shadow-teal/10"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
