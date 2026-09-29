import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MapPin, Mic, Send, Banknote, Navigation, Loader2, Radio, Star, ShieldCheck, Car, Clock, MessageSquare, X, Info, CheckCircle2, Home, Briefcase, BookmarkPlus, VolumeX, Wind, Luggage, Sparkles as SparklesIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

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
  
  const [activeCategory, setActiveCategory] = useState(categoryId);
  const isTransport = ['drivers', 'bikes', 'taxis', 'rickshaws', 'cars'].includes(activeCategory);
  const categoryLabel = activeCategory === 'cars' ? 'Rent a Car' : activeCategory === 'bikes' ? 'Hire a Bike' : activeCategory === 'taxis' ? 'Book a Taxi' : activeCategory === 'rickshaws' ? 'Rickshaw' : activeCategory;
  
  // Real Data States
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [initialEta, setInitialEta] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [rideCompleted, setRideCompleted] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const { profile } = useAuth();
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  const PREFERENCE_OPTIONS = [
    { id: 'quiet', label: 'Quiet Ride', icon: VolumeX },
    { id: 'luggage', label: 'Extra Luggage', icon: Luggage },
    { id: 'ac', label: 'AC Required', icon: Wind },
    { id: 'new', label: 'New Vehicle', icon: SparklesIcon },
  ];

  const togglePreference = (id: string) => {
    setPreferences(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };
  
  const handleSavePlace = async (type: 'home' | 'work', val: string) => {
    if (!user || !val.trim()) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`savedPlaces.${type}`]: val,
        updatedAt: serverTimestamp()
      });
      alert(`Saved as ${type === 'home' ? 'Home' : 'Work'}!`);
    } catch (error) {
      console.error("Save place error:", error);
    }
  };

  // Price Calculation Logic
  useEffect(() => {
    const parseCoords = (str: string) => {
      const match = str.match(/\(([^,]+),\s*([^)]+)\)/);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      return null;
    };

    const fromCoords = parseCoords(location);
    const toCoords = parseCoords(destination);

    if (fromCoords && toCoords) {
      // Haversine formula for distance
      const R = 6371; // km
      const dLat = (toCoords.lat - fromCoords.lat) * Math.PI / 180;
      const dLon = (toCoords.lng - fromCoords.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(fromCoords.lat * Math.PI / 180) * Math.cos(toCoords.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      setEstimatedDistance(Number(distance.toFixed(2)));
      
      // Category rates
      const rates: Record<string, number> = {
        'taxis': 80,
        'bikes': 30,
        'rickshaws': 45,
        'cars': 120,
        'drivers': 50
      };
      
      const price = distance * (rates[activeCategory] || 50);
      setEstimatedPrice(Math.round(price));
      if (!offer) setOffer(Math.round(price).toString());
    } else {
      setEstimatedDistance(null);
      setEstimatedPrice(null);
    }
  }, [location, destination, activeCategory]);

  // Real-time tracking listener
  useEffect(() => {
    if (!selectedDriver) return;
    const unsub = onSnapshot(doc(db, 'users', selectedDriver.id), (doc) => {
      const data = doc.data();
      if (data?.lastLocation) {
        setDriverLocation(data.lastLocation);
      }
    });
    return () => unsub();
  }, [selectedDriver]);

  useEffect(() => {
    if (location.includes('(')) {
      const match = location.match(/\(([^,]+),\s*([^)]+)\)/);
      if (match) setUserCoords({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
    }
  }, [location]);

  // Real-time tracking simulator
  useEffect(() => {
    if (!selectedDriver || eta === null || eta <= 0) return;

    const interval = setInterval(() => {
      setEta(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
      
      setTrackingProgress(prev => {
        const next = prev + (100 / (initialEta || 15));
        return next > 100 ? 100 : next;
      });
    }, 5000); // Update every 5 seconds for simulation

    return () => clearInterval(interval);
  }, [selectedDriver, initialEta]);

  // Fetch Drivers from Firestore
  useEffect(() => {
    if (!user) {
      setLoadingDrivers(false);
      return;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'driver'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
      setLoadingDrivers(false);
    }, (error) => {
      console.error("Error fetching drivers:", error);
      setLoadingDrivers(false);
    });
    return () => unsubscribe();
  }, [user]);

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

  const handleRateDriver = async () => {
    if (!user || !selectedDriver) return;
    setRatingLoading(true);
    try {
      const driverRef = doc(db, 'users', selectedDriver.id);
      const driverSnap = await getDoc(driverRef);
      
      if (driverSnap.exists()) {
        const data = driverSnap.data();
        const currentRating = data.rating || 5;
        const currentCount = data.reviewsCount || 0;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + userRating) / newCount;
        
        await updateDoc(driverRef, {
          rating: Number(newRating.toFixed(1)),
          reviewsCount: newCount,
          updatedAt: serverTimestamp()
        });

        // Also add to a reviews collection for history
        await addDoc(collection(db, 'reviews'), {
          driverId: selectedDriver.id,
          customerId: user.uid,
          rating: userRating,
          createdAt: serverTimestamp()
        });

        setRideCompleted(true);
        setShowRatingModal(false);
        alert(`Thank you! You rated ${selectedDriver.name} ${userRating} stars.`);
        onSuccess();
      }
    } catch (error) {
      console.error("Rating error:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleSelectDriver = async (driver: Driver) => {
    if (!user) {
      login();
      return;
    }
    
    const randomEta = Math.floor(Math.random() * 10) + 5;
    setSelectedDriver(driver);
    setEta(randomEta);
    setInitialEta(randomEta);
    setTrackingProgress(0);
    
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

    const numericOffer = Number(offer);
    if (!offer || isNaN(numericOffer) || numericOffer <= 0) {
      alert("Please enter a valid price offer");
      return;
    }

    const path = 'service_requests';
    try {
      const requestId = doc(collection(db, path)).id;
      await setDoc(doc(db, path, requestId), {
        id: requestId,
        customerId: user.uid,
        category: activeCategory,
        location,
        destination: isTransport ? destination : null,
        description,
        initialOfferPKR: numericOffer,
        assignedDriverId: null, // Always broadcast to all providers
        status: 'pending',
        preferences,
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

      {user && isTransport && (
        <div className="px-6 mb-6">
          <motion.div 
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[21/9] rounded-[32px] overflow-hidden shadow-xl shadow-teal/10"
          >
            <img 
              src={
                activeCategory === 'cars' ? '/src/assets/images/car_rental_hero_1790495430237.jpg' :
                activeCategory === 'bikes' ? '/src/assets/images/bike_rental_hero_1790668396314.jpg' :
                activeCategory === 'taxis' ? '/src/assets/images/taxi_booking_hero_1790668419818.jpg' :
                activeCategory === 'rickshaws' ? '/src/assets/images/rickshaw_service_hero_1790668434852.jpg' :
                '/src/assets/images/car_rental_hero_1790495430237.jpg'
              } 
              alt={categoryLabel}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal/90 via-teal/20 to-transparent flex items-end p-6">
              <div className="w-full flex justify-between items-end">
                <div>
                  <span className="block text-white font-black text-xl tracking-tight leading-none mb-1">
                    {activeCategory === 'cars' ? 'Premium Cars' : 
                     activeCategory === 'bikes' ? 'Adventure Bikes' : 
                     activeCategory === 'taxis' ? 'Valley Taxis' : 'Local Rickshaw'}
                  </span>
                  <span className="text-gold text-[10px] font-black uppercase tracking-[0.2em] opacity-90">
                    Trusted by 500+ Travelers
                  </span>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                  <span className="text-white text-[10px] font-bold">Chitral Network</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {user && isTransport && (
        <div className="px-6 mb-4">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[24px] mb-4">
            {[
              { id: 'taxis', label: 'Taxi', img: '/src/assets/images/taxi_booking_hero_1790668419818.jpg' },
              { id: 'bikes', label: 'Bike', img: '/src/assets/images/bike_rental_hero_1790668396314.jpg' },
              { id: 'rickshaws', label: 'Rickshaw', img: '/src/assets/images/rickshaw_service_hero_1790668434852.jpg' },
              { id: 'cars', label: 'Car', img: '/src/assets/images/car_rental_hero_1790495430237.jpg' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 flex flex-col items-center p-1 rounded-[20px] transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-white shadow-md scale-105 z-10' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-full aspect-square rounded-[16px] overflow-hidden mb-1.5 border-2 border-transparent group-hover:border-teal/20 transition-all">
                  <img src={cat.img} alt="" className="w-full h-full object-cover" />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${activeCategory === cat.id ? 'text-teal' : 'text-slate-500'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

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

      {user && ['drivers', 'bikes', 'taxis', 'rickshaws', 'cars'].includes(activeCategory) && (
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-teal text-sm uppercase tracking-wider">Nearby {categoryLabel}s</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg font-bold">Live Network Strength</span>
          </div>
          
          {loadingDrivers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-teal" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border border-dashed border-slate-200">
               <p className="text-xs text-slate-500 italic">No {categoryLabel}s currently online. You can still post your request!</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {drivers.map((driver) => (
                <div 
                  key={driver.id}
                  className="min-w-[140px] bg-slate-50 border border-slate-100 rounded-3xl p-4 text-center"
                >
                  <div className="relative w-12 h-12 mx-auto mb-2">
                    <img 
                      src={driver.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.id}`} 
                      alt={driver.name} 
                      className="w-full h-full rounded-2xl object-cover bg-white" 
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <p className="text-[10px] font-bold text-teal truncate">{driver.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Star size={8} className="fill-gold text-gold" />
                    <span className="text-[8px] font-bold text-teal">{driver.rating || '5.0'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-2 px-1 italic">Your request will be broadcast to all nearby {categoryLabel}s instantly.</p>
        </div>
      )}

      {user && selectedDriver && (
        <div className="px-6 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-teal text-white rounded-[32px] p-6 shadow-xl shadow-teal/20 overflow-hidden relative"
          >
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Clock size={24} className={eta && eta < 3 ? 'text-gold animate-pulse' : 'text-white'} />
                </div>
                <div>
                  <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">Estimated Arrival</p>
                  <p className="text-2xl font-black">
                    {eta && eta > 0 ? `${eta} mins` : 'Arrived!'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowChat(true)}
                  className="bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 backdrop-blur-md hover:bg-white/30 transition-colors"
                >
                  <MessageSquare size={18} />
                  CHAT
                </button>
                <button 
                  onClick={() => setShowRatingModal(true)}
                  className="bg-gold text-teal px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
                >
                  <CheckCircle2 size={18} />
                  FINISH RIDE
                </button>
              </div>
            </div>

            {/* Real-time Google Map Tracking */}
            <div className="relative h-64 bg-slate-100 rounded-[32px] overflow-hidden border-4 border-white/20 shadow-inner">
              <Map
                defaultZoom={15}
                defaultCenter={userCoords || { lat: 35.8511, lng: 71.7864 }}
                center={driverLocation || userCoords}
                mapId="DEMO_MAP_ID"
                disableDefaultUI={true}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              >
                {userCoords && (
                  <AdvancedMarker position={userCoords} title="Your Location">
                    <Pin background={'#115E59'} borderColor={'#FFFFFF'} glyphColor={'#FFFFFF'} />
                  </AdvancedMarker>
                )}
                
                {driverLocation && (
                  <AdvancedMarker position={driverLocation} title={selectedDriver.name}>
                    <div className="relative">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-1 border-2 border-gold">
                        <Car size={20} className="text-teal" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-teal uppercase tracking-tight">Live GPS Tracking</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Chitral, Pakistan</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] bg-white/10 p-3 rounded-2xl border border-white/5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="opacity-90 font-medium">Your ride with {selectedDriver.name} is end-to-end encrypted.</span>
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
              <div className="flex items-center gap-2">
                {profile?.savedPlaces?.home && (
                  <button 
                    type="button"
                    onClick={() => setLocation(profile.savedPlaces!.home!)}
                    className="p-1.5 bg-teal/5 text-teal rounded-lg hover:bg-teal/10 transition-colors"
                    title="Select Home"
                  >
                    <Home size={12} />
                  </button>
                )}
                {profile?.savedPlaces?.work && (
                  <button 
                    type="button"
                    onClick={() => setLocation(profile.savedPlaces!.work!)}
                    className="p-1.5 bg-teal/5 text-teal rounded-lg hover:bg-teal/10 transition-colors"
                    title="Select Work"
                  >
                    <Briefcase size={12} />
                  </button>
                )}
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
            </div>
            <div className="relative group">
              <input 
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shahi Bazar, Chitral"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-crimson" size={18} />
              
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {location && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => handleSavePlace('home', location)} className="p-1.5 hover:bg-teal/5 rounded-lg text-slate-400 hover:text-teal transition-colors" title="Save as Home"><BookmarkPlus size={14} /></button>
                  </div>
                )}
                {location.includes('(') && (
                  <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                    GPS Locked
                  </div>
                )}
              </div>
            </div>
          </div>

          {isTransport && (
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To (Destination)</label>
                <div className="flex items-center gap-2">
                  {profile?.savedPlaces?.home && (
                    <button 
                      type="button"
                      onClick={() => setDestination(profile.savedPlaces!.home!)}
                      className="p-1.5 bg-teal/5 text-teal rounded-lg hover:bg-teal/10 transition-colors"
                      title="Select Home"
                    >
                      <Home size={12} />
                    </button>
                  )}
                  {profile?.savedPlaces?.work && (
                    <button 
                      type="button"
                      onClick={() => setDestination(profile.savedPlaces!.work!)}
                      className="p-1.5 bg-teal/5 text-teal rounded-lg hover:bg-teal/10 transition-colors"
                      title="Select Work"
                    >
                      <Briefcase size={12} />
                    </button>
                  )}
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
              </div>
              <div className="relative group">
                <input 
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Booni, Upper Chitral"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {destination && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => handleSavePlace('work', destination)} className="p-1.5 hover:bg-teal/5 rounded-lg text-slate-400 hover:text-teal transition-colors" title="Save as Work"><BookmarkPlus size={14} /></button>
                    </div>
                  )}
                  {destination.includes('(') && (
                    <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      GPS Locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isTransport && estimatedPrice !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-teal text-white p-4 rounded-[28px] shadow-lg shadow-teal/20 flex items-center justify-between overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Banknote size={20} className="text-gold" />
                </div>
                <div>
                  <p className="text-[10px] opacity-70 font-black uppercase tracking-widest leading-none mb-1">Estimated Fare</p>
                  <p className="text-xl font-black leading-none">PKR {estimatedPrice}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest leading-none mb-1">Distance</p>
                <p className="text-sm font-bold text-gold leading-none">{estimatedDistance} KM</p>
              </div>
            </motion.div>
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
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeCategory === 'cars' ? 'Rental Duration (Days)' : isTransport ? 'Price Offer (PKR)' : 'Your Initial Offer (PKR)'}
              </label>
              {isTransport && (
                <button 
                  type="button"
                  onClick={() => setShowPrefsModal(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-teal bg-teal/5 px-2 py-1 rounded-lg border border-teal/10 hover:bg-teal/10 transition-colors"
                >
                  <Wind size={12} />
                  {preferences.length > 0 ? `${preferences.length} Prefs Selected` : 'Ride Preferences'}
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                required
                type="number"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder={activeCategory === 'cars' ? "e.g. 3" : "e.g. 1500"}
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
      {/* Preferences Modal */}
      <AnimatePresence>
        {showPrefsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 sm:pb-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-teal">Ride Preferences</h3>
                <button onClick={() => setShowPrefsModal(false)} className="p-2 bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => togglePreference(opt.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[24px] border-2 transition-all ${
                      preferences.includes(opt.id) 
                        ? 'bg-teal border-teal text-white shadow-lg shadow-teal/20 scale-[1.02]' 
                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${preferences.includes(opt.id) ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                      <opt.icon size={24} />
                    </div>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowPrefsModal(false)}
                className="w-full bg-teal text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal/20"
              >
                Confirm Preferences
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && selectedDriver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <img 
                  src={selectedDriver.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDriver.id}`} 
                  alt="" 
                  className="w-full h-full rounded-3xl object-cover border-4 border-teal/10 p-1 bg-slate-50"
                />
                <div className="absolute -bottom-2 -right-2 bg-gold text-teal p-1.5 rounded-full shadow-lg">
                  <Star size={16} className="fill-current" />
                </div>
              </div>
              
              <h3 className="text-xl font-black text-teal mb-1">Rate Your Ride</h3>
              <p className="text-sm text-slate-500 mb-8">How was your journey with <span className="font-bold text-teal">{selectedDriver.name}</span>?</p>
              
              <div className="flex justify-center gap-3 mb-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setUserRating(star)}
                    className="transition-transform"
                  >
                    <Star 
                      size={40} 
                      className={`${star <= userRating ? 'fill-gold text-gold' : 'text-slate-200'} transition-colors`}
                    />
                  </motion.button>
                ))}
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleRateDriver}
                  disabled={ratingLoading}
                  className="w-full bg-teal text-white py-4 rounded-2xl font-black shadow-xl shadow-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {ratingLoading ? <Loader2 size={20} className="animate-spin" /> : 'SUBMIT RATING'}
                </button>
                <button 
                  onClick={() => setShowRatingModal(false)}
                  className="w-full py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
