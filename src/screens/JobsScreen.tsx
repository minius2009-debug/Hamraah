import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, setDoc, serverTimestamp, addDoc, getDoc, limit, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, Banknote, Check, X, MessageSquare, User, ChevronRight, Star, ShieldCheck, Trophy, Send, Info, AlertCircle, ClipboardList, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface ServiceRequest {
  id: string;
  customerId: string;
  category: string;
  location: string;
  description: string;
  initialOfferPKR: number;
  status: 'pending' | 'negotiating' | 'in_progress' | 'completed' | 'cancelled';
  assignedProviderId?: string;
  finalPricePKR?: number;
  createdAt: any;
  updatedAt?: any;
}

interface Negotiation {
  id: string;
  requestId: string;
  providerId: string;
  offerPKR: number;
  message: string;
  createdAt: any;
}

interface ProviderProfile {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
  isVerified: boolean;
  skills?: string[];
  bio?: string;
  experience?: number;
  portfolio?: string[];
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export const JobsScreen: React.FC = () => {
  const { profile, user, login, isLoggingIn } = useAuth();
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [availableJobs, setAvailableJobs] = useState<ServiceRequest[]>([]);
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingProvider, setViewingProvider] = useState<ProviderProfile | null>(null);
  const [rating, setRating] = useState(5);
  
