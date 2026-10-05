import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, deleteDoc, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Send, User, Clock, Trash2, ChevronRight, MessageCircle, AlertCircle, Share2, Info, Loader2 } from 'lucide-react';

interface Thread {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  postsCount: number;
  createdAt: any;
}

interface Post {
  id: string;
  creatorId: string;
  creatorName: string;
  text: string;
  createdAt: any;
}

export const ForumScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Thread));
      setThreads(threadList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedThread) {
      setPosts([]);
      return;
    }

    const q = query(collection(db, `forum_threads/${selectedThread.id}/posts`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postList);
    });
    return () => unsubscribe();
  }, [selectedThread]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newDesc.trim()) return;

    try {
      await addDoc(collection(db, 'forum_threads'), {
        creatorId: user.uid,
        creatorName: profile?.name || 'Anonymous',
        title: newTitle,
        description: newDesc,
        postsCount: 0,
        createdAt: serverTimestamp()
      });
      setNewTitle('');
      setNewDesc('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedThread || !newPost.trim()) return;

    try {
      const threadRef = doc(db, 'forum_threads', selectedThread.id);
      await addDoc(collection(db, `forum_threads/${selectedThread.id}/posts`), {
        creatorId: user.uid,
        creatorName: profile?.name || 'Anonymous',
        text: newPost,
        createdAt: serverTimestamp()
      });
      await updateDoc(threadRef, {
        postsCount: increment(1),
        updatedAt: serverTimestamp()
      });
      setNewPost('');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const handleDeleteThread = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discussion?')) return;
    try {
      await deleteDoc(doc(db, 'forum_threads', id));
      if (selectedThread?.id === id) setSelectedThread(null);
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  if (selectedThread) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedThread(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div>
              <h2 className="font-black text-teal text-xl leading-tight">{selectedThread.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Started by {selectedThread.creatorName}</p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-teal transition-colors">
            <Share2 size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center text-teal">
                  <User size={20} />
                </div>
                <div>
                   <p className="font-bold text-teal">{selectedThread.creatorName}</p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Thread Starter</p>
                </div>
             </div>
             <p className="text-slate-600 leading-relaxed text-lg">{selectedThread.description}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Replies ({posts.length})</h3>
            {posts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-4 ${post.creatorId === user?.uid ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <User size={20} className="text-slate-400" />
                </div>
                <div className={`p-5 rounded-[24px] max-w-[80%] ${post.creatorId === user?.uid ? 'bg-teal text-white' : 'bg-white text-slate-700 shadow-sm border border-slate-100'}`}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="font-bold text-sm">{post.creatorName}</span>
                    <span className="text-[10px] opacity-60">
                      {post.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{post.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 sticky bottom-0">
          <form onSubmit={handleAddPost} className="flex gap-3">
            <input 
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Join the discussion..."
              className="flex-1 bg-slate-50 border-transparent focus:border-teal/20 focus:bg-white p-4 rounded-2xl text-sm transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={!newPost.trim()}
              className="bg-teal text-white p-4 rounded-2xl shadow-lg shadow-teal/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-teal tracking-tight mb-2">Community Forum</h2>
          <p className="text-slate-500">A space for Chitralis to discuss local issues and projects.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-3 bg-teal text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-teal/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
          Start Thread
        </button>
      </div>

      <div className="bg-gold/10 p-6 rounded-[32px] border border-gold/20 flex gap-4 items-start">
         <Info className="text-teal shrink-0 mt-1" size={20} />
         <div>
           <p className="font-bold text-teal text-sm">Community Guidelines</p>
           <p className="text-xs text-teal/70 leading-relaxed mt-1">Please be respectful and focus on constructive discussions about Chitral. Avoid political toxicity or personal attacks.</p>
         </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateThread} className="bg-white p-8 rounded-[40px] border-2 border-teal/10 shadow-2xl shadow-teal/5 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-teal uppercase tracking-widest ml-1">Discussion Title</label>
                <input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What should we talk about?"
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-teal outline-none focus:bg-white focus:ring-2 ring-teal/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-teal uppercase tracking-widest ml-1">Context / Description</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  placeholder="Provide some details to get the conversation started..."
                  className="w-full bg-slate-50 p-5 rounded-2xl text-slate-600 outline-none focus:bg-white focus:ring-2 ring-teal/10 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit"
                  className="flex-1 bg-teal text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Post Discussion
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-8 bg-slate-100 text-slate-500 py-5 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-teal/20" size={48} />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
             <MessageCircle className="mx-auto text-slate-200 mb-4" size={64} />
             <p className="text-slate-400 font-bold">No active discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <motion.div 
              key={thread.id}
              layoutId={thread.id}
              onClick={() => setSelectedThread(thread)}
              className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-teal/20 hover:shadow-xl hover:shadow-teal/5 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-gold bg-gold/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Local Issue
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} />
                      {thread.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-teal mb-2 group-hover:text-teal-dark transition-colors">{thread.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{thread.description}</p>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MessageSquare size={16} />
                      <span className="text-sm font-bold">{thread.postsCount} replies</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={16} />
                      <span className="text-sm font-bold">{thread.creatorName}</span>
                    </div>
                  </div>
                </div>
                {user?.uid === thread.creatorId && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.id); }}
                    className="p-3 text-slate-200 hover:text-crimson hover:bg-crimson/5 rounded-2xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="self-center p-3 text-slate-200 group-hover:text-teal group-hover:translate-x-1 transition-all">
                  <ChevronRight size={24} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
