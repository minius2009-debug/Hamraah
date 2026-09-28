import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Briefcase, AlertTriangle } from 'lucide-react';

export const NotificationToaster: React.FC = () => {
  const { user } = useAuth();
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/notifications`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Only show if it's new and unread
      if (data.id !== lastNotificationId && !data.read) {
        setLastNotificationId(data.id);
        
        // Don't show toast if it's very old (e.g. from more than 10 seconds ago)
        // This prevents showing old unread notifications on first load
        const now = new Date().getTime();
        const created = data.createdAt?.toDate().getTime() || 0;
        if (now - created < 10000) {
          setActiveToast({
            id: data.id,
            title: data.title,
            message: data.message,
            type: data.type
          });

          // Auto-hide after 5 seconds
          setTimeout(() => {
            setActiveToast(null);
          }, 5000);
        }
      }
    });

    return () => unsubscribe();
  }, [user, lastNotificationId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'job_status': return <Briefcase size={18} className="text-teal" />;
      case 'civic_escalation': return <AlertTriangle size={18} className="text-crimson" />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 20, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-0 left-1/2 z-[100] w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl border border-teal/10 p-4 flex gap-4 items-start"
        >
          <div className="w-10 h-10 bg-teal/5 rounded-xl flex items-center justify-center shrink-0">
            {getIcon(activeToast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-teal truncate">{activeToast.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2">{activeToast.message}</p>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
