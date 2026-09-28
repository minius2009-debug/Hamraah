import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Check, Clock, AlertTriangle, Briefcase } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'job_status' | 'civic_escalation';
  read: boolean;
  createdAt: any;
  referenceId: string;
}

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/notifications`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/notifications`;
    try {
      await updateDoc(doc(db, path, id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'job_status': return <Briefcase className="text-teal" size={18} />;
      case 'civic_escalation': return <AlertTriangle className="text-crimson" size={18} />;
      default: return <Bell className="text-slate-400" size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-2xl font-bold text-teal">Notifications</h2>
        {notifications.length > 0 && (
          <span className="text-[10px] font-bold bg-teal/10 text-teal px-2 py-1 rounded-full">
            {notifications.filter(n => !n.read).length} NEW
          </span>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-2xl p-4 border shadow-sm flex gap-4 transition-colors ${n.read ? 'border-slate-100 opacity-70' : 'border-teal/20 bg-teal/5'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-50' : 'bg-white'}`}>
                {getIcon(n.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold truncate ${n.read ? 'text-slate-600' : 'text-teal'}`}>
                    {n.title}
                  </h4>
                  {!n.read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="p-1 hover:bg-teal/10 rounded-lg text-teal transition-colors"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={10} />
                  <span className="text-[10px] font-medium">
                    {n.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {n.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <BellOff size={32} />
            </div>
            <h3 className="font-bold text-teal mb-1">All Caught Up</h3>
            <p className="text-sm text-slate-400">You don't have any notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};
