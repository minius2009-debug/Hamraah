import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Search,
  MoreVertical,
  Filter,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AdminDashboardStats } from '../components/AdminDashboardStats';

interface CivicIssue {
  id: string;
  title: string;
  description: string;
  status: 'posted' | 'escalated' | 'resolved';
  category: string;
  upvotesCount: number;
  downvotesCount: number;
  commentsCount: number;
  creatorId: string;
  createdAt: any;
}

interface VerificationApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  skills?: string[];
  bio?: string;
  createdAt: any;
}

export const AdminScreen: React.FC = () => {
  const { profile, user } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Active Issues', value: '...', icon: Megaphone, color: 'text-crimson' },
    { label: 'Total Users', value: '...', icon: Users, color: 'text-teal' },
    { label: 'Verified Providers', value: '...', icon: ShieldCheck, color: 'text-emerald-500' },
    { label: 'Pending Approvals', value: '...', icon: AlertTriangle, color: 'text-gold' }
  ]);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    // Listen to Issues
    const issuesQ = query(collection(db, 'civic_issues'), orderBy('createdAt', 'desc'));
    const unsubscribeIssues = onSnapshot(issuesQ, (snapshot) => {
      setIssues(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CivicIssue)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'civic_issues'));

    // Listen to Applications
    const appsQ = query(collection(db, 'verification_applications'), orderBy('createdAt', 'desc'));
    const unsubscribeApps = onSnapshot(appsQ, (snapshot) => {
      setApplications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VerificationApplication)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'verification_applications'));

    // Fetch Stats
    const fetchStats = async () => {
       try {
         const usersSnap = await getDocs(collection(db, 'users'));
         const verifiedSnap = await getDocs(query(collection(db, 'users'), where('isVerified', '==', true)));
         const pendingSnap = await getDocs(query(collection(db, 'verification_applications'), where('status', '==', 'pending')));
         const activeIssuesSnap = await getDocs(query(collection(db, 'civic_issues'), where('status', '!=', 'resolved')));

         setStats([
            { label: 'Active Issues', value: activeIssuesSnap.size.toString(), icon: Megaphone, color: 'text-crimson' },
            { label: 'Total Users', value: usersSnap.size.toString(), icon: Users, color: 'text-teal' },
            { label: 'Verified Providers', value: verifiedSnap.size.toString(), icon: ShieldCheck, color: 'text-emerald-500' },
            { label: 'Pending Approvals', value: pendingSnap.size.toString(), icon: AlertTriangle, color: 'text-gold' }
         ]);
       } catch (err) {
         console.error("Stats error:", err);
       }
    };
    fetchStats();

    return () => {
      unsubscribeIssues();
      unsubscribeApps();
    };
  }, []);

  const handleIssueStatus = async (id: string, status: 'escalated' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'civic_issues', id), { status, updatedAt: new Date() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `civic_issues/${id}`);
    }
  };

  const deleteIssue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this issue report?")) return;
    try {
      await deleteDoc(doc(db, 'civic_issues', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `civic_issues/${id}`);
    }
  };

  const handleApplication = async (app: VerificationApplication, status: 'approved' | 'rejected') => {
    try {
      // 1. Update Application status
      await updateDoc(doc(db, 'verification_applications', app.id), { status });
      
      // 2. If approved, update user record
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', app.userId), { 
          isVerified: true,
          updatedAt: new Date()
        });
        alert(`Provider ${app.userName} has been verified!`);
      } else {
        alert(`Application for ${app.userName} has been rejected.`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `verification_applications/${app.id}`);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application record?")) return;
    try {
      await deleteDoc(doc(db, 'verification_applications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `verification_applications/${id}`);
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const scoreA = (a.upvotesCount || 0) + (a.commentsCount || 0) * 2 - (a.downvotesCount || 0);
    const scoreB = (b.upvotesCount || 0) + (b.commentsCount || 0) * 2 - (b.downvotesCount || 0);
    return scoreB - scoreA;
  });

  const topFiveIds = new Set(sortedIssues.slice(0, 5).filter(i => (i.upvotesCount || 0) + (i.commentsCount || 0) > 0).map(i => i.id));

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="animate-spin text-teal mb-4" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Secure Vault...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 pb-24 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-teal tracking-tight mb-1">Admin Control</h1>
          <p className="text-slate-500 text-sm">Managing the Chitral Digital Ecosystem</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">System Live</span>
           </div>
        </div>
      </header>

      <AdminDashboardStats />

      {/* Verification Queue */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                <ShieldCheck size={20} />
             </div>
             <h2 className="text-xl font-black text-teal">Verification Queue</h2>
          </div>
          <span className="bg-gold/20 text-teal text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {applications.filter(a => a.status === 'pending').length} Pending
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {applications.filter(a => a.status === 'pending').map((app) => (
              <motion.div 
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.userId}`} alt="" className="w-full h-full" />
                      </div>
                      <div>
                        <h4 className="font-bold text-teal">{app.userName}</h4>
                        <p className="text-[10px] text-slate-400">{app.userEmail}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteApplication(app.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Bio</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl line-clamp-2">{app.bio || 'No bio provided.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {app.skills?.map(s => (
                         <span key={s} className="bg-teal/5 text-teal text-[9px] font-bold px-2 py-1 rounded-lg border border-teal/10">{s}</span>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApplication(app, 'approved')}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => handleApplication(app, 'rejected')}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {applications.filter(a => a.status === 'pending').length === 0 && (
            <div className="md:col-span-2 py-12 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
               <ShieldCheck className="text-slate-200 mb-4" size={48} />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Queue is Clear</p>
               <p className="text-slate-400 text-sm mt-1">All service provider applications have been processed.</p>
            </div>
          )}
        </div>
      </section>

      {/* Issues Management Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-crimson/10 rounded-xl flex items-center justify-center text-crimson">
                <Megaphone size={20} />
             </div>
             <h2 className="text-xl font-black text-teal">Community Issues</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500 shadow-sm">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue / Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedIssues.map((issue) => (
                <tr key={issue.id} className={`hover:bg-slate-50/30 transition-colors group ${topFiveIds.has(issue.id) ? 'bg-crimson/[0.01]' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                       <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${topFiveIds.has(issue.id) ? 'bg-crimson animate-pulse' : 'bg-slate-300'}`} />
                       <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-teal line-clamp-1">{issue.title}</p>
                            {topFiveIds.has(issue.id) && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-crimson text-white rounded uppercase tracking-tighter">Office Candidate</span>
                            )}
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase tracking-tight">
                            {issue.category}
                          </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                       <span className="text-sm font-black text-emerald-500">{(issue.upvotesCount || 0) + (issue.commentsCount || 0) * 2 - (issue.downvotesCount || 0)}</span>
                       <div className="flex gap-1.5 text-[7px] font-bold text-slate-400 uppercase mt-1">
                          <span className="text-teal">U:{issue.upvotesCount || 0}</span>
                          <span className="text-crimson">D:{issue.downvotesCount || 0}</span>
                          <span className="text-blue-500">C:{issue.commentsCount || 0}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                      issue.status === 'posted' ? 'text-gold' : 
                      issue.status === 'resolved' ? 'text-emerald-500' : 'text-blue-500'
                    }`}>
                      {issue.status === 'posted' ? <Clock size={12} /> : 
                       issue.status === 'resolved' ? <CheckCircle2 size={12} /> : <TrendingUp size={12} />}
                      {issue.status}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className="text-xs text-slate-400 font-medium">
                        {issue.createdAt?.toDate().toLocaleDateString()}
                     </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {issue.status !== 'resolved' && (
                        <button 
                          onClick={() => handleIssueStatus(issue.id, 'resolved')}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteIssue(issue.id)}
                        className="p-2 text-crimson hover:bg-crimson/5 rounded-xl"
                        title="Delete Report"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {issues.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">No community issues reported yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};