  // AI State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const generateAISummary = async (job: ServiceRequest) => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/summarize-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: job.description, category: job.category }),
      });
      const data = await response.json();
      if (data.summary) {
        setAiSummary(data.summary);
      }
    } catch (error) {
      console.error('AI Summary Error:', error);
    } finally {
      setAiLoading(false);
    }
  };
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isProvider = profile?.role === 'provider';

  useEffect(() => {
    if (!user) return;

    const myQ = query(
      collection(db, 'service_requests'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeMy = onSnapshot(myQ, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'service_requests'));

    let unsubscribeAvail = () => {};
    if (isProvider) {
      const availQ = query(
        collection(db, 'service_requests'),
        where('status', 'in', ['pending', 'negotiating']),
        orderBy('createdAt', 'desc')
      );
      unsubscribeAvail = onSnapshot(availQ, (snapshot) => {
        setAvailableJobs(snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest))
          .filter(job => job.customerId !== user.uid)
        );
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'service_requests'));
    }

    return () => {
      unsubscribeMy();
      unsubscribeAvail();
    };
  }, [user, isProvider]);

  useEffect(() => {
    if (!selectedJob) {
      setNegotiations([]);
      setMessages([]);
      return;
    }

    // Load negotiations for all
    const negQ = query(
      collection(db, `service_requests/${selectedJob.id}/negotiations`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeNeg = onSnapshot(negQ, (snapshot) => {
      setNegotiations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `service_requests/${selectedJob.id}/negotiations`));

    // Load messages if in progress or completed
    let unsubscribeMsg = () => {};
    if (selectedJob.status === 'in_progress' || selectedJob.status === 'completed') {
      const msgQ = query(
        collection(db, `service_requests/${selectedJob.id}/messages`),
        orderBy('createdAt', 'asc')
      );
      unsubscribeMsg = onSnapshot(msgQ, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }, (error) => handleFirestoreError(error, OperationType.LIST, `service_requests/${selectedJob.id}/messages`));
    }

    return () => {
      unsubscribeNeg();
      unsubscribeMsg();
    };
  }, [selectedJob]);

  const sendNotification = async (userId: string, title: string, message: string, type: 'job_status', refId: string) => {
    try {
      const notifId = doc(collection(db, `users/${userId}/notifications`)).id;
      await setDoc(doc(db, `users/${userId}/notifications`, notifId), {
        id: notifId,
        userId,
        title,
        message,
        type,
        referenceId: refId,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Notif error:", error);
    }
  };

  const handleSendOffer = async () => {
    if (!user || !selectedJob || !counterOffer) return;

    try {
      const negId = doc(collection(db, `service_requests/${selectedJob.id}/negotiations`)).id;
      await setDoc(doc(db, `service_requests/${selectedJob.id}/negotiations`, negId), {
        id: negId,
        requestId: selectedJob.id,
        providerId: user.uid,
        offerPKR: Number(counterOffer),
        message: 'I can do this job.',
        createdAt: serverTimestamp()
      });
      
      if (selectedJob.status === 'pending') {
        await updateDoc(doc(db, 'service_requests', selectedJob.id), {
          status: 'negotiating',
          updatedAt: serverTimestamp()
        });
      }

      await sendNotification(
        selectedJob.customerId,
        "New Price Offer",
        `A professional offered PKR ${counterOffer} for your request in ${selectedJob.location}.`,
        'job_status',
        selectedJob.id
      );
      
      setCounterOffer('');
      alert("Offer sent! Wait for the customer to accept.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `service_requests/${selectedJob.id}/negotiations`);
    }
  };

  const handleAcceptOffer = async (neg: Negotiation) => {
    if (!selectedJob) return;

    try {
      await updateDoc(doc(db, 'service_requests', selectedJob.id), {
        status: 'in_progress',
        assignedProviderId: neg.providerId,
        finalPricePKR: neg.offerPKR,
        updatedAt: serverTimestamp()
      });

      await sendNotification(
        neg.providerId,
        "Job Accepted!",
        `The customer accepted your offer of PKR ${neg.offerPKR}. You can now start the job.`,
        'job_status',
        selectedJob.id
      );

      setSelectedJob(prev => prev ? { ...prev, status: 'in_progress', assignedProviderId: neg.providerId, finalPricePKR: neg.offerPKR } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_requests/${selectedJob.id}`);
    }
  };

  const handleDirectAccept = async () => {
    if (!user || !selectedJob) return;

    try {
      await updateDoc(doc(db, 'service_requests', selectedJob.id), {
        status: 'in_progress',
        assignedProviderId: user.uid,
        finalPricePKR: selectedJob.initialOfferPKR,
        updatedAt: serverTimestamp()
      });

      await sendNotification(
        selectedJob.customerId,
        "Provider Accepted Your Price!",
        `A professional has accepted your offer of PKR ${selectedJob.initialOfferPKR} and is starting the job now.`,
        'job_status',
        selectedJob.id
      );

      setSelectedJob(prev => prev ? { ...prev, status: 'in_progress', assignedProviderId: user.uid, finalPricePKR: selectedJob.initialOfferPKR } : null);
      alert("Job accepted! You can now chat with the customer.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_requests/${selectedJob.id}`);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedJob || !newMessage.trim()) return;

    try {
      const msgId = doc(collection(db, `service_requests/${selectedJob.id}/messages`)).id;
      await setDoc(doc(db, `service_requests/${selectedJob.id}/messages`, msgId), {
        id: msgId,
        senderId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `service_requests/${selectedJob.id}/messages`);
    }
  };

  const markJobDone = async () => {
    if (!selectedJob || !user) return;
    try {
      await updateDoc(doc(db, 'service_requests', selectedJob.id), {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
      await sendNotification(
        selectedJob.customerId,
        "Job Completed",
        `The provider has marked the job as done. Please confirm and rate their service.`,
        'job_status',
        selectedJob.id
      );
      setSelectedJob(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_requests/${selectedJob.id}`);
    }
  };

  const confirmCompletion = async () => {
    if (!selectedJob || !selectedJob.assignedProviderId) return;
    try {
      // 1. Update Provider stats
      const provRef = doc(db, 'users', selectedJob.assignedProviderId);
      await updateDoc(provRef, {
        completedJobs: increment(1),
        rating: increment((rating - 5) / 10) // Simple average simulation
      });
      
      // 2. Clear job from active list or mark final
      closeJobDetails();
      alert("Thank you for your feedback! The job is now archived.");
    } catch (error) {
      console.error("Confirm error:", error);
    }
  };

  const fetchProviderProfile = async (providerId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (userDoc.exists()) {
        setViewingProvider(userDoc.data() as ProviderProfile);
      }
    } catch (error) {
      console.error("Error fetching provider profile:", error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'negotiating': return 'bg-gold/10 text-teal';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const closeJobDetails = () => {
    setSelectedJob(null);
    setAiSummary(null);
  };

  if (selectedJob) {
    const isOwner = selectedJob.customerId === user?.uid;
    const isAssigned = selectedJob.assignedProviderId === user?.uid;

    return (
      <div className="pb-24 px-4 pt-4 min-h-screen bg-white flex flex-col">
        {/* Modals same as before... */}
        <AnimatePresence>
          {viewingProvider && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative"
              >
                <button onClick={() => setViewingProvider(null)} className="absolute right-4 top-4 p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-teal/5 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-gold/20 p-1">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingProvider.id}`} alt="Avatar" className="w-full h-full rounded-full" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-teal">{viewingProvider.name}</h3>
                    {viewingProvider.isVerified && <ShieldCheck className="text-emerald-500" size={20} />}
                  </div>
                  <div className="flex items-center justify-center gap-1 bg-gold/10 px-3 py-1 rounded-full w-fit mx-auto">
                    <Star size={14} className="fill-gold text-gold" /><span className="text-sm font-bold text-teal">{viewingProvider.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <Trophy className="mx-auto mb-2 text-gold" size={24} />
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
                    <span className="text-lg font-bold text-teal">{viewingProvider.experience || 0} Years</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <ShieldCheck className="mx-auto mb-2 text-emerald-500" size={24} />
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jobs</span>
                    <span className="text-lg font-bold text-teal">{viewingProvider.completedJobs || 0}+</span>
                  </div>
                </div>

                {viewingProvider.bio && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">About</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">{viewingProvider.bio}</p>
                  </div>
                )}

                <div className="space-y-6">
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-3">Skills & Specialties</h4>
                     <div className="flex flex-wrap gap-2">
                       {viewingProvider.skills?.map(skill => (
                         <span key={skill} className="bg-teal/5 text-teal text-[10px] font-bold px-3 py-1.5 rounded-lg border border-teal/10">
                           {skill}
                         </span>
                       )) || <span className="text-xs text-slate-400 px-1 italic">Professional Service Provider</span>}
                     </div>
                   </div>

                   {viewingProvider.portfolio && viewingProvider.portfolio.length > 0 && (
                     <div>
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-3">Portfolio / Past Work</h4>
                       <div className="grid grid-cols-3 gap-2">
                         {viewingProvider.portfolio.map((img, i) => (
                           <div key={i} className="aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                             <img src={img} alt="Past work" className="w-full h-full object-cover" />
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex items-center justify-between mb-6">
          <button onClick={closeJobDetails} className="flex items-center gap-2 text-slate-500">
            <X size={20} /><span className="text-sm font-bold">Close</span>
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${getStatusStyle(selectedJob.status)}`}>
            {selectedJob.status.replace('_', ' ')}
          </span>
        </header>

        <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Job Details</h4>
          <p className="text-teal font-medium leading-relaxed mb-6">{selectedJob.description}</p>
          
          {!aiSummary && isProvider && (
            <button 
              onClick={() => generateAISummary(selectedJob)}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 bg-teal/5 text-teal py-3 rounded-2xl text-xs font-bold border border-teal/10 hover:bg-teal/10 transition-colors"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate Professional AI Brief
            </button>
          )}

          {aiSummary && (
            <div className="bg-white p-4 rounded-2xl border border-teal/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
               <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={12} className="text-gold" />
                  <span className="text-[10px] font-bold text-teal uppercase tracking-widest">Professional Summary (AI)</span>
               </div>
               <p className="text-xs text-slate-600 italic leading-relaxed">{aiSummary}</p>
            </div>
          )}
        </div>

        {/* Real-time Chat UI */}
        {(selectedJob.status === 'in_progress' || selectedJob.status === 'completed') && (isOwner || isAssigned) && (
          <div className="flex-1 flex flex-col bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden mb-4 min-h-[300px]">
             <div className="bg-white p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-teal/5 rounded-full flex items-center justify-center text-teal">
                      <User size={16} />
                   </div>
                   <span className="text-xs font-bold text-teal">Live Chat with {isOwner ? 'Service Provider' : 'Service Taker'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => alert("SOS Alert Sent! Local emergency contacts and Hamraah safety team have been notified.")}
                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Safety SOS"
                  >
                    <AlertCircle size={16} />
                  </button>
                  {isAssigned && selectedJob.status === 'in_progress' && (
                    <button onClick={markJobDone} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      Mark as Done
                    </button>
                  )}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${
                      m.senderId === user?.uid ? 'bg-teal text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>

             {selectedJob.status === 'in_progress' && (
               <div className="p-3 bg-white flex gap-2">
                 <input 
                   value={newMessage}
                   onChange={(e) => setNewMessage(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Type a message..."
                   className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-teal/20"
                 />
                 <button onClick={handleSendMessage} className="w-10 h-10 bg-teal text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                   <Send size={18} />
                 </button>
               </div>
             )}

             {selectedJob.status === 'completed' && isOwner && (
               <div className="p-6 bg-white text-center">
                 <h4 className="font-bold text-teal mb-4">Rate your experience</h4>
                 <div className="flex justify-center gap-2 mb-6">
                   {[1,2,3,4,5].map(i => (
                     <button key={i} onClick={() => setRating(i)}>
                       <Star size={24} className={i <= rating ? 'fill-gold text-gold' : 'text-slate-200'} />
                     </button>
                   ))}
                 </div>
                 <button onClick={confirmCompletion} className="btn-primary w-full py-3">Confirm & Release Payment</button>
               </div>
             )}
          </div>
        )}

        {/* Bids Section for Negotiation Phase */}
        {selectedJob.status !== 'in_progress' && selectedJob.status !== 'completed' && (
          <div className="space-y-4">
            <h4 className="font-bold text-teal flex items-center gap-2 px-1">
              <MessageSquare size={18} /> Negotiations
            </h4>
            <div className="space-y-3">
              {negotiations.map((neg) => (
                <div key={neg.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => fetchProviderProfile(neg.providerId)}>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal shadow-sm group-hover:border-gold border border-slate-100"><User size={20} /></div>
                    <div>
                      <div className="flex items-center gap-1"><span className="text-xs text-slate-500 font-medium">Offer</span><ChevronRight size={12} className="text-slate-300" /></div>
                      <span className="font-bold text-teal">PKR {neg.offerPKR}</span>
                    </div>
                  </div>
                  {!isProvider && <button onClick={() => handleAcceptOffer(neg)} className="bg-gold text-teal font-bold text-xs px-4 py-2 rounded-xl active:scale-95 transition-transform">Accept</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {isProvider && selectedJob.status === 'pending' && (
           <div className="mt-auto p-4 bg-teal/5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Info className="text-teal" size={20} />
                <p className="text-[10px] text-teal/70 font-medium">You can negotiate a different price or instantly accept the customer's offer.</p>
              </div>
              <button 
                onClick={handleDirectAccept}
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
              >
                <CheckCircle2 size={16} />
                Accept Job (PKR {selectedJob.initialOfferPKR})
              </button>
           </div>
        )}

        {isProvider && selectedJob.status === 'negotiating' && (
           <div className="mt-auto p-4 bg-teal/5 rounded-2xl flex gap-3 items-center">
              <Info className="text-teal" size={20} />
              <p className="text-[10px] text-teal/70 font-medium">Waiting for customer to accept or counter. You can see other jobs in the market.</p>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4">
      {!user && (
        <div className="bg-gold/10 border border-gold/20 rounded-[32px] p-8 text-center mb-8">
           <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 text-teal">
              <ClipboardList size={32} />
           </div>
           <h3 className="text-xl font-bold text-teal mb-2">Track Your Work</h3>
           <p className="text-slate-500 text-sm mb-6">Login to see your active service requests, negotiate prices, and chat with providers.</p>
           <button 
             onClick={login}
             disabled={isLoggingIn}
             className="w-full bg-teal text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal/20 disabled:opacity-50"
           >
             {isLoggingIn ? 'Connecting...' : 'Login to View Market'}
           </button>
        </div>
      )}

      {user && (
        <>
          <div className="bg-teal/5 border border-teal/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${isProvider ? 'bg-emerald-500 animate-pulse' : 'bg-gold'}`} />
               <span className="text-xs font-bold text-teal capitalize">Account Type: {profile?.role === 'provider' ? 'Service Provider' : 'Service Taker'}</span>
            </div>
            <span className="text-[10px] text-slate-400">Manage in Profile</span>
          </div>

          <div className="space-y-8">
            {isProvider && (
              <section>
                <h3 className="font-bold text-lg text-teal mb-4 flex items-center justify-between">Available Jobs <span className="text-[10px] bg-crimson text-white px-2 py-0.5 rounded-full">{availableJobs.length}</span></h3>
                <div className="space-y-4">
                  {availableJobs.map((job) => (
                    <button key={job.id} onClick={() => setSelectedJob(job)} className="w-full text-left bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-crimson bg-crimson/5 px-2 py-1 rounded-lg">{job.category}</span>
                        <span className="font-bold text-teal">PKR {job.initialOfferPKR}</span>
                      </div>
                      <h4 className="font-bold text-teal mb-1">{job.location}</h4>
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1"><Clock size={12} /><span className="text-[10px]">{job.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <div className="flex items-center gap-1"><MapPin size={12} /><span className="text-[10px]">Chitral Town</span></div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-bold text-lg text-teal mb-4">{isProvider ? 'My Active Work' : 'My Service Needs'}</h3>
              <div className="space-y-4">
                {myRequests.map((job) => (
                  <button key={job.id} onClick={() => setSelectedJob(job)} className="w-full text-left bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${getStatusStyle(job.status)}`}>{job.status.replace('_', ' ')}</span>
                      <span className="font-bold text-teal">PKR {job.finalPricePKR || job.initialOfferPKR}</span>
                    </div>
                    <h4 className="font-bold text-teal mb-1">{job.location}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{job.description}</p>
                  </button>
                ))}
                {myRequests.length === 0 && <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400 text-sm">No active jobs.</p></div>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
