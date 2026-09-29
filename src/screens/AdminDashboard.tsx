import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Trash2, AlertTriangle, Clock, MapPin, Search, Loader2, CheckCircle2, Megaphone } from 'lucide-react';

interface ServiceRequest {
  id: string;
  customerId: string;
  category: string;
  location: string;
  description: string;
  status: string;
  createdAt: any;
}

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // News form state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState('News');
  const [newsLocation, setNewsLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const qReq = query(collection(db, 'service_requests'), orderBy('createdAt', 'desc'));
    const unsubReq = onSnapshot(qReq, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
    });

    const qUpd = query(collection(db, 'chitral_updates'), orderBy('createdAt', 'desc'));
    const unsubUpd = onSnapshot(qUpd, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubReq();
      unsubUpd();
    };
  }, [profile]);

  const handlePostNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'chitral_updates'), {
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        location: newsLocation,
        createdAt: serverTimestamp()
      });
      setNewsTitle('');
      setNewsContent('');
      setNewsLocation('');
      alert("News posted successfully!");
    } catch (error) {
      console.error("News post error:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const seedRealNews = async () => {
     const realNews = [
       { title: "Honeybee Preservation", category: "News", location: "Chitral Valley", content: "Efforts are underway to establish a reserve for Apis cerana, Chitral's indigenous honeybee, which is crucial for mountain agriculture and local livelihoods." },
       { title: "Road Status: Main Routes Open", category: "Traffic", location: "Chitral-Gilgit", content: "The main road to Chitral is open. The Gilgit-Chitral route via Shandur remains accessible but is expected to close soon for the winter season." },
       { title: "Kalash Phool Festival", category: "Event", location: "Kalash Valleys", content: "The traditional Phool Festival, marking the end of agricultural work, is being celebrated across the Kalash valleys with traditional dances and music." },
       { title: "Infrastructure Alert: Dilapidated Roads", category: "Traffic", location: "Upper Chitral", content: "Residents of Upper Chitral are demanding urgent repairs for the severely dilapidated roads to Torkhow, Terich, and Laspur." }
     ];
     
     for (const news of realNews) {
       await addDoc(collection(db, 'chitral_updates'), { ...news, createdAt: serverTimestamp() });
     }
     alert("Real news seeded!");
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!confirm("Delete this news update?")) return;
    await deleteDoc(doc(db, 'chitral_updates', id));
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("ADMIN ACTION: Permanently delete this request? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'service_requests', id));
      alert("Request deleted by admin.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `service_requests/${id}`);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.location.toLowerCase().includes(search.toLowerCase()) || 
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  if (profile?.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle size={48} className="text-crimson mb-4" />
        <h2 className="text-xl font-bold text-teal">Access Denied</h2>
        <p className="text-slate-500 text-sm">You do not have administrator privileges.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-8 pb-24">
      <header className="flex justify-between items-center bg-teal text-white p-8 rounded-[40px] shadow-xl shadow-teal/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-gold" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Admin Moderation</h2>
          </div>
          <p className="text-teal-50/80 text-sm font-medium">Manage all community service requests in Chitral.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
          <span className="text-[10px] font-black uppercase tracking-widest">{requests.length} Total Posts</span>
        </div>
      </header>

      <div className="relative">
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search requests by location, category, or content..."
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* News Poster */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-teal">Post Official News</h3>
            <button 
              onClick={seedRealNews}
              className="text-[10px] font-black text-gold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-lg"
            >
              Seed Real News
            </button>
          </div>
          
          <form onSubmit={handlePostNews} className="space-y-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">News Title</label>
               <input 
                 value={newsTitle}
                 onChange={(e) => setNewsTitle(e.target.value)}
                 className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-teal"
                 placeholder="e.g. Lowari Tunnel Update"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">Category</label>
                 <select 
                   value={newsCategory}
                   onChange={(e) => setNewsCategory(e.target.value)}
                   className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-teal"
                 >
                   <option>News</option>
                   <option>Traffic</option>
                   <option>Weather</option>
                   <option>Event</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">Location</label>
                 <input 
                   value={newsLocation}
                   onChange={(e) => setNewsLocation(e.target.value)}
                   className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-teal"
                   placeholder="e.g. Booni"
                 />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Content</label>
               <textarea 
                 value={newsContent}
                 onChange={(e) => setNewsContent(e.target.value)}
                 rows={4}
                 className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-teal"
                 placeholder="Write the real update here..."
               />
             </div>
             <button 
               type="submit"
               disabled={isPosting}
               className="w-full bg-teal text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-teal/10 flex items-center justify-center gap-2"
             >
               {isPosting ? <Loader2 className="animate-spin" size={16} /> : <Megaphone size={16} />}
               PUBLISH UPDATE
             </button>
          </form>
        </div>

        {/* Live Updates Management */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
           <h3 className="text-xl font-black text-teal mb-6">Live News Stream</h3>
           <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
              {updates.map(upd => (
                <div key={upd.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black bg-teal text-white px-1.5 py-0.5 rounded uppercase">{upd.category}</span>
                        <h4 className="text-xs font-black text-teal truncate">{upd.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{upd.content}</p>
                   </div>
                   <button 
                     onClick={() => handleDeleteUpdate(upd.id)}
                     className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
              ))}
              {updates.length === 0 && <p className="text-center py-12 text-slate-400 text-xs italic">No updates in stream.</p>}
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black text-teal px-1">Manage Community Posts</h3>
        {loading ? (
          <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-teal" /></div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((req) => (
              <motion.div 
                key={req.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-teal/5 text-teal text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                      {req.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                      req.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                      req.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      'bg-gold/10 text-teal'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-teal mb-1">{req.location}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{req.description}</p>
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-1"><Clock size={12} /><span className="text-[10px] font-bold">{req.createdAt?.toDate().toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-1"><MapPin size={12} /><span className="text-[10px] font-bold">Post ID: {req.id.slice(0, 8)}</span></div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleDeleteRequest(req.id)}
                    className="flex-1 md:flex-none h-14 w-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="Delete Request"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {!loading && filteredRequests.length === 0 && (
          <div className="text-center py-24 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold italic">No requests match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
