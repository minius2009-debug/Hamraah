import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, ThumbsUp, ThumbsDown, MapPin, AlertCircle, Plus, X, FileText, Sparkles, Loader2, MessageSquare, Send, Map as MapIcon, List, Navigation, Landmark, TrendingUp, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  upvotesCount: number;
  downvotesCount: number;
  commentsCount: number;
  status: 'posted' | 'escalated' | 'resolved';
  createdAt: any;
  creatorId: string;
  lat?: number;
  lng?: number;
  aiMetadata?: {
    category: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
    summary: string;
    keywords: string[];
  };
}

interface CivicComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

const CommentSection: React.FC<{ issueId: string }> = ({ issueId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CivicComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'civic_issues', issueId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    
    // Use a separate function for the listener to keep it synchronous
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentData: CivicComment[] = [];
      const fetchNames = async () => {
        for (const d of snapshot.docs) {
          const data = d.data();
          try {
            // Using getDocFromServer to bypass local cache if needed, but getDoc is usually fine
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            commentData.push({
              id: d.id,
              userId: data.userId,
              userName: userDoc.exists() ? userDoc.data().name : 'User',
              text: data.text,
              createdAt: data.createdAt,
            });
          } catch (err) {
            commentData.push({
              id: d.id,
              userId: data.userId,
              userName: 'User',
              text: data.text,
              createdAt: data.createdAt,
            });
          }
        }
        setComments(commentData);
      };
      fetchNames();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `civic_issues/${issueId}/comments`);
    });

    return () => unsubscribe();
  }, [issueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentId = doc(collection(db, 'civic_issues', issueId, 'comments')).id;
      await setDoc(doc(db, 'civic_issues', issueId, 'comments', commentId), {
        userId: user.uid,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'civic_issues', issueId), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Comment error:', error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-50">
      <div className="space-y-3 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-teal">{comment.userName}</span>
              <span className="text-[8px] text-slate-400">
                {comment.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl rounded-tl-none border border-slate-100">
              {comment.text}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-[10px] text-slate-400 text-center py-2 italic">No comments yet. Start the discussion!</p>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal/20"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="w-8 h-8 bg-teal text-white rounded-lg flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      ) : (
        <p className="text-[10px] text-slate-400 text-center italic">Login to join the discussion.</p>
      )}
    </div>
  );
};

const LocationPicker: React.FC<{ onLocationSelect: (lat: number, lng: number) => void, initialPos?: [number, number], forcePos?: [number, number] | null }> = ({ onLocationSelect, initialPos, forcePos }) => {
  const [position, setPosition] = useState<[number, number] | null>(initialPos || null);
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (forcePos) {
      setPosition(forcePos);
      map.flyTo(forcePos, map.getZoom());
    }
  }, [forcePos, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
};

export const CivicScreen: React.FC = () => {
  const { profile, user, login, isLoggingIn } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [userDownvotes, setUserDownvotes] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const CHITRAL_CENTER: [number, number] = [35.8511, 71.7864];

  const toggleComments = (id: string) => {
    const newOpen = new Set(openComments);
    if (newOpen.has(id)) newOpen.delete(id);
    else newOpen.add(id);
    setOpenComments(newOpen);
  };
  
  // AI State
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [activeNotice, setActiveNotice] = useState<{ title: string; content: string } | null>(null);
  const [isGrouping, setIsGrouping] = useState(false);
  const [clusters, setClusters] = useState<{ name: string; issueIds: string[]; summary: string }[]>([]);

  const groupIssuesWithAI = async () => {
    setIsGrouping(true);
    try {
      const issueData = issues.map(i => ({ id: i.id, title: i.title, description: i.description }));
      const response = await fetch('/api/civic/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: issueData }),
      });
      const data = await response.json();
      if (data.clusters) {
        setClusters(data.clusters);
      }
    } catch (error) {
      console.error("Grouping error:", error);
    } finally {
      setIsGrouping(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'civic_issues'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const issuesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CivicIssue));
      setIssues(issuesList);
      setLoading(false);

      if (user) {
        const upvotedIds = new Set<string>();
        const downvotedIds = new Set<string>();

        // Optimized: Only check interactions for the current issues
        const interactionPromises = snapshot.docs.map(async (issueDoc) => {
          try {
            const [upvoteDoc, downvoteDoc] = await Promise.all([
              getDoc(doc(db, 'civic_issues', issueDoc.id, 'upvotes', user.uid)),
              getDoc(doc(db, 'civic_issues', issueDoc.id, 'downvotes', user.uid))
            ]);
            if (upvoteDoc.exists()) upvotedIds.add(issueDoc.id);
            if (downvoteDoc.exists()) downvotedIds.add(issueDoc.id);
          } catch (err) {
            // Silently fail for individual interaction checks
          }
        });

        await Promise.all(interactionPromises);
        setUserUpvotes(upvotedIds);
        setUserDownvotes(downvotedIds);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'civic_issues');
    });

    return () => unsubscribe();
  }, [user]);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const analyzeIssue = async (issue: CivicIssue) => {
    if (!user) return;
    setAnalyzingId(issue.id);
    try {
      const response = await fetch('/api/civic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: issue.title, description: issue.description }),
      });
      const metadata = await response.json();
      
      await updateDoc(doc(db, 'civic_issues', issue.id), {
        aiMetadata: metadata,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const generateAINotice = async (issue: CivicIssue) => {
    setAiLoading(issue.id);
    try {
      const response = await fetch('/api/ai/generate-civic-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issue),
      });
      const data = await response.json();
      if (data.notice) {
        setActiveNotice({ title: issue.title, content: data.notice });
      }
    } catch (error: any) {
      console.error('AI Notice Error:', error);
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        alert("The AI advocacy tool is currently busy (limit reached). Please try again in a few hours.");
      } else {
        alert("AI notice generation failed. Please try again later.");
      }
    } finally {
      setAiLoading(null);
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads');
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [forcePos, setForcePos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLat(latitude);
        setSelectedLng(longitude);
        setForcePos([latitude, longitude]);
        setLocating(false);
      },
      (error) => {
        const errorDetails = {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        };
        console.warn("Geolocation detailed error (Civic):", errorDetails);
        
        let displayMessage = "Unable to retrieve your location";
        if (error.code === error.PERMISSION_DENIED) {
          displayMessage = "Location access denied. Please enable location permissions in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          displayMessage = "Location information is unavailable in your current area.";
        } else if (error.code === error.TIMEOUT) {
          displayMessage = "The request to get your location timed out.";
        }
        
        alert(displayMessage);
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const path = 'civic_issues';
    try {
      const issueId = doc(collection(db, path)).id;
      const newIssue: any = {
        id: issueId,
        creatorId: user.uid,
        title,
        description,
        category,
        upvotesCount: 0,
        downvotesCount: 0,
        commentsCount: 0,
        status: 'posted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lat: selectedLat,
        lng: selectedLng
      };
      await setDoc(doc(db, path, issueId), newIssue);
      analyzeIssue(newIssue);
      setShowForm(false);
      setTitle('');
      setDescription('');
      setSelectedLat(null);
      setSelectedLng(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpvote = async (issueId: string) => {
    if (!user) return;
    
    const upvoteRef = doc(db, 'civic_issues', issueId, 'upvotes', user.uid);
    const upvoteDoc = await getDoc(upvoteRef);
    
    if (upvoteDoc.exists()) return; // Already upvoted

    try {
      await setDoc(upvoteRef, {
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'civic_issues', issueId), {
        upvotesCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Upvote failed:", error);
    }
  };

  const handleDownvote = async (issueId: string) => {
    if (!user) return;
    
    const downvoteRef = doc(db, 'civic_issues', issueId, 'downvotes', user.uid);
    const downvoteDoc = await getDoc(downvoteRef);
    
    if (downvoteDoc.exists()) return;

    try {
      // 1. If upvoted, remove upvote first (optional but cleaner)
      // For simplicity, we just allow switching.
      
      await setDoc(downvoteRef, {
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'civic_issues', issueId), {
        downvotesCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Downvote failed:", error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Resolved';
      case 'escalated': return 'In Progress';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'escalated': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const scoreA = (a.upvotesCount || 0) + (a.commentsCount || 0) * 2 - (a.downvotesCount || 0);
    const scoreB = (b.upvotesCount || 0) + (b.commentsCount || 0) * 2 - (b.downvotesCount || 0);
    return scoreB - scoreA;
  });

  const topFiveIds = new Set(sortedIssues.slice(0, 5).filter(i => (i.upvotesCount || 0) > 0).map(i => i.id));

  return (
    <div className="pb-24 px-4 pt-4">
      {!user && (
        <div className="bg-gold/10 border border-gold/20 rounded-3xl p-6 mb-8 text-center">
           <p className="text-sm font-bold text-teal mb-3">Join Hamraah to Raise Your Voice</p>
           <button 
             onClick={login}
             disabled={isLoggingIn}
             className="bg-teal text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-teal/10 disabled:opacity-50"
           >
             {isLoggingIn ? 'Connecting...' : 'Login to Report Issues'}
           </button>
        </div>
      )}

      <div className="bg-crimson/5 border border-crimson/10 rounded-3xl p-6 mb-8 text-center">
        <div className="w-12 h-12 bg-crimson/10 rounded-full flex items-center justify-center mx-auto mb-3 text-crimson">
          <Megaphone size={24} />
        </div>
        <h2 className="text-xl font-bold text-teal mb-1">Online Protest</h2>
        <p className="text-slate-600 text-sm">Raise your voice for Chitral's development.</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg text-teal">Recent Reports</h3>
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-teal' : 'text-slate-400'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-teal' : 'text-slate-400'}`}
            >
              <MapIcon size={16} />
            </button>
          </div>
          <button 
            onClick={groupIssuesWithAI}
            disabled={isGrouping || issues.length === 0}
            className="flex items-center gap-2 text-xs font-bold text-teal bg-teal/5 px-3 py-2 rounded-xl border border-teal/10 hover:bg-teal/10 transition-colors disabled:opacity-50"
          >
            {isGrouping ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {clusters.length > 0 ? 'Regroup' : 'AI Cluster'}
          </button>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-crimson text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-crimson/20"
        >
          <Plus size={16} />
          Report Issue
        </button>
      </div>

      {clusters.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-teal uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-gold" /> AI Semantic Groups
            </h4>
            <button onClick={() => setClusters([])} className="text-[10px] font-bold text-slate-400 hover:text-crimson">Clear</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {clusters.map((cluster, idx) => (
              <div 
                key={idx}
                className="min-w-[280px] bg-gold/5 border border-gold/20 rounded-[24px] p-5 shadow-sm"
              >
                <h5 className="font-black text-teal text-sm mb-1">{cluster.name}</h5>
                <p className="text-[10px] text-teal/60 font-bold uppercase tracking-tighter mb-3">{cluster.issueIds.length} Linked Reports</p>
                <p className="text-xs text-slate-600 line-clamp-3 italic mb-4 leading-relaxed">"{cluster.summary}"</p>
                <div className="flex -space-x-2 overflow-hidden">
                  {cluster.issueIds.slice(0, 5).map((id, i) => (
                    <div key={id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-400">
                      #{i+1}
                    </div>
                  ))}
                  {cluster.issueIds.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-teal/10 flex items-center justify-center text-[8px] font-bold text-teal">
                      +{cluster.issueIds.length - 5}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[500px] w-full rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative z-10">
          <MapContainer center={CHITRAL_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {issues.filter(i => i.lat && i.lng).map(issue => (
              <Marker key={issue.id} position={[issue.lat!, issue.lng!]}>
                <Popup className="custom-popup">
                  <div className="p-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block border ${getStatusColor(issue.status)}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                    <h4 className="font-bold text-teal text-sm mb-1">{issue.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-2">{issue.category}</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{issue.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedIssues.map((issue) => (
            <motion.div 
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-3xl p-5 shadow-sm border transition-all ${topFiveIds.has(issue.id) ? 'border-crimson/30 shadow-crimson/5 bg-gradient-to-br from-white to-crimson/[0.02]' : 'border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(issue.status)}`}>
                    {getStatusLabel(issue.status)}
                  </span>
                  {topFiveIds.has(issue.id) && (
                    <span className="text-[10px] font-black px-3 py-1 bg-crimson text-white rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
                      <Landmark size={10} /> To Admin Office
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {issue.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              
              <h4 className="font-bold text-teal text-lg mb-2 flex items-center gap-2">
                {issue.title}
                {topFiveIds.has(issue.id) && <TrendingUp size={16} className="text-crimson" />}
              </h4>
              
              {issue.aiMetadata && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-tighter ${
                    issue.aiMetadata.urgency === 'Critical' ? 'bg-red-500 text-white border-red-600' :
                    issue.aiMetadata.urgency === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {issue.aiMetadata.urgency} Urgency
                  </span>
                  {issue.aiMetadata.keywords?.map(kw => (
                    <span key={kw} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {issue.description}
              </p>

              {issue.aiMetadata && (
                <div className="bg-gold/5 border border-gold/10 p-3 rounded-2xl mb-4">
                  <p className="text-[10px] font-black text-teal/60 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Sparkles size={10} /> AI Government Brief
                  </p>
                  <p className="text-xs text-teal/80 font-medium italic italic">"{issue.aiMetadata.summary}"</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between border-t border-slate-50 pt-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} className="text-crimson" />
                    <span className="text-xs font-medium">{issue.category}</span>
                  </div>
                  
                    {issue.upvotesCount >= 1 && (
                      <button 
                        onClick={() => generateAINotice(issue)}
                        disabled={aiLoading === issue.id}
                        className="flex items-center gap-2 text-xs font-bold text-teal bg-teal/5 px-3 py-2 rounded-xl border border-teal/10 hover:bg-teal/10 transition-colors"
                      >
                        {aiLoading === issue.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Draft Notice
                      </button>
                    )}

                    {!issue.aiMetadata && (
                      <button 
                        onClick={() => analyzeIssue(issue)}
                        disabled={analyzingId === issue.id}
                        className="flex items-center gap-2 text-xs font-bold text-crimson bg-crimson/5 px-3 py-2 rounded-xl border border-crimson/10 hover:bg-crimson/10 transition-colors"
                      >
                        {analyzingId === issue.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Activity size={14} />
                        )}
                        AI Analyze
                      </button>
                    )}
                  </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-50 rounded-2xl p-1 border border-slate-100">
                    <button 
                      onClick={() => handleUpvote(issue.id)}
                      disabled={userUpvotes.has(issue.id) || userDownvotes.has(issue.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${
                        userUpvotes.has(issue.id) 
                          ? 'bg-white shadow-sm text-crimson' 
                          : 'text-slate-400 hover:text-teal'
                      }`}
                    >
                      <ThumbsUp size={16} className={userUpvotes.has(issue.id) ? 'fill-crimson text-crimson' : 'group-hover:text-teal'} />
                      <span className={`text-xs font-bold ${userUpvotes.has(issue.id) ? 'text-crimson' : 'text-teal'}`}>
                        {issue.upvotesCount || 0}
                      </span>
                    </button>

                    <button 
                      onClick={() => handleDownvote(issue.id)}
                      disabled={userUpvotes.has(issue.id) || userDownvotes.has(issue.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${
                        userDownvotes.has(issue.id) 
                          ? 'bg-white shadow-sm text-slate-800' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <ThumbsDown size={16} className={userDownvotes.has(issue.id) ? 'fill-slate-800 text-slate-800' : 'group-hover:text-slate-600'} />
                      <span className={`text-xs font-bold ${userDownvotes.has(issue.id) ? 'text-slate-800' : 'text-slate-400'}`}>
                        {issue.downvotesCount || 0}
                      </span>
                    </button>
                  </div>

                  <button 
                    onClick={() => toggleComments(issue.id)}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-teal/5 px-4 py-2 rounded-xl transition-colors group border border-slate-100"
                  >
                    <MessageSquare size={16} className="text-slate-400 group-hover:text-teal" />
                    <span className="text-sm font-bold text-teal">Discuss</span>
                  </button>
                </div>
              </div>

              {openComments.has(issue.id) && <CommentSection issueId={issue.id} />}
            </motion.div>
          ))}
          {issues.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
              <p>No issues reported yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 sm:pb-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-teal">New Report</h3>
                <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Title</label>
                  <input 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/50"
                  >
                    <option>Roads</option>
                    <option>Water</option>
                    <option>Electricity</option>
                    <option>Waste</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Description</label>
                  <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Provide details about the issue..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/50 resize-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tag Location (Click on Map)</label>
                    <button 
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-teal bg-teal/5 px-2 py-1 rounded-lg border border-teal/10 hover:bg-teal/10 transition-colors disabled:opacity-50"
                    >
                      {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                      Use My Location
                    </button>
                  </div>
                  <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-10">
                    <MapContainer center={CHITRAL_CENTER} zoom={10} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker 
                        onLocationSelect={(lat, lng) => {
                          setSelectedLat(lat);
                          setSelectedLng(lng);
                          setForcePos(null);
                        }} 
                        forcePos={forcePos}
                      />
                    </MapContainer>
                  </div>
                  {selectedLat && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ Location tagged ({selectedLat.toFixed(4)}, {selectedLng?.toFixed(4)})</p>
                  )}
                </div>

                <button type="submit" className="w-full btn-danger mt-4">
                  Post Report
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notice Modal */}
      <AnimatePresence>
        {activeNotice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[32px] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center text-teal">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-teal uppercase tracking-tight">Official Draft Notice</h3>
                </div>
                <button onClick={() => setActiveNotice(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 font-serif whitespace-pre-wrap text-sm leading-relaxed text-slate-800 shadow-inner">
                  {activeNotice.content}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(activeNotice.content);
                    alert("Notice copied to clipboard!");
                  }}
                  className="flex-1 bg-crimson text-white py-4 rounded-2xl font-bold shadow-lg shadow-crimson/20"
                >
                  Copy to Clipboard
                </button>
                <button 
                  onClick={() => setActiveNotice(null)}
                  className="flex-1 bg-slate-100 text-teal py-4 rounded-2xl font-bold hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {user && !showForm && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-crimson text-white rounded-full flex items-center justify-center shadow-2xl shadow-crimson/40 z-40 md:bottom-8"
        >
          <Plus size={28} />
        </motion.button>
      )}
    </div>
  );
};
